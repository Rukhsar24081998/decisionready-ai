"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  MessageSquareText,
  Minus,
  Send,
  Sparkles,
} from "lucide-react";
import {
  evidenceStrengthFromScore,
  hasDocumentPresence,
  humanDocumentLabel,
  matchDocumentColumn,
  uniqueEvidenceDocuments,
} from "@/components/intelligence/presentation-utils";
import { EvidenceStrengthStars } from "@/components/intelligence/evidence-icons";
import {
  COPILOT_LOADING_STEPS,
  EXAMPLE_COPILOT_QUESTIONS,
  INSUFFICIENT_EVIDENCE_ANSWER,
  type CopilotCitation,
  type CopilotEvidenceConflict,
} from "@/lib/ai/copilot-schema";
import { scrollToEvidenceMapping } from "@/lib/ai/citation-utils";
import { formatTime } from "@/lib/format";
import { formatPercentage } from "@/lib/ai/score-utils";
import { cn } from "@/lib/utils";

interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  confidence?: number;
  citations?: CopilotCitation[];
  relatedCompetencies?: string[];
  limitations?: string;
  followUpQuestions?: string[];
  evidenceConflict?: CopilotEvidenceConflict;
}

interface RecruiterCopilotProps {
  analysisId: string;
  className?: string;
  competencyScores?: Record<string, number>;
}

const card = "rounded-xl border border-[#E5E7EB] bg-white";

const DOCUMENT_CHECKS = [
  { key: "Resume" as const, label: "Resume" },
  { key: "Interview" as const, label: "Interview" },
  { key: "Scorecard" as const, label: "Scorecard" },
  { key: "HM" as const, label: "HM" },
  { key: "JD" as const, label: "JD" },
];

function pageLabel(page: number | null): string {
  return page === null ? "Page Unknown" : `Page ${page}`;
}

