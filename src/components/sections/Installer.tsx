"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { Play, RotateCcw } from "lucide-react";
import SectionHead from "@/components/ui/SectionHead";
import { useGains } from "@/components/providers/GainsProvider";
import { Bar, G, M, Ok, R, Spin, Y } from "@/components/terminal/Out";
import { pick, sample } from "@/lib/random";

type Phase = "idle" | "running" | "ask-calves" | "ask-dirty" | "done" | "aborted";
type Line = { id: number; node: ReactNode };

const DOWNLOADS = [
  "creatine.exe (5.0 g)",
  "whey-isolate.tar.gz (30 g)",
  "chicken-breast.deb (200 g)",
  "sleep-8h.iso (corrupted, retrying)",
  "rice.bin (1 cup, dry)",
  "pump-cover.zip (oversized hoodie)",
  "broccoli.patch (mandatory, sadly)",
];

const COMPILE = [
  ["Compiling chest_day", "4 warnings: elbows flared"],
  ["Compiling back_day", "0 warnings (nobody can see it)"],
  ["Compiling arm_day", "optimizations disabled: too many curls"],
  ["Compiling shoulder_day", "built with -O3 (boulders)"],
] as const;

const OPTIMIZE = [
  "Linking mind_muscle_connection...",
  "Optimizing rest_periods... 6 min → 90 s (phone confiscated)",
  "Tuning progressive_overload (+2.5 kg/week, aspirational)",
  "Garbage-collecting junk volume...",
  "Indexing PR history (1 entry, disputed)",
];

const ENDINGS = [
  "Congratulations. You are now {n}% more jacked.",
  "Installation complete. Your shirts have been notified. You are {n}% more jacked.",
  "Done. Measurable gains: {n}%. Perceived gains: 40%.",
];

