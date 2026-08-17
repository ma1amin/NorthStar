import * as yauzl from "yauzl";
import { OfficeParser } from "officeparser";
import { assertSafePublicUrl } from "./urlMetadata";
import { getArchiveContentExclusion } from "./archiveReview";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_ZIP_ENTRIES = 12;
const MAX_EXTRACTED_TEXT_BYTES = 1 * 1024 * 1024;
const URL_PATTERN = /https?:\/\/[^\s<>"'`()[\]{}]+/gi;
const TEXT_EXTENSIONS = new Set(["txt", "md", "csv", "html", "htm"]);
const OFFICE_EXTENSIONS = new Set(["pdf", "docx", "xlsx", "pptx", "rtf", "odt", "ods", "odp"]);
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

export type IntakeArtifactFormat = "text" | "chat_archive" | "document" | "image";

export type EphemeralIntakeResult = {
  format: IntakeArtifactFormat;
  candidates: string[];
  totalUrlMentions: number;
  rejectedUrlMentions: number;
  sourceContextRetained: false;
  personalDataRetained: false;
  requiresLocalOcr: boolean;
};

export type IntakeArtifact = {
  filename: string;
  mimeType?: string;
  data: Buffer;
};

function extensionOf(filename: string) {
  const normalized = filename.trim().toLowerCase();
  const dot = normalized.lastIndexOf(".");
  return dot >= 0 ? normalized.slice(dot + 1) : "";
}

function removeTrailingPunctuation(value: string) {
  return value.replace(/[.,;:!?]+$/g, "");
}

function containsLikelyPersonalData(value: string) {
  const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const phone = /(?:\+?\d[\d\s().-]{7,}\d)/;
  return email.test(value) || phone.test(value);
}

/**
 * Normalizes a public resource link without retaining surrounding chat content.
 * URLs carrying apparent contact data or userinfo are deliberately excluded.
 */
export function normalizeIntakeUrl(rawUrl: string) {
  const candidate = removeTrailingPunctuation(rawUrl.trim());
  if (!candidate || containsLikelyPersonalData(candidate)) return undefined;

  try {
    const parsed = assertSafePublicUrl(candidate);
    if (parsed.username || parsed.password) return undefined;
    const decodedUrlParts = [parsed.pathname, parsed.search, parsed.hash].map((part) => {
      try { return decodeURIComponent(part); } catch { return part; }
    });
    if (decodedUrlParts.some(containsLikelyPersonalData)) return undefined;
    for (const key of Array.from(parsed.searchParams.keys())) {
      if (/^(utm_[a-z]+|fbclid|gclid|mc_[a-z]+)$/i.test(key)) parsed.searchParams.delete(key);
    }
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return undefined;
  }
}

export function sanitizePublicResourceMetadata(value: string | undefined, maxLength: number) {
  if (!value || containsLikelyPersonalData(value) || /@[A-Za-z0-9_]{1,64}/.test(value)) return undefined;
  return value.trim().slice(0, maxLength) || undefined;
}

export function extractPiiFreeResourceUrls(text: string) {
  const rawUrls = text.match(URL_PATTERN) ?? [];
  const candidates = new Set<string>();
  let rejectedUrlMentions = 0;

  for (const rawUrl of rawUrls) {
    const normalized = normalizeIntakeUrl(rawUrl);
    if (!normalized) {
      rejectedUrlMentions += 1;
      continue;
    }
    if (getArchiveContentExclusion(normalized)) {
      rejectedUrlMentions += 1;
      continue;
    }
    candidates.add(normalized);
  }

  return {
    candidates: Array.from(candidates),
    totalUrlMentions: rawUrls.length,
    rejectedUrlMentions,
  };
}

function decodeText(buffer: Buffer) {
  return buffer.toString("utf8").slice(0, MAX_EXTRACTED_TEXT_BYTES);
}

async function readChatArchiveText(buffer: Buffer) {
  if (buffer.byteLength > MAX_UPLOAD_BYTES) throw new Error("Archive exceeds the 8 MB intake limit");

  return new Promise<string>((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true, autoClose: true, validateEntrySizes: true }, (openError, zip) => {
      if (openError || !zip) return reject(new Error("The archive could not be opened safely"));

      let entryCount = 0;
      let text = "";
      let textEntryFound = false;
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        if (error) reject(error);
        else resolve(text);
      };

      zip.on("error", () => finish(new Error("The archive could not be read safely")));
      zip.on("end", () => finish());
      zip.on("entry", (entry) => {
        entryCount += 1;
        if (entryCount > MAX_ZIP_ENTRIES) return finish(new Error("Archive contains too many entries"));
        if (entry.fileName.includes("..") || entry.fileName.startsWith("/") || entry.fileName.startsWith("\\")) return finish(new Error("Archive contains an unsafe path"));
        if (/\/$/.test(entry.fileName)) return zip.readEntry();

        const extension = extensionOf(entry.fileName);
        // Contact-card and media payloads are never opened, parsed, or retained.
        if (!TEXT_EXTENSIONS.has(extension) || extension === "vcf") return zip.readEntry();
        if (entry.uncompressedSize > MAX_EXTRACTED_TEXT_BYTES || text.length >= MAX_EXTRACTED_TEXT_BYTES) return finish(new Error("Archive text exceeds the intake limit"));

        zip.openReadStream(entry, (streamError, stream) => {
          if (streamError || !stream) return finish(new Error("Archive text could not be read"));
          const chunks: Buffer[] = [];
          let total = 0;
          stream.on("data", (chunk: Buffer) => {
            total += chunk.length;
            if (total > MAX_EXTRACTED_TEXT_BYTES) {
              stream.destroy(new Error("Archive text exceeds the intake limit"));
              return;
            }
            chunks.push(chunk);
          });
          stream.on("error", () => finish(new Error("Archive text could not be read")));
          stream.on("end", () => {
            textEntryFound = true;
            text += decodeText(Buffer.concat(chunks));
            zip.readEntry();
          });
        });
      });
      zip.readEntry();
      zip.on("close", () => {
        if (!textEntryFound && !settled) finish(new Error("Archive contains no supported text export"));
      });
    });
  });
}

