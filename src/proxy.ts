import { NextResponse, type NextRequest } from "next/server";

/*
  curl / wget / HTTPie / PowerShell get a terminal version of the site.
  Browsers are untouched. Paths with their own CLI-aware route handlers
  (/install, /github/*, /fortune, /neofetch, /help) are excluded below.
*/
const CLI_UA = /^(curl|wget|httpie|xh|aria2|libfetch|fetch|lwp|powershell)|windowspowershell/i;

export function proxy(request: NextRequest) {
  const ua = request.headers.get("user-agent") ?? "";
  if (!CLI_UA.test(ua)) return NextResponse.next();
  const url = request.nextUrl.clone();
  const original = url.pathname;
  url.pathname = "/cli";
  const headers = new Headers(request.headers);
  if (original !== "/") headers.set("x-cli-path", original);
  else headers.delete("x-cli-path");
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/|cli|install|github/|fortune|neofetch|help|opengraph-image|twitter-image|icon|robots\\.txt|sitemap\\.xml|favicon).*)"],
};
