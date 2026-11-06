"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertTriangle, Flame, Pizza, Snowflake } from "lucide-react";
import SectionHead from "@/components/ui/SectionHead";
import { useGains } from "@/components/providers/GainsProvider";
import type { Mode } from "@/lib/modes";
import { pick } from "@/lib/random";

type Metric = { label: string; value: number; display: string; danger?: boolean };

interface ModeSpec {
  label: string;
  target: string;
  icon: typeof Snowflake;
  color: string;
  status: string;
  statusNote: string;
  metrics: Metric[];
  warnings: string[];
  readouts: [string, string][];
  weight: number[];
  logs: string[];
  torso: string[];
}

const MODES: Record<Mode, ModeSpec> = {
  cut: {
    label: "CUT",
    target: "cut.target",
    icon: Snowflake,
    color: "var(--cyan)",
    status: "THROTTLED",
    statusNote: "CPU throttled to conserve calories",
    metrics: [
      { label: "cpu (strength)", value: 41, display: "degraded" },
      { label: "hunger daemon", value: 100, display: "100%", danger: true },
      { label: "abs visibility", value: 64, display: "increasing" },
      { label: "emotional stability", value: 22, display: "questionable", danger: true },
      { label: "food budget", value: 28, display: "lettuce-tier" },
    ],
    warnings: [
      "CPU throttled. Bench press running at 80% clock speed.",
      "Hunger daemon at 100%. It has started negotiating.",
      "Strength performance degraded. Warm-up sets now feel like working sets.",
      "Abs visibility increasing (bathroom lighting only).",
      "Emotional stability: questionable. Do not ask how they are.",
    ],
    readouts: [
      ["intake", "1,850 kcal (−500)"],
      ["scale", "80.4 kg ↓"],
      ["mood", "hangry"],
    ],
    weight: [86, 85.6, 85.1, 84.8, 84.1, 83.7, 83.2, 82.6, 82.2, 81.5, 81, 80.4],
    logs: [
      "hunger[201]: considered eating the napkin. deferred.",
      "cardio[88]: 10,000 steps achieved. morale not achieved.",
      "abs[404]: faint outline detected. confidence: low.",
      "kitchen[3]: fridge opened 14 times. nothing new appeared.",
      "mood[7]: snapped at a coworker about rice.",
      "strength[1]: warm-up set reclassified as max effort.",
    ],
    torso: [
      "   .-''''-.   ",
      "  /  ____  \\  ",
      " |  |_||_|  | ",
      " |  |_||_|  | ",
      " |  |_||_|  | ",
      "  \\  \\__/  /  ",
      "   '-.__.-'   ",
    ],
  },
  bulk: {
    label: "BULK",
    target: "bulk.target",
    icon: Flame,
    color: "var(--accent)",
    status: "HYPERTROPHY",
    statusNote: "maximum hypertrophy enabled",
    metrics: [
      { label: "hypertrophy", value: 92, display: "maximum" },
      { label: "caloric surplus", value: 70, display: "+500 kcal" },
      { label: "shirt compatibility", value: 34, display: "decreasing", danger: true },
      { label: "scale weight", value: 76, display: "increasing" },
      { label: "food budget", value: 100, display: "exceeded (112%)", danger: true },
    ],
    warnings: [
      "Maximum hypertrophy enabled.",
      "Caloric surplus detected. This is intentional. Mostly.",
      "Shirt compatibility decreasing. Sleeves are under load.",
      "Scale weight increasing. Do not look directly at it.",
      "Food budget exceeded. Chicken futures are up 4%.",
    ],
    readouts: [
      ["intake", "3,400 kcal (+500)"],
      ["scale", "84.9 kg ↑"],
      ["mood", "unstoppable"],
    ],
    weight: [80.4, 80.9, 81.3, 81.8, 82.1, 82.7, 83.0, 83.4, 83.9, 84.2, 84.5, 84.9],
    logs: [
      "fridge[3000]: inventory below threshold. reorder triggered.",
      "tailor[12]: received an inquiry about sleeves.",
      "protein_synthesis[1]: running hot. no complaints.",
      "bench[225]: moved. slightly. it counts.",
      "wallet[0]: chicken subscription renewed.",
      "mirror[2]: flex detected. confidence: high.",
    ],
    torso: [
      "  .-''''''-.  ",
      " /  .----.  \\ ",
      "|  ( ==== )  |",
      "|   \\====/   |",
      "|    |==|    |",
      " \\   '--'   / ",
      "  '-.____.-'  ",
    ],
  },
  dirty: {
    label: "DIRTY BULK",
    target: "dirtybulk.target",
    icon: Pizza,
    color: "var(--amber)",
    status: "UNSAFE",
    statusNote: "all safety protocols disabled",
    metrics: [
      { label: "safety protocols", value: 0, display: "disabled", danger: true },
      { label: "pizza dependencies", value: 100, display: "installed" },
      { label: "insulin sensitivity", value: 4, display: "left the chat", danger: true },
      { label: "belly expansion", value: 88, display: "unexpected", danger: true },
      { label: "strength", value: 96, display: "honestly great" },
    ],
    warnings: [
      "All safety protocols disabled.",
      "Pizza dependencies installed (extra cheese pinned to latest).",
      "Insulin sensitivity has left the chat.",
      "Warning: unexpected belly expansion.",
      "System administrator recommends cardio. Request ignored.",
    ],
    readouts: [
      ["intake", "5,200 kcal (+2,300)"],
      ["scale", "91.2 kg ↑↑"],
      ["mood", "euphoric, sweaty"],
    ],
    weight: [80.4, 81.6, 82.9, 84.1, 85, 86.2, 87.1, 88.4, 89.2, 89.9, 90.6, 91.2],
    logs: [
      "pizza[1]: dependency resolved. version: large.",
      "sysadmin[0]: recommends cardio. ignored. again.",
      "belt[34]: notch 7 deprecated. migrating to notch 9.",
      "donut[12]: classified as 'pre-workout'. approved.",
      "stairs[3]: now considered a workout.",
      "scale[1]: requested a vacation.",
    ],
    torso: [
      "   .-''''-.    ",
      "  /        \\   ",
      " |          |  ",
      " |    ()    |  ",
      " |          |  ",
      "  \\        /   ",
      "   '-....-'    ",
    ],
  },
};

