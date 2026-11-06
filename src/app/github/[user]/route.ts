import { isCli, renderPhysique, streamText } from "@/lib/cli";
import { analyze, fetchGithub, GhError, ghErrorMessage, USERNAME_RE, type GhData } from "@/lib/physique";

/*
  curl sudogetbig.com/github/<user>  → ANSI physique report
  browser                            → redirected to the site, which runs it in the terminal
  Set GITHUB_TOKEN in Vercel (a token with no scopes) to lift the 60 req/hour limit.
*/

const cache = new Map<string, { at: number; data: GhData }>();
const TTL = 10 * 60 * 1000;

async function getData(user: string) {
  const key = user.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.data;
  const data = await fetchGithub(user, { token: process.env.GITHUB_TOKEN || undefined, base: process.env.GITHUB_API_URL || undefined });
  if (cache.size > 500) cache.clear();
  cache.set(key, { at: Date.now(), data });
  return data;
}

export async function GET(req: Request, { params }: { params: Promise<{ user: string }> }) {
  const { user: raw } = await params;
  const user = decodeURIComponent(raw).replace(/^@/, "");

  if (!isCli(req.headers.get("user-agent"))) {
    const url = new URL("/", req.url);
    if (USERNAME_RE.test(user)) url.searchParams.set("gh", user);
    return Response.redirect(url, 307);
  }

  return streamText(req, async (o) => {
    const { p } = o;
    o.line();
    o.line(p.g("gains@sudogetbig") + p.m(":") + p.c("~") + p.m("$ ") + `sudo get big --github ${user}`);
    if (!USERNAME_RE.test(user)) {
      o.line(p.r(ghErrorMessage(new GhError("invalid"), user)));
      return;
    }
    const pending = getData(user);
    pending.catch(() => {});
    let data: GhData | undefined;
    try {
      data = await o.step(`Pulling public profile for ${user}`, pending);
    } catch (e) {
      o.line(p.r(ghErrorMessage(e, user)));
      o.line(p.m("try: curl sudogetbig.com/github/octocat"));
      return;
    }
    await o.step("Counting sets (pushes) and reps (commits)", 300);
    await o.step("Measuring weekend attendance", 300);
    await o.step("Mapping languages to muscle groups", 300);
    o.line();
    if (!data) return;
    renderPhysique(o, analyze(data));
    o.line();
    o.line(p.m("share: ") + p.c(`https://sudogetbig.com/github/${data.user.login}`) + p.m("  ·  results are scientifically meaningless and emotionally accurate"));
    o.line();
  });
}
