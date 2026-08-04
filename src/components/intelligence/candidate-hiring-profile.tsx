"use client";

import {
  Briefcase,
  Building2,
  FileStack,
  FolderKanban,
  MapPin,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import {
  displayExperience,
  displayExperienceYearsField,
  displayField,
} from "@/components/intelligence/candidate-profile";
import {
  groupSkills,
  skillGroupItems,
} from "@/components/intelligence/presentation-utils";
import { formatDate } from "@/lib/format";
import { formatPercentage } from "@/lib/ai/score-utils";
import { cn } from "@/lib/utils";

export interface CandidateHiringProfileProps {
  candidateName: string;
  roleTitle: string;
  currentTitle?: string | null;
  currentCompany?: string | null;
  location?: string | null;
  experience?: string | null;
  experienceYears?: number | null;
  education?: string | null;
  hiringStage?: string | null;
  recruiter?: string | null;
  hiringManager?: string | null;
  applicationDate?: string;
  department?: string | null;
  noticePeriod?: string | null;
  expectedSalary?: string | null;
  currentSalary?: string | null;
  skills: string[];
  readinessScore: number;
  readinessLabel: string;
  projectsCount: number;
  achievementsCount: number;
  competenciesCount: number;
  evidenceNodesCount: number;
  evidenceConfidence: number;
  documentsProcessed: number;
  documentCoverageLabel: string;
  interviewerAlignmentPercent: number;
  className?: string;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function Field({ label, value }: { label: string; value: string }) {
  const display = displayField(value);
  const missing = display === "Not Available";
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 truncate text-[12px] font-medium",
          missing ? "text-[#94A3B8]" : "text-[#0F172A]"
        )}
      >
        {display}
      </dd>
    </div>
  );
}

function HeaderMeta({
  icon: Icon,
  value,
}: {
  icon: typeof Briefcase;
  value: string;
}) {
  const display = displayField(value);
  if (display === "Not Available") return null;
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="size-3 text-[#64748B]" aria-hidden="true" />
      <span className="font-medium text-[#0F172A]">{display}</span>
    </span>
  );
}

/**
 * Executive hiring profile header — Ashby/Greenhouse-style snapshot.
 * Presentation only. Consumes already-normalized candidate fields.
 */
