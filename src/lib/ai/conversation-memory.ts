import type { CopilotConversationTurn } from "@/lib/ai/copilot-schema";

/** Rough token estimate (~4 chars/token). */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const MAX_HISTORY_TOKENS = 1800;
const KEEP_RECENT_TURNS = 6;

/**
 * Keep conversation memory inside token limits.
 * Older turns are summarized into a single system-facing note.
 */
export function compressConversationHistory(
  history: CopilotConversationTurn[]
): CopilotConversationTurn[] {
  if (history.length === 0) return [];

  const cleaned = history
    .filter((turn) => turn.content.trim().length > 0)
    .map((turn) => ({
      role: turn.role,
      content: turn.content.trim().slice(0, 2000),
    }));

  const total = cleaned.reduce(
    (sum, turn) => sum + estimateTokens(turn.content),
    0
  );

  if (cleaned.length <= KEEP_RECENT_TURNS && total <= MAX_HISTORY_TOKENS) {
    return cleaned;
  }

  const recent = cleaned.slice(-KEEP_RECENT_TURNS);
  const older = cleaned.slice(0, Math.max(0, cleaned.length - KEEP_RECENT_TURNS));

  if (older.length === 0) {
    return truncateToBudget(recent, MAX_HISTORY_TOKENS);
  }

  const summaryLines = older.map((turn) => {
    const label = turn.role === "user" ? "Recruiter asked" : "Copilot answered";
    return `- ${label}: ${turn.content.slice(0, 180)}`;
  });

  const summaryTurn: CopilotConversationTurn = {
    role: "assistant",
    content: `Earlier conversation summary (compressed for memory limits):\n${summaryLines.join("\n")}`,
  };

  return truncateToBudget([summaryTurn, ...recent], MAX_HISTORY_TOKENS);
}

function truncateToBudget(
  turns: CopilotConversationTurn[],
  budget: number
): CopilotConversationTurn[] {
  const result: CopilotConversationTurn[] = [];
  let used = 0;

  for (let i = turns.length - 1; i >= 0; i -= 1) {
    const turn = turns[i];
    const cost = estimateTokens(turn.content);
    if (used + cost > budget && result.length > 0) break;
    result.unshift(turn);
    used += cost;
  }

  return result;
}

export function formatConversationForPrompt(
  history: CopilotConversationTurn[]
): string {
  const compressed = compressConversationHistory(history);
  if (compressed.length === 0) return "(no prior turns)";

  return compressed
    .map((turn) => {
      const speaker = turn.role === "user" ? "Recruiter" : "Copilot";
      return `${speaker}: ${turn.content}`;
    })
    .join("\n\n");
}
