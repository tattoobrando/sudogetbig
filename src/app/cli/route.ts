import { banner, FIGURE, menu, streamText } from "@/lib/cli";

/* What `curl sudogetbig.com` returns (the proxy rewrites CLI requests here). */
export async function GET(req: Request) {
  const path = req.headers.get("x-cli-path");

  if (path) {
    return streamText(
      req,
      async (o) => {
        const { p } = o;
        o.line(p.r(`bash: cd: ${path.slice(0, 80)}: No such file or directory`));
        o.line(p.m("404: gains not found at this path. Neither are your calves."));
        o.line();
        menu(o);
      },
      { status: 404 },
    );
  }

  return streamText(req, async (o) => {
    const { p } = o;
    o.line();
    o.write(p.g("gains@sudogetbig") + p.m(":") + p.c("~") + p.m("$ "));
    await o.sleep(300);
    await o.type("sudo get big", 45);
    o.line();
    o.write("[sudo] password for gains: ");
    await o.type("********", 55);
    o.line();
    for (const s of ["Authenticating gym membership...", "Installing progressive_overload...", "Mounting /dev/delts...", "Disabling excuses.service..."]) {
      await o.step(s, 300 + Math.random() * 250);
    }
    o.line(p.y("WARNING:") + " leg_day.service has not been started.");
    o.line(p.b("STATUS: ") + p.gb("MASSIVE PRIVILEGES GRANTED"));
    await o.sleep(400);
    o.line();
    banner(o);
    o.line();
    for (const l of FIGURE) o.line("  " + p.g(l));
    o.line();
    menu(o);
    o.line();
  });
}