export function CandidateHiringProfile({
  candidateName,
  roleTitle,
  currentTitle,
  currentCompany,
  location,
  experience,
  experienceYears = null,
  education,
  hiringStage,
  recruiter,
  hiringManager,
  applicationDate,
  noticePeriod,
  expectedSalary,
  currentSalary,
  skills,
  readinessScore,
  readinessLabel,
  projectsCount,
  achievementsCount,
  competenciesCount,
  evidenceNodesCount,
  evidenceConfidence,
  documentsProcessed,
  documentCoverageLabel,
  interviewerAlignmentPercent,
  className,
}: CandidateHiringProfileProps) {
  const name = displayField(candidateName);
  const appliedRole = displayField(roleTitle);
  const title = displayField(currentTitle);
  const company = displayField(currentCompany);
  const loc = displayField(location);
  const stage = displayField(hiringStage);

  const experienceProfile = {
    experienceLabel:
      experience && displayField(experience) !== "Not Available"
        ? displayField(experience)
        : null,
    experienceYears,
  };
  const experienceHeader = displayExperience(experienceProfile);
  const experienceField = displayExperienceYearsField(experienceProfile);
  const skillGroups = groupSkills(skills);

  const headerBits = [
    title !== "Not Available" ? (
      <HeaderMeta key="title" icon={Briefcase} value={currentTitle ?? ""} />
    ) : null,
    company !== "Not Available" ? (
      <HeaderMeta key="company" icon={Building2} value={currentCompany ?? ""} />
    ) : null,
    loc !== "Not Available" ? (
      <HeaderMeta key="location" icon={MapPin} value={location ?? ""} />
    ) : null,
  ].filter(Boolean);

  const kpis = [
    { label: "Projects", value: projectsCount, icon: FolderKanban },
    { label: "Achievements", value: achievementsCount, icon: Trophy },
    { label: "Competencies", value: competenciesCount, icon: Target },
    { label: "Evidence Nodes", value: evidenceNodesCount, icon: FileStack },
  ];

  const health = [
    {
      label: "Evidence Confidence",
      value: formatPercentage(evidenceConfidence),
      icon: ShieldCheck,
    },
    {
      label: "Document Coverage",
      value: displayField(documentCoverageLabel),
      icon: FileStack,
    },
    {
      label: "Documents Processed",
      value: String(documentsProcessed),
      icon: Briefcase,
    },
    {
      label: "Evidence Nodes",
      value: String(evidenceNodesCount),
      icon: Sparkles,
    },
    {
      label: "Interviewer Alignment",
      value: formatPercentage(interviewerAlignmentPercent),
      icon: Users,
    },
  ];

  return (
    <section
      className={cn(
        "rounded-xl border border-[#E5E7EB] bg-white transition-all duration-150",
        "hover:-translate-y-0.5 hover:border-[#D1D5DB]",
        className
      )}
    >
      <div className="border-b border-[#E5E7EB] px-4 py-3.5 sm:px-5">
        <p className="mb-2 text-[10px] font-semibold tracking-[0.06em] text-[#64748B] uppercase">
          Executive Hiring Profile
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#064E3B] text-[14px] font-semibold tracking-wide text-white"
              aria-hidden="true"
            >
              {initialsFromName(name === "Not Available" ? "Candidate" : name)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-[18px] font-semibold tracking-tight text-[#0F172A]">
                {name}
              </h2>
              {headerBits.length > 0 ? (
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-[#475569]">
                  {headerBits.map((bit, index) => (
                    <span key={`bit-${index}`} className="contents">
                      {index > 0 ? (
                        <span className="text-[#CBD5E1]" aria-hidden="true">
                          ·
                        </span>
                      ) : null}
                      {bit}
                    </span>
                  ))}
                </p>
              ) : null}
              {experienceHeader !== "Experience not available" ? (
                <p className="mt-1 text-[12px] font-medium tabular-nums text-[#064E3B]">
                  {experienceHeader}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
            <span className="rounded-full bg-[#E8F5EF] px-2.5 py-1 text-[10px] font-semibold tracking-wide text-[#064E3B] uppercase">
              {stage === "Not Available" ? "Stage Not Available" : stage}
            </span>
            {appliedRole !== "Not Available" ? (
              <span className="rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-1 text-[10px] font-semibold text-[#334155]">
                {appliedRole}
              </span>
            ) : null}
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                readinessScore >= 80
                  ? "bg-[#DCFCE7] text-[#166534]"
                  : readinessScore >= 55
                    ? "bg-[#FEF3C7] text-[#92400E]"
                    : "bg-[#FEE2E2] text-[#991B1B]"
              )}
            >
              {readinessLabel} · {formatPercentage(readinessScore)}
            </span>
          </div>
        </div>
      </div>

      <dl className="grid gap-x-4 gap-y-2.5 border-b border-[#E5E7EB] px-4 py-3 sm:grid-cols-2 sm:px-5">
        <Field label="Current Company" value={currentCompany ?? ""} />
        <Field label="Current Title" value={currentTitle ?? ""} />
        <Field label="Years of Experience" value={experienceField} />
        <Field label="Education" value={education ?? ""} />
        <Field label="Location" value={location ?? ""} />
        <Field label="Recruiter" value={recruiter ?? ""} />
        <Field label="Hiring Manager" value={hiringManager ?? ""} />
        <Field
          label="Application Date"
          value={applicationDate ? formatDate(applicationDate) : "Not Available"}
        />
        <Field label="Hiring Stage" value={hiringStage ?? ""} />
        <Field label="Role Applied" value={roleTitle} />
        <Field label="Notice Period" value={noticePeriod ?? ""} />
        <Field label="Expected Salary" value={expectedSalary ?? ""} />
        <Field label="Current Salary" value={currentSalary ?? ""} />
      </dl>

      <div className="border-b border-[#E5E7EB] px-4 py-3 sm:px-5">
        <p className="text-[10px] font-semibold tracking-[0.06em] text-[#64748B] uppercase">
          Skills
        </p>
        {skillGroups.length === 0 ? (
          <p className="mt-2 text-[12px] text-[#94A3B8]">Not Available</p>
        ) : (
          <div className="mt-2 space-y-2.5">
            {skillGroups.map((group, groupIdx) => {
              const skillsList = skillGroupItems(group);
              if (skillsList.length === 0) return null;
              return (
                <div key={`${group.category || group.group}-${groupIdx}`}>
                  <p className="text-[11px] font-semibold text-[#0F172A]">
                    {group.category || group.group}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {skillsList.map((skill, skillIdx) => (
                      <span
                        key={`${group.category}-${skill}-${skillIdx}`}
                        className="rounded-md border border-[#E5E7EB] bg-[#FAFAFA] px-2 py-0.5 text-[11px] font-medium text-[#334155] transition-colors duration-100 hover:border-[#064E3B]/30 hover:bg-[#E8F5EF] hover:text-[#064E3B]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 border-b border-[#E5E7EB] px-4 py-3 sm:grid-cols-4 sm:px-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-2.5 py-2 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#D1D5DB] hover:bg-white"
            >
              <div className="flex items-center justify-between gap-1">
                <p className="text-[10px] font-semibold tracking-[0.04em] text-[#94A3B8] uppercase">
                  {kpi.label}
                </p>
                <Icon className="size-3 text-[#64748B]" aria-hidden="true" />
              </div>
              <p className="mt-1 text-[18px] font-semibold tabular-nums tracking-tight text-[#0F172A]">
                {kpi.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 sm:px-5">
        <p className="text-[10px] font-semibold tracking-[0.06em] text-[#64748B] uppercase">
          Evidence Health
        </p>
        <ul className="mt-2 grid list-none gap-1.5 p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {health.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.label}
                className="flex items-start gap-2 rounded-lg border border-[#E5E7EB] px-2.5 py-2 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#D1D5DB]"
              >
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-[#E8F5EF]">
                  <Icon
                    className="size-3 text-[#064E3B]"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-[#94A3B8]">
                    {item.label}
                  </p>
                  <p className="truncate text-[12px] font-semibold text-[#0F172A]">
                    {item.value}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