export function RecruiterCopilot({
  analysisId,
  className,
  competencyScores: competencyScoresProp,
}: RecruiterCopilotProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [competencyScores, setCompetencyScores] = useState<
    Record<string, number>
  >(competencyScoresProp ?? {});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(
    null
  );
  const listRef = useRef<HTMLDivElement>(null);

  const latestAssistant = useMemo(
    () => [...messages].reverse().find((m) => m.role === "assistant") ?? null,
    [messages]
  );

  useEffect(() => {
    if (competencyScoresProp) {
      setCompetencyScores(competencyScoresProp);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/api/analyses/${analysisId}`);
        if (!response.ok) return;
        const payload = (await response.json()) as {
          data?: {
            aiResult?: {
              competencyCoverage?: {
                competencies?: Array<{ name: string; score: number }>;
              };
            };
          };
        };
        const competencies =
          payload.data?.aiResult?.competencyCoverage?.competencies ?? [];
        if (cancelled || competencies.length === 0) return;
        setCompetencyScores(
          Object.fromEntries(
            competencies.map((row) => [row.name, Math.round(row.score)])
          )
        );
      } catch {
        // Presentation-only enrichment — ignore fetch failures.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [analysisId, competencyScoresProp]);

  function handleCitationClick() {
    const el = document.getElementById("evidence-mapping");
    if (el) {
      scrollToEvidenceMapping();
      return;
    }
    router.push(`/analyses/${analysisId}/intelligence#evidence-mapping`);
  }

  useEffect(() => {
    if (!isLoading) {
      setLoadingStep(0);
      return;
    }
    const id = window.setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % COPILOT_LOADING_STEPS.length);
    }, 1100);
    return () => window.clearInterval(id);
  }, [isLoading]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  async function ask(nextQuestion: string) {
    const trimmed = nextQuestion.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setLastFailedQuestion(null);
    setQuestion("");

    const userMessage: CopilotMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    const history = messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId,
          userQuestion: trimmed,
          conversationHistory: history,
        }),
      });

      const payload = (await response.json()) as {
        data?: {
          answer: string;
          confidence: number;
          citations: CopilotCitation[];
          relatedCompetencies: string[];
          limitations: string;
          followUpQuestions: string[];
          evidenceConflict: CopilotEvidenceConflict;
        };
        error?: string;
      };

      if (!response.ok || !payload.data) {
        throw new Error(
          payload.error || "Unable to get an evidence-based answer right now."
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: "assistant",
          content: payload.data!.answer,
          createdAt: new Date().toISOString(),
          confidence: payload.data!.confidence,
          citations: payload.data!.citations,
          relatedCompetencies: payload.data!.relatedCompetencies,
          limitations: payload.data!.limitations,
          followUpQuestions: payload.data!.followUpQuestions,
          evidenceConflict: payload.data!.evidenceConflict,
        },
      ]);
    } catch (err) {
      setLastFailedQuestion(trimmed);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to get an evidence-based answer right now."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    void ask(question);
  }

  async function copyAnswer(message: CopilotMessage) {
    try {
      await navigator.clipboard.writeText(
        formatExportText(message, competencyScores)
      );
      setCopyFailed(false);
      setCopiedId(message.id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopyFailed(true);
      window.setTimeout(() => setCopyFailed(false), 2500);
    }
  }

  function exportAnswer(message: CopilotMessage) {
    const text = formatExportText(message, competencyScores);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evidence-assistant-${message.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section
      className={cn(card, "overflow-hidden", className)}
      aria-labelledby="evidence-assistant-title"
    >
      <div className="flex items-start gap-2.5 border-b border-[#E5E7EB] px-3.5 py-3 sm:px-4">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#E5E7EB] bg-[#F9FAFB]">
          <Sparkles
            className="size-3.5 text-[#064E3B]"
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </span>
        <div className="min-w-0 flex-1">
          <h2
            id="evidence-assistant-title"
            className="text-[14px] font-semibold tracking-tight text-[#0F172A]"
          >
            AI Hiring Analyst
          </h2>
          <p className="mt-0.5 text-[11px] text-[#64748B]">
            Enterprise Evidence Assistant — grounded in uploaded hiring
            documents only. Never recommends Hire or Reject.
          </p>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="grid gap-1.5 border-b border-[#E5E7EB] px-3.5 py-3 sm:grid-cols-2 sm:px-4">
          {EXAMPLE_COPILOT_QUESTIONS.slice(0, 6).map((example, exampleIdx) => (
            <FollowUpCard
              key={`example-${exampleIdx}`}
              label={example}
              disabled={isLoading}
              onClick={() => void ask(example)}
            />
          ))}
        </div>
      ) : null}

      <div className="lg:grid lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-8 lg:border-r lg:border-[#E5E7EB]">
          <div
            ref={listRef}
            className="max-h-[560px] space-y-2.5 overflow-y-auto bg-[#F9FAFB] px-3 py-3 sm:px-3.5"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.length === 0 && !isLoading ? (
              <p className="px-1 py-6 text-center text-[12px] text-[#94A3B8]">
                Ask a hiring evidence question. Responses are structured as
                recruiter reports with citations.
              </p>
            ) : null}

            {messages.map((message) =>
              message.role === "user" ? (
                <RecruiterQuestionBubble
                  key={message.id}
                  content={message.content}
                  time={formatTime(message.createdAt)}
                />
              ) : (
                <AnalystReport
                  key={message.id}
                  message={message}
                  competencyScores={competencyScores}
                  copied={copiedId === message.id}
                  onCitationClick={handleCitationClick}
                  onCopy={() => void copyAnswer(message)}
                  onExport={() => exportAnswer(message)}
                  onFollowUp={(q) => void ask(q)}
                  onAskFollowUp={() => inputRef.current?.focus()}
                />
              )
            )}

            {isLoading ? <LoadingReport stepIndex={loadingStep} /> : null}
          </div>

          {error ? (
            <div
              className="border-t border-[#FEE2E2] bg-[#FEF2F2] px-3.5 py-2.5"
              role="alert"
            >
              <p className="text-[12px] font-medium text-[#B91C1C]">{error}</p>
              <p className="mt-0.5 text-[11px] text-[#991B1B]/80">
                The AI Hiring Analyst could not complete this report. Retry the
                same question, or rephrase with a narrower ask.
              </p>
              {lastFailedQuestion ? (
                <button
                  type="button"
                  onClick={() => void ask(lastFailedQuestion)}
                  disabled={isLoading}
                  className="mt-2 inline-flex h-8 items-center justify-center rounded-lg border border-[#FECACA] bg-white px-3 text-[12px] font-semibold text-[#991B1B] transition-colors duration-150 hover:bg-[#FEF2F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#991B1B]/30 disabled:opacity-50"
                >
                  Retry last question
                </button>
              ) : null}
            </div>
          ) : null}
          {copyFailed ? (
            <p className="border-t border-[#FDE68A] bg-[#FFFBEB] px-3.5 py-2 text-[11px] text-[#92400E]" role="status">
              Copy failed. Check browser clipboard permissions and try again.
            </p>
          ) : null}

          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-1.5 border-t border-[#E5E7EB] bg-white px-3.5 py-3 sm:flex-row sm:px-4"
          >
            <label className="sr-only" htmlFor="evidence-assistant-input">
              Ask the AI Hiring Analyst
            </label>
            <input
              ref={inputRef}
              id="evidence-assistant-input"
              name="evidenceAssistantQuestion"
              type="text"
              value={question}
              disabled={isLoading}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about evidence in this package…"
              className="h-9 min-w-0 flex-1 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[12px] text-[#0F172A] outline-none placeholder:text-[#94A3B8] transition-colors duration-150 focus:border-[#064E3B]/40 focus:ring-1 focus:ring-[#064E3B]/15 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#064E3B] px-4 text-[12px] font-semibold text-white transition-opacity duration-150 hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#064E3B] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="size-3.5" aria-hidden="true" />
              )}
              Ask
            </button>
          </form>
        </div>

        {/* Desktop sticky evidence sidebar */}
        <aside
          className="hidden border-t border-[#E5E7EB] lg:sticky lg:top-4 lg:col-span-4 lg:block lg:border-t-0 lg:self-start"
          aria-label="Evidence sidebar"
        >
          <EvidenceSidebar
            message={latestAssistant}
            competencyScores={competencyScores}
            onOpenEvidence={handleCitationClick}
          />
        </aside>
      </div>
    </section>
  );
}

