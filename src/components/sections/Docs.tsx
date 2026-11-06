"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BookOpen, GitCommitHorizontal, Tag, X } from "lucide-react";
import { useGains } from "@/components/providers/GainsProvider";

const RELEASES = [
  {
    tag: "v2.4.0",
    name: "Bulk Season",
    date: "2026-10-28",
    hash: "9f2c1ab",
    latest: true,
    items: [
      ["feat", "Dirty bulk mode (unsupported, extremely popular)."],
      ["feat", "Pizza dependency resolver. Extra cheese pinned to latest."],
      ["fix", "Shirts now report a size mismatch instead of tearing silently."],
      ["known", "Belly expansion under dirty bulk is expected behavior."],
    ],
  },
  {
    tag: "v2.3.0",
    name: "Overload",
    date: "2026-07-14",
    hash: "3a7e0d4",
    items: [
      ["breaking", "All previous PRs are deprecated. There is no compatibility mode."],
      ["feat", "Progressive Overload Engine v5 (+2.5 kg/week, aspirational)."],
      ["perf", "Rest periods reduced from 6 min (scrolling) to 90 s (phone in locker)."],
    ],
  },
  {
    tag: "v2.2.1",
    name: "Hotfix",
    date: "2026-03-02",
    hash: "c0ffee1",
    items: [
      ["fix", "excuses.service no longer restarts automatically. (It still does.)"],
      ["security", "Patched CVE-2026-0420 (skipped leg day). Patch not applied."],
    ],
  },
  {
    tag: "v2.0.0",
    name: "Absolute Unit",
    date: "2025-09-21",
    hash: "a8501u7",
    items: [
      ["breaking", "Migrated from Dad Bod v2.1. Some lawn-mowing tans were lost."],
      ["removed", "excuses.txt"],
      ["feat", "sudo get big"],
    ],
  },
  {
    tag: "v0.1.0",
    name: "Initial commit",
    date: "2019-03-04",
    hash: "d4db0d2",
    items: [["feat", "One push-up. Then a nap."], ["revert", "leg day"]],
  },
] as const;

const LABEL: Record<string, string> = {
  feat: "text-accent border-accent/40",
  fix: "text-cyan border-cyan/40",
  perf: "text-violet border-violet/40",
  breaking: "text-red border-red/40",
  security: "text-amber border-amber/40",
  known: "text-muted border-line-2",
  removed: "text-red border-red/40",
  revert: "text-amber border-amber/40",
};

const H = ({ children }: { children: string }) => <div className="mt-5 font-bold text-text">{children}</div>;
const I = ({ children }: { children: ReactNode }) => <div className="pl-6 text-muted sm:pl-10">{children}</div>;
const Opt = ({ flag, children }: { flag: string; children: ReactNode }) => (
  <div className="grid gap-x-4 pl-6 sm:grid-cols-[9rem_minmax(0,1fr)] sm:pl-10">
    <span className="font-bold text-accent">{flag}</span>
    <span className="text-muted">{children}</span>
  </div>
);

function ManPage() {
  return (
    <div className="text-[13px] leading-[1.7]">
      <div className="flex justify-between text-dim">
        <span>GAINS(1)</span>
        <span className="hidden sm:inline">SwoleOS Manual</span>
        <span>GAINS(1)</span>
      </div>
      <H>NAME</H>
      <I>gains — grant root access to your physique</I>
      <H>SYNOPSIS</H>
      <I>
        <span className="text-text">sudo get big</span> [--now] [--dirty] [--no-legs]
        <br />
        <span className="text-text">sudo apt install</span> &lt;muscle&gt;...
      </I>
      <H>DESCRIPTION</H>
      <I>
        gains escalates your physique from limited user privileges to MASSIVE. It does this by running progressive overload in a loop until
        something gives. Ideally the muscle. It is not a fitness platform, a meal plan, or a substitute for a coach, a doctor, or eating vegetables.
      </I>
      <H>OPTIONS</H>
      <Opt flag="--now">Skip confirmation. Also skips warm-up (not recommended).</Opt>
      <Opt flag="--dirty">Enable dirty bulk. Disables all safety protocols.</Opt>
      <Opt flag="--no-legs">Default behavior. Retained for backwards compatibility.</Opt>
      <Opt flag="--natty">Accepted. Cannot be verified.</Opt>
      <Opt flag="-v, --verbose">Narrate every set to the people near you.</Opt>
      <H>EXIT STATUS</H>
      <Opt flag="0">Gains installed.</Opt>
      <Opt flag="1">General failure (skipped breakfast).</Opt>
      <Opt flag="2">Misuse of equipment (curls in the squat rack).</Opt>
      <Opt flag="137">Killed by OOM (ate the whole buffet).</Opt>
      <H>ENVIRONMENT</H>
      <Opt flag="PROTEIN">Daily protein target. Default: yes.</Opt>
      <Opt flag="REST">Seconds between sets. Ignored while phone is in hand.</Opt>
      <H>BUGS</H>
      <I>
        Calves are not supported on this architecture.
        <br />
        leg_day.service fails to start on most systems.
        <br />
        Running <span className="text-text">sudo get big</span> twice does not make you twice as big.
      </I>
      <H>SEE ALSO</H>
      <I>squat(8), sleep(1), eat(1), touch(1) — but not grass</I>
      <div className="mt-6 flex justify-between text-dim">
        <span>SwoleOS 24.04</span>
        <span>November 2026</span>
        <span>GAINS(1)</span>
      </div>
    </div>
  );
}

