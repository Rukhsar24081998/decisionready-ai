/**
 * Structured output schema for Decision Intelligence.
 * Schema A (LLM) + Schema B (UI) — source: @/ai/output-schema
 */

export {
  aiIntelligenceLlmSchema,
  aiIntelligenceLlmJsonSchema,
  aiIntelligenceSchema,
  aiIntelligenceJsonSchema,
  DISCLAIMER,
  type AiIntelligenceLlmPayload,
  type AiIntelligenceResult,
} from "@/ai/output-schema";

export { SCHEMA_VERSION as schemaVersion, PROMPT_VERSION as promptVersion } from "@/lib/ai/decision-engine";
