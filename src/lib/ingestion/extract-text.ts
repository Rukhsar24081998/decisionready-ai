/**
 * Extract plain text from PDF, DOCX, TXT, or MD buffers.
 * Server-only — uses pdf-parse and mammoth.
 *
 * Important for Vercel: `pdf-parse/worker` must load BEFORE `pdf-parse`.
 * Without it, pdfjs evaluates DOMMatrix/canvas globals at module load and
 * the entire /api/analyze serverless function crashes with an HTML 500.
 * Official pattern: https://github.com/mehmet-kozan/vercel-next-app-demo
 */
import "pdf-parse/worker";
import mammoth from "mammoth";
import { PDFParse, VerbosityLevel } from "pdf-parse";

export async function extractTextFromBuffer(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";

  if (extension === "pdf") {
    console.info("[ingest] stage=pdf_parse_start", {
      filename,
      bytes: buffer.byteLength,
    });
    const parser = new PDFParse({
      data: buffer,
      verbosity: VerbosityLevel.ERRORS,
    });
    try {
      const result = await parser.getText();
      const text = normalizeText(result.text);
      console.info("[ingest] stage=pdf_parse_ok", {
        filename,
        chars: text.length,
        pages: result.total,
      });
      return text;
    } catch (error) {
      console.error("[ingest] stage=pdf_parse_failed", {
        filename,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      await parser.destroy();
    }
  }

  if (extension === "docx" || extension === "doc") {
    console.info("[ingest] stage=docx_parse_start", { filename });
    const result = await mammoth.extractRawText({ buffer });
    const text = normalizeText(result.value);
    console.info("[ingest] stage=docx_parse_ok", {
      filename,
      chars: text.length,
    });
    return text;
  }

  if (extension === "txt" || extension === "md" || extension === "markdown") {
    const text = normalizeText(buffer.toString("utf8"));
    console.info("[ingest] stage=text_parse_ok", {
      filename,
      chars: text.length,
    });
    return text;
  }

  throw new Error(
    `Unsupported file type for "${filename}". Upload PDF, DOCX, TXT, or MD.`
  );
}

function normalizeText(value: string): string {
  return value.replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim();
}
