import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

/**
 * Extract plain text from PDF, DOCX, TXT, or MD buffers.
 * Server-only — uses pdf-parse and mammoth.
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";

  if (extension === "pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return normalizeText(result.text);
    } finally {
      await parser.destroy();
    }
  }

  if (extension === "docx" || extension === "doc") {
    const result = await mammoth.extractRawText({ buffer });
    return normalizeText(result.value);
  }

  if (extension === "txt" || extension === "md" || extension === "markdown") {
    return normalizeText(buffer.toString("utf8"));
  }

  throw new Error(
    `Unsupported file type for "${filename}". Upload PDF, DOCX, TXT, or MD.`
  );
}

function normalizeText(value: string): string {
  return value.replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim();
}
