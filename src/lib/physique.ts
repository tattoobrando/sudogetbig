/* ------------------------------------------------------------------
   GitHub physique: turns public GitHub activity into a (scientifically
   meaningless) bodybuilding report. Pure functions + a fetch helper,
   shared by the browser terminal and the curl endpoint.
   ------------------------------------------------------------------ */

export interface GhUser {
  login: string;
  name: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}
export interface GhRepo {
  name: string;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
  size: number;
}
export interface GhEvent {
  type: string;
  created_at: string;
  payload?: { size?: number; distinct_size?: number; commits?: unknown[]; action?: string };
}
export interface GhData {
  user: GhUser;
  repos: GhRepo[];
  events: GhEvent[];
}

export type GhErrorKind = "invalid" | "notfound" | "ratelimit" | "network";
export class GhError extends Error {
  kind: GhErrorKind;
  resetAt?: number;
  constructor(kind: GhErrorKind, resetAt?: number) {
    super(kind);
    this.kind = kind;
    this.resetAt = resetAt;
  }
}

export const USERNAME_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

/** 3 requests per lookup (user, repos, one page of events) to go easy on rate limits. */
export async function fetchGithub(username: string, opts: { token?: string; signal?: AbortSignal; base?: string } = {}): Promise<GhData> {
  if (!USERNAME_RE.test(username)) throw new GhError("invalid");
  const headers: Record<string, string> = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  const base = `${opts.base ?? "https://api.github.com"}/users/${encodeURIComponent(username)}`;

  const get = async <T,>(url: string): Promise<T> => {
    let r: Response;
    try {
      r = await fetch(url, { headers, signal: opts.signal });
    } catch (e) {
      if (opts.signal?.aborted) throw e;
      throw new GhError("network");
    }
    if (r.status === 404) throw new GhError("notfound");
    if (r.status === 403 || r.status === 429) {
      const reset = Number(r.headers.get("x-ratelimit-reset"));
      throw new GhError("ratelimit", Number.isFinite(reset) && reset > 0 ? reset * 1000 : undefined);
    }
    if (!r.ok) throw new GhError("network");
    return (await r.json()) as T;
  };

  const user = await get<GhUser>(base);
  const [repos, events] = await Promise.all([
    get<GhRepo[]>(`${base}/repos?per_page=100&sort=pushed&type=owner`),
    get<GhEvent[]>(`${base}/events/public?per_page=100`),
  ]);
  return { user, repos: Array.isArray(repos) ? repos : [], events: Array.isArray(events) ? events : [] };
}

/* ---------------- analysis ---------------- */

export interface Muscle {
  language: string;
  muscle: string;
  note: string;
  share: number; // 0..1 of owned repos
}

export interface Physique {
  login: string;
  name: string | null;
  archetype: string;
  tagline: string;
  gainsIndex: number;
  stats: [string, string][];
  muscles: Muscle[];
  roasts: string[];
  art: string[];
  tiers: { arms: number; torso: number; legs: number };
  verdict: string;
}

