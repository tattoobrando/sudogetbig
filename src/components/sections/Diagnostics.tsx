"use client";

import { useState, type FormEvent } from "react";
import { useReducedMotion } from "motion/react";
import { Bug, Check, Copy, Radar, Share2, ShieldAlert } from "lucide-react";
import SectionHead from "@/components/ui/SectionHead";
import { useGains } from "@/components/providers/GainsProvider";
import { buildReport } from "@/lib/report";
import { copyText } from "@/lib/clipboard";
import { intBetween, pick, sample } from "@/lib/random";

/* ---------------- legscan: vulnerability scanner ---------------- */
type Sev = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type Vuln = { id: string; sev: Sev; cvss: string; title: string; patch: string };

const ALWAYS: Vuln = {
  id: "CVE-2026-0420",
  sev: "CRITICAL",
  cvss: "9.8",
  title: "Skipped leg day (remote, unauthenticated, everyone can see it)",
  patch: "squat(8). There is no other patch.",
};

const POOL: Vuln[] = [
  { id: "CVE-2026-1337", sev: "HIGH", cvss: "8.1", title: "Ego lifting detected in production", patch: "Reduce weight 20%. Keep dignity 100%." },
  { id: "CVE-2026-0808", sev: "MEDIUM", cvss: "6.5", title: "Unpatched sleep schedule (5h12m average)", patch: "Put the phone in another room." },
  { id: "CVE-2026-0042", sev: "LOW", cvss: "3.1", title: "Forearms exposed but not maintained", patch: "Carry the groceries in one trip." },
  { id: "CVE-2026-2014", sev: "LOW", cvss: "2.9", title: "Hardcoded bro split since 2014", patch: "Refactor to a program written after 2014." },
  { id: "CVE-2026-0400", sev: "HIGH", cvss: "7.7", title: "Supply chain: pre-workout from an untrusted vendor", patch: "Read the label. Then read it again." },
  { id: "CVE-2026-0666", sev: "MEDIUM", cvss: "5.9", title: "Mirror-only training: front delts over-privileged, rear delts orphaned", patch: "Face pulls. Yes, really." },
  { id: "CVE-2026-0113", sev: "MEDIUM", cvss: "5.3", title: "Half reps logged as full reps (integrity violation)", patch: "Full range of motion. Full honesty." },
  { id: "CVE-2026-0007", sev: "LOW", cvss: "2.2", title: "Wrist wraps used for bicep curls (misconfiguration)", patch: "Remove. You'll survive." },
];

const SEV_CLASS: Record<Sev, string> = {
  CRITICAL: "bg-red text-bg",
  HIGH: "border border-red/50 text-red",
  MEDIUM: "border border-amber/50 text-amber",
  LOW: "border border-line-2 text-muted",
};

