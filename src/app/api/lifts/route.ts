import { timingSafeEqual } from "node:crypto";
import { LOG, nf, fmtDate, type LiftLog } from "@/lib/lifts";
import { LiftoffError, summarize } from "@/lib/liftsSummary.mjs";

/*
  GET  /api/lifts   the public summary as JSON (what /lifts and the SSH app show)
  POST /api/lifts   iPhone sync: send a Liftoff CSV export with
                    "Authorization: Bearer <LIFTS_UPLOAD_TOKEN>".

  POST summarizes the CSV in memory and commits only src/data/lifts.json to
  GitHub; Vercel redeploys on that push. The CSV itself is never stored.

  Env (Vercel → Settings → Environment Variables):
    LIFTS_UPLOAD_TOKEN   long random secret, also pasted into the Shortcut
    LIFTS_GITHUB_TOKEN   fine-grained token: this repo only, Contents read/write
    LIFTS_GITHUB_REPO    optional, default tattoobrando/sudogetbig
*/

const MAX_BYTES = 4 * 1024 * 1024; // Vercel's request limit is 4.5 MB
const PATH = "src/data/lifts.json";

export function GET() {
  return Response.json(LOG, {
    headers: { "cache-control": "public, max-age=300, s-maxage=300", "access-control-allow-origin": "*" },
  });
}

const text = (body: string, status = 200) =>
  new Response(body + "\n", { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });

function authorized(req: Request) {
  const want = process.env.LIFTS_UPLOAD_TOKEN ?? "";
  const got = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (want.length < 24 || !got) return false;
  const a = Buffer.from(want);
  const b = Buffer.from(got);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function readCsv(req: Request): Promise<string> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_BYTES) throw new LiftoffError("That file is over 4 MB. Is it the right export?");
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("multipart/form-data")) {
    const form = await req.formData();
    for (const v of form.values()) if (typeof v !== "string") return await v.text();
    for (const v of form.values()) if (typeof v === "string" && v.includes("Exercise Name")) return v;
    throw new LiftoffError("No file in the upload. In the Shortcut, set Request Body to File → Shortcut Input.");
  }
  const body = await req.text();
  if (body.length > MAX_BYTES) throw new LiftoffError("That file is over 4 MB. Is it the right export?");
  return body;
}

/** Same data apart from the date it was generated? */
const sameData = (a: LiftLog, b: LiftLog) => JSON.stringify({ ...a, generated: "" }) === JSON.stringify({ ...b, generated: "" });

function prs(prev: LiftLog, next: LiftLog) {
  const old = new Map(prev.lifts.map((l) => [l.exercise, l.best ?? 0]));
  return next.lifts
    .filter((l) => l.best && l.best > (old.get(l.exercise) ?? Infinity))
    .map((l) => `${l.exercise} ${l.best} (was ${old.get(l.exercise)})`);
}

export async function POST(req: Request) {
  if (!process.env.LIFTS_UPLOAD_TOKEN || !process.env.LIFTS_GITHUB_TOKEN) {
    return text("✗ Sync isn't set up yet: add LIFTS_UPLOAD_TOKEN and LIFTS_GITHUB_TOKEN in Vercel, then redeploy.", 503);
  }
  if (!authorized(req)) return text("✗ Wrong or missing token. Check the Authorization header in the Shortcut.", 401);

  let next: LiftLog;
  try {
    next = summarize(await readCsv(req)).log;
  } catch (e) {
    return text(`✗ ${e instanceof LiftoffError ? e.message : "Couldn't read that file as a Liftoff CSV export."}`, 400);
  }

  const repo = process.env.LIFTS_GITHUB_REPO || "tattoobrando/sudogetbig";
  const api = (process.env.LIFTS_GITHUB_API || "https://api.github.com").replace(/\/$/, "");
  const gh = (path: string, init?: RequestInit) =>
    fetch(`${api}/repos/${repo}/contents/${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${process.env.LIFTS_GITHUB_TOKEN}`,
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
        "user-agent": "sudogetbig-lift-sync",
        ...(init?.body ? { "content-type": "application/json" } : {}),
      },
      cache: "no-store",
    });

  // What's committed right now (may be newer than this deployment).
  const cur = await gh(`${PATH}?ref=main`);
  if (!cur.ok) return text(`✗ GitHub said ${cur.status} reading ${PATH}. Check LIFTS_GITHUB_TOKEN has Contents access to ${repo}.`, 502);
  const curJson = (await cur.json()) as { sha: string; content?: string; encoding?: string };
  let prev: LiftLog = LOG;
  try {
    if (curJson.content && curJson.encoding === "base64") prev = JSON.parse(Buffer.from(curJson.content, "base64").toString("utf8"));
  } catch {
    /* fall back to the deployed copy */
  }

  const force = new URL(req.url).searchParams.has("force");
  if (!force && next.totals.sessions < prev.totals.sessions) {
    return text(
      `✗ That export has ${nf(next.totals.sessions)} sessions but the site already has ${nf(prev.totals.sessions)}. ` +
        "It looks partial, so nothing was changed. (Add ?force to the URL to upload it anyway.)",
      409,
    );
  }
  if (sameData(prev, next)) return text(`✓ Already up to date: ${nf(next.totals.sessions)} sessions through ${fmtDate(next.range.last)}.`);

  const added = next.totals.sessions - prev.totals.sessions;
  const newPrs = prs(prev, next);
  const put = await gh(PATH, {
    method: "PUT",
    body: JSON.stringify({
      message: `Update lift log: ${nf(next.totals.sessions)} sessions through ${next.range.last}${added > 0 ? ` (+${added})` : ""}`,
      content: Buffer.from(JSON.stringify(next) + "\n").toString("base64"),
      sha: curJson.sha,
      branch: "main",
    }),
  });
  if (!put.ok) return text(`✗ GitHub said ${put.status} saving the update. Nothing changed; try again in a minute.`, 502);

  const t = next.totals;
  const lines = [
    `✓ Synced. ${added > 0 ? `+${added} session${added === 1 ? "" : "s"}. ` : ""}${nf(t.sessions)} sessions, ${t.current_streak}-week streak.`,
    newPrs.length ? `New PRs: ${newPrs.slice(0, 5).join(", ")}${newPrs.length > 5 ? ` +${newPrs.length - 5} more` : ""}.` : "",
    "sudogetbig.com/lifts updates in about a minute.",
  ];
  return text(lines.filter(Boolean).join("\n"));
}
