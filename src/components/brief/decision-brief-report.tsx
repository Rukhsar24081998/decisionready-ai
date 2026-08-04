"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Printer,
  Share2,
} from "lucide-react";
import { DotGrid } from "@/components/landing/dot-grid";
import {
  landingBtnPrimary,
  landingContainer,
  landingSerif,
} from "@/components/landing/landing-tokens";
import { ProgressStepper } from "@/components/prepare/progress-stepper";
import type {
  DecisionBriefData,
  GapSeverity,
} from "@/components/brief/brief-data";
import { CandidateHiringProfile } from "@/components/intelligence/candidate-hiring-profile";
import { RecruiterCopilot } from "@/components/intelligence/recruiter-copilot";
import { uniqueEvidenceDocuments } from "@/components/intelligence/presentation-utils";
import { ComingSoonButton } from "@/components/shared/coming-soon-button";
import { formatDateTime } from "@/lib/format";
import { formatPercentage } from "@/lib/ai/score-utils";
import { cn } from "@/lib/utils";

const card = "rounded-xl border border-[#E5E7EB] bg-white";

function severityClass(severity: GapSeverity) {
  if (severity === "High") return "bg-[#FEE2E2] text-[#991B1B]";
  if (severity === "Medium") return "bg-[#FEF3C7] text-[#92400E]";
  return "bg-[#F1F5F9] text-[#64748B]";
}

function confidenceClass(confidence: string) {
  if (confidence === "High") return "bg-[#E8F5EF] text-[#064E3B]";
  if (confidence === "Medium") return "bg-[#FEF3C7] text-[#92400E]";
  return "bg-[#F1F5F9] text-[#64748B]";
}

function topicPriority(
  index: number,
  total: number,
  topic: string,
  gaps: DecisionBriefData["evidenceGaps"]
): GapSeverity {
  for (const gap of gaps) {
    if (
      gap.relatedCompetency &&
      topic.toLowerCase().includes(gap.relatedCompetency.toLowerCase())
    ) {
      return gap.severity;
    }
  }
  const third = Math.max(1, Math.ceil(total / 3));
  if (index < third) return "High";
  if (index < third * 2) return "Medium";
  return "Low";
}

interface DecisionBriefReportProps {
  data: DecisionBriefData;
}