async function extractDocumentText(buffer: Buffer) {
  const document = await OfficeParser.parseOffice(buffer, {
    includeRawContent: false,
    extractAttachments: false,
    ocr: false,
  });
  return document.toText().slice(0, MAX_EXTRACTED_TEXT_BYTES);
}

/**
 * Parses a user-supplied artifact only in memory. It returns URL candidates and
 * aggregate counters; raw source material and chat/comment context are dropped.
 */
export async function extractResourceCandidatesFromArtifact(artifact: IntakeArtifact): Promise<EphemeralIntakeResult> {
  if (!artifact.filename.trim()) throw new Error("A filename is required");
  if (artifact.data.byteLength === 0) throw new Error("The uploaded file is empty");
  if (artifact.data.byteLength > MAX_UPLOAD_BYTES) throw new Error("File exceeds the 8 MB intake limit");

  const extension = extensionOf(artifact.filename);
  if (extension === "zip") {
    const summary = extractPiiFreeResourceUrls(await readChatArchiveText(artifact.data));
    return { format: "chat_archive", ...summary, sourceContextRetained: false, personalDataRetained: false, requiresLocalOcr: false };
  }
  if (TEXT_EXTENSIONS.has(extension)) {
    const summary = extractPiiFreeResourceUrls(decodeText(artifact.data));
    return { format: "text", ...summary, sourceContextRetained: false, personalDataRetained: false, requiresLocalOcr: false };
  }
  if (OFFICE_EXTENSIONS.has(extension)) {
    const summary = extractPiiFreeResourceUrls(await extractDocumentText(artifact.data));
    return { format: "document", ...summary, sourceContextRetained: false, personalDataRetained: false, requiresLocalOcr: false };
  }
  if (IMAGE_EXTENSIONS.has(extension)) {
    return { format: "image", candidates: [], totalUrlMentions: 0, rejectedUrlMentions: 0, sourceContextRetained: false, personalDataRetained: false, requiresLocalOcr: true };
  }
  throw new Error("Unsupported file type. Upload a chat export, text, PDF, Office document, spreadsheet, presentation, or image.");
}
