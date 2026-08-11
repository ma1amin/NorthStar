import { invokeLLM } from "./_core/llm";

export type ResourceReviewDraft = {
  summary: string;
  suggestedTags: string[];
  suggestedRelationshipNotes: string[];
  risks: string[];
  moderationRecommendation: "approve_with_review" | "request_evidence" | "needs_manual_review";
  confidence: number;
  provenance: string;
};

export async function draftResourceReview(resource: {
  title: string;
  description?: string | null;
  url: string;
  pricing: string;
  license?: string | null;
  builtBy?: string | null;
}) {
  const response = await invokeLLM({
    model: "gpt-5-mini",
    maxTokens: 900,
    messages: [
      {
        role: "system",
        content: "You are a moderation assistant for an open resource-intelligence platform. Generate a concise review draft from the supplied metadata only. Do not claim that facts are verified, do not browse, and never decide publication. Flag uncertainty and return only JSON matching the schema.",
      },
      {
        role: "user",
        content: JSON.stringify({ resource }),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "resource_review_draft",
        strict: true,
        schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            suggestedTags: { type: "array", items: { type: "string" } },
            suggestedRelationshipNotes: { type: "array", items: { type: "string" } },
            risks: { type: "array", items: { type: "string" } },
            moderationRecommendation: { type: "string", enum: ["approve_with_review", "request_evidence", "needs_manual_review"] },
            confidence: { type: "number", minimum: 0, maximum: 1 },
            provenance: { type: "string" },
          },
          required: ["summary", "suggestedTags", "suggestedRelationshipNotes", "risks", "moderationRecommendation", "confidence", "provenance"],
          additionalProperties: false,
        },
      },
    },
  });
  const content = response.choices[0]?.message.content;
  if (typeof content !== "string") throw new Error("AI review draft returned no structured content");
  return { draft: JSON.parse(content) as ResourceReviewDraft, model: response.model, usage: response.usage };
}