export default function Installer() {
  const reduced = useReducedMotion() ?? false;
  const { bump, toast } = useGains();
  const [lines, setLines] = useState<Line[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [runs, setRuns] = useState(0);
  const idRef = useRef(0);
  const answer = useRef<((v: boolean) => void) | null>(null);
  const cancelled = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dirtyRef = useRef(false);
  const yesRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, phase]);

  useEffect(() => () => {
    cancelled.current = true;
  }, []);

  const print = useCallback((node: ReactNode) => {
    const id = ++idRef.current;
    setLines((l) => [...l, { id, node }]);
    return (n: ReactNode) => setLines((l) => l.map((x) => (x.id === id ? { id, node: n } : x)));
  }, []);

  const sleep = useCallback(
    (ms: number) =>
      new Promise<void>((res, rej) =>
        setTimeout(() => (cancelled.current ? rej(new Error("cancelled")) : res()), reduced ? ms * 0.1 : ms),
      ),
    [reduced],
  );

  const ask = (p: Phase) =>
    new Promise<boolean>((res) => {
      setPhase(p);
      answer.current = (v) => {
        answer.current = null;
        setPhase("running");
        res(v);
      };
      setTimeout(() => yesRef.current?.focus({ preventScroll: true }), 50);
    });

  const bar = async (label: string, from: number, to: number) => {
    let p = from;
    const upd = print(<Bar pct={p} label={label} />);
    while (p < to) {
      await sleep(70);
      p = Math.min(to, p + 2 + Math.random() * 6);
      upd(<Bar pct={p} label={label} />);
    }
  };

  const spin = async (label: ReactNode, done: ReactNode = label) => {
    const upd = print(<Spin>{label}</Spin>);
    await sleep(380 + Math.random() * 380);
    upd(<Ok>{done}</Ok>);
  };

  const run = async () => {
    cancelled.current = false;
    setLines([]);
    setPhase("running");
    dirtyRef.current = false;
    setRuns((r) => r + 1);
    try {
      print(<span><G>$</G> ./install-gains.sh --interactive</span>);
      await sleep(300);
      print(<span>Installing hypertrophy dependencies...</span>);
      for (const d of sample(DOWNLOADS, 3)) {
        print(<M>  Downloading {d}...</M>);
        await sleep(240);
      }
      await bar("resolving", 0, 62);
      const [c, note] = pick(COMPILE);
      await spin(`${c}...`, <>{c}... <Y>[ok] ({note})</Y></>);
      for (const o of sample(OPTIMIZE, 2)) await spin(o);
      await sleep(300);
      print(<R className="font-bold">ERROR: Cannot locate calves.dll</R>);
      print(<M>  searched: /usr/lib/genetics, /opt/hope, ~/Downloads/calves_final_v2.dll</M>);

      const cont = await ask("ask-calves");
      print(<span>Continue anyway? [Y/n] <span className="text-text">{cont ? "Y" : "n"}</span></span>);
      if (!cont) {
        await spin("Rolling back transaction...");
        print(<Y>Installation aborted. You have been restored to your previous physique.</Y>);
        print(<M>It&apos;s fine. It&apos;s fine.</M>);
        setPhase("aborted");
        return;
      }
      print(<span>Proceeding without calves. Installing polyfill: <G>high-socks.sock</G></span>);
      await bar("installing", 62, 88);

      const dirty = await ask("ask-dirty");
      dirtyRef.current = dirty;
      print(<span>Enable experimental feature &apos;dirty_bulk&apos;? [y/N] <span className="text-text">{dirty ? "y" : "N"}</span></span>);
      if (dirty) {
        await spin("Disabling safety protocols...");
        print(<Y>W: pizza.so loaded from an untrusted source (the group chat)</Y>);
      }
      await bar("finalizing", 88, 100);
      await sleep(200);
      const n = (0.001 + Math.random() * 0.006).toFixed(3);
      print(
        <div className="mt-2 border-t border-line-2 pt-2">
          <div className="display text-2xl text-accent glow">INSTALLATION COMPLETE</div>
          <div className="mt-1 text-text">&ldquo;{pick(ENDINGS).replace("{n}", n)}{dirty ? " And 4% rounder." : ""}&rdquo;</div>
          <div className="mt-1 text-muted">calves: still 404 · leg_day: not installed · excuses: removed (temporarily)</div>
        </div>,
      );
      bump("installs");
      setPhase("done");
      if (runs + 1 >= 3) toast({ kind: "info", title: "installer: run #" + (runs + 1), body: "Reinstalling does not stack. We admire the persistence, though." });
    } catch {
      /* cancelled on unmount */
    }
  };

  const respond = (v: boolean) => answer.current?.(v);

  // keyboard: Y / N while a question is open (when focus is inside the section)
  const onKey = (e: KeyboardEvent) => {
    if (phase !== "ask-calves" && phase !== "ask-dirty") return;
    if (e.key.toLowerCase() === "y") {
      e.preventDefault();
      respond(true);
    } else if (e.key.toLowerCase() === "n") {
      e.preventDefault();
      respond(false);
    }
  };

  const asking = phase === "ask-calves" || phase === "ask-dirty";
  const status =
    phase === "idle" ? "idle" : phase === "running" ? "running" : asking ? "awaiting input" : phase === "done" ? "complete" : "aborted";

  return (
    <section id="installer" className="scroll-mt-20 border-y border-line bg-bg-2">
      <div className="mx-auto max-w-[1240px] px-4 py-20 sm:px-6 md:py-28">
        <SectionHead index="03" command="./install-gains.sh --interactive" title="Gains installer">
          A guided installation with real decisions and unreal consequences. Replayable. Results differ every run, like your bench.
        </SectionHead>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div onKeyDown={onKey} className="overflow-hidden rounded-xl border border-line-2 bg-[#070908]">
            <div className="flex items-center justify-between border-b border-line bg-panel px-3 py-2 text-[12px] text-muted">
              <span>install-gains.sh</span>
              <span className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${phase === "done" ? "bg-accent" : phase === "aborted" ? "bg-red" : phase === "idle" ? "bg-dim" : "bg-amber"}`} />
                {status}
              </span>
            </div>
            <div ref={scrollRef} className="term-scroll h-[360px] overflow-y-auto px-4 py-3 text-[13px] leading-[1.6]" role="log" aria-label="Installer output">
              {phase === "idle" && !lines.length ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <p className="max-w-xs text-muted">Nothing installed yet. Your physique is currently running the factory defaults.</p>
                  <button
                    type="button"
                    onClick={run}
                    className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-[13px] font-bold text-accent-ink"
                  >
                    <Play size={15} aria-hidden /> Run installer
                  </button>
                </div>
              ) : (
                lines.map((l) => <div key={l.id}>{l.node}</div>)
              )}

              {asking ? (
                <div className="mt-2 rounded-lg border border-amber/40 bg-amber/5 p-3">
                  <div className="mb-2 text-amber">
                    {phase === "ask-calves" ? "Continue anyway? [Y/n]" : "Enable experimental feature 'dirty_bulk'? [y/N]"}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      ref={yesRef}
                      type="button"
                      onClick={() => respond(true)}
                      className="rounded-md bg-accent px-3 py-1.5 text-[12px] font-bold text-accent-ink"
                    >
                      {phase === "ask-calves" ? "Y — skip calves (as usual)" : "y — what could go wrong"}
                    </button>
                    <button
                      type="button"
                      onClick={() => respond(false)}
                      className="rounded-md border border-line-2 px-3 py-1.5 text-[12px] text-text hover:border-red/60"
                    >
                      {phase === "ask-calves" ? "n — abort and stay small" : "N — keep it clean"}
                    </button>
                  </div>
                  <div className="mt-2 text-[11px] text-dim">or press Y / N</div>
                </div>
              ) : null}
            </div>
          </div>

          <aside className="flex flex-col gap-4 text-[13px]">
            <div className="rounded-xl border border-line p-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-dim">run</div>
              <div className="mt-1 text-2xl font-bold tabular-nums text-text">#{runs}</div>
              <p className="mt-1 text-muted">
                {runs === 0 ? "Fresh system." : runs < 3 ? "Gains do not stack across installs." : "At this point it's a lifestyle."}
              </p>
            </div>
            <button
              type="button"
              onClick={run}
              disabled={phase === "running" || asking}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-line-2 px-4 py-3 text-[13px] text-text transition-colors hover:border-accent/60 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {runs ? <RotateCcw size={15} aria-hidden /> : <Play size={15} aria-hidden />}
              {runs ? "Reinstall from scratch" : "Run installer"}
            </button>
            <p className="text-[12px] leading-relaxed text-dim">
              Known issue: calves.dll has never been located on any system. Workarounds include high socks and acceptance.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
