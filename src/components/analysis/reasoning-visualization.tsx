"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface ReasoningVisualizationProps {
  progress: number;
  activeStepIndex: number;
  stepCount: number;
}

const NODES = [
  { x: 48, y: 36, label: "JD" },
  { x: 132, y: 72, label: "Resume" },
  { x: 72, y: 128, label: "Notes" },
  { x: 168, y: 168, label: "Scores" },
  { x: 96, y: 228, label: "Map" },
  { x: 176, y: 276, label: "Gaps" },
  { x: 88, y: 336, label: "Ready" },
  { x: 160, y: 392, label: "Brief" },
] as const;

function pathBetween(
  a: { x: number; y: number },
  b: { x: number; y: number }
) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const cx = mx + (b.y - a.y) * 0.18;
  const cy = my - (b.x - a.x) * 0.18;
  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
}

export function ReasoningVisualization({
  progress,
  activeStepIndex,
  stepCount,
}: ReasoningVisualizationProps) {
  const links = useMemo(
    () =>
      NODES.slice(0, -1).map((node, i) => ({
        d: pathBetween(node, NODES[i + 1]),
        index: i,
      })),
    []
  );

  const stagesDone = Math.min(
    stepCount,
    progress >= 100 ? stepCount : activeStepIndex
  );

  return (
    <div className="relative flex h-full min-h-[440px] flex-col overflow-hidden rounded-2xl border border-[#E7ECEF] bg-gradient-to-b from-[#FAFCFA] to-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
      <div className="relative z-[1]">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-[#64748B] uppercase">
          Reasoning Graph
        </p>
        <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-[#0F172A]">
          Decision Intelligence Engine
        </h2>
        <p className="mt-1 text-[12px] leading-relaxed text-[#64748B]">
          Evidence flows through each stage before Decision Readiness is
          calculated.
        </p>
      </div>

      <div
        className="pointer-events-none absolute -right-8 top-16 size-40 rounded-full bg-[#E8F5EF]/70 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-24 -left-10 size-36 rounded-full bg-[#DCFCE7]/50 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-[1] mt-3 flex flex-1 items-center justify-center">
        <svg
          viewBox="0 0 224 440"
          className="h-full max-h-[460px] w-full max-w-[240px]"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="flowStroke" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#064E3B" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#0B6E4F" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#064E3B" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {links.map((link) => {
            const complete = progress >= 100 || link.index < activeStepIndex;
            const active = link.index === activeStepIndex && progress < 100;
            return (
              <g key={link.index}>
                <path
                  d={link.d}
                  fill="none"
                  stroke="#E7ECEF"
                  strokeWidth="1.5"
                />
                {(complete || active) && (
                  <path
                    d={link.d}
                    fill="none"
                    stroke="url(#flowStroke)"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeDasharray={active ? "5 8" : undefined}
                    className={cn(
                      "transition-opacity duration-500",
                      active && "animate-[dashFlow_1.5s_linear_infinite]"
                    )}
                  />
                )}
              </g>
            );
          })}

          {NODES.map((node, index) => {
            const complete = progress >= 100 || index < activeStepIndex;
            const active = index === activeStepIndex && progress < 100;
            const pending = !complete && !active;

            return (
              <g key={node.label} transform={`translate(${node.x}, ${node.y})`}>
                {active ? (
                  <circle
                    r="16"
                    fill="#064E3B"
                    fillOpacity="0.08"
                    className="origin-center animate-[softRing_2s_ease-out_infinite]"
                    style={{ transformBox: "fill-box", transformOrigin: "center" }}
                  />
                ) : null}
                <circle
                  r="11"
                  fill={
                    complete ? "#DCFCE7" : active ? "#064E3B" : "#F1F5F9"
                  }
                  stroke={
                    complete ? "#86EFAC" : active ? "#064E3B" : "#E7ECEF"
                  }
                  strokeWidth="1.25"
                  className="transition-all duration-500"
                />
                {complete ? (
                  <path
                    d="M-3.5 0.5 L-1 3 L3.5 -2.5"
                    fill="none"
                    stroke="#166534"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-[checkIn_0.4s_ease-out]"
                  />
                ) : (
                  <circle
                    r="2.4"
                    fill={active ? "#FFFFFF" : pending ? "#CBD5E1" : "#064E3B"}
                    className={cn(
                      active &&
                        "origin-center animate-[nodePulse_1.8s_ease-in-out_infinite]"
                    )}
                    style={
                      active
                        ? {
                            transformBox: "fill-box",
                            transformOrigin: "center",
                          }
                        : undefined
                    }
                  />
                )}
                <text
                  y="26"
                  textAnchor="middle"
                  fill="#64748B"
                  style={{
                    fontSize: "9px",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                  }}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="relative z-[1] mt-2 rounded-xl border border-[#E7ECEF] bg-white/85 px-3 py-2.5 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-[#64748B]">
            Pipeline throughput
          </span>
          <span className="text-[12px] font-semibold tabular-nums text-[#0F172A]">
            {stagesDone} / {stepCount} stages
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#E7ECEF]">
          <div
            className="h-full rounded-full bg-[#064E3B] transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
