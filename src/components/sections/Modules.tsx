"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import SectionHead from "@/components/ui/SectionHead";

type Status = "stable" | "unstable" | "migrating" | "experimental";

const MODULES: { id: string; name: string; version: string; status: Status; title: string; line: string; snippet: string }[] = [
  {
    id: "overload",
    name: "progressive-overload-engine",
    version: "5.0.0",
    status: "stable",
    title: "Progressive Overload Engine",
    line: "Your previous PR is now deprecated. Upgrade immediately.",
    snippet: `$ poe check --lift bench
current_pr:   100.0 kg   (deprecated)
next_target:  102.5 kg
eta:          3 weeks, assuming sleep
status:       UPGRADE REQUIRED
note:         no rollback available. there is only forward.`,
  },
  {
    id: "memory",
    name: "muscle-memory-alloc",
    version: "2.3.1",
    status: "stable",
    title: "Muscle Memory Allocation",
    line: "RAM is temporary. Gains are forever.",
    snippet: `$ free --muscle
               total      used      free
Mem:         8 years   3 years   5 years
Muscle:    permanent permanent         0
cached:    every PR, bench groove, the one good squat

note: muscle memory survives reboots, vacations, and holidays.`,
  },
  {
    id: "recovery",
    name: "recovery-daemon",
    version: "1.0.0-rc.9",
    status: "unstable",
    title: "Recovery Daemon",
    line: "Sleep is required. Unfortunately, production never stops.",
    snippet: `recoveryd[7]: requested 8h00m of sleep
recoveryd[7]: granted 5h12m (one more episode)
recoveryd[7]: DOMS on /dev/chest: expected
recoveryd[7]: DOMS on /dev/legs: not found (legs not installed)
recoveryd[7]: entering degraded mode. coffee spawned.`,
  },
  {
    id: "migration",
    name: "legacy-physique-migrator",
    version: "1.0.0",
    status: "migrating",
    title: "Legacy Physique Migration",
    line: "Migrating from Dad Bod v2.1 to Absolute Unit 1.0.",
    snippet: `$ migrate --from dadbod@2.1 --to absolute-unit@1.0
✓ remove: farmer_tan (partial)
✓ remove: "I used to play sports"
✓ add:    delts, traps, mild arrogance
✗ remove: beer_belly — resource busy (weekend)
… 61% complete · eta: 2 bulks, 1 cut, 0 shortcuts`,
  },
  {
    id: "ppm",
    name: "protein-package-manager",
    version: "9.1.2",
    status: "stable",
    title: "Protein Package Manager",
    line: "Dependency resolution failed. Consume additional chicken.",
    snippet: `$ ppm install muscle
resolving dependencies...
error: unresolved dependency 'protein >= 160g' (have: 94g)
  required by: muscle → hypertrophy → you
suggestion: ppm install chicken --qty=2
            ppm install greek-yogurt --no-flavor-required`,
  },
  {
    id: "calves",
    name: "calves-compat-layer",
    version: "0.0.1-alpha",
    status: "experimental",
    title: "Calves Compatibility Layer",
    line: "Experimental support. No guarantees.",
    snippet: `calvesd: loading genetics... not found
calvesd: falling back to polyfill: high-socks
calvesd: running 'standing calf raise' x 400
calvesd: growth detected: 0.0mm (±0.0mm)
calvesd: this is fine. it has always been fine.`,
  },
];

const STATUS_CLASS: Record<Status, string> = {
  stable: "text-accent border-accent/40",
  unstable: "text-amber border-amber/40",
  migrating: "text-cyan border-cyan/40",
  experimental: "text-red border-red/40",
};

export default function Modules() {
  const [active, setActive] = useState(MODULES[0].id);
  const reduced = useReducedMotion();
  const mod = MODULES.find((m) => m.id === active) ?? MODULES[0];
  const [progress, setProgress] = useState<{ id: string; n: number }>({ id: MODULES[0].id, n: Infinity });
  const shown = reduced ? mod.snippet.length : progress.id === active ? progress.n : 0;
  const typed = mod.snippet.slice(0, shown);

  // type the snippet out when the selection changes
  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => {
      setProgress((p) => {
        const n = (p.id === active ? p.n : 0) + 6;
        if (n >= mod.snippet.length) clearInterval(t);
        return { id: active, n };
      });
    }, 16);
    return () => clearInterval(t);
  }, [active, mod.snippet.length, reduced]);

  return (
    <section id="modules" className="mx-auto max-w-[1240px] scroll-mt-20 px-4 py-20 sm:px-6 md:py-28">
      <SectionHead index="04" command="dpkg -l | grep gains" title="Installed modules">
        Six packages ship with every install. Hover or select one to inspect it. Support levels vary. Calves vary the most.
      </SectionHead>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ul role="tablist" aria-orientation="vertical" aria-label="Modules" className="divide-y divide-line border-y border-line">
          {MODULES.map((m, i) => {
            const on = m.id === active;
            return (
              <li key={m.id}>
                <button
                  role="tab"
                  type="button"
                  aria-selected={on}
                  aria-controls="module-preview"
                  onMouseEnter={() => setActive(m.id)}
                  onFocus={() => setActive(m.id)}
                  onClick={() => setActive(m.id)}
                  className={`group grid w-full grid-cols-[2.2rem_minmax(0,1fr)] gap-3 py-4 text-left transition-colors sm:grid-cols-[2.2rem_minmax(0,1fr)_auto] ${on ? "" : "opacity-70 hover:opacity-100"}`}
                >
                  <span className={`pt-0.5 text-[12px] ${on ? "text-accent" : "text-dim"}`}>{String(i + 1).padStart(2, "0")}</span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span className="display text-lg uppercase text-text sm:text-xl">{m.title}</span>
                    </span>
                    <span className="mt-0.5 block text-[12px] text-dim">
                      {m.name} <span className="text-muted">v{m.version}</span>
                    </span>
                    <span className="mt-1.5 block text-[13px] text-muted">{m.line}</span>
                  </span>
                  <span className={`col-start-2 w-fit self-start rounded border px-1.5 py-0.5 text-[10.5px] uppercase tracking-wider sm:col-start-3 ${STATUS_CLASS[m.status]}`}>
                    {m.status}
                  </span>
                </button>
                {/* inline preview on small screens */}
                <AnimatePresence initial={false}>
                  {on ? (
                    <motion.pre
                      initial={reduced ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reduced ? undefined : { height: 0, opacity: 0 }}
                      className="mb-4 overflow-hidden whitespace-pre-wrap rounded-lg border border-line bg-[#070908] p-3 text-[12px] leading-[1.55] text-text/90 lg:hidden"
                    >
                      {m.snippet}
                    </motion.pre>
                  ) : null}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>

        <div className="hidden lg:block">
          <div id="module-preview" role="tabpanel" className="sticky top-24 overflow-hidden rounded-xl border border-line-2 bg-[#070908]">
            <div className="flex items-center justify-between border-b border-line bg-panel px-3 py-2 text-[12px] text-muted">
              <span>{mod.name}</span>
              <span className={`rounded border px-1.5 py-0.5 text-[10.5px] uppercase tracking-wider ${STATUS_CLASS[mod.status]}`}>{mod.status}</span>
            </div>
            <pre className="min-h-[230px] whitespace-pre-wrap p-4 text-[13px] leading-[1.65] text-text/90">
              {typed}
              {typed.length < mod.snippet.length ? <span className="cursor" /> : null}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