export function DecisionBriefReport({ data }: DecisionBriefReportProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="relative overflow-hidden pb-16 print:bg-white print:pb-8">
      <DotGrid className="opacity-15 print:hidden" />

      <div
        className={cn(
          landingContainer,
          "relative py-4 lg:py-6 print:max-w-none print:px-8"
        )}
      >
        <div className="print:hidden">
          <ProgressStepper activeStep={3} />
        </div>

        <div className="mb-8 hidden print:block">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-[#64748B] uppercase">
            DecisionReady AI
          </p>
          <h1 className={cn(landingSerif, "mt-2 text-[32px] leading-tight")}>
            Decision Brief
          </h1>
          <p className="mt-2 text-[14px] font-semibold text-[#0F172A]">
            {data.candidateName} · {data.roleTitle}
          </p>
          <p className="mt-1 text-[12px] text-[#64748B]">
            Generated {formatDateTime(data.generatedAt)}
          </p>
          <p className="mt-4 max-w-2xl text-[12px] leading-relaxed text-[#64748B]">
            {data.disclaimer}
          </p>
        </div>

        <header className="mt-4 print:mt-0 print:hidden">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1 text-[11px] text-[#64748B]"
          >
            <Link href="/dashboard" className="hover:text-[#0F172A]">
              Dashboard
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href={`/analyses/${data.analysisId}/intelligence`}
              className="hover:text-[#0F172A]"
            >
              Decision Intelligence
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-[#0F172A]">Decision Brief</span>
          </nav>

          <div className="mt-3 flex flex-col gap-3 border-b border-[#E5E7EB] pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.12em] text-[#64748B] uppercase">
                Executive Hiring Report
              </p>
              <h1
                className={cn(
                  landingSerif,
                  "mt-1 text-[28px] leading-tight sm:text-[32px]"
                )}
              >
                Decision Brief
              </h1>
              <div className="mt-2 space-y-0.5">
                <p className="text-[16px] font-semibold text-[#0F172A]">
                  {data.candidateName}
                </p>
                <p className="text-[13px] text-[#475569]">{data.roleTitle}</p>
                <p className="text-[11px] tabular-nums text-[#94A3B8]">
                  Generated {formatDateTime(data.generatedAt)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 print:hidden">
              <ComingSoonButton
                className="h-9 rounded-lg px-3 text-[12px]"
                accessibleName="Share"
              >
                <Share2 className="size-3.5" aria-hidden="true" />
                Share
              </ComingSoonButton>
              <button
                type="button"
                onClick={handlePrint}
                className={cn(
                  landingBtnPrimary,
                  "h-9 rounded-lg px-4 text-[12px] transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/30"
                )}
              >
                <Printer className="size-3.5" aria-hidden="true" />
                Print report
              </button>
            </div>
          </div>
        </header>

        <section className={cn(card, "mt-5 p-4 sm:p-5")}>
          <h2 className="text-[11px] font-semibold tracking-[0.1em] text-[#64748B] uppercase">
            Executive Summary
          </h2>
          <p className="mt-2 max-w-3xl text-[15px] leading-relaxed font-medium text-[#0F172A]">
            {data.executiveSummary}
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryStat
              label="Decision Readiness"
              value={formatPercentage(data.readinessScore)}
              detail={data.readinessLabel}
            />
            <SummaryStat
              label="Evidence Coverage"
              value={data.evidenceCoverage}
              detail="Competencies assessed"
            />
            <SummaryStat
              label="Interviewer Alignment"
              value={formatPercentage(data.interviewerAlignment)}
              detail="Panel agreement"
            />
            <SummaryStat
              label="Evidence Confidence"
              value={formatPercentage(data.overallConfidence)}
              detail="Evidence quality confidence"
            />
          </div>

          <p className="mt-3 text-[13px] leading-relaxed text-[#475569]">
            {data.readinessExplanation}
          </p>

          <p className="mt-3 border-t border-[#E5E7EB] pt-3 text-[12px] leading-relaxed text-[#64748B]">
            This brief evaluates whether enough high-quality hiring evidence
            exists for a structured debrief. It does not recommend Hire or
            Reject.
          </p>
        </section>

        <div className="mt-5 print:hidden">
          <RecruiterCopilot
            analysisId={data.analysisId}
            competencyScores={data.competencyScores}
          />
        </div>

        <CandidateHiringProfile
          className="mt-5"
          candidateName={data.candidateName}
          roleTitle={data.roleTitle}
          currentTitle={data.currentTitle}
          currentCompany={data.currentCompany}
          location={data.location}
          experience={data.experience}
          experienceYears={data.experienceYears}
          education={data.education}
          hiringStage={data.hiringStage}
          recruiter={data.recruiter}
          hiringManager={data.hiringManager}
          applicationDate={data.applicationDate}
          department={data.department}
          noticePeriod={data.noticePeriod}
          expectedSalary={data.expectedSalary}
          currentSalary={data.currentSalary}
          skills={data.skills}
          readinessScore={data.readinessScore}
          readinessLabel={data.readinessLabel}
          projectsCount={data.projectsCount}
          achievementsCount={data.achievementsCount}
          competenciesCount={data.competenciesTotal}
          evidenceNodesCount={data.metadata.evidenceCount}
          evidenceConfidence={data.aiConfidence}
          documentsProcessed={data.metadata.documentsProcessed}
          documentCoverageLabel={data.evidenceCoverage}
          interviewerAlignmentPercent={data.interviewerAlignment}
        />

        <section className={cn(card, "mt-5 p-4 sm:p-5")}>
          <SectionHeading title="Documents Analyzed" />
          {data.documentsAnalyzed.length === 0 ? (
            <div className="mt-2 rounded-lg border border-dashed border-[#E5E7EB] bg-[#FAFAFA] px-3 py-3 text-center">
              <p className="text-[12px] font-medium text-[#0F172A]">
                No documents listed for this brief.
              </p>
              <p className="mt-1 text-[11px] text-[#64748B]">
                Re-run Decision Intelligence after uploading hiring evidence.
              </p>
            </div>
          ) : (
            <ul className="mt-2 list-none space-y-1 p-0">
              {uniqueEvidenceDocuments(data.documentsAnalyzed).map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center gap-1.5 text-[12px] text-[#334155]"
                >
                  <FileText
                    className="size-3 text-[#064E3B]"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  {doc.display}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={cn(card, "mt-5 p-4 sm:p-5")}>
          <SectionHeading title="Key Strengths" />
          {data.keyStrengths.length === 0 ? (
            <div className="mt-3 rounded-lg border border-dashed border-[#E5E7EB] bg-[#FAFAFA] px-3 py-4 text-center">
              <p className="text-[12px] font-medium text-[#0F172A]">
                No evidence-backed strengths highlighted yet.
              </p>
              <p className="mt-1 text-[11px] text-[#64748B]">
                Add Resume, Interview Notes, or Scorecards and regenerate Decision
                Intelligence to surface strengths.
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {data.keyStrengths.map((group) => (
                <StrengthGroupCard key={group.competency} group={group} />
              ))}
            </div>
          )}
        </section>

        <section className={cn(card, "mt-5 p-4 sm:p-5")}>
          <SectionHeading title="Evidence Gaps" />
          <p className="mt-1 text-[12px] text-[#64748B]">
            Missing or thin evidence to clarify during debrief.
          </p>
          <ul className="mt-3 list-none space-y-2 p-0">
            {data.emptyStates.length === 0 &&
            data.evidenceGaps.length === 0 ? (
              <li className="rounded-lg border border-dashed border-[#E5E7EB] bg-[#FAFAFA] px-3 py-3 text-[12px] text-[#64748B]">
                No critical evidence gaps identified for this package. Proceed to
                debrief with the supporting evidence already mapped.
              </li>
            ) : null}
            {data.emptyStates.map((state, stateIdx) => (
              <li
                key={`empty-${stateIdx}`}
                className="rounded-lg border border-dashed border-[#E5E7EB] px-3 py-2.5 text-[12px] text-[#64748B]"
              >
                {state}
              </li>
            ))}
            {data.evidenceGaps.map((gap, gapIdx) => (
              <li
                key={`gap-${gapIdx}-${gap.title}`}
                className="rounded-lg border border-[#E5E7EB] px-3 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-2">
                    <AlertTriangle
                      className="mt-0.5 size-3.5 shrink-0 text-[#C2410C]"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-[13px] font-medium text-[#0F172A]">
                          {gap.title}
                        </p>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase",
                            severityClass(gap.severity)
                          )}
                        >
                          {gap.severity}
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] leading-relaxed text-[#475569]">
                        {gap.whyItMatters}
                      </p>
                    </div>
                  </div>
                </div>

                <dl className="mt-2 grid gap-1.5 border-t border-[#F1F5F9] pt-2 sm:grid-cols-2 lg:grid-cols-4">
                  <GapMeta
                    label="Coverage"
                    value={
                      gap.coveragePercent !== null
                        ? `${gap.coveragePercent}%`
                        : "Not Available"
                    }
                  />
                  <GapMeta
                    label="Required by JD"
                    value={gap.requiredByJd ? "Yes" : "No"}
                  />
                  <GapMeta
                    label="Evidence Found"
                    value={
                      gap.evidenceFoundCount > 0
                        ? `${gap.evidenceFoundCount} quote${gap.evidenceFoundCount === 1 ? "" : "s"}`
                        : "None"
                    }
                  />
                  <GapMeta
                    label="Est. Discussion"
                    value={gap.estimatedDiscussionTime || "Not Available"}
                  />
                </dl>

                {gap.recommendedQuestion ? (
                  <p className="mt-2 text-[12px] leading-relaxed text-[#334155]">
                    <span className="font-semibold">
                      Recommended validation question:{" "}
                    </span>
                    {gap.recommendedQuestion}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section className={cn(card, "mt-5 p-4 sm:p-5")}>
          <SectionHeading title="Interviewer Summary" />
          <div className="mt-3 grid gap-2 lg:grid-cols-2">
            {data.interviewers.map((person) => (
              <article
                key={`${person.name}-${person.round}`}
                className="rounded-lg border border-[#E5E7EB] p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-[13px] font-semibold text-[#0F172A]">
                      {person.name}
                    </h3>
                    <p className="text-[11px] text-[#64748B]">{person.round}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold tracking-wide text-[#94A3B8] uppercase">
                      Confidence
                    </p>
                    <p className="text-[16px] font-bold tabular-nums text-[#0F172A]">
                      {formatPercentage(person.confidence)}
                    </p>
                  </div>
                </div>

                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.06em] text-[#64748B] uppercase">
                      Positive observations
                    </p>
                    <ul className="mt-1 list-none space-y-1 p-0">
                      {person.positives.map((item, itemIdx) => (
                        <li
                          key={`pos-${person.name}-${itemIdx}`}
                          className="flex items-start gap-1.5 text-[12px] text-[#334155]"
                        >
                          <Check
                            className="mt-0.5 size-3 shrink-0 text-[#166534]"
                            strokeWidth={2.5}
                            aria-hidden="true"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.06em] text-[#64748B] uppercase">
                      Concerns
                    </p>
                    <ul className="mt-1 list-none space-y-1 p-0">
                      {person.concerns.map((item, itemIdx) => (
                        <li
                          key={`con-${person.name}-${itemIdx}`}
                          className="flex items-start gap-1.5 text-[12px] text-[#334155]"
                        >
                          <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[#D97706]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {person.supportingEvidence.length > 0 ? (
                  <ul className="mt-2 list-none space-y-1 border-t border-[#E5E7EB] pt-2 p-0">
                    {person.supportingEvidence.map((ev, evIdx) => (
                      <li
                        key={`ev-${person.name}-${evIdx}`}
                        className="text-[11px] leading-relaxed text-[#64748B]"
                      >
                        “{ev}”
                      </li>
                    ))}
                  </ul>
                ) : null}

                <p className="mt-2 border-t border-[#E5E7EB] pt-2 text-[11px] text-[#64748B]">
                  <span className="font-semibold text-[#475569]">
                    Consensus:{" "}
                  </span>
                  {person.consensus}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className={cn(card, "mt-5 p-4 sm:p-5")}>
          <SectionHeading title="Discussion Topics" />
          <p className="mt-1 text-[12px] text-[#64748B]">
            Structured prompts for the hiring debrief—not hire or reject
            recommendations.
          </p>
          <ul className="mt-3 list-none space-y-1.5 p-0">
            {data.discussionTopics.map((topic, index) => {
              const priority = topicPriority(
                index,
                data.discussionTopics.length,
                topic,
                data.evidenceGaps
              );
              return (
                <li
                  key={`topic-${index}`}
                  className="flex items-start gap-2 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5"
                >
                  <span
                    className={cn(
                      "mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase",
                      severityClass(priority)
                    )}
                  >
                    {priority}
                  </span>
                  <p className="text-[13px] leading-relaxed text-[#0F172A]">
                    {topic}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className={cn(card, "mt-5 p-4 sm:p-5")}>
          <SectionHeading title="Decision Readiness Breakdown" />
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            <MetaRow
              label="Competency Coverage (40%)"
              value={formatPercentage(data.readinessBreakdown.competencyCoverage)}
            />
            <MetaRow
              label="Evidence Quality (25%)"
              value={formatPercentage(data.readinessBreakdown.evidenceQuality)}
            />
            <MetaRow
              label="Interviewer Alignment (20%)"
              value={formatPercentage(
                data.readinessBreakdown.interviewerAlignment
              )}
            />
            <MetaRow
              label="Evidence Completeness (15%)"
              value={formatPercentage(
                data.readinessBreakdown.evidenceCompleteness
              )}
            />
            <MetaRow
              label="Top Strength"
              value={data.readinessBreakdown.topStrength}
            />
            <MetaRow label="Top Risk" value={data.readinessBreakdown.topRisk} />
          </dl>
        </section>

        <section className={cn(card, "mt-5 p-4 sm:p-5")}>
          <SectionHeading title="Evidence Appendix" />
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {data.evidenceAppendix.map((group) => (
              <div
                key={group.category}
                className="rounded-lg border border-[#E5E7EB] px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold tracking-[0.06em] text-[#64748B] uppercase">
                    {group.category}
                  </p>
                  <span className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-[#475569]">
                    {group.count}
                  </span>
                </div>
                <ul className="mt-1.5 list-none space-y-1 p-0">
                  {group.items.map((item, itemIdx) => (
                    <li
                      key={`${group.category}-${itemIdx}-${item}`}
                      className="flex items-center gap-1.5 text-[12px] text-[#334155]"
                    >
                      <Check
                        className="size-3 text-[#166534]"
                        strokeWidth={2.5}
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-[#E5E7EB] pt-3">
            <button
              type="button"
              onClick={() => setShowAdvanced((prev) => !prev)}
              className="flex w-full items-center gap-1.5 text-left text-[12px] font-medium text-[#475569] hover:text-[#0F172A]"
            >
              {showAdvanced ? (
                <ChevronDown className="size-3.5" aria-hidden="true" />
              ) : (
                <ChevronRight className="size-3.5" aria-hidden="true" />
              )}
              Advanced metadata
            </button>

            {showAdvanced ? (
              <dl className="mt-2 space-y-1.5 rounded-lg border border-[#E5E7EB] px-3 py-2.5">
                <MetaRow label="AI Provider" value={data.metadata.aiProvider} />
                <MetaRow label="Model" value={data.metadata.modelName} />
                <MetaRow label="Processing Time" value={data.processingTime} />
                <MetaRow
                  label="Documents Processed"
                  value={String(data.metadata.documentsProcessed)}
                />
                <MetaRow
                  label="Total Words"
                  value={String(data.metadata.totalWords)}
                />
                <MetaRow
                  label="Evidence Count"
                  value={String(data.metadata.evidenceCount)}
                />
                <MetaRow
                  label="Schema Version"
                  value={data.metadata.schemaVersion}
                />
                <MetaRow
                  label="Prompt Version"
                  value={data.metadata.promptVersion}
                />
                <MetaRow label="Version" value={data.version} />
                <MetaRow
                  label="Evidence Confidence"
                  value={formatPercentage(data.aiConfidence)}
                />
                <MetaRow label="Report ID" value={data.analysisId} mono />
              </dl>
            ) : null}
          </div>
        </section>

        <footer className="mt-8 border-t border-[#E5E7EB] pt-6 text-center">
          <p className="mx-auto max-w-2xl text-[12px] leading-relaxed text-[#64748B]">
            {data.disclaimer}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 print:hidden">
            <Link
              href={`/analyses/${data.analysisId}/intelligence`}
              className="inline-flex h-9 items-center rounded-lg border border-[#E5E7EB] bg-white px-3 text-[12px] font-medium text-[#0F172A] hover:border-[#CBD5E1]"
            >
              Back to Decision Intelligence
            </Link>
            <Link
              href="/analyses/new"
              className={cn(landingBtnPrimary, "h-9 rounded-lg px-4 text-[12px]")}
            >
              Start New Analysis
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

function StrengthGroupCard({
  group,
}: {
  group: DecisionBriefData["keyStrengths"][number];
}) {
  const [expanded, setExpanded] = useState(false);
  const primary = group.items[0];
  const additional = group.items.slice(1);

  if (!primary) return null;

  return (
    <article className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <h3 className="text-[13px] font-semibold text-[#0F172A]">
          {group.competency}
        </h3>
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase",
            confidenceClass(group.confidence)
          )}
        >
          {group.confidence}
        </span>
        {group.items.length > 1 ? (
          <span className="text-[10px] text-[#94A3B8]">
            {group.items.length} sources
          </span>
        ) : null}
      </div>

      <div className="mt-2 rounded-md border border-[#E5E7EB] bg-white p-2.5">
        <p className="text-[10px] font-medium text-[#64748B]">
          {primary.source}
          {primary.pageNumber !== null ? ` · Page ${primary.pageNumber}` : ""}
        </p>
        <blockquote className="mt-1 border-l-2 border-[#D1E7DC] pl-2.5 text-[12px] leading-relaxed text-[#475569]">
          “{primary.quote}”
        </blockquote>
      </div>

      {additional.length > 0 ? (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-[11px] font-medium text-[#064E3B] hover:underline"
          >
            {expanded
              ? "Hide additional quotes"
              : `Show ${additional.length} additional quote${additional.length === 1 ? "" : "s"}`}
          </button>
          {expanded ? (
            <div className="mt-1.5 space-y-1.5">
              {additional.map((item) => (
                <div
                  key={`${item.source}-${item.quote.slice(0, 24)}`}
                  className="rounded-md border border-[#E5E7EB] bg-white p-2.5"
                >
                  <p className="text-[10px] font-medium text-[#64748B]">
                    {item.source}
                    {item.pageNumber !== null
                      ? ` · Page ${item.pageNumber}`
                      : ""}
                  </p>
                  <blockquote className="mt-1 border-l-2 border-[#E5E7EB] pl-2.5 text-[12px] leading-relaxed text-[#475569]">
                    “{item.quote}”
                  </blockquote>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <h2 className="text-[14px] font-semibold tracking-tight text-[#0F172A]">
      {title}
    </h2>
  );
}

function SummaryStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5">
      <p className="text-[10px] font-semibold tracking-[0.08em] text-[#64748B] uppercase">
        {label}
      </p>
      <p className="mt-1 text-[20px] font-bold tabular-nums text-[#0F172A]">
        {value}
      </p>
      <p className="text-[11px] text-[#94A3B8]">{detail}</p>
    </div>
  );
}

function GapMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
        {label}
      </dt>
      <dd className="text-[12px] font-medium text-[#0F172A]">{value}</dd>
    </div>
  );
}

function MetaRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-[12px] text-[#64748B]">{label}</dt>
      <dd
        className={cn(
          "text-[12px] font-semibold text-[#0F172A]",
          mono && "font-mono text-[11px]"
        )}
      >
        {value}
      </dd>
    </div>
  );
}
