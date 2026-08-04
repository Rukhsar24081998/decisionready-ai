import { extractTextFromBuffer } from "@/lib/ingestion/extract-text";
import type {
  DocumentType,
  IngestedDocument,
} from "@/lib/ingestion/types";

export async function ingestUploadedFile(
  file: File,
  documentType: DocumentType
): Promise<IngestedDocument> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const extractedText = await extractTextFromBuffer(buffer, file.name);

  if (!extractedText) {
    throw new Error(
      `No extractable text found in "${file.name}". Please upload a text-based document.`
    );
  }

  return {
    id: `doc_${crypto.randomUUID().slice(0, 10)}`,
    filename: file.name,
    documentType,
    extractedText,
  };
}