const ORDER: Mode[] = ["cut", "bulk", "dirty"];

function Sparkline({ points, color }: { points: number[]; color: string }) {
  const w = 280;
  const h = 70;
  const min = 78;
  const max = 92;
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / (max - min)) * h;
      return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const last = points[points.length - 1];
  const ly = h - ((last - min) / (max - min)) * h;
  return (
    <svg viewBox={`-4 -6 ${w + 8} ${h + 12}`} className="h-[78px] w-full" role="img" aria-label={`Scale weight trend, now ${last} kg`}>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={0} x2={w} y1={h * f} y2={h * f} stroke="var(--line)" strokeDasharray="2 4" />
      ))}
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" style={{ transition: "d 0.6s ease" }} />
      <circle cx={w} cy={ly} r={3.5} fill={color} />
    </svg>
  );
}

export default function ControlPanel() {
  const { mode, setMode, toast } = useGains();
  const reduced = useReducedMotion();
  const spec = MODES[mode];
  const [jitter, setJitter] = useState<number[]>([0, 0, 0, 0, 0]);
  const [log, setLog] = useState<{ id: number; text: string }[]>([]);
  const [switching, setSwitching] = useState(false);
  const logId = useRef(0);
  const first = useRef(true);

  // live metrics + journal
  useEffect(() => {
    setLog(spec.logs.slice(0, 3).map((text) => ({ id: ++logId.current, text })));
    const t = setInterval(() => {
      setJitter(spec.metrics.map((m) => (m.value === 0 || m.value === 100 ? 0 : (Math.random() - 0.5) * 6)));
      setLog((l) => [...l.slice(-5), { id: ++logId.current, text: pick(spec.logs) }]);
    }, 2400);
    return () => clearInterval(t);
  }, [spec]);

  const choose = (m: Mode) => {
    if (m === mode) return;
    setSwitching(true);
    setTimeout(() => setSwitching(false), 650);
    setMode(m);
    if (!first.current && m === "dirty") {
      toast({ kind: "alert", title: "SECURITY ALERT", body: "Unverified pizza detected in /dev/stomach. Allowing anyway." });
    }
    first.current = false;
  };

  const Icon = spec.icon;

  return (
    <section id="control-panel" className="mx-auto max-w-[1240px] scroll-mt-20 px-4 py-20 sm:px-6 md:py-28">
      <SectionHead index="02" command={`systemctl isolate ${spec.target}`} title={<>Physique<br className="sm:hidden" /> control panel</>}>
        Pick a target. Every metric, warning, and graph below follows it. None of them are medical advice, all of them are accurate.
      </SectionHead>

      <div className="overflow-hidden rounded-xl border border-line-2 bg-panel" style={{ ["--mode" as string]: spec.color }}>
        {/* mode switch */}
        <div className="flex flex-col gap-3 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between">
          <div role="tablist" aria-label="Physique mode" className="grid grid-cols-3 gap-1 rounded-lg bg-bg p-1">
            {ORDER.map((m) => {
              const s = MODES[m];
              const I = s.icon;
              const active = m === mode;
              return (
                <button
                  key={m}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  aria-controls="mode-panel"
                  onClick={() => choose(m)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                      e.preventDefault();
                      const i = ORDER.indexOf(mode);
                      const next = ORDER[(i + (e.key === "ArrowRight" ? 1 : ORDER.length - 1)) % ORDER.length];
                      choose(next);
                      (e.currentTarget.parentElement?.children[ORDER.indexOf(next)] as HTMLElement | undefined)?.focus();
                    }
                  }}
                  tabIndex={active ? 0 : -1}
                  className={`relative flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-[12px] font-bold tracking-wider transition-colors sm:px-4 ${active ? "text-bg" : "text-muted hover:text-text"}`}
                >
                  {active ? (
                    <motion.span
                      layoutId={reduced ? undefined : "mode-pill"}
                      className="absolute inset-0 rounded-md"
                      style={{ background: s.color }}
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  ) : null}
                  <I size={14} className="relative" aria-hidden />
                  <span className="relative whitespace-nowrap">{s.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 px-1 text-[12px] text-muted">
            <span className={`h-2 w-2 rounded-full ${switching ? "animate-ping" : ""}`} style={{ background: spec.color }} aria-hidden />
            {switching ? (
              <span>isolating {spec.target}…</span>
            ) : (
              <span>
                <span className="text-text">{spec.target}</span> reached
              </span>
            )}
          </div>
        </div>

        <div id="mode-panel" role="tabpanel" aria-live="polite" className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          {/* left: status + metrics */}
          <div className="border-b border-line p-5 sm:p-6 lg:border-b-0 lg:border-r">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-dim">system status</div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mode}
                    initial={reduced ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="display mt-1 text-4xl sm:text-5xl"
                    style={{ color: spec.color }}
                  >
                    {spec.status}
                  </motion.div>
                </AnimatePresence>
                <div className="mt-1 text-[13px] text-muted">{spec.statusNote}</div>
              </div>
              <Icon size={28} style={{ color: spec.color }} aria-hidden className="shrink-0" />
            </div>

            <ul className="mt-7 space-y-4">
              {spec.metrics.map((m, i) => {
                const v = Math.max(0, Math.min(100, m.value + (jitter[i] ?? 0)));
                return (
                  <li key={`${mode}-${m.label}`}>
                    <div className="mb-1.5 flex justify-between gap-3 text-[12px]">
                      <span className="text-muted">{m.label}</span>
                      <span className={m.danger ? "text-red" : "text-text"}>{m.display}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-bg" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v)} aria-label={m.label}>
                      <div
                        className="h-full rounded-full transition-[width] duration-700 ease-out"
                        style={{ width: `${v}%`, background: m.danger ? "var(--red)" : spec.color }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-7 grid grid-cols-3 gap-3 border-t border-line pt-5 text-[12px]">
              {spec.readouts.map(([k, v]) => (
                <div key={k}>
                  <div className="text-dim">{k}</div>
                  <div className="text-text">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* right: visual, trend, warnings, journal */}
          <div className="grid gap-5 p-5 sm:p-6">
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-5">
              <pre className="text-[11px] leading-[1.15] sm:text-[12px]" style={{ color: spec.color }} aria-label={`${spec.label} physique render`}>
                {spec.torso.join("\n")}
              </pre>
              <div className="min-w-0">
                <div className="mb-1 flex justify-between text-[11px] text-dim">
                  <span>scale weight · 12 wk</span>
                  <span className="text-text">{spec.weight[spec.weight.length - 1]} kg</span>
                </div>
                <Sparkline points={spec.weight} color={spec.color} />
              </div>
            </div>

            <div>
              <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-dim">warnings</div>
              <ul className="space-y-1.5 text-[12.5px]">
                {spec.warnings.map((w) => (
                  <li key={w} className="flex gap-2">
                    <AlertTriangle size={13} className="mt-[3px] shrink-0 text-amber" aria-hidden />
                    <span className="text-text/90">{w}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-line bg-bg p-3">
              <div className="mb-1.5 text-[11px] text-dim">journalctl -f -u {spec.target}</div>
              <ul className="h-[112px] space-y-0.5 overflow-hidden text-[11.5px] text-muted" aria-live="off">
                {log.map((l) => (
                  <li key={l.id} className="truncate">
                    <span className="text-dim">{String(l.id).padStart(4, "0")}</span> {l.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
