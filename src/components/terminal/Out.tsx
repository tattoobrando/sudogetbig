"use client";

import { useEffect, useState, type ReactNode } from "react";

/* Output primitives for terminal lines. Colors follow classic ANSI semantics. */

type P = { children?: ReactNode; className?: string };

export const G = ({ children, className = "" }: P) => <span className={`text-accent ${className}`}>{children}</span>;
export const Y = ({ children, className = "" }: P) => <span className={`text-amber ${className}`}>{children}</span>;
export const R = ({ children, className = "" }: P) => <span className={`text-red ${className}`}>{children}</span>;
export const C = ({ children, className = "" }: P) => <span className={`text-cyan ${className}`}>{children}</span>;
export const V = ({ children, className = "" }: P) => <span className={`text-violet ${className}`}>{children}</span>;
export const M = ({ children, className = "" }: P) => <span className={`text-muted ${className}`}>{children}</span>;
export const D = ({ children, className = "" }: P) => <span className={`text-dim ${className}`}>{children}</span>;
export const B = ({ children, className = "" }: P) => <span className={`font-bold text-text ${className}`}>{children}</span>;

/** Preformatted block (keeps spacing for tables and ASCII art). */
export const Pre = ({ children, className = "" }: P) => (
  <pre className={`whitespace-pre font-mono leading-[1.35] ${className}`}>{children}</pre>
);

export const Ok = ({ children }: P) => (
  <span>
    <G>✓</G> {children}
  </span>
);

export const Fail = ({ children }: P) => (
  <span>
    <R>✗</R> {children}
  </span>
);

export const Warn = ({ children }: P) => (
  <span>
    <Y className="font-bold">WARNING:</Y> {children}
  </span>
);

/** systemd-style status tags. */
export const Tag = ({ kind, children }: { kind: "ok" | "fail" | "warn"; children: ReactNode }) => (
  <span>
    <span className="text-dim">[</span>
    <span className={kind === "ok" ? "text-accent" : kind === "fail" ? "text-red" : "text-amber"}>
      {kind === "ok" ? "  OK  " : kind === "fail" ? "FAILED" : " WARN "}
    </span>
    <span className="text-dim">]</span> {children}
  </span>
);

/** Text progress bar: [██████░░░░] 62% */
export function Bar({ pct, width = 24, label, tone = "accent" }: { pct: number; width?: number; label?: ReactNode; tone?: "accent" | "amber" | "red" }) {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  const filled = Math.round((p / 100) * width);
  const color = tone === "accent" ? "text-accent" : tone === "amber" ? "text-amber" : "text-red";
  return (
    <span className="whitespace-pre">
      {label ? <span>{label} </span> : null}
      <span className="text-dim">[</span>
      <span className={color}>{"█".repeat(filled)}</span>
      <span className="text-line-2">{"░".repeat(width - filled)}</span>
      <span className="text-dim">]</span> <span className="tabular-nums">{String(p).padStart(3, " ")}%</span>
    </span>
  );
}

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

/** Braille spinner that animates on its own until the line is replaced. */
export function Spin({ children }: P) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % FRAMES.length), 80);
    return () => clearInterval(t);
  }, []);
  return (
    <span>
      <C>{FRAMES[i]}</C> {children}
    </span>
  );
}

/** Two-column help/listing rows. */
export function Rows({ rows, pad = 30 }: { rows: [ReactNode, ReactNode][]; pad?: number }) {
  return (
    <div className="grid gap-x-4 gap-y-0.5" style={{ gridTemplateColumns: `minmax(0, ${pad}ch) minmax(0, 1fr)` }}>
      {rows.map(([a, b], i) => (
        <div key={i} className="contents">
          <div className="truncate">{a}</div>
          <div className="text-muted">{b}</div>
        </div>
      ))}
    </div>
  );
}

/** Pre-sized ANSI-ish color swatches for neofetch. */
export const Swatches = () => (
  <span className="inline-flex gap-0">
    {["#0a0c0b", "#ff5f5f", "#3dff8c", "#ffb547", "#63d8ff", "#b99cff", "#7ae7c7", "#dfe6e1"].map((c) => (
      <span key={c} className="inline-block h-[1.1em] w-[2.2ch]" style={{ background: c }} />
    ))}
  </span>
);