const MUSCLES: Record<string, [string, string]> = {
  TypeScript: ["delts", "boulder shoulders, strongly typed"],
  JavaScript: ["biceps", "big, flexible, occasionally undefined"],
  Python: ["back", "wide, readable, held up by whitespace"],
  Rust: ["core", "memory-safe abs, approved by the borrow checker"],
  Go: ["quads", "simple, fast, no generics until recently"],
  Java: ["chest", "enterprise-grade pecs with a factory for each rep"],
  "C#": ["triceps", "solid, underrated, owned by a big gym"],
  C: ["forearms", "grip strength from manual memory management"],
  "C++": ["forearms", "grip strength, plus mysterious injuries"],
  Shell: ["traps", "does the heavy lifting nobody sees"],
  HTML: ["glutes", "it's all about the front end"],
  CSS: ["obliques", "still can't center anything"],
  SCSS: ["obliques", "nested deeper than your excuses"],
  PHP: ["lower back", "holds up half the internet, aches constantly"],
  Ruby: ["calves", "beautiful in theory. rarely seen in production"],
  Kotlin: ["lats", "Java's lats, but they talk less"],
  Swift: ["hamstrings", "only trained on Apple equipment"],
  Dart: ["rear delts", "trained exclusively for Flutter"],
  "Jupyter Notebook": ["dad bod", "cells executed out of order"],
  Dockerfile: ["containerized core", "works on my machine"],
  Lua: ["neck", "small, embedded everywhere"],
  Haskell: ["pure abs", "no side effects. also no visible results"],
  Nix: ["reproducible physique", "nobody else can build it"],
  Elixir: ["cardio", "fault-tolerant endurance"],
  Scala: ["traps", "a back exercise and a front exercise at the same time"],
  R: ["glutes", "statistically significant"],
  Vue: ["shoulders", "progressive enhancement"],
  Svelte: ["abs", "compiled away to nothing"],
  "Objective-C": ["legacy biceps", "still flexing in 2014"],
  Zig: ["core", "no hidden control flow. no hidden carbs"],
  HCL: ["infrastructure", "terraformed glutes"],
  Markdown: ["documentation", "nobody reads it"],
  YAML: ["spine", "one wrong indent and you're out for six weeks"],
};

const ARCHETYPES: Record<string, string> = {
  "Ghost Lifter": "Signed up. Never showed up.",
  "Deload Week": "No public activity in a while. Deload, or witness protection?",
  "Fork Lifter": "Mostly forks. Following someone else's program again.",
  "Night Shift Lifter": "Trains after midnight. Recovery daemon has filed a complaint.",
  "Weekend Warrior": "Ships on weekends. Weekends are leg day. You see the problem.",
  "Daily Grinder": "Shows up every day. Mobility status: unknown.",
  Powerlifter: "Few pushes, enormous sets. Spotter recommended.",
  "Cardio Bunny": "Hundreds of tiny commits. High reps, low weight.",
  "Aesthetic Influencer": "Lots of stars. Mostly from people across the gym.",
  "Fresh Membership": "New account. Still has the free trial pass.",
  "Intermediate Lifter": "Intermediate lifter with advanced confidence.",
};

