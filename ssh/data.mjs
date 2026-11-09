/*
  Lift data for the SSH app. Fetches the public summary the website serves
  (/api/lifts), refreshes it every 10 minutes and keeps the last good copy on
  disk so a restart or a website outage doesn't blank the app.
*/
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const SOURCES = (process.env.LIFTS_URLS || "https://sudogetbig.com/api/lifts,https://sudogetbig.vercel.app/api/lifts")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const CACHE = process.env.LIFTS_CACHE || "/data/lifts.json";
const EVERY = 10 * 60 * 1000;

let current = null;
let fetchedAt = 0;

function valid(j) {
  return j && j.totals && Array.isArray(j.lifts) && Array.isArray(j.weekly) && Array.isArray(j.days);
}

try {
  const j = JSON.parse(readFileSync(CACHE, "utf8"));
  if (valid(j)) current = j;
} catch {
  /* no cache yet */
}

async function refresh() {
  for (const url of SOURCES) {
    try {
      const r = await fetch(url, { headers: { "user-agent": "sudogetbig-ssh" }, signal: AbortSignal.timeout(8000) });
      if (!r.ok) continue;
      const j = await r.json();
      if (!valid(j)) continue;
      current = j;
      fetchedAt = Date.now();
      try {
        mkdirSync(dirname(CACHE), { recursive: true });
        writeFileSync(CACHE, JSON.stringify(j));
      } catch {
        /* read-only cache dir: fine, keep it in memory */
      }
      return;
    } catch {
      /* try the next source */
    }
  }
}

export async function startData() {
  await refresh();
  setInterval(refresh, EVERY).unref();
}

/** The latest lift log, or null if none has ever loaded. */
export const lifts = () => current;
export const lastFetch = () => fetchedAt;
