"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileText,
  FolderOpen,
  MessageSquareText,
  Printer,
  Scale,
  Share2,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { DotGrid } from "@/components/landing/dot-grid";
import {
  landingBtnPrimaryLg,
  landingContainer,
  landingSerif,
} from "@/components/landing/landing-tokens";
import { ProgressStepper } from "@/components/prepare/progress-stepper";
import { RecruiterCopilot } from "@/components/intelligence/recruiter-copilot";
import { CandidateHiringProfile } from "@/components/intelligence/candidate-hiring-profile";
import { EvidenceIntelligenceMatrix } from "@/components/intelligence/evidence-intelligence-matrix";
import { InteractiveEvidenceExplorer } from "@/components/intelligence/interactive-evidence-explorer";
import { ExecutiveDecisionScorecard } from "@/components/intelligence/executive-decision-scorecard";
import type { IntelligenceDashboardData } from "@/components/intelligence/dashboard-data";
import { uniqueEvidenceDocuments } from "@/components/intelligence/presentation-utils";
import { ComingSoonButton } from "@/components/shared/coming-soon-button";
import { formatDateTime } from "@/lib/format";
import { formatPercentage } from "@/lib/ai/score-utils";
import { cn } from "@/lib/utils";

const card =
  "rounded-xl border border-[#E5E7EB] bg-white transition-colors duration-150";

function confidenceTone(confidence: string) {
  if (confidence === "High") return "bg-[#DCFCE7] text-[#166534]";
  if (confidence === "Medium") return "bg-[#FEF3C7] text-[#92400E]";
  return "bg-[#F1F5F9] text-[#64748B]";
}

function severityTone(severity: string) {
  if (severity === "High") return "bg-[#FEE2E2] text-[#991B1B]";
  if (severity === "Medium") return "bg-[#FEF3C7] text-[#92400E]";
  return "bg-[#F1F5F9] text-[#64748B]";
}

interface DecisionIntelligenceDashboardProps {
  data: IntelligenceDashboardData;
}

