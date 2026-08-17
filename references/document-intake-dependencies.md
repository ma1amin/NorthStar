# Document Intake Dependency Record

NorthStar’s multi-format intake uses [`officeParser`](https://github.com/harshankur/officeParser), an MIT-licensed TypeScript/Node.js project inspected on August 17, 2026. Its public documentation lists DOCX, XLSX, PPTX, ODT, ODP, ODS, PDF, RTF, CSV, Markdown, and HTML as supported formats and documents parsing directly from an in-memory `Buffer`.

NorthStar uses the in-memory path only, disables OCR and attachment extraction on the server, and drops the parsed source text after URL extraction. This preserves the project requirement that no archive, message text, contact data, or other personal data is stored publicly or privately.