function RecruiterQuestionBubble({
  content,
  time,
}: {
  content: string;
  time: string;
}) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[90%] rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold tracking-[0.06em] text-[#64748B] uppercase">
            Recruiter
          </p>
          {time ? (
            <time
              className="text-[10px] tabular-nums text-[#94A3B8]"
              dateTime={time}
            >
              {time}
            </time>
          ) : null}
        </div>
        <p className="mt-1 text-[12px] leading-relaxed text-[#0F172A]">
          <span className="sr-only">Question: </span>
          {content}
        </p>
      </div>
    </div>
  );
}

function LoadingReport({ stepIndex }: { stepIndex: number }) {
  return (
    <div
      className="min-h-[168px] rounded-lg border border-[#E5E7EB] bg-white px-3 py-3"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-[12px] font-semibold text-[#0F172A]">
        <Loader2
          className="size-3.5 animate-spin text-[#064E3B]"
          aria-hidden="true"
        />
        Preparing evidence report
      </div>
      <ol className="mt-2.5 list-none space-y-1.5 p-0">
        {COPILOT_LOADING_STEPS.map((step, index) => {
          const done = index < stepIndex;
          const active = index === stepIndex;
          return (
            <li
              key={`loading-step-${index}`}
              className={cn(
                "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px] transition-colors duration-150",
                active
                  ? "border-[#064E3B]/25 bg-[#E8F5EF] font-semibold text-[#064E3B]"
                  : done
                    ? "border-[#E5E7EB] bg-[#FAFAFA] text-[#64748B]"
                    : "border-transparent text-[#CBD5E1]"
              )}
            >
              {done ? (
                <Check className="size-3 shrink-0" aria-hidden="true" />
              ) : active ? (
                <Loader2
                  className="size-3 shrink-0 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <span
                  className="size-3 shrink-0 rounded-full border border-current"
                  aria-hidden="true"
                />
              )}
              {step}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function AnalystReport({
  message,
  competencyScores,
  copied,
  onCitationClick,
  onCopy,
  onExport,
  onFollowUp,
  onAskFollowUp,
}: {
  message: CopilotMessage;
  competencyScores: Record<string, number>;
  copied: boolean;
  onCitationClick: () => void;
  onCopy: () => void;
  onExport: () => void;
  onFollowUp: (question: string) => void;
  onAskFollowUp: () => void;
}) {
  const citations = message.citations ?? [];
  const relatedCompetencies = message.relatedCompetencies ?? [];
  const noEvidence =
    citations.length === 0 ||
    message.content.trim() === INSUFFICIENT_EVIDENCE_ANSWER ||
    /insufficient evidence/i.test(message.content);

  const summary = buildExecutiveAnswer(message);
  const confidenceFactors = buildConfidenceFactors(message);
  const risks = buildRisks(message);
  const why = buildWhyExplanation(message);
  const groupedCitations = groupCitationsByDocument(citations);

  return (
    <article
      className="rounded-lg border border-[#E5E7EB] bg-white"
      aria-label="Evidence assistant report"
    >
      <div className="border-b border-[#E5E7EB] px-3 py-2">
        <p className="text-[10px] font-semibold tracking-[0.06em] text-[#64748B] uppercase">
          Evidence Report
        </p>
        <p className="mt-0.5 text-[11px] text-[#94A3B8]">
          AI Hiring Analyst · {formatTime(message.createdAt)}
        </p>
      </div>

      {noEvidence ? (
        <div className="space-y-3 px-3 py-3">
          <EmptyEvidenceState />
          {message.followUpQuestions && message.followUpQuestions.length > 0 ? (
            <FollowUpSection
              questions={message.followUpQuestions}
              onFollowUp={onFollowUp}
            />
          ) : null}
          <ActionsFooter
            copied={copied}
            onCopy={onCopy}
            onExport={onExport}
            onOpenEvidence={onCitationClick}
            onAskFollowUp={onAskFollowUp}
          />
        </div>
      ) : (
        <div className="divide-y divide-[#F1F5F9]">
          {/* 1. Executive Answer */}
          <ReportSection title="1. Executive Answer">
            <p className="text-[12px] leading-relaxed whitespace-pre-wrap text-[#0F172A]">
              {summary}
            </p>
          </ReportSection>

          {/* 2. Evidence Confidence */}
          <ReportSection title="2. Evidence Confidence">
            <p className="text-[18px] font-bold tabular-nums text-[#064E3B]">
              {typeof message.confidence === "number"
                ? formatPercentage(message.confidence)
                : "Not Available"}
            </p>
            <p className="mt-1 text-[10px] font-semibold tracking-[0.04em] text-[#94A3B8] uppercase">
              Calculated From
            </p>
            <ul className="mt-1 list-none space-y-1 p-0">
              {confidenceFactors.map((factor) => (
                <li
                  key={factor.label}
                  className="flex items-center gap-1.5 text-[11px] text-[#334155]"
                >
                  {factor.ok ? (
                    <Check
                      className="size-3 shrink-0 text-[#166534]"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                  ) : (
                    <Minus
                      className="size-3 shrink-0 text-[#94A3B8]"
                      aria-hidden="true"
                    />
                  )}
                  {factor.label}
                </li>
              ))}
            </ul>
          </ReportSection>

          {/* 3. Competency Analysis */}
          {relatedCompetencies.length > 0 ? (
            <ReportSection title="3. Competency Analysis">
              <div className="grid gap-1.5 sm:grid-cols-2">
                {relatedCompetencies.map((competency, competencyIdx) => (
                  <CompetencyCard
                    key={`competency-${competencyIdx}-${competency}`}
                    competency={competency}
                    citations={citations}
                    score={lookupCompetencyScoreValue(
                      competencyScores,
                      competency
                    )}
                  />
                ))}
              </div>
            </ReportSection>
          ) : null}

          {/* 4. Supporting Evidence */}
          <ReportSection title="4. Supporting Evidence">
            {groupedCitations.length === 0 ? (
              <p className="text-[12px] text-[#94A3B8]">
                No supporting evidence detected.
              </p>
            ) : (
              <div className="space-y-2">
                {groupedCitations.map((group) => (
                  <div key={group.id}>
                    <p className="mb-1 text-[11px] font-semibold text-[#0F172A]">
                      {group.label}
                    </p>
                    <div className="space-y-1.5">
                      {group.items.map((citation, index) => (
                        <EvidenceCard
                          key={`${group.id}-${index}`}
                          citation={citation}
                          relatedCompetencies={relatedCompetencies}
                          onOpen={onCitationClick}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ReportSection>

          {/* 5. Why */}
          <ReportSection title="5. Why AI concluded this">
            <p className="text-[12px] leading-relaxed text-[#475569]">
              <span className="font-semibold text-[#0F172A]">Reasoning. </span>
              {why}
            </p>
          </ReportSection>

          {/* 6. Risks */}
          <ReportSection title="6. Potential Risks">
            {risks.length === 0 ? (
              <p className="text-[12px] text-[#64748B]">
                No material risks identified for this answer.
              </p>
            ) : (
              <div className="space-y-2">
                {(["High", "Medium", "Low"] as const).map((severity) => {
                  const items = risks.filter((r) => r.severity === severity);
                  if (items.length === 0) return null;
                  return (
                    <div key={severity}>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                          severity === "High" &&
                            "bg-[#FEE2E2] text-[#991B1B]",
                          severity === "Medium" &&
                            "bg-[#FEF3C7] text-[#92400E]",
                          severity === "Low" && "bg-[#F1F5F9] text-[#64748B]"
                        )}
                      >
                        {severity}
                      </span>
                      <ul className="mt-1.5 list-none space-y-1.5 p-0">
                        {items.map((risk, riskIdx) => (
                          <li
                            key={`${severity}-risk-${riskIdx}`}
                            className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-2.5 py-2"
                          >
                            <p className="text-[12px] font-medium text-[#0F172A]">
                              {risk.reason}
                            </p>
                            <p className="mt-0.5 text-[11px] text-[#64748B]">
                              Evidence: {risk.evidence}
                            </p>
                            <p className="mt-0.5 text-[11px] text-[#475569]">
                              Suggested validation: {risk.validation}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </ReportSection>

          {/* 7. Follow-ups */}
          {message.followUpQuestions &&
          message.followUpQuestions.length > 0 ? (
            <ReportSection title="7. Suggested Follow-up Questions">
              <FollowUpSection
                questions={message.followUpQuestions}
                onFollowUp={onFollowUp}
              />
            </ReportSection>
          ) : null}

          {/* 8. Actions */}
          <div className="px-3 py-2.5">
            <p className="mb-1.5 text-[10px] font-semibold tracking-[0.06em] text-[#64748B] uppercase">
              8. Actions
            </p>
            <ActionsFooter
              copied={copied}
              onCopy={onCopy}
              onExport={onExport}
              onOpenEvidence={onCitationClick}
              onAskFollowUp={onAskFollowUp}
            />
          </div>
        </div>
      )}
    </article>
  );
}

function EmptyEvidenceState() {
  return (
    <div className="rounded-lg border border-dashed border-[#E5E7EB] bg-[#FAFAFA] px-3 py-4 text-center">
      <FileText
        className="mx-auto size-5 text-[#CBD5E1]"
        aria-hidden="true"
      />
      <p className="mt-2 text-[12px] font-semibold text-[#0F172A]">
        No evidence available to answer this question.
      </p>
      <p className="mt-1 text-[11px] text-[#64748B]">
        Suggest uploading missing documents (Resume, Interview Notes,
        Scorecards, or Hiring Manager Notes) and retry.
      </p>
    </div>
  );
}

function EvidenceSidebar({
  message,
  competencyScores,
  onOpenEvidence,
}: {
  message: CopilotMessage | null;
  competencyScores: Record<string, number>;
  onOpenEvidence: () => void;
}) {
  if (!message) {
    return (
      <div className="px-3 py-4">
        <p className="text-[10px] font-semibold tracking-[0.06em] text-[#64748B] uppercase">
          Evidence Sidebar
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-[#94A3B8]">
          Ask a question to see documents, competencies, quotes, and confidence
          for the latest report.
        </p>
      </div>
    );
  }

  const citations = message.citations ?? [];
  const docs = uniqueEvidenceDocuments(citations.map((c) => c.document));
  const competencies = [
    ...new Set((message.relatedCompetencies ?? []).map((c) => c.trim()).filter(Boolean)),
  ];
  const quotes = citations
    .filter((c) => c.quote.trim())
    .slice(0, 4)
    .map((c, index) => ({
      id: `quote-${index}-${c.document}-${c.pageNumber ?? "p"}`,
      quote: c.quote.trim(),
      document: humanDocumentLabel(c.document),
    }));

  return (
    <div className="px-3 py-3">
      <p className="text-[10px] font-semibold tracking-[0.06em] text-[#64748B] uppercase">
        Evidence Sidebar
      </p>

      <div className="mt-2 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-2.5 py-2">
        <p className="text-[9px] font-semibold tracking-[0.04em] text-[#94A3B8] uppercase">
          Confidence
        </p>
        <p className="mt-0.5 text-[16px] font-bold tabular-nums text-[#064E3B]">
          {typeof message.confidence === "number"
            ? formatPercentage(message.confidence)
            : "Not Available"}
        </p>
      </div>

      <div className="mt-2.5">
        <p className="text-[9px] font-semibold tracking-[0.04em] text-[#94A3B8] uppercase">
          Documents referenced
        </p>
        {docs.length === 0 ? (
          <p className="mt-1 text-[11px] text-[#94A3B8]">Not Available</p>
        ) : (
          <ul className="mt-1 list-none space-y-1 p-0">
            {docs.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center gap-1.5 text-[11px] text-[#334155]"
              >
                <Check
                  className="size-3 shrink-0 text-[#166534]"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
                {doc.display}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-2.5">
        <p className="text-[9px] font-semibold tracking-[0.04em] text-[#94A3B8] uppercase">
          Competencies discussed
        </p>
        {competencies.length === 0 ? (
          <p className="mt-1 text-[11px] text-[#94A3B8]">Not Available</p>
        ) : (
          <ul className="mt-1 list-none space-y-1 p-0">
            {competencies.map((c, cIdx) => {
              const score = lookupCompetencyScoreValue(competencyScores, c);
              return (
                <li
                  key={`competency-${cIdx}-${c}`}
                  className="flex items-center justify-between gap-2 text-[11px] text-[#334155]"
                >
                  <span className="truncate">{c}</span>
                  <span className="shrink-0 tabular-nums text-[#64748B]">
                    {score !== null ? formatPercentage(score) : "Not Available"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-2.5">
        <p className="text-[9px] font-semibold tracking-[0.04em] text-[#94A3B8] uppercase">
          Evidence quotes
        </p>
        {quotes.length === 0 ? (
          <p className="mt-1 text-[11px] text-[#94A3B8]">Not Available</p>
        ) : (
          <ul className="mt-1 list-none space-y-1.5 p-0">
            {quotes.map((q) => (
              <li
                key={q.id}
                className="rounded border border-[#E5E7EB] bg-white px-2 py-1.5 text-[10px] leading-relaxed text-[#475569]"
              >
                &ldquo;{q.quote.length > 110 ? `${q.quote.slice(0, 107)}…` : q.quote}&rdquo;
                <p className="mt-1 text-[9px] font-medium text-[#94A3B8]">
                  {q.document}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={onOpenEvidence}
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-2 text-[11px] font-semibold text-[#064E3B] transition-colors duration-150 hover:border-[#064E3B]/30 hover:bg-[#E8F5EF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#064E3B]"
      >
        <ExternalLink className="size-3" aria-hidden="true" />
        Open Evidence
      </button>
    </div>
  );
}

function ReportSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="px-3 py-2.5">
      <p className="text-[10px] font-semibold tracking-[0.06em] text-[#64748B] uppercase">
        {title}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function CompetencyCard({
  competency,
  citations,
  score,
}: {
  competency: string;
  citations: CopilotCitation[];
  score: number | null;
}) {
  const token = competency.toLowerCase().split(/\s+/)[0] ?? "";
  const related = citations.filter((c) =>
    `${c.quote} ${c.section} ${c.document}`.toLowerCase().includes(token)
  );
  const docs = [
    ...new Set(
      (related.length > 0 ? related : citations).map((c) =>
        humanDocumentLabel(c.document)
      )
    ),
  ];
  const quoteCount = related.length || citations.length;
  const strength = evidenceStrengthFromScore(score ?? (quoteCount > 0 ? 60 : 20));
  const confidence =
    score !== null
      ? score >= 75
        ? "High"
        : score >= 50
          ? "Medium"
          : "Low"
      : quoteCount > 0
        ? "Medium"
        : "Low";

  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-2.5 py-2 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#D1D5DB] hover:bg-white">
      <p className="text-[12px] font-semibold text-[#0F172A]">{competency}</p>
      <dl className="mt-1.5 grid grid-cols-2 gap-1 text-[10px]">
        <div>
          <dt className="text-[#94A3B8]">Coverage</dt>
          <dd className="font-semibold tabular-nums text-[#0F172A]">
            {score !== null ? formatPercentage(score) : "Not Available"}
          </dd>
        </div>
        <div>
          <dt className="text-[#94A3B8]">Confidence</dt>
          <dd className="font-semibold text-[#0F172A]">{confidence}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-[#94A3B8]">Supporting Documents</dt>
          <dd className="mt-0.5">
            <DocumentChecks documents={docs} />
          </dd>
        </div>
        <div>
          <dt className="text-[#94A3B8]">Evidence Strength</dt>
          <dd className="mt-0.5">
            <EvidenceStrengthStars
              filled={strength.filled}
              label={strength.label}
            />
          </dd>
        </div>
        <div>
          <dt className="text-[#94A3B8]">Supporting Quotes</dt>
          <dd className="font-semibold tabular-nums text-[#0F172A]">
            {quoteCount}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function DocumentChecks({ documents }: { documents: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {DOCUMENT_CHECKS.map(({ key, label }) => {
        const present = hasDocumentPresence(documents, key);
        return (
          <span
            key={key}
            className={cn(
              "inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-semibold",
              present
                ? "bg-[#E8F5EF] text-[#064E3B]"
                : "bg-[#F1F5F9] text-[#94A3B8]"
            )}
            title={label}
          >
            {present ? (
              <Check className="size-2.5" aria-hidden="true" />
            ) : (
              <Minus className="size-2.5" aria-hidden="true" />
            )}
            {label}
          </span>
        );
      })}
    </div>
  );
}

function EvidenceCard({
  citation,
  relatedCompetencies,
  onOpen,
}: {
  citation: CopilotCitation;
  relatedCompetencies: string[];
  onOpen: () => void;
}) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] p-2.5 transition-all duration-150 hover:border-[#D1D5DB] hover:bg-white">
      <dl className="grid gap-1 sm:grid-cols-2">
        <Meta label="Document" value={humanDocumentLabel(citation.document)} />
        <Meta
          label="Section"
          value={citation.section?.trim() || "Not Available"}
        />
        <Meta label="Page" value={pageLabel(citation.pageNumber)} />
        <Meta
          label="Mapped Competency"
          value={
            relatedCompetencies.length > 0
              ? relatedCompetencies.join(", ")
              : "Not Available"
          }
        />
      </dl>
      <p className="mt-1.5 text-[11px] leading-relaxed text-[#475569]">
        <span className="font-semibold text-[#64748B]">Quote · </span>
        &ldquo;{citation.quote}&rdquo;
      </p>
      <button
        type="button"
        onClick={onOpen}
        className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#064E3B] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#064E3B]"
      >
        <ExternalLink className="size-3" aria-hidden="true" />
        Open Evidence
      </button>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[9px] font-semibold tracking-wide text-[#94A3B8] uppercase">
        {label}
      </dt>
      <dd className="truncate text-[11px] font-medium text-[#0F172A]">
        {value}
      </dd>
    </div>
  );
}

function FollowUpSection({
  questions,
  onFollowUp,
}: {
  questions: string[];
  onFollowUp: (q: string) => void;
}) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-2">
      {questions.map((followUp, followUpIdx) => (
        <FollowUpCard
          key={`follow-up-${followUpIdx}`}
          label={followUp}
          onClick={() => onFollowUp(followUp)}
        />
      ))}
    </div>
  );
}

function FollowUpCard({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2.5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-[#064E3B]/30 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#064E3B] disabled:opacity-60"
    >
      <span className="text-[10px] font-semibold tracking-[0.04em] text-[#064E3B] uppercase">
        Recruiter action
      </span>
      <span className="mt-0.5 block text-[12px] font-medium leading-snug text-[#334155]">
        {label}
      </span>
    </button>
  );
}

function ActionsFooter({
  copied,
  onCopy,
  onExport,
  onOpenEvidence,
  onAskFollowUp,
}: {
  copied: boolean;
  onCopy: () => void;
  onExport: () => void;
  onOpenEvidence: () => void;
  onAskFollowUp: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <FooterAction
        icon={<Copy className="size-3" aria-hidden="true" />}
        label={copied ? "Copied" : "Copy Answer"}
        onClick={onCopy}
      />
      <FooterAction
        icon={<ExternalLink className="size-3" aria-hidden="true" />}
        label="Open Evidence"
        onClick={onOpenEvidence}
      />
      <FooterAction
        icon={<MessageSquareText className="size-3" aria-hidden="true" />}
        label="Ask Follow-up"
        onClick={onAskFollowUp}
      />
      <FooterAction
        icon={<Download className="size-3" aria-hidden="true" />}
        label="Export Answer"
        onClick={onExport}
      />
    </div>
  );
}

function FooterAction({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#334155] transition-colors duration-150 hover:border-[#CBD5E1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#064E3B]"
    >
      {icon}
      {label}
    </button>
  );
}

function buildExecutiveAnswer(message: CopilotMessage): string {
  const trimmed = message.content.trim();
  if (!trimmed) return "Not Available";

  const competencies = message.relatedCompetencies ?? [];

  const paragraphs = trimmed.split(/\n\s*\n/).filter(Boolean);
  const core = paragraphs[0]?.trim() || trimmed;

  if (competencies.length === 0) return core;

  const weaker =
    message.limitations?.trim() &&
    /weak|missing|limited|only|gap/i.test(message.limitations)
      ? message.limitations.trim()
      : null;

  const lines = [core];
  if (competencies.length > 0) {
    lines.push(`Competencies in focus: ${competencies.join(", ")}.`);
  }
  if (weaker) {
    lines.push(weaker);
  }
  if (typeof message.confidence === "number") {
    const band =
      message.confidence >= 75
        ? "High"
        : message.confidence >= 50
          ? "Medium"
          : "Low";
    lines.push(`Decision confidence remains ${band}.`);
  }
  return lines.join("\n\n");
}

function buildConfidenceFactors(message: CopilotMessage) {
  const citations = message.citations ?? [];
  const docs = citations.map((c) => c.document);
  const uniqueDocs = new Set(docs.map((d) => humanDocumentLabel(d))).size;
  const conflict = message.evidenceConflict?.present === true;
  const competencies = message.relatedCompetencies?.length ?? 0;
  const confidence = message.confidence ?? 0;

  return [
    {
      label: "Supporting documents",
      ok: uniqueDocs > 0,
    },
    {
      label: "Cross-document agreement",
      ok: uniqueDocs >= 2 && !conflict,
    },
    {
      label: "Quote density",
      ok: citations.length >= 2,
    },
    {
      label: "Competency coverage",
      ok: competencies > 0,
    },
    {
      label: "Low ambiguity",
      ok: confidence >= 70 && !conflict,
    },
  ];
}

function buildWhyExplanation(message: CopilotMessage): string {
  if (message.limitations?.trim()) return message.limitations.trim();
  if (message.evidenceConflict?.explanation?.trim()) {
    return message.evidenceConflict.explanation.trim();
  }

  const citations = message.citations ?? [];
  if (citations.length === 0) {
    return "No supporting quote was detected across Resume, Interview Notes, Scorecards, or Hiring Manager Notes for this question.";
  }

  const docs = [
    ...new Set(citations.map((c) => humanDocumentLabel(c.document))),
  ];
  const competencies = message.relatedCompetencies ?? [];
  const focus =
    competencies.length > 0
      ? competencies.slice(0, 2).join(" and ")
      : "the asked topic";

  return `Evidence for ${focus} appears in ${docs.join(", ")} with ${citations.length} supporting quote${citations.length === 1 ? "" : "s"} aligned to the recruiter question.`;
}

function buildRisks(message: CopilotMessage): Array<{
  severity: "High" | "Medium" | "Low";
  reason: string;
  evidence: string;
  validation: string;
}> {
  const risks: Array<{
    severity: "High" | "Medium" | "Low";
    reason: string;
    evidence: string;
    validation: string;
  }> = [];

  const conflict = message.evidenceConflict;
  if (conflict?.present) {
    risks.push({
      severity: "High",
      reason: conflict.title || "Evidence conflict detected",
      evidence: [conflict.sideA, conflict.sideB].filter(Boolean).join(" vs "),
      validation:
        "Reconcile interviewer perspectives before debrief and ask a clarifying probe.",
    });
  }

  if (message.limitations?.trim()) {
    const text = message.limitations.trim();
    const severity: "High" | "Medium" | "Low" = /missing|no supporting|insufficient|only in/i.test(
      text
    )
      ? "Medium"
      : "Low";
    risks.push({
      severity,
      reason: text.length > 120 ? `${text.slice(0, 117)}…` : text,
      evidence:
        (message.citations?.length ?? 0) > 0
          ? `${message.citations!.length} citation(s) in package`
          : "Limited or missing citations",
      validation:
        message.followUpQuestions?.[0] ||
        "Ask candidate for a concrete example to validate this gap.",
    });
  }

  if (
    (message.citations?.length ?? 0) === 0 &&
    risks.length === 0
  ) {
    risks.push({
      severity: "High",
      reason: "No supporting evidence attached to this answer",
      evidence: "Empty citation set",
      validation: "Upload missing documents or rephrase with a narrower ask.",
    });
  }

  return risks;
}

function groupCitationsByDocument(citations: CopilotCitation[]) {
  const entries = uniqueEvidenceDocuments(citations.map((c) => c.document));
  const byOriginal = new Map(entries.map((e) => [e.original.toLowerCase(), e]));
  const map = new Map<string, { display: string; items: CopilotCitation[] }>();

  for (const citation of citations) {
    const original = citation.document.trim();
    const meta =
      byOriginal.get(original.toLowerCase()) ??
      ({
        id: `doc-fallback-${original}`,
        display: humanDocumentLabel(original),
        original,
      } as const);
    const existing = map.get(meta.id);
    if (!existing) {
      map.set(meta.id, { display: meta.display, items: [citation] });
    } else {
      existing.items.push(citation);
    }
  }

  return [...map.entries()]
    .map(([id, group]) => ({ id, label: group.display, items: group.items }))
    .sort((a, b) => {
      const aKey = matchDocumentColumn(a.label);
      const bKey = matchDocumentColumn(b.label);
      const rank = (k: ReturnType<typeof matchDocumentColumn>) =>
        k === "Resume"
          ? 0
          : k === "Interview"
            ? 1
            : k === "Scorecard"
              ? 2
              : k === "HM"
                ? 3
                : k === "JD"
                  ? 4
                  : 5;
      return rank(aKey) - rank(bKey);
    });
}

function lookupCompetencyScoreValue(
  scores: Record<string, number>,
  competency: string
): number | null {
  if (scores[competency] !== undefined) return scores[competency];
  const normalized = competency.trim().toLowerCase();
  const match = Object.entries(scores).find(
    ([name]) => name.trim().toLowerCase() === normalized
  );
  return match ? match[1] : null;
}

function formatExportText(
  message: CopilotMessage,
  scores: Record<string, number>
): string {
  const lines = [
    "AI Hiring Analyst — Evidence Report",
    `Confidence: ${typeof message.confidence === "number" ? formatPercentage(message.confidence) : "Not Available"}`,
    "",
    "Executive Answer",
    buildExecutiveAnswer(message),
    "",
    "Why AI concluded this",
    buildWhyExplanation(message),
    "",
    "Competencies",
    ...(message.relatedCompetencies ?? []).map((c) => {
      const s = lookupCompetencyScoreValue(scores, c);
      return `- ${c}${s !== null ? ` (${formatPercentage(s)})` : ""}`;
    }),
    "",
    "Citations",
    ...(message.citations ?? []).map(
      (c) =>
        `- [${humanDocumentLabel(c.document)}] ${pageLabel(c.pageNumber)} · ${c.section || "Section Not Available"}\n  "${c.quote}"`
    ),
    "",
    "Limitations",
    message.limitations || "None noted",
  ];
  return lines.join("\n");
}