function Changelog() {
  return (
    <ol className="relative space-y-8 border-l border-line pl-6">
      {RELEASES.map((r) => (
        <li key={r.tag} className="relative">
          <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full border border-line-2 bg-bg">
            <GitCommitHorizontal size={10} className="text-accent" aria-hidden />
          </span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1 text-[13px] font-bold text-text">
              <Tag size={13} className="text-accent" aria-hidden /> {r.tag}
            </span>
            <span className="text-[13px] text-text">{r.name}</span>
            {"latest" in r && r.latest ? (
              <span className="rounded-full border border-accent/50 px-2 py-0.5 text-[10.5px] text-accent">Latest</span>
            ) : null}
            <span className="text-[12px] text-dim">
              {r.date} · <code>{r.hash}</code>
            </span>
          </div>
          <ul className="mt-3 space-y-1.5">
            {r.items.map(([k, t]) => (
              <li key={t} className="flex gap-2 text-[13px]">
                <span className={`h-fit w-[4.6rem] shrink-0 rounded border px-1.5 py-px text-center text-[10.5px] uppercase tracking-wider ${LABEL[k]}`}>{k}</span>
                <span className="text-muted">{t}</span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

export default function Docs() {
  const { docsOpen, openDocs, closeDocs } = useGains();
  const [tab, setTab] = useState<"man" | "changelog">("man");
  const reduced = useReducedMotion();

  return (
    <section id="docs" className="mx-auto max-w-[1240px] scroll-mt-20 px-4 sm:px-6">
      <AnimatePresence initial={false}>
        {docsOpen ? (
          <motion.div
            key="docs"
            initial={reduced ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduced ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="py-16 md:py-24">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="mb-3 flex items-center gap-3 text-[12px] text-muted">
                    <span className="text-accent">[man]</span>
                    <span className="h-px w-8 bg-line-2" aria-hidden />
                    <code><span className="text-dim">$</span> man gains | less</code>
                  </div>
                  <h2 className="display text-[2.1rem] uppercase text-text sm:text-5xl">Documentation</h2>
                </div>
                <div className="flex items-center gap-2">
                  <div role="tablist" aria-label="Documentation" className="flex rounded-lg border border-line-2 p-1 text-[12px]">
                    {(["man", "changelog"] as const).map((t) => (
                      <button
                        key={t}
                        role="tab"
                        type="button"
                        aria-selected={tab === t}
                        onClick={() => setTab(t)}
                        className={`rounded-md px-3 py-1.5 transition-colors ${tab === t ? "bg-panel-2 text-text" : "text-muted hover:text-text"}`}
                      >
                        {t === "man" ? "gains(1)" : "releases"}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={closeDocs}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line-2 px-3 py-2 text-[12px] text-muted hover:text-text"
                    aria-label="Close documentation"
                  >
                    <X size={14} aria-hidden /> q
                  </button>
                </div>
              </div>
              <div className="rounded-xl border border-line-2 bg-[#070908] p-5 sm:p-8">{tab === "man" ? <ManPage /> : <Changelog />}</div>
              <p className="mt-3 text-[12px] text-dim">Manual page gains(1) line 1/48 (END) — press q to quit (or click the button, we&apos;re not monsters)</p>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-start justify-between gap-4 border-t border-line py-10 sm:flex-row sm:items-center">
            <div className="text-[13px] text-muted">
              <span className="text-text">Documentation</span> is available. Nobody reads it, which is why it&apos;s collapsed.
            </div>
            <button
              type="button"
              onClick={() => openDocs(false)}
              className="inline-flex items-center gap-2 rounded-lg border border-line-2 px-4 py-2.5 text-[13px] text-text hover:border-accent/60"
            >
              <BookOpen size={15} aria-hidden /> man gains
            </button>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
