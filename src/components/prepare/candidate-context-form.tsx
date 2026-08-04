"use client";

import { cn } from "@/lib/utils";

export const HIRING_STAGES = [
  "Phone Screen",
  "Technical Round",
  "Manager Round",
  "Final Interview",
  "Executive Review",
] as const;

export type HiringStage = (typeof HIRING_STAGES)[number] | "";

export interface CandidateContextValues {
  candidateName: string;
  appliedRole: string;
  department: string;
  hiringManager: string;
  hiringStage: HiringStage;
}

interface CandidateContextFormProps {
  values: CandidateContextValues;
  onChange: (values: CandidateContextValues) => void;
}

const inputClassName =
  "h-9 w-full appearance-none rounded-lg border border-[#E7ECEF] bg-white px-3 text-[13px] text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.03)] outline-none transition-all duration-200 placeholder:text-[#CBD5E1] hover:border-[#CBD5E1] focus:border-[#064E3B]/50 focus:ring-[3px] focus:ring-[#064E3B]/12";

const FIELD_IDS = {
  candidateName: "decision-context-candidate-name",
  appliedRole: "decision-context-applied-role",
  department: "decision-context-department",
  hiringManager: "decision-context-hiring-manager",
  hiringStage: "decision-context-hiring-stage",
} as const;

export function CandidateContextForm({
  values,
  onChange,
}: CandidateContextFormProps) {
  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3">
      <div>
        <h2 className="text-[14px] font-semibold tracking-tight text-[#0F172A]">
          Decision Analysis Context
        </h2>
        <p className="mt-0.5 text-[12px] leading-snug text-[#64748B]">
          Identify the candidate and role before evaluating hiring evidence.
        </p>
      </div>

      <div className="mt-2.5 grid gap-x-4 gap-y-2 sm:grid-cols-2">
        <label htmlFor={FIELD_IDS.candidateName} className="block min-w-0">
          <span className="mb-1 block text-[11px] font-medium text-[#334155]">
            Candidate Name
          </span>
          <input
            id={FIELD_IDS.candidateName}
            name="candidateName"
            type="text"
            value={values.candidateName}
            onChange={(e) =>
              onChange({ ...values, candidateName: e.target.value })
            }
            placeholder="e.g. Priya Sharma"
            className={cn(inputClassName)}
            autoComplete="off"
          />
        </label>

        <label htmlFor={FIELD_IDS.appliedRole} className="block min-w-0">
          <span className="mb-1 block text-[11px] font-medium text-[#334155]">
            Applied Role
          </span>
          <input
            id={FIELD_IDS.appliedRole}
            name="appliedRole"
            type="text"
            value={values.appliedRole}
            onChange={(e) =>
              onChange({ ...values, appliedRole: e.target.value })
            }
            placeholder="e.g. Senior Backend Engineer"
            className={cn(inputClassName)}
            autoComplete="off"
          />
        </label>

        <label htmlFor={FIELD_IDS.department} className="block min-w-0">
          <span className="mb-1 block text-[11px] font-medium text-[#334155]">
            Department
          </span>
          <input
            id={FIELD_IDS.department}
            name="department"
            type="text"
            value={values.department}
            onChange={(e) =>
              onChange({ ...values, department: e.target.value })
            }
            placeholder="e.g. Engineering"
            className={cn(inputClassName)}
            autoComplete="off"
          />
        </label>

        <label htmlFor={FIELD_IDS.hiringManager} className="block min-w-0">
          <span className="mb-1 flex items-center gap-2 text-[11px] font-medium text-[#334155]">
            Hiring Manager
            <span className="rounded-full bg-[#F1F5F9] px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-[#64748B] uppercase">
              Optional
            </span>
          </span>
          <input
            id={FIELD_IDS.hiringManager}
            name="hiringManager"
            type="text"
            value={values.hiringManager}
            onChange={(e) =>
              onChange({ ...values, hiringManager: e.target.value })
            }
            placeholder="e.g. Alex Chen"
            className={cn(inputClassName)}
            autoComplete="off"
          />
        </label>

        <label
          htmlFor={FIELD_IDS.hiringStage}
          className="block min-w-0 sm:col-span-2"
        >
          <span className="mb-1 block text-[11px] font-medium text-[#334155]">
            Hiring Stage
          </span>
          <select
            id={FIELD_IDS.hiringStage}
            name="hiringStage"
            value={values.hiringStage}
            onChange={(e) =>
              onChange({
                ...values,
                hiringStage: e.target.value as HiringStage,
              })
            }
            className={cn(
              inputClassName,
              "bg-[length:12px] bg-[right_12px_center] bg-no-repeat pr-9",
              !values.hiringStage && "text-[#CBD5E1]",
              "bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2394A3B8%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E')]"
            )}
          >
            <option value="" disabled>
              Select hiring stage
            </option>
            {HIRING_STAGES.map((stage) => (
              <option key={stage} value={stage} className="text-[#0F172A]">
                {stage}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
