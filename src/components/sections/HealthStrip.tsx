"use client";

import { useEffect, useState } from "react";
import { Skull } from "lucide-react";
import { useGains } from "@/components/providers/GainsProvider";

/* A tmux-style status line: Gains Uptime, Protein Bandwidth, Excuse Processes, Leg Day. */

const EPOCH = Date.UTC(2025, 8, 21, 5, 0, 0); // when gains.service was first started

function fmtUptime(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(sec).padStart(2, "0")}s`;
}

export default function HealthStrip() {
  const { excusesKilled, setExcusesKilled, toast } = useGains();
  const [now, setNow] = useState<number | null>(null);
  const [bandwidth, setBandwidth] = useState(182.4);
  const [excuses, setExcuses] = useState(4812);

  useEffect(() => {
    const tick = () => {
      setNow(Date.now());
      setBandwidth((b) => Math.max(150, Math.min(215, b + (Math.random() - 0.5) * 6)));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // excuses respawn (Restart=always)
  useEffect(() => {
    if (!excusesKilled) {
      const t = setInterval(() => setExcuses((x) => x + Math.floor(Math.random() * 3)), 2500);
      return () => clearInterval(t);
    }
    const t = setTimeout(() => {
      setExcusesKilled(false);
      setExcuses(1);
      toast({ kind: "warn", title: "excuses.service restarted", body: "Restart=always. New excuse: “I'll start Monday.”" });
    }, 9000);
    return () => clearTimeout(t);
  }, [excusesKilled, setExcusesKilled, toast]);

  const cell = "flex min-w-0 items-center gap-2 px-4 py-3";

  return (
    <section aria-label="System health" className="border-y border-line bg-bg-2">
      <div className="mx-auto grid max-w-[1240px] grid-cols-2 divide-line text-[12px] sm:px-2 md:grid-cols-4 md:divide-x">
        <div className={cell}>
          <span className="text-dim">gains uptime</span>
          <span className="truncate tabular-nums text-accent" suppressHydrationWarning>
            {now ? fmtUptime(now - EPOCH) : "—"}
          </span>
        </div>
        <div className={cell}>
          <span className="text-dim">protein bw</span>
          <span className="tabular-nums text-text">{bandwidth.toFixed(1)} g/day</span>
        </div>
        <div className={`${cell} justify-between`}>
          <span className="flex items-center gap-2">
            <span className="text-dim">excuse procs</span>
            <span className={`tabular-nums ${excusesKilled ? "text-accent" : "text-amber"}`}>{excusesKilled ? 0 : excuses.toLocaleString()}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setExcusesKilled(true);
              toast({ kind: "ok", title: "kill -9 excuses", body: "All 4,812 excuse processes terminated. Enjoy it while it lasts." });
            }}
            disabled={excusesKilled}
            className="flex items-center gap-1 rounded border border-line-2 px-1.5 py-0.5 text-[11px] text-muted transition-colors hover:border-red/60 hover:text-red disabled:opacity-40"
          >
            <Skull size={12} aria-hidden /> kill -9
          </button>
        </div>
        <div className={cell}>
          <span className="text-dim">leg_day</span>
          <span className="text-red">last seen: never</span>
        </div>
      </div>
    </section>
  );
}
