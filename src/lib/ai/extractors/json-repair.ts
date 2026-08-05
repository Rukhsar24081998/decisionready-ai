/**
 * Best-effort cleanup of LLM JSON before Zod validation.
 * Does not invent domain data — only repairs syntax / wrappers.
 */

/** Pull a JSON object/array out of markdown fences or surrounding prose. */
export function extractJsonPayload(rawText: string): string {
  const trimmed = rawText.trim();
  if (!trimmed) return trimmed;

  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const inlineFence = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (inlineFence?.[1]) {
    const candidate = inlineFence[1].trim();
    if (candidate.startsWith("{") || candidate.startsWith("[")) {
      return candidate;
    }
  }

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return trimmed;
  }

  const objectStart = trimmed.indexOf("{");
  const arrayStart = trimmed.indexOf("[");
  let start = -1;
  if (objectStart >= 0 && arrayStart >= 0) {
    start = Math.min(objectStart, arrayStart);
  } else {
    start = Math.max(objectStart, arrayStart);
  }
  if (start < 0) return trimmed;

  const opening = trimmed[start];
  const closing = opening === "{" ? "}" : "]";
  const end = trimmed.lastIndexOf(closing);
  if (end > start) {
    return trimmed.slice(start, end + 1).trim();
  }

  return trimmed.slice(start).trim();
}

/** Repair common non-strict JSON mistakes from LLMs. */
export function repairCommonJsonMistakes(jsonText: string): string {
  let text = jsonText.trim();

  // Strip BOM / zero-width chars
  text = text.replace(/^\uFEFF/, "").replace(/[\u200B-\u200D\uFEFF]/g, "");

  // Smart quotes → standard quotes
  text = text.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");

  // Trailing commas before } or ]
  text = text.replace(/,\s*(?=[}\]])/g, "");

  // JavaScript-style unquoted keys: {name: "x"} → {"name": "x"}
  // Conservative: only simple identifier keys
  text = text.replace(
    /([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g,
    '$1"$2":'
  );

  // Single-quoted strings → double-quoted (simple cases)
  text = text.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_match, inner: string) => {
    const escaped = inner.replace(/"/g, '\\"');
    return `"${escaped}"`;
  });

  return text.trim();
}

export function parseJsonLenient(rawText: string): {
  cleaned: string;
  parsed: unknown | null;
  error: string | null;
} {
  const extracted = extractJsonPayload(rawText);
  const cleaned = repairCommonJsonMistakes(extracted);

  try {
    return { cleaned, parsed: JSON.parse(cleaned), error: null };
  } catch (firstError) {
    // Second pass: truncate to last complete object if truncated mid-stream
    const repairedTruncation = attemptCloseTruncatedJson(cleaned);
    if (repairedTruncation && repairedTruncation !== cleaned) {
      try {
        return {
          cleaned: repairedTruncation,
          parsed: JSON.parse(repairedTruncation),
          error: null,
        };
      } catch {
        // fall through
      }
    }

    return {
      cleaned,
      parsed: null,
      error:
        firstError instanceof Error
          ? firstError.message
          : String(firstError),
    };
  }
}

/**
 * If the model hit a token limit mid-object, try closing open braces/brackets.
 * Best-effort only — may still fail Zod if structure is incomplete.
 */
function attemptCloseTruncatedJson(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;

  let inString = false;
  let escape = false;
  const stack: string[] = [];

  for (let i = 0; i < trimmed.length; i += 1) {
    const ch = trimmed[i];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") {
      if (stack.length && stack[stack.length - 1] === ch) stack.pop();
    }
  }

  if (!stack.length) return null;

  // Drop trailing incomplete key/value fragment after last comma
  let base = trimmed.replace(/,\s*$/, "");
  if (inString) {
    base += '"';
  }
  return `${base}${stack.reverse().join("")}`;
}