function Scanner() {
  const reduced = useReducedMotion();
  const { toast } = useGains();
  const [state, setState] = useState<"idle" | "scanning" | "done">("idle");
  const [log, setLog] = useState<string[]>([]);
  const [found, setFound] = useState<Vuln[]>([]);
  const [pct, setPct] = useState(0);

  const scan = async () => {
    setState("scanning");
    setFound([]);
    setLog([]);
    setPct(0);
    const steps = [
      "Enumerating muscle groups... 14 found (2 hidden under pants)",
      "Probing quads... weak response",
      "Probing hamstrings... service not running",
      "Probing calves... timeout (genetics firewall)",
      "Fingerprinting split... bro split v1 detected",
      "Checking sleep endpoint... 5h12m (insecure)",
    ];
    const wait = (ms: number) => new Promise((r) => setTimeout(r, reduced ? 10 : ms));
    for (let i = 0; i < steps.length; i++) {
      setLog((l) => [...l, steps[i]]);
      setPct(Math.round(((i + 1) / steps.length) * 100));
      await wait(380);
    }
    const res = [ALWAYS, ...sample(POOL, intBetween(3, 4))].sort((a, b) => Number(b.cvss) - Number(a.cvss));
    setFound(res);
    setState("done");
    toast({ kind: "alert", title: "legscan: 1 critical vulnerability", body: "Your physique failed the penetration test." });
  };

  const counts = found.reduce<Record<Sev, number>>((acc, v) => ({ ...acc, [v.sev]: acc[v.sev] + 1 }), { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 });

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-line-2 bg-panel">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2 text-[13px] font-bold text-text">
          <Radar size={16} className="text-accent" aria-hidden /> legscan
          <span className="font-normal text-dim">v3.1 · lower-body attack surface</span>
        </div>
        <button
          type="button"
          onClick={scan}
          disabled={state === "scanning"}
          className="rounded-md bg-accent px-3 py-1.5 text-[12px] font-bold text-accent-ink disabled:opacity-50"
        >
          {state === "idle" ? "Run scan" : state === "scanning" ? "Scanning…" : "Rescan"}
        </button>
      </div>
      <div className="min-h-[320px] flex-1 p-4 text-[12.5px]" aria-live="polite">
        {state === "idle" ? (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 text-center text-muted">
            <ShieldAlert size={22} className="text-dim" aria-hidden />
            <p className="max-w-xs">No scan run yet. The vulnerabilities exist either way. This just makes them official.</p>
          </div>
        ) : (
          <>
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-bg">
              <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
            </div>
            {state === "scanning" ? (
              <ul className="space-y-1 text-muted">
                {log.map((l) => (
                  <li key={l}>
                    <span className="text-accent">›</span> {l}
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
                  {(Object.keys(counts) as Sev[]).map((s) => (
                    <span key={s} className={`rounded px-1.5 py-0.5 ${SEV_CLASS[s]}`}>
                      {counts[s]} {s.toLowerCase()}
                    </span>
                  ))}
                </div>
                <ul className="divide-y divide-line">
                  {found.map((v) => (
                    <li key={v.id} className="grid gap-1 py-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded px-1.5 py-px text-[10.5px] font-bold ${SEV_CLASS[v.sev]}`}>{v.sev}</span>
                        <code className="text-[11.5px] text-dim">
                          {v.id} · CVSS {v.cvss}
                        </code>
                      </div>
                      <div className="text-text">{v.title}</div>
                      <div className="text-muted">
                        <span className="text-accent">patch:</span> {v.patch}
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 border-t border-line pt-3 text-red">Result: your physique failed the penetration test.</p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- bug report generator ---------------- */
const COMPONENTS = ["chest", "back", "arms", "legs", "abs", "calves", "sleep", "motivation", "diet"] as const;
type Component = (typeof COMPONENTS)[number];
const SYMPTOMS = ["not growing", "stalled PR", "asymmetric", "invisible", "always tired", "won't fit in shirts", "hurts (in a bad way)"] as const;

const ROOT_CAUSE: Record<Component, string[]> = {
  chest: ["Bench press is not production-ready.", "Elbows flared to 90°. Shoulders filed a grievance."],
  back: ["Can't see it, therefore can't train it. Known limitation of mirrors.", "Rows are 70% lower back, 30% hope."],
  arms: ["Triceps ignored in favor of 14 curl variations.", "Arm day scheduled daily. Recovery daemon never ran."],
  legs: ["leg_day.service disabled since 2019.", "Legs are a legacy dependency nobody wants to maintain."],
  abs: ["Abs are installed. They're under /bellyfat.", "404: Visible abs not found. Kitchen is upstream."],
  calves: ["Genetics not found. Package unavailable for this architecture.", "Calves are hardware, not software."],
  sleep: ["One more episode (x4).", "Phone is a root-level process with no rate limit."],
  motivation: ["motivation is deprecated. Migrate to discipline.", "Runs only on Mondays and January."],
  diet: ["Protein intake rate-limited by budget.", "Weekend cheat meal has been promoted to a cheat weekend."],
};

const WORKAROUND: Record<Component, string> = {
  chest: "Tuck elbows. Add weight slowly. Stop asking the gym for a spot on your warm-up.",
  back: "Pull with your elbows. Ask a friend to take a photo. Be emotionally prepared.",
  arms: "Do triceps. They are two-thirds of the arm.",
  legs: "Squat. We're sorry. There's no flag for this.",
  abs: "Caloric deficit. The rm command won't help.",
  calves: "High socks. Acceptance. Calf raises, out of spite.",
  sleep: "Phone in another room. 8 hours. It's free and it works.",
  motivation: "Install discipline. It doesn't feel good. That's how you know it's working.",
  diet: "Eat more protein than seems reasonable. Then a bit more.",
};

function BugReport() {
  const [component, setComponent] = useState<Component>("calves");
  const [symptom, setSymptom] = useState<(typeof SYMPTOMS)[number]>("not growing");
  const [notes, setNotes] = useState("");
  const [issue, setIssue] = useState<null | { n: number; cause: string; status: string; labels: string[]; dup?: number }>(null);
  const [copied, setCopied] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const statuses = ["Closed as WONTFIX", "Closed as WORKS AS INTENDED", "Open since 2019", "Needs more protein", "Closed as DUPLICATE"];
    const status = component === "calves" ? "Closed as WONTFIX" : component === "legs" ? "Closed as DUPLICATE" : pick(statuses);
    const labels = [
      component,
      component === "calves" ? "genetics" : pick(["needs-more-protein", "user-error", "ego", "skill-issue", "good-first-squat"]),
      status.includes("WONTFIX") ? "wontfix" : status.includes("DUPLICATE") ? "duplicate" : "triage",
    ];
    setIssue({ n: intBetween(1200, 9800), cause: pick(ROOT_CAUSE[component]), status, labels, dup: status.includes("DUPLICATE") ? 1 : undefined });
    setCopied(false);
  };

  const markdown = issue
    ? [
        `### #${issue.n} [${component}] ${symptom}`,
        `**Status:** ${issue.status}${issue.dup ? ` of #${issue.dup} "skipped legs"` : ""}`,
        `**Labels:** ${issue.labels.join(", ")}`,
        notes.trim() ? `**Reporter notes:** ${notes.trim()}` : "",
        `**Root cause:** ${issue.cause}`,
        `**Workaround:** ${WORKAROUND[component]}`,
        `— filed via https://sudogetbig.com`,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const field = "w-full rounded-md border border-line-2 bg-bg px-3 py-2 text-[13px] text-text";

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-line-2 bg-panel">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3 text-[13px] font-bold text-text">
        <Bug size={16} className="text-accent" aria-hidden /> File a bug against your body
      </div>
      <div className="grid flex-1 gap-4 p-4">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-[12px] text-muted">
            component
            <select className={field} value={component} onChange={(e) => setComponent(e.target.value as Component)}>
              {COMPONENTS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-[12px] text-muted">
            symptom
            <select className={field} value={symptom} onChange={(e) => setSymptom(e.target.value as (typeof SYMPTOMS)[number])}>
              {SYMPTOMS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-[12px] text-muted sm:col-span-2">
            steps to reproduce (optional)
            <input
              className={field}
              value={notes}
              maxLength={140}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. did 400 calf raises, nothing happened"
            />
          </label>
          <button type="submit" className="rounded-md bg-accent px-3 py-2 text-[13px] font-bold text-accent-ink sm:col-span-2">
            Submit issue
          </button>
        </form>

        {issue ? (
          <div className="rounded-lg border border-line bg-bg p-3 text-[12.5px]" aria-live="polite">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-text">
                #{issue.n} [{component}] {symptom}
              </span>
              <span className={`rounded-full px-2 py-px text-[10.5px] ${issue.status.startsWith("Open") ? "bg-accent/15 text-accent" : "bg-violet/15 text-violet"}`}>
                {issue.status}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {issue.labels.map((l) => (
                <span key={l} className="rounded-full border border-line-2 px-2 py-px text-[10.5px] text-muted">
                  {l}
                </span>
              ))}
            </div>
            <dl className="mt-3 grid gap-1.5">
              {issue.dup ? (
                <div><dt className="inline text-dim">duplicate of: </dt><dd className="inline text-text">#1 &quot;skipped legs&quot; (opened 2019, 48k 👍)</dd></div>
              ) : null}
              <div><dt className="inline text-dim">root cause: </dt><dd className="inline text-text">{issue.cause}</dd></div>
              <div><dt className="inline text-dim">workaround: </dt><dd className="inline text-text">{WORKAROUND[component]}</dd></div>
            </dl>
            <button
              type="button"
              onClick={async () => setCopied(await copyText(markdown))}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-line-2 px-2.5 py-1.5 text-[12px] text-muted hover:text-text"
            >
              {copied ? <Check size={13} className="text-accent" aria-hidden /> : <Copy size={13} aria-hidden />}
              {copied ? "Copied as markdown" : "Copy as markdown"}
            </button>
          </div>
        ) : (
          <p className="text-[12.5px] text-dim">All reports are triaged by a senior engineer who has also skipped leg day.</p>
        )}
      </div>
    </div>
  );
}

/* ---------------- shareable system report ---------------- */
function SystemReport() {
  const g = useGains();
  const [text, setText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  const generate = async () => {
    const t = buildReport({ mode: g.mode, eggs: g.eggs.length, stats: g.stats, excusesKilled: g.excusesKilled });
    setText(t);
    setCanShare(typeof navigator.share === "function");
    setCopied(await copyText(t));
  };

  const share = async () => {
    if (!text) return;
    try {
      await navigator.share({ title: "My Gains System Report", text });
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="grid gap-4 rounded-xl border border-line-2 bg-panel p-4 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:p-6">
      <div>
        <div className="display text-2xl uppercase text-text">Gains system report</div>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          A plain-text summary of this session: your mode, your commands, your rejections, your eggs. Copy it into the group chat. Let them judge you.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={generate} className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-[13px] font-bold text-accent-ink">
            {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
            {text ? (copied ? "Copied — regenerate" : "Regenerate") : "Generate & copy"}
          </button>
          {text && canShare ? (
            <button type="button" onClick={share} className="inline-flex items-center gap-2 rounded-md border border-line-2 px-3 py-2 text-[13px] text-text">
              <Share2 size={14} aria-hidden /> Share
            </button>
          ) : null}
        </div>
      </div>
      <pre className="min-h-[220px] overflow-x-auto rounded-lg border border-line bg-[#070908] p-4 text-[12px] leading-[1.6] text-muted" aria-live="polite">
        {text ?? "$ report\n# nothing generated yet.\n# run some commands in the terminal first —\n# the report gets funnier the more you mess around."}
      </pre>
    </div>
  );
}

export default function Diagnostics() {
  return (
    <section id="diagnostics" className="mx-auto max-w-[1240px] scroll-mt-20 px-4 py-20 sm:px-6 md:py-28">
      <SectionHead index="05" command="sudo legscan --full && gains-report" title="Diagnostics">
        Security tooling for the human body. Scan for vulnerabilities, file bugs against your own anatomy, and export a report for people who
        didn&apos;t ask.
      </SectionHead>
      <div className="grid gap-6 lg:grid-cols-2">
        <Scanner />
        <BugReport />
      </div>
      <div className="mt-6">
        <SystemReport />
      </div>
    </section>
  );
}
