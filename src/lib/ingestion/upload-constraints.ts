/** Shared upload constraints for client + /api/analyze (no Node APIs). */

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_UPLOAD_EXTENSIONS = [
  "pdf",
  "docx",
  "txt",
  "md",
  "markdown",
] as const;

export type UploadValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function validateUploadFile(input: {
  filename: string;
  size: number;
}): UploadValidationResult {
  if (!input.filename.trim()) {
    return { ok: false, error: "Uploaded file is missing a name." };
  }

  if (!Number.isFinite(input.size) || input.size <= 0) {
    return {
      ok: false,
      error: `File "${input.filename}" is empty. Please upload a valid document.`,
    };
  }

  if (input.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `File "${input.filename}" exceeds the 10 MB limit.`,
    };
  }

  const extension = getFileExtension(input.filename);
  if (
    !ALLOWED_UPLOAD_EXTENSIONS.includes(
      extension as (typeof ALLOWED_UPLOAD_EXTENSIONS)[number]
    )
  ) {
    return {
      ok: false,
      error: `Unsupported file type for "${input.filename}". Upload PDF, DOCX, TXT, or MD.`,
    };
  }

  return { ok: true };
}