function hash(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

const day = (iso: string) => iso.slice(0, 10);
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const pct = (n: number) => `${Math.round(n * 100)}%`;

function longestStreak(days: string[]): number {
  const ts = [...new Set(days)].map((d) => Date.parse(d + "T00:00:00Z")).sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  for (let i = 0; i < ts.length; i++) {
    run = i > 0 && ts[i] - ts[i - 1] === 864e5 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

function commitsIn(e: GhEvent): number {
  const p = e.payload ?? {};
  const n = p.size ?? p.distinct_size ?? (Array.isArray(p.commits) ? p.commits.length : undefined);
  return typeof n === "number" && n > 0 ? n : 1;
}

/** Symmetric ASCII figure. Arms = commit volume, torso = stars, legs = weekends off. */
export function buildArt(t: { arms: number; torso: number; legs: number }, face: string): string[] {
  const W = 25;
  const center = (s: string) => {
    const left = Math.floor((W - s.length) / 2);
    return " ".repeat(Math.max(0, left)) + s;
  };
  const torso = ["|   |", "|===|", "|###|"][t.torso];
  const arms = ["o-" + torso + "-o", "(O)=" + torso + "=(O)", "(@@@)=" + torso + "=(@@@)"][t.arms];
  const legs = [
    ["| |", "| |", "^ ^"],
    ["/ | \\", "/  |  \\", "(__/ \\__)"],
    ["(###|###)", "(####|####)", "(____/ \\____)"],
  ][t.legs];
  return [".---.", `( ${face} )`, arms, torso, "\\___/", ...legs].map(center);
}

export function analyze(data: GhData, now = Date.now()): Physique {
  const { user, repos, events } = data;
  const owned = repos.filter((r) => !r.fork);
  const forkRatio = repos.length ? (repos.length - owned.length) / repos.length : 0;
  const stars = owned.reduce((s, r) => s + (r.stargazers_count || 0), 0);
  const ageYears = (now - Date.parse(user.created_at)) / (365.25 * 864e5);

  const pushes = events.filter((e) => e.type === "PushEvent");
  const commits = pushes.reduce((s, e) => s + commitsIn(e), 0);
  const prs = events.filter((e) => e.type === "PullRequestEvent" && e.payload?.action === "opened").length;
  const starsGiven = events.filter((e) => e.type === "WatchEvent").length;

  const activeDays = [...new Set(events.map((e) => day(e.created_at)))];
  const oldest = events.length ? Math.min(...events.map((e) => Date.parse(e.created_at))) : now;
  const windowDays = Math.max(1, Math.min(90, Math.ceil((now - oldest) / 864e5)));
  const streak = longestStreak(activeDays);
  const weekendDays = activeDays.filter((d) => {
    const w = new Date(d + "T12:00:00Z").getUTCDay();
    return w === 0 || w === 6;
  }).length;
  const weekendSlots = Math.max(1, Math.round((windowDays / 7) * 2));
  const weekendShare = weekendDays / weekendSlots;
  const late = events.filter((e) => new Date(e.created_at).getUTCHours() < 5).length;
  const lateShare = events.length ? late / events.length : 0;
  const avgPush = pushes.length ? commits / pushes.length : 0;

  // languages → muscles
  const langCount = new Map<string, number>();
  for (const r of owned) if (r.language) langCount.set(r.language, (langCount.get(r.language) ?? 0) + 1);
  const langTotal = [...langCount.values()].reduce((a, b) => a + b, 0) || 1;
  const muscles: Muscle[] = [...langCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([language, n]) => {
      const [muscle, note] = MUSCLES[language] ?? ["accessory muscles", "niche, but committed"];
      return { language, muscle, note, share: n / langTotal };
    });

  // archetype
  let archetype = "Intermediate Lifter";
  if (!events.length && !owned.length) archetype = "Ghost Lifter";
  else if (!events.length) archetype = "Deload Week";
  else if (forkRatio > 0.6 && repos.length >= 3) archetype = "Fork Lifter";
  else if (lateShare > 0.35 && events.length >= 10) archetype = "Night Shift Lifter";
  else if (weekendShare > 0.45 && events.length >= 10) archetype = "Weekend Warrior";
  else if (streak >= 14) archetype = "Daily Grinder";
  else if (avgPush >= 8 && pushes.length >= 3) archetype = "Powerlifter";
  else if (pushes.length >= 40 && avgPush <= 1.5) archetype = "Cardio Bunny";
  else if (stars >= 1000) archetype = "Aesthetic Influencer";
  else if (ageYears < 1) archetype = "Fresh Membership";

  // gains index
  const consistency = (activeDays.length / windowDays) * 35;
  const volume = Math.min(25, Math.log10(commits + 1) * 12);
  const aesthetics = Math.min(20, Math.log10(stars + 1) * 7);
  const legs = (1 - Math.min(1, weekendShare)) * 12;
  const recovery = (1 - lateShare) * 8;
  const gainsIndex = Math.round(clamp(events.length ? consistency + volume + aesthetics + legs + recovery : aesthetics + 5));

  const tiers = {
    arms: commits >= 60 ? 2 : commits >= 10 ? 1 : 0,
    torso: stars >= 200 ? 2 : stars >= 10 ? 1 : 0,
    legs: !events.length ? 1 : weekendShare > 0.4 ? 0 : weekendShare > 0.15 ? 1 : 2,
  };
  const face = !events.length ? "-_-" : gainsIndex >= 70 ? "ò_ó" : gainsIndex >= 40 ? "o_o" : "•_•";

  // roasts
  const h = hash(user.login.toLowerCase());
  const roasts: string[] = [];
  if (events.length) {
    roasts.push(
      weekendDays > 0
        ? `Pushed code on ${weekendDays} weekend day${weekendDays === 1 ? "" : "s"}. That's ${weekendDays} leg day${weekendDays === 1 ? "" : "s"} skipped.`
        : "Zero weekend activity. Either you train legs or you have a life. Both are suspicious.",
    );
    if (lateShare >= 0.15) roasts.push(`${pct(lateShare)} of activity between midnight and 5am UTC. Recovery daemon: failing.`);
    roasts.push(
      streak >= 7
        ? `Longest streak: ${streak} days. Consistency: elite. Rest days: theoretical.`
        : `Longest streak: ${streak} day${streak === 1 ? "" : "s"}. Consistency is a muscle. Yours is in a cast.`,
    );
  } else {
    roasts.push("No public activity in the last 90 days. The gym misses you. Your desk does not.");
  }
  if (forkRatio >= 0.3) roasts.push(`${pct(forkRatio)} of repos are forks. Copying someone else's program, again.`);
  roasts.push(
    stars === 0
      ? "0 stars across your repos. Nobody is spotting you."
      : stars >= 100
        ? `${stars.toLocaleString("en-US")} stars. Admired mostly from across the gym.`
        : `${stars} star${stars === 1 ? "" : "s"}. Your mom and one bot are proud.`,
  );
  if (user.following > Math.max(10, user.followers * 3)) {
    roasts.push(`Follows ${user.following}, followed by ${user.followers}. Classic gym-mirror energy.`);
  }
  if (starsGiven >= 10) roasts.push(`Starred ${starsGiven} repos recently. Great at spotting. Never lifts.`);
  if (muscles[0]) roasts.push(`Dominant muscle group: ${muscles[0].muscle} (${muscles[0].language}). ${muscles[0].note[0].toUpperCase()}${muscles[0].note.slice(1)}.`);
  roasts.push(["Calves: 404, as expected.", "Calves: not found on GitHub either.", "Calves: no public repos."][h % 3]);

  const stats: [string, string][] = [
    ["training age", ageYears >= 1 ? `${ageYears.toFixed(1)} years` : `${Math.max(1, Math.round(ageYears * 12))} months`],
    ["window", events.length ? `last ${windowDays} day${windowDays === 1 ? "" : "s"} of public events` : "no public events (90 days)"],
    ["sets (pushes)", `${pushes.length}`],
    ["reps (commits)", `${commits}`],
    ["active days", `${activeDays.length}`],
    ["longest streak", `${streak} day${streak === 1 ? "" : "s"}`],
    ["PRs opened", `${prs}`],
    ["repos", `${owned.length} owned, ${repos.length - owned.length} forked`],
    ["stars", stars.toLocaleString("en-US")],
    ["followers", `${user.followers}`],
  ];

  const verdict = `Gains Index ${gainsIndex}/100 — ${archetype}. ${ARCHETYPES[archetype]}`;

  return {
    login: user.login,
    name: user.name,
    archetype,
    tagline: ARCHETYPES[archetype],
    gainsIndex,
    stats,
    muscles,
    roasts: roasts.slice(0, 6),
    art: buildArt(tiers, face),
    tiers,
    verdict,
  };
}

export function ghErrorMessage(e: unknown, username: string): string {
  if (e instanceof GhError) {
    switch (e.kind) {
      case "invalid":
        return `'${username}' isn't a valid GitHub username. Neither is 'calves'.`;
      case "notfound":
        return `404: GitHub user '${username}' not found. Like your calves.`;
      case "ratelimit": {
        const mins = e.resetAt ? Math.max(1, Math.ceil((e.resetAt - Date.now()) / 60000)) : 60;
        return `GitHub says that's enough sets for now (rate limit). Rest ${mins} min and try again.`;
      }
      case "network":
        return "Couldn't reach GitHub. The gym wifi strikes again.";
    }
  }
  return "Something went wrong talking to GitHub.";
}