export function DecisionIntelligenceDashboard({
  data,
}: DecisionIntelligenceDashboardProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [expandedStrengths, setExpandedStrengths] = useState<Set<string>>(
    new Set()
  );

  const handlePrint = () => {
    window.print();
  };

  const toggleStrength = (competency: string) => {
    setExpandedStrengths((prev) => {
      const next = new Set(prev);
      if (next.has(competency)) next.delete(competency);
      else next.add(competency);
      return next;
    });
  };

  return (
    <main className="relative overflow-hidden pb-12">
      <DotGrid className="opacity-20" />

      <div className={cn(landingContainer, "relative py-4 lg:py-5")}>
        <ProgressStepper activeStep={2} />

        {/* Header */}
        <header className="mt-4">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1 text-[11px] text-[#64748B]"
          >
            <Link href="/dashboard" className="hover:text-[#0F172A]">
              Dashboard
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/analyses/new" className="hover:text-[#0F172A]">
              Start Analysis
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-[#0F172A]">
              Decision Intelligence
            </span>
          </nav>

          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1
                className={cn(
                  landingSerif,
                  "text-[22px] leading-tight sm:text-[26px]"
                )}
              >
                Decision Intelligence
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px]">
                <span className="font-semibold text-[#0F172A]">
                  {data.candidateName}
                </span>
                <span className="text-[#CBD5E1]" aria-hidden="true">
                  ·
                </span>
                <span className="text-[#475569]">{data.roleTitle}</span>
                <span className="text-[#CBD5E1]" aria-hidden="true">
                  ·
                </span>
                <span className="tabular-nums text-[#64748B]">
                  {formatDateTime(data.analyzedAt)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[12px] font-medium text-[#0F172A] transition-colors duration-150 hover:border-[#CBD5E1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/30"
              >
                <Printer className="size-3" aria-hidden="true" />
                Print report
              </button>
              <ComingSoonButton
                className="h-8 rounded-lg px-3 text-[12px]"
                accessibleName="Share Report"
              >
                <Share2 className="size-3" aria-hidden="true" />
                Share Report
              </ComingSoonButton>
            </div>
          </div>
        </header>

        {/* KPI row */}
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            icon={Scale}
            label="Decision Readiness"
            value={formatPercentage(data.readinessScore)}
            detail={data.readinessLabel}
            meta={`Strength: ${
              data.readinessBreakdown.topStrength === "—"
                ? "Not Available"
                : data.readinessBreakdown.topStrength
            } · Risk: ${
              data.readinessBreakdown.topRisk === "—"
                ? "Not Available"
                : data.readinessBreakdown.topRisk
            }`}
            accent
          />
          <KpiCard
            icon={Check}
            label="Competency Coverage"
            value={`${data.competenciesCovered} / ${data.competenciesTotal}`}
            detail={data.coverageExplanation}
            meta={`Partial ${data.competenciesPartial} · Missing ${data.competenciesMissing}`}
          />
          <KpiCard
            icon={Users}
            label="Interviewer Alignment"
            value={formatPercentage(data.interviewerAlignmentPercent)}
            detail={data.interviewerAlignmentLabel}
            meta={data.alignmentExplanation}
          />
          <KpiCard
            icon={Sparkles}
            label="Evidence Quality"
            value={`${data.evidenceQualityLabel} · ${formatPercentage(data.evidenceQualityScore)}`}
            detail={`${data.evidenceSourcesCount} sources · ${data.supportingQuotesCount} quotes`}
            meta={`${data.missingEvidenceCount} missing evidence areas`}
          />
        </div>

        {/* Executive Hiring Profile */}
        <CandidateHiringProfile
          className="mt-4"
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
          projectsCount={data.processingSummary.projectsCount}
          achievementsCount={data.processingSummary.achievementsApprox}
          competenciesCount={data.competenciesTotal}
          evidenceNodesCount={data.processingSummary.evidenceNodes}
          evidenceConfidence={data.aiConfidence}
          documentsProcessed={data.metadata.documentsProcessed}
          documentCoverageLabel={`${data.competenciesCovered}/${data.competenciesTotal} competencies`}
          interviewerAlignmentPercent={data.interviewerAlignmentPercent}
        />

        {/* Evidence Summary */}
        <section className={cn(card, "mt-3 p-3.5 sm:p-4")}>
          <SectionTitle
            title="Evidence Summary"
            subtitle="Executive overview for hiring debrief"
          />
          <p className="mt-2.5 max-w-3xl text-[13px] leading-relaxed text-[#0F172A]">
            {data.executiveSummary}
          </p>
        </section>

        <div className="mt-3">
          <RecruiterCopilot
            analysisId={data.analysisId}
            competencyScores={Object.fromEntries(
              data.competencies.map((c) => [c.name, Math.round(c.score)])
            )}
          />
        </div>

        {/* Main + sidebar */}
        <div className="mt-4 grid gap-3 lg:grid-cols-12 lg:items-start">
          <div className="space-y-3 lg:col-span-8">
            {/* Executive Decision Scorecard */}
            <ExecutiveDecisionScorecard
              analysisId={data.analysisId}
              readinessScore={data.readinessScore}
              readinessLabel={data.readinessLabel}
              readinessSubtitle={data.readinessSubtitle}
              readinessExplanation={data.readinessExplanation}
              readinessBreakdown={data.readinessBreakdown}
              readinessWeights={data.readinessWeights}
              evidenceGaps={data.evidenceGapDetails}
              evidenceSourcesCount={data.evidenceSourcesCount}
              supportingQuotesCount={data.supportingQuotesCount}
              competenciesCovered={data.competenciesCovered}
              competenciesTotal={data.competenciesTotal}
              evidenceConfidence={data.aiConfidence}
            />

            {/* Evidence Intelligence Matrix */}
            <EvidenceIntelligenceMatrix
              competencies={data.competencies}
              evidenceMapping={data.evidenceMapping}
              competenciesCovered={data.competenciesCovered}
              supportingQuotesCount={data.supportingQuotesCount}
              evidenceSourcesCount={data.evidenceSourcesCount}
            />

            {/* Key Strengths */}
            {data.keyStrengths.length > 0 ? (
              <section className={cn(card, "p-3.5 sm:p-4")}>
                <SectionTitle
                  title="Key Strengths"
                  subtitle="Evidence-backed competencies from uploaded documents"
                />
                <ul className="mt-3 list-none space-y-2 p-0">
                  {data.keyStrengths.map((strength) => {
                    const expanded = expandedStrengths.has(strength.competency);
                    const visibleQuotes = expanded
                      ? strength.quotes
                      : strength.quotes.slice(0, 2);
                    return (
                      <li
                        key={strength.competency}
                        className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[12px] font-semibold text-[#0F172A]">
                              {strength.competency}
                            </p>
                            <p className="mt-0.5 text-[10px] text-[#64748B]">
                              {strength.documentCount} document
                              {strength.documentCount === 1 ? "" : "s"} ·{" "}
                              {strength.quoteCount} quote
                              {strength.quoteCount === 1 ? "" : "s"}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                              confidenceTone(strength.confidence)
                            )}
                          >
                            {strength.confidence} Evidence
                          </span>
                        </div>
                        <p className="mt-1.5 text-[10px] text-[#64748B]">
                          Sources: {strength.sources.join(", ")}
                        </p>
                        {visibleQuotes.length > 0 ? (
                          <ul className="mt-2 list-none space-y-1.5 p-0">
                            {visibleQuotes.map((q, idx) => (
                              <li
                                key={`${q.source}-${idx}`}
                                className="rounded border border-[#E5E7EB] bg-white px-2.5 py-2"
                              >
                                <p className="text-[11px] leading-relaxed text-[#334155]">
                                  &ldquo;{q.quote}&rdquo;
                                </p>
                                <p className="mt-1 text-[10px] text-[#94A3B8]">
                                  {q.source}
                                  {q.pageNumber !== null
                                    ? ` · p.${q.pageNumber}`
                                    : ""}
                                </p>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        {strength.quotes.length > 2 ? (
                          <button
                            type="button"
                            onClick={() => toggleStrength(strength.competency)}
                            className="mt-2 inline-flex items-center gap-0.5 text-[10px] font-medium text-[#064E3B] hover:underline"
                          >
                            {expanded ? (
                              <>
                                Show less <ChevronUp className="size-3" />
                              </>
                            ) : (
                              <>
                                Show {strength.quotes.length - 2} more quote
                                {strength.quotes.length - 2 === 1 ? "" : "s"}{" "}
                                <ChevronDown className="size-3" />
                              </>
                            )}
                          </button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            {/* Interactive Evidence Explorer */}
            <InteractiveEvidenceExplorer
              evidenceMapping={data.evidenceMapping}
              evidenceNodesCount={
                data.processingSummary.evidenceNodes ||
                data.metadata.evidenceCount
              }
            />

            {/* Evidence Gaps */}
            <section
              className={cn(
                card,
                "border-[#FDE68A] bg-[#FFFBEB] p-3.5 sm:p-4"
              )}
            >
              <div className="flex items-start gap-2.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#FEF3C7]">
                  <AlertTriangle
                    className="size-3.5 text-[#92400E]"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[13px] font-semibold tracking-tight text-[#0F172A]">
                    Evidence Gaps
                  </h2>
                  <p className="mt-0.5 text-[11px] text-[#78716C]">
                    Areas to probe before debrief to strengthen readiness.
                  </p>
                  <ul className="mt-2.5 list-none space-y-1.5 p-0">
                    {data.evidenceGapDetails.length === 0 &&
                    data.emptyStates.length === 0 ? (
                      <li className="rounded-lg border border-[#FDE68A]/80 bg-white/70 px-3 py-2 text-[12px] text-[#44403C]">
                        No critical evidence gaps identified for this package.
                      </li>
                    ) : null}
                    {data.evidenceGapDetails.map((gap, gapIdx) => (
                      <li
                        key={`gap-${gapIdx}-${gap.title}`}
                        className="rounded-lg border border-[#FDE68A]/80 bg-white/70 px-3 py-2"
                      >
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-[12px] font-medium text-[#44403C]">
                            {gap.title}
                          </p>
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                              severityTone(gap.severity)
                            )}
                          >
                            {gap.severity}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-[#57534E]">
                          {gap.whyItMatters}
                        </p>
                        {gap.recommendedQuestion ? (
                          <p className="mt-1 text-[11px] text-[#78716C]">
                            Ask: {gap.recommendedQuestion}
                            {gap.estimatedDiscussionTime
                              ? ` (${gap.estimatedDiscussionTime})`
                              : ""}
                          </p>
                        ) : null}
                      </li>
                    ))}
                    {data.emptyStates.map((gap, emptyIdx) => (
                      <li
                        key={`empty-${emptyIdx}-${gap.slice(0, 24)}`}
                        className="flex items-start gap-2 rounded-lg border border-[#FDE68A]/80 bg-white/70 px-3 py-2"
                      >
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[#D97706]" />
                        <p className="text-[11px] leading-relaxed text-[#44403C]">
                          {gap}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Interviewer Alignment */}
            <section className={cn(card, "p-3.5 sm:p-4")}>
              <SectionTitle
                title="Interviewer Alignment"
                subtitle="Panel consensus across interview rounds"
              />
              {data.interviewerAlignment.length === 0 ? (
                <div className="mt-3 rounded-lg border border-dashed border-[#E5E7EB] bg-[#FAFAFA] px-3 py-4 text-center">
                  <p className="text-[12px] font-medium text-[#0F172A]">
                    No interviewer notes available yet.
                  </p>
                  <p className="mt-1 text-[11px] text-[#64748B]">
                    Upload Interview Notes or Scorecards and regenerate Decision
                    Intelligence to populate panel alignment.
                  </p>
                </div>
              ) : (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {data.interviewerAlignment.map((row, rowIdx) => (
                    <div
                      key={`interviewer-${rowIdx}-${row.name}-${row.role}`}
                      className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] p-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#D1D5DB] hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[12px] font-semibold text-[#0F172A]">
                            {row.name}
                          </p>
                          <p className="text-[10px] text-[#64748B]">{row.role}</p>
                        </div>
                        <span className="text-[13px] font-bold tabular-nums text-[#064E3B]">
                          {formatPercentage(row.percent)}
                        </span>
                      </div>
                      {row.consensus ? (
                        <p className="mt-2 text-[11px] leading-relaxed text-[#475569]">
                          {row.consensus}
                        </p>
                      ) : null}
                      {row.strengths.length > 0 ? (
                        <div className="mt-2">
                          <p className="text-[10px] font-medium text-[#64748B]">
                            Strengths
                          </p>
                          <ul className="mt-0.5 list-none space-y-0.5 p-0">
                            {row.strengths.slice(0, 3).map((s, sIdx) => (
                              <li
                                key={`str-${rowIdx}-${sIdx}`}
                                className="text-[10px] text-[#334155] before:mr-1 before:text-[#064E3B] before:content-['+']"
                              >
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {row.concerns.length > 0 ? (
                        <div className="mt-1.5">
                          <p className="text-[10px] font-medium text-[#64748B]">
                            Concerns
                          </p>
                          <ul className="mt-0.5 list-none space-y-0.5 p-0">
                            {row.concerns.slice(0, 2).map((c, cIdx) => (
                              <li
                                key={`con-${rowIdx}-${cIdx}`}
                                className="text-[10px] text-[#334155] before:mr-1 before:text-[#92400E] before:content-['−']"
                              >
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-2.5 flex items-center justify-between rounded-lg border border-[#D1E7DC] bg-[#E8F5EF] px-3 py-2">
                <span className="text-[12px] font-semibold text-[#064E3B]">
                  Overall Agreement
                </span>
                <span className="text-[16px] font-bold tabular-nums text-[#064E3B]">
                  {formatPercentage(data.overallAgreement)}
                </span>
              </div>
            </section>

            {/* Processing Summary */}
            <section className={cn(card, "p-3.5 sm:p-4")}>
              <SectionTitle
                title="Processing Summary"
                subtitle="How evidence was parsed and connected"
              />
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <ProcessingCard
                  label="Resume Parsed"
                  value={`${data.processingSummary.resumeCompetencies} competencies`}
                  detail={`${data.processingSummary.skillsCount} skills · ${data.processingSummary.achievementsApprox} achievements`}
                />
                <ProcessingCard
                  label="Interview"
                  value={`${data.processingSummary.interviewObservations} observations`}
                  detail="From interview notes and panel feedback"
                />
                <ProcessingCard
                  label="Scorecards"
                  value={`${data.processingSummary.scorecardRatings} ratings`}
                  detail="Structured interviewer scorecard evidence"
                />
                <ProcessingCard
                  label="Hiring Manager"
                  value={`${data.processingSummary.hiringManagerSignals} signals`}
                  detail="Manager notes and decision factors"
                />
                <ProcessingCard
                  label="Evidence Graph"
                  value={`${data.processingSummary.evidenceNodes} nodes`}
                  detail="Mapped evidence connections"
                />
                <ProcessingCard
                  label="Analysis Time"
                  value={data.analysisTime}
                  detail="End-to-end processing"
                />
              </div>
            </section>

            {/* Discussion topics */}
            <section className={cn(card, "p-3.5 sm:p-4")}>
              <div className="flex items-start gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#E8F5EF]">
                  <MessageSquareText
                    className="size-3.5 text-[#064E3B]"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </span>
                <div>
                  <h2 className="text-[13px] font-semibold tracking-tight text-[#0F172A]">
                    Recommended Discussion Topics
                  </h2>
                  <p className="mt-0.5 text-[11px] text-[#64748B]">
                    Debrief prompts — not hire or reject recommendations.
                  </p>
                </div>
              </div>
              <ul className="mt-2.5 list-none space-y-1.5 p-0">
                {data.discussionTopics.length === 0 ? (
                  <li className="rounded-lg border border-dashed border-[#E5E7EB] bg-[#FAFAFA] px-3 py-3 text-center">
                    <p className="text-[12px] font-medium text-[#0F172A]">
                      No discussion topics generated yet.
                    </p>
                    <p className="mt-1 text-[11px] text-[#64748B]">
                      Regenerate Decision Intelligence after uploading Interview
                      Notes or Scorecards to surface debrief prompts.
                    </p>
                  </li>
                ) : (
                  data.discussionTopics.map((topic, topicIdx) => (
                    <li
                      key={`topic-${topicIdx}`}
                      className="flex items-start gap-2 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#D1D5DB] hover:bg-white"
                    >
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[#064E3B]" />
                      <p className="text-[12px] leading-relaxed text-[#334155]">
                        {topic}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </section>

            {/* Advanced metadata */}
            <section className={cn(card, "overflow-hidden")}>
              <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                className="flex w-full items-center justify-between px-3.5 py-3 text-left hover:bg-[#FAFAFA]"
              >
                <span className="text-[12px] font-semibold text-[#0F172A]">
                  Advanced — Technical Metadata
                </span>
                {advancedOpen ? (
                  <ChevronUp className="size-4 text-[#64748B]" />
                ) : (
                  <ChevronDown className="size-4 text-[#64748B]" />
                )}
              </button>
              {advancedOpen ? (
                <dl className="grid gap-2 border-t border-[#E5E7EB] px-3.5 py-3 sm:grid-cols-2">
                  <MetaField label="AI Provider" value={data.metadata.aiProvider} />
                  <MetaField label="Model" value={data.metadata.modelName} />
                  <MetaField
                    label="Schema Version"
                    value={data.metadata.schemaVersion}
                  />
                  <MetaField
                    label="Prompt Version"
                    value={data.metadata.promptVersion}
                  />
                  <MetaField
                    label="Total Words"
                    value={String(data.metadata.totalWords)}
                  />
                  <MetaField
                    label="Evidence Count"
                    value={String(data.metadata.evidenceCount)}
                  />
                  <MetaField label="Report Version" value={data.version} />
                  <MetaField label="Report Status" value={data.reportStatus} />
                </dl>
              ) : null}
            </section>
          </div>

          {/* Right sidebar */}
          <aside className="space-y-2.5 lg:col-span-4">
            <SidebarCard title="Evidence Confidence" icon={Sparkles}>
              <p className="text-[22px] font-bold tracking-tight text-[#0F172A] tabular-nums">
                {formatPercentage(data.aiConfidence)}
              </p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#E5E7EB]">
                <div
                  className="h-full rounded-full bg-[#064E3B]"
                  style={{ width: `${data.aiConfidence}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-[#64748B]">
                {data.confidenceExplanation}
              </p>
              <p className="mt-2 text-[10px] leading-relaxed text-[#94A3B8]">
                Based on: Document diversity, Supporting quotes, Evidence
                consistency, Coverage
              </p>
            </SidebarCard>

            <SidebarCard title="Evidence Sources" icon={FolderOpen}>
              <ul className="list-none space-y-1.5 p-0">
                {uniqueEvidenceDocuments(data.evidenceSources).map((source) => (
                  <li
                    key={source.id}
                    className="flex items-center gap-1.5 text-[12px] text-[#334155]"
                  >
                    <Check
                      className="size-3 shrink-0 text-[#166534]"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                    {source.display}
                  </li>
                ))}
              </ul>
            </SidebarCard>

            <SidebarCard title="Analysis Time" icon={Clock3}>
              <p className="text-[18px] font-bold tracking-tight text-[#0F172A]">
                {data.analysisTime}
              </p>
              <p className="mt-0.5 text-[11px] text-[#64748B]">
                End-to-end evidence processing
              </p>
            </SidebarCard>

            <SidebarCard title="Report Version" icon={FileText}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-medium text-[#0F172A]">
                  {data.version}
                </span>
                <span className="rounded-full bg-[#E8F5EF] px-1.5 py-0.5 text-[10px] font-semibold text-[#064E3B]">
                  Current
                </span>
              </div>
              <p className="mt-1.5 text-[10px] text-[#94A3B8]">
                Full version history arrives in a later release.
              </p>
            </SidebarCard>

            <SidebarCard title="Trust & Governance" icon={Shield}>
              <p className="text-[12px] leading-relaxed text-[#475569]">
                {data.disclaimer}
              </p>
            </SidebarCard>
          </aside>
        </div>

        {/* Bottom CTAs */}
        <section className={cn(card, "mt-4 p-3.5 sm:p-4")}>
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-[13px] font-semibold text-[#0F172A]">
                Next steps
              </h2>
              <p className="mt-0.5 text-[11px] text-[#64748B]">
                Open the Decision Brief or print this report for debrief prep.
              </p>
            </div>
            <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:flex-row sm:flex-wrap">
              <Link
                href={`/analyses/${data.analysisId}/brief`}
                className={cn(landingBtnPrimaryLg, "h-9 px-4 text-[13px]")}
              >
                <FileText className="size-3.5" aria-hidden="true" />
                Open Decision Brief
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-4 text-[13px] font-medium text-[#0F172A] transition-colors duration-150 hover:border-[#CBD5E1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/30"
              >
                <Printer className="size-3.5" aria-hidden="true" />
                Print report
              </button>
              <ComingSoonButton
                className="h-9 rounded-lg px-4 text-[13px]"
                accessibleName="Share Report"
              >
                <Share2 className="size-3.5" aria-hidden="true" />
                Share Report
              </ComingSoonButton>
              <Link
                href="/analyses/new"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-4 text-[13px] font-medium text-[#0F172A] transition-colors duration-150 hover:border-[#CBD5E1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/30"
              >
                Start New Analysis
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h2 className="text-[13px] font-semibold tracking-tight text-[#0F172A]">
        {title}
      </h2>
      <p className="mt-0.5 text-[11px] text-[#64748B]">{subtitle}</p>
    </div>
  );
}

function ProcessingCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2.5">
      <p className="text-[10px] font-semibold tracking-[0.04em] text-[#64748B] uppercase">
        {label}
      </p>
      <p className="mt-1 text-[14px] font-bold text-[#0F172A]">{value}</p>
      <p className="mt-0.5 text-[10px] text-[#94A3B8]">{detail}</p>
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-medium text-[#94A3B8]">{label}</dt>
      <dd className="text-[11px] font-medium text-[#0F172A]">{value}</dd>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  detail,
  meta,
  accent,
}: {
  icon: typeof Scale;
  label: string;
  value: string;
  detail: string;
  meta?: string;
  accent?: boolean;
}) {
  return (
    <div className={cn(card, "p-3")}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold tracking-[0.06em] text-[#64748B] uppercase">
          {label}
        </p>
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full",
            accent ? "bg-[#064E3B] text-white" : "bg-[#E8F5EF] text-[#064E3B]"
          )}
        >
          <Icon className="size-3" strokeWidth={1.75} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-[20px] font-bold tracking-tight text-[#0F172A] tabular-nums">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] leading-snug text-[#475569]">
        {detail}
      </p>
      {meta ? (
        <p className="mt-0.5 text-[10px] leading-snug text-[#94A3B8]">{meta}</p>
      ) : null}
    </div>
  );
}

function SidebarCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Scale;
  children: ReactNode;
}) {
  return (
    <section className={cn(card, "p-3")}>
      <div className="mb-2 flex items-center gap-1.5">
        <span className="flex size-6 items-center justify-center rounded-full bg-[#E8F5EF]">
          <Icon
            className="size-3 text-[#064E3B]"
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </span>
        <h2 className="text-[12px] font-semibold text-[#0F172A]">{title}</h2>
      </div>
      {children}
    </section>
  );
}
