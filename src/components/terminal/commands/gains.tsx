"use client";

import type { Command, Ctx } from "../engine";
import { B, C, G, M, Ok, Pre, R, Tag, Warn, Y } from "../Out";
import { lines, progress, steps, type, yes } from "./helpers";
import { pick } from "@/lib/random";

/* ------------------------------------------------------------------
   Muscle packages for `apt install`
   ------------------------------------------------------------------ */
const PACKAGES: Record<string, { version: string; note: string }> = {
  delts: { version: "3.0.0-boulder", note: "Shoulders now 14% wider. Door frames have been notified." },
  chest: { version: "2.4.1", note: "Chest installed. Monday is now reserved system-wide." },
  biceps: { version: "17.0.0", note: "Biceps installed. Sleeves report reduced headroom." },
  triceps: { version: "2.2.0", note: "Triceps installed. They were two-thirds of the arm all along." },
  traps: { version: "1.8.0", note: "Traps installed. Neck has been deprecated." },
  lats: { version: "4.0.0-wingspan", note: "Lats installed. You now take up two seats on the bus." },
  back: { version: "4.0.0", note: "Back installed. You can't see it, but the mirror behind you can." },
  forearms: { version: "1.1.2", note: "Forearms installed. Jar lids are no longer a security issue." },
  glutes: { version: "3.3.3", note: "Glutes installed. Jeans compatibility: degraded." },
  quads: { version: "0.9.0-beta", note: "Quads installed. Stairs will be filing a complaint." },
  hamstrings: { version: "0.4.0-alpha", note: "Hamstrings installed. First time anyone's asked for them." },
  neck: { version: "1.0.0", note: "Neck installed. Shirt collars are now load-bearing." },
  discipline: { version: "∞", note: "Discipline installed. It doesn't feel good. That's how you know it's working." },
  creatine: { version: "5.0g", note: "Creatine installed. Water retention: enabled. Crying face: optional." },
  protein: { version: "200g", note: "Protein installed. You are 4% chicken now." },
  sleep: { version: "8.0h", note: "Sleep installed. It will be uninstalled tonight by 'one more episode'." },
};

const SPECIAL = ["calves", "abs", "patience", "motivation", "cardio", "legs", "genetics", "steroids"];
export const PACKAGE_NAMES = [...Object.keys(PACKAGES), ...SPECIAL].sort();

function needRoot(ctx: Ctx, what: string): boolean {
  if (ctx.sudo || ctx.isRoot) return false;
  ctx.print(<R>E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)</R>);
  ctx.print(<R>E: Unable to acquire the dpkg frontend lock, are you root? are you even lifting?</R>);
  ctx.print(<M>hint: try &apos;sudo {what}&apos;</M>);
  ctx.reject();
  return true;
}

async function readingLists(ctx: Ctx) {
  await lines(ctx, ["Reading package lists... Done", "Building dependency tree... Done", "Reading state information... Done"], 120);
}

async function installOne(ctx: Ctx, pkg: string, force: boolean) {
  const p = pkg.toLowerCase();
  switch (p) {
    case "calves":
      await ctx.sleep(350);
      ctx.print(<R>E: Unable to locate package calves</R>);
      ctx.print(
        <span>
          <R className="font-bold">ERROR 404:</R> Genetics not found. Package unavailable for this architecture.
        </span>,
      );
      if (force) {
        await ctx.sleep(500);
        await progress(ctx, "Forcing calves", { tone: "amber" });
        ctx.print(<M>Done. Nothing changed. As expected.</M>);
      } else {
        ctx.print(<M>hint: &apos;--force&apos; is available. it won&apos;t help.</M>);
      }
      ctx.reject();
      return;
    case "abs":
      ctx.print(<span>abs is already the newest version (1.0.0).</span>);
      ctx.print(<M>abs is installed at /bellyfat/abs.txt. To expose it, run: sudo rm -rf /bellyfat</M>);
      return;
    case "patience":
      ctx.print(<R>E: Package &apos;patience&apos; has no installation candidate.</R>);
      ctx.print(<M>It must be built from source. Estimated build time: 3-5 years.</M>);
      ctx.reject();
      return;
    case "motivation":
      ctx.print(<Y>W: Package &apos;motivation&apos; is deprecated and unreliable at 5am.</Y>);
      ctx.print(<span>Installing replacement: discipline</span>);
      await progress(ctx, "Unpacking discipline", { step: [2, 7] });
      ctx.print(<Ok>{PACKAGES.discipline.note}</Ok>);
      ctx.bump("installs");
      return;
    case "legs":
    case "genetics":
      ctx.print(<R>E: Unable to locate package {p}</R>);
      ctx.print(<M>{p === "legs" ? "Did you mean: excuses? (installed, 4,812 instances)" : "genetics is provided by your parents. File a ticket with them."}</M>);
      ctx.reject();
      return;
    case "cardio": {
      ctx.print(<Y>The following packages will be installed: cardio</Y>);
      ctx.print(<M>This package has been known to reduce gains (it doesn&apos;t).</M>);
      const a = await ctx.ask("Do you want to continue? [Y/n] ");
      if (!yes(a)) {
        ctx.print(<span>Abort. Cardio has been avoided again. Your heart has been notified.</span>);
        return;
      }
      await progress(ctx, "Installing cardio", { step: [1, 4], tick: 90 });
      ctx.print(<Ok>cardio installed. Lung capacity +3%. Ego -8%. Worth it.</Ok>);
      ctx.bump("installs");
      return;
    }
    case "steroids":
      ctx.print(<R>E: Package &apos;steroids&apos; is not available from official sources.</R>);
      ctx.print(<M>This is a terminal on a joke website. Talk to a doctor, not a doctor&apos;s cousin.</M>);
      ctx.reject();
      return;
  }
  const meta = PACKAGES[p];
  if (!meta) {
    ctx.print(<R>E: Unable to locate package {pkg}</R>);
    ctx.print(<M>Did you mean: {pick(["chicken", "rice", "broccoli", "protein", "delts"])}?</M>);
    ctx.reject();
    return;
  }
  ctx.print(
    <span>
      The following NEW packages will be installed:{"\n"}  <G>{p}</G>
      {p === "delts" ? <M>{"  delts-front  delts-side  delts-rear (optional, nobody installs this)"}</M> : null}
    </span>,
  );
  ctx.print(
    <M>
      Get:1 http://gym.local/iron stable/main {p} {meta.version} [{Math.ceil(Math.random() * 90 + 10)} kB]
    </M>,
  );
  await progress(ctx, `Unpacking ${p} (${meta.version})`, { step: [6, 18], tick: 55 });
  ctx.print(<span>Setting up {p} ({meta.version}) ...</span>);
  await ctx.sleep(200);
  ctx.print(<Ok>{meta.note}</Ok>);
  ctx.bump("installs");
}

const aptInstall: Command = {
  match: ["apt", "install"],
  aliases: [["apt-get", "install"]],
  usage: "sudo apt install <pkg>",
  summary: "install a muscle group (delts, calves, abs, traps…)",
  group: "gains",
  complete: () => PACKAGE_NAMES,
  async run(ctx) {
    const force = ctx.args.includes("--force") || ctx.args.includes("-f");
    const pkgs = ctx.args.filter((a) => !a.startsWith("-"));
    if (!pkgs.length) {
      ctx.print(<span>E: No packages specified. Try: <G>sudo apt install delts</G></span>);
      ctx.print(<M>available: {PACKAGE_NAMES.join(" ")}</M>);
      return;
    }
    if (needRoot(ctx, `apt install ${pkgs.join(" ")}`)) return;
    await readingLists(ctx);
    for (const p of pkgs) await installOne(ctx, p, force);
  },
};

const aptRemove: Command = {
  match: ["apt", "remove"],
  aliases: [["apt", "purge"], ["apt-get", "remove"]],
  usage: "sudo apt remove <pkg>",
  summary: "uninstall something. try cardio.",
  group: "gains",
  complete: () => ["cardio", "excuses", "bellyfat", "legs", "delts"],
  async run(ctx) {
    const pkg = (ctx.args.find((a) => !a.startsWith("-")) ?? "").toLowerCase();
    if (!pkg) {
      ctx.print(<span>E: No packages specified.</span>);
      return;
    }
    if (needRoot(ctx, `apt remove ${pkg}`)) return;
    await readingLists(ctx);
    if (pkg === "cardio") {
      ctx.print(<span>The following packages will be REMOVED:{"\n"}  <R>cardio heart lungs stairs-tolerance</R></span>);
      ctx.print(<Y className="font-bold">WARNING: The following essential packages will be removed.</Y>);
      ctx.print(<Y>This should NOT be done unless you know exactly what you are doing!</Y>);
      ctx.print(<span>  heart (due to cardio)</span>);
      const a = await ctx.ask("To continue type in the phrase 'Yes, do as I say!'\n ?] ");
      if (a.trim() === "Yes, do as I say!") {
        await progress(ctx, "Removing cardio", { tone: "red", step: [5, 12] });
        ctx.print(<R>Removing heart ... denied by /etc/doctor.conf. Request blocked.</R>);
        ctx.print(<M>cardio has been reinstalled at the request of literally every medical body.</M>);
      } else {
        ctx.print(<span>Abort.</span>);
      }
      ctx.reject();
      return;
    }
    if (pkg === "excuses") {
      await progress(ctx, "Removing excuses", { step: [8, 20] });
      ctx.print(<Ok>excuses removed.</Ok>);
      await ctx.sleep(700);
      ctx.print(<Y>excuses.service: Scheduled restart job, restart counter is at 4812.</Y>);
      ctx.print(<M>They&apos;re back. They&apos;re always back. (Restart=always)</M>);
      return;
    }
    if (pkg === "bellyfat") {
      ctx.print(<R>E: bellyfat is not managed by apt. It is managed by the kitchen.</R>);
      ctx.reject();
      return;
    }
    if (pkg === "delts" || pkg === "legs") {
      ctx.print(
        pkg === "delts" ? (
          <R>E: Refusing to remove delts. They took years to compile.</R>
        ) : (
          <M>Package &apos;legs&apos; is not installed, so not removed.</M>
        ),
      );
      return;
    }
    ctx.print(<M>Package &apos;{pkg}&apos; is not installed, so not removed. 0 upgraded, 0 removed, 0 gains lost.</M>);
  },
};

const aptUpdate: Command = {
  match: ["apt", "update"],
  aliases: [["apt-get", "update"]],
  usage: "sudo apt update",
  summary: "check the mirrors for new gains",
  group: "gains",
  async run(ctx) {
    if (needRoot(ctx, "apt update")) return;
    await lines(
      ctx,
      [
        <M key="1">Hit:1 http://gym.local/iron noble InRelease</M>,
        <M key="2">Get:2 http://protein.cdn/whey noble-updates InRelease [126 kB]</M>,
        <M key="3">Get:3 http://supplements.example/sketchy noble/main [12 kB] (unsigned)</M>,
        <M key="4">Ign:4 http://cardio.mirror noble InRelease</M>,
      ],
      260,
    );
    await readingLists(ctx);
    ctx.print(<span>Fetched 2,147 kcal in 0.4s (5,368 kcal/s)</span>);
    ctx.print(
      <span>
        <B>7 packages can be upgraded.</B> Run &apos;<G>apt list --upgradable</G>&apos; to see them.
      </span>,
    );
  },
};

const aptList: Command = {
  match: ["apt", "list"],
  usage: "apt list --upgradable",
  summary: "list pending upgrades",
  group: "gains",
  run(ctx) {
    ctx.print(<span>Listing... Done</span>);
    ctx.print(
      <Pre>
        <G>bench</G>/noble 102.5kg   upgradable from: 100kg (stalled since March){"\n"}
        <G>squat</G>/noble 120kg     upgradable from: [never installed]{"\n"}
        <G>deadlift</G>/noble 160kg  upgradable from: 140kg (lower back says no){"\n"}
        <G>sleep</G>/noble 8h        upgradable from: 5h12m{"\n"}
        <G>water</G>/noble 3L        upgradable from: 2 coffees{"\n"}
        <G>shirt</G>/noble XL        upgradable from: L (bursting){"\n"}
        <G>calves</G>/noble —        upgradable from: — (no candidate){"\n"}
      </Pre>,
    );
  },
};

const aptUpgrade: Command = {
  match: ["apt", "upgrade"],
  aliases: [["apt", "full-upgrade"], ["apt-get", "upgrade"]],
  usage: "sudo apt upgrade",
  summary: "upgrade everything at once (bold)",
  group: "gains",
  async run(ctx) {
    if (needRoot(ctx, "apt upgrade")) return;
    await readingLists(ctx);
    ctx.print(<span>Calculating upgrade... Done</span>);
    await progress(ctx, "Upgrading bench 100kg → 102.5kg", { to: 87, step: [5, 12] });
    ctx.print(<R>E: Sub-process /usr/bin/bench returned an error code (1)</R>);
    ctx.print(<M>reason: weights were not locked in. Please try again on a Monday.</M>);
    ctx.reject();
  },
};

/* ------------------------------------------------------------------
   sudo get big — the main event
   ------------------------------------------------------------------ */
async function getBig(ctx: Ctx, now: boolean) {
  await type(ctx, "********", (t) => <span>[sudo] password for gains: {t}</span>, 70);
  await ctx.sleep(250);
  await readingLists(ctx);
  ctx.print(
    <span>
      The following additional packages will be installed:{"\n"}
      {"  "}
      <C>chicken-breast white-rice creatine-monohydrate sleep progressive-overload</C>
    </span>,
  );
  ctx.print(
    <span>
      Suggested packages:{"\n"}
      {"  "}
      <M>cardio stretching a-social-life</M>
    </span>,
  );
  ctx.print(
    <span>
      The following packages have unmet dependencies:{"\n"}
      {"  "}calves : Depends: genetics (&gt;= 2.0) but 0.4-beta is to be installed
    </span>,
  );
  ctx.print(
    <span>
      The following NEW packages will be installed:{"\n"}
      {"  "}
      <G>chest delts lats traps biceps triceps glutes quads</G>
    </span>,
  );
  ctx.print(<span>0 upgraded, 8 newly installed, 0 to remove and 1 not upgraded (calves).</span>);
  ctx.print(<span>Need to get 4,500 kcal/day of archives.</span>);
  ctx.print(<span>After this operation, 6.8 kg of additional mass will be used.</span>);

  if (now) {
    ctx.print(<M>--now: skipping confirmation (like your warm-up)</M>);
  } else {
    const a = await ctx.ask("Do you want to continue? [Y/n] ");
    if (!yes(a)) {
      ctx.print(<span>Abort.</span>);
      ctx.print(<M>Gains remain at current levels. Which is to say: modest.</M>);
      ctx.reject();
      return;
    }
  }

  await lines(
    ctx,
    [
      <M key="1">Get:1 http://gym.local/iron stable/main chest 2.4.1 [bench] [1,204 kB]</M>,
      <M key="2">Get:2 http://gym.local/iron stable/main delts 3.0.0-boulder [966 kB]</M>,
      <M key="3">Get:3 http://protein.cdn/whey stable/main chicken-breast 200g [4 kB]</M>,
      <M key="4">Get:4 http://gym.local/iron stable/main lats 4.0.0-wingspan [2,048 kB]</M>,
    ],
    140,
  );
  await progress(ctx, "Unpacking hypertrophy", { step: [3, 9], tick: 60 });
  await steps(ctx, [
    "Authenticating gym membership...",
    "Installing progressive_overload...",
    "Mounting /dev/delts...",
    "Allocating additional muscle memory...",
    "Linking mind_muscle_connection...",
    "Disabling excuses.service...",
  ]);
  ctx.setExcusesKilled(true);
  ctx.print(<Warn>leg_day.service has not been started.</Warn>);
  ctx.print(<Y>W: Shirt size compatibility could not be verified.</Y>);
  ctx.print(<M>Processing triggers for mirror (selfie) ...</M>);
  await ctx.sleep(300);
  ctx.print(
    <Pre className="mt-1 text-accent glow">
      {"╔══════════════════════════════════════╗\n"}
      {"║  STATUS: MASSIVE PRIVILEGES GRANTED  ║\n"}
      {"╚══════════════════════════════════════╝"}
    </Pre>,
  );
  const n = ctx.stats.installs;
  ctx.print(
    <span>
      Congratulations. You are now <B>{(0.001 + Math.random() * 0.006).toFixed(3)}%</B> more jacked.
      {n >= 2 ? <M> (Note: running this repeatedly does not stack. We checked.)</M> : null}
    </span>,
  );
  ctx.bump("installs");
}

const sudoGetBig: Command = {
  match: ["get", "big"],
  usage: "sudo get big [--now]",
  summary: "install the full hypertrophy stack",
  group: "gains",
  complete: () => ["--now"],
  async run(ctx) {
    if (!ctx.sudo && !ctx.isRoot) {
      ctx.print(<R>get: big: Permission denied</R>);
      ctx.print(<M>Your physique is running on limited privileges. Try: <G>sudo get big</G></M>);
      ctx.reject();
      return;
    }
    await getBig(ctx, ctx.args.includes("--now") || ctx.args.includes("-y"));
  },
};

const sudoGetBigger: Command = {
  match: ["get", "bigger"],
  aliases: [["get", "huge"], ["get", "massive"]],
  usage: "sudo get bigger",
  summary: "",
  group: "gains",
  hidden: true,
  async run(ctx) {
    ctx.unlock("bigger");
    await ctx.sleep(300);
    ctx.print(<R>E: Version &apos;bigger&apos; for &apos;big&apos; was not found.</R>);
    ctx.print(<M>&apos;bigger&apos; is a premium tier. It unlocks after you finish &apos;big&apos;. Nobody has finished &apos;big&apos;.</M>);
  },
};

const sudoGetSmall: Command = {
  match: ["get", "small"],
  aliases: [["get", "lean"], ["get", "shredded"]],
  usage: "sudo get small",
  summary: "",
  group: "gains",
  hidden: true,
  run(ctx) {
    ctx.print(<R>get: &apos;{ctx.args[0] ?? "small"}&apos; is handled by a different package.</R>);
    ctx.print(<M>That&apos;s called a cut. Scroll down to the Physique Control Panel. Bring snacks. You can&apos;t have them.</M>);
  },
};

/* ------------------------------------------------------------------
   rm, systemctl, journalctl, reboot
   ------------------------------------------------------------------ */
const rm: Command = {
  match: ["rm"],
  usage: "sudo rm -rf /bellyfat",
  summary: "attempt fat removal",
  group: "gains",
  complete: () => ["-rf"],
  async run(ctx) {
    const targets = ctx.args.filter((a) => !a.startsWith("-"));
    const noPreserve = ctx.args.includes("--no-preserve-root");
    const t = targets[0];
    if (!t) {
      ctx.print(<span>rm: missing operand</span>);
      return;
    }
    if (t === "/" || t === "/*") {
      ctx.unlock("rmroot");
      if (!noPreserve) {
        ctx.print(<R>rm: it is dangerous to operate recursively on &apos;/&apos;</R>);
        ctx.print(<R>rm: use --no-preserve-root to override this failsafe</R>);
        ctx.print(<M>…and bring a spotter.</M>);
        return;
      }
      for (const d of ["/bin", "/boot", "/etc", "/home/gains/excuses", "/home/gains/goals.md"]) {
        ctx.print(<M>removed directory &apos;{d}&apos;</M>);
        await ctx.sleep(180);
      }
      ctx.print(<R>rm: refusing to remove &apos;/dev/delts&apos;: protected by the Geneva Convention</R>);
      ctx.print(<Y>Emergency rollback complete. Nice try.</Y>);
      return;
    }
    if (t.replace(/\/$/, "") === "/bellyfat" || t === "bellyfat") {
      await ctx.sleep(400);
      ctx.print(<R>rm: cannot remove &apos;/bellyfat&apos;: Permission denied</R>);
      ctx.print(<span>rm: required privilege not held: <Y>caloric_deficit</Y></span>);
      ctx.print(<M>{ctx.sudo ? "note: sudo has no effect here. Nobody has root on /bellyfat." : "hint: sudo won't help either. Ask the kitchen."}</M>);
      ctx.reject();
      return;
    }
    if (/excuse/.test(t)) {
      ctx.print(<M>removed &apos;{t}&apos;. it will regenerate overnight.</M>);
      return;
    }
    if (/delts|biceps|chest|lats|traps/.test(t)) {
      ctx.print(<R>rm: cannot remove &apos;{t}&apos;: Device or resource busy (pumped)</R>);
      return;
    }
    const n = ctx.fs.get(t);
    if (!n) {
      ctx.print(<span>rm: cannot remove &apos;{t}&apos;: No such file or directory</span>);
      return;
    }
    ctx.print(<M>rm: &apos;{t}&apos; is write-protected. Leave the meal prep alone.</M>);
  },
};

const SERVICES = ["leg_day", "gains", "excuses", "recovery", "protein_synthesis"];

const systemctl: Command = {
  match: ["systemctl"],
  usage: "sudo systemctl <start|stop|status> <svc>",
  summary: "manage services: leg_day, gains, excuses…",
  group: "gains",
  complete: (args) => (args.length === 0 ? ["start", "stop", "status", "restart", "enable", "disable"] : SERVICES),
  async run(ctx) {
    const [verb, svcRaw] = ctx.args;
    const svc = (svcRaw ?? "").replace(/\.service$/, "");
    if (!verb) {
      ctx.print(<span>usage: systemctl &lt;start|stop|status|restart&gt; &lt;service&gt;</span>);
      ctx.print(<M>services: {SERVICES.join(", ")}</M>);
      return;
    }
    if (verb === "isolate") {
      ctx.print(<M>Targets are switched from the Physique Control Panel below.</M>);
      return;
    }
    if (!svc) {
      ctx.print(<R>Too few arguments.</R>);
      return;
    }
    if (!SERVICES.includes(svc)) {
      ctx.print(<R>Failed to {verb} {svc}.service: Unit {svc}.service not found.</R>);
      ctx.reject();
      return;
    }
    if (verb !== "status" && !ctx.sudo && !ctx.isRoot) {
      ctx.print(<R>Failed to {verb} {svc}.service: Access denied</R>);
      ctx.print(<M>See system logs and &apos;systemctl status {svc}.service&apos; for details. Or use sudo.</M>);
      ctx.reject();
      return;
    }

    if (svc === "leg_day") {
      if (verb === "stop" || verb === "disable") {
        ctx.print(<Y>Warning: leg_day.service is already disabled.</Y>);
        ctx.print(<M>     Loaded: loaded (/etc/systemd/system/leg_day.service; disabled; preset: skipped)</M>);
        ctx.print(<M>     Active: inactive (dead) since Mon 2019-03-04 07:02:11; 7 years ago</M>);
        return;
      }
      if (verb === "start" || verb === "restart" || verb === "enable") {
        const h = ctx.print(<span>A start job is running for leg_day.service (0s / 1min 30s)</span>);
        for (let s = 1; s <= 12; s++) {
          await ctx.sleep(260);
          const stars = "***".slice(0, (s % 3) + 1).padEnd(3, " ");
          h.update(
            <span>
              [<R>{stars}</R>] A start job is running for leg_day.service ({s * 7}s / 1min 30s)
            </span>,
          );
        }
        ctx.print(<Tag kind="fail">Failed to start leg_day.service - Lower Body Training.</Tag>);
        ctx.print(<span>Job for leg_day.service failed because the control process exited with error code.</span>);
        ctx.print(<M>See &apos;<G>journalctl -xeu leg_day.service</G>&apos; for details.</M>);
        ctx.reject();
        return;
      }
      ctx.print(
        <Pre>
          <R>○</R> leg_day.service - Lower Body Training{"\n"}
          {"     "}Loaded: loaded (/etc/systemd/system/leg_day.service; <R>disabled</R>){"\n"}
          {"     "}Active: <R>inactive (dead)</R> since 2019{"\n"}
          {"       "}Docs: man:squat(8)  (unread)
        </Pre>,
      );
      return;
    }

    if (svc === "excuses") {
      if (verb === "stop" || verb === "disable") {
        ctx.setExcusesKilled(true);
        ctx.print(<Ok>Stopped excuses.service.</Ok>);
        ctx.print(<M>Restart=always is set. It will be back by Monday.</M>);
        return;
      }
      if (verb === "start" || verb === "restart") {
        ctx.setExcusesKilled(false);
        ctx.print(<Tag kind="ok">Started excuses.service - Excuse Generator Daemon. (It was never really gone.)</Tag>);
        return;
      }
      ctx.print(
        <Pre>
          {ctx.excusesKilled ? <M>○</M> : <G>●</G>} excuses.service - Excuse Generator Daemon{"\n"}
          {"     "}Loaded: loaded (/lib/systemd/system/excuses.service; enabled; Restart=always){"\n"}
          {"     "}Active: {ctx.excusesKilled ? <M>inactive (dead) — disabled by &apos;sudo get big&apos;</M> : <G>active (running)</G>}{"\n"}
          {"      "}Tasks: {ctx.excusesKilled ? 0 : 4812} (limit: none){"\n"}
          {"     "}Recent: &quot;too tired&quot;, &quot;gym is crowded&quot;, &quot;it&apos;s raining (I drive)&quot;
        </Pre>,
      );
      return;
    }

    if (verb === "stop") {
      ctx.print(<R>Refusing to stop {svc}.service: production never stops.</R>);
      return;
    }
    ctx.print(
      <Pre>
        <G>●</G> {svc}.service - {svc === "gains" ? "Hypertrophy Daemon" : svc === "recovery" ? "Recovery Daemon (best effort)" : "Protein Synthesis"}{"\n"}
        {"     "}Loaded: loaded (/lib/systemd/system/{svc}.service; enabled; preset: enabled){"\n"}
        {"     "}Active: <G>active (running)</G> since 2025-09-21; 412 days ago{"\n"}
        {"     "}Memory: 4.2kg (peak: 6.8kg, during bulk){"\n"}
        {"        "}CPU: 99.9% (chewing){"\n"}
        {"     "}CGroup: /system.slice/{svc}.service{"\n"}
        {"             "}├─ 1 /usr/bin/eat --protein=200g{"\n"}
        {"             "}└─ 2 /usr/bin/sleep 8h  <M>(usually killed at 5h12m)</M>
      </Pre>,
    );
  },
};

const journalctl: Command = {
  match: ["journalctl"],
  usage: "journalctl -xeu leg_day",
  summary: "read the service logs",
  group: "gains",
  complete: () => ["-xeu"],
  async run(ctx) {
    const svc = (ctx.args.find((a) => !a.startsWith("-")) ?? "leg_day").replace(/\.service$/, "");
    if (svc !== "leg_day") {
      ctx.print(<M>-- No entries -- ({svc} is behaving, which is suspicious)</M>);
      return;
    }
    await lines(
      ctx,
      [
        <M key="0">-- Logs begin at Mon 2019-03-04. --</M>,
        <span key="1">leg_day[666]: Arrived at gym. Looked at squat rack.</span>,
        <span key="2">leg_day[666]: Squat rack occupied (curls). Waiting.</span>,
        <span key="3">leg_day[666]: Waited 40 seconds. Remembered something urgent at home.</span>,
        <span key="4">leg_day[666]: Did 3 sets of leg extensions &quot;to warm up&quot;. Called it a day.</span>,
        <span key="5"><R>systemd[1]: leg_day.service: Main process exited, code=exited, status=1/EXCUSE</R></span>,
        <span key="6"><R>systemd[1]: leg_day.service: Failed with result &apos;excuse&apos;.</R></span>,
        <M key="7">░░ The unit leg_day.service has entered the &apos;failed&apos; state with result &apos;excuse&apos;.</M>,
      ],
      220,
    );
  },
};

const reboot: Command = {
  match: ["reboot"],
  aliases: [["shutdown", "-r", "now"], ["shutdown"]],
  usage: "sudo reboot",
  summary: "initiate rest day",
  group: "gains",
  async run(ctx) {
    if (!ctx.sudo && !ctx.isRoot) {
      ctx.print(<R>reboot: must be superuser. Rest days require elevated privileges, apparently.</R>);
      ctx.reject();
      return;
    }
    ctx.print(<B>Broadcast message from root@sudogetbig (pts/0):</B>);
    ctx.print(<span>The system is going down for <Y>REST DAY</Y> NOW!</span>);
    await ctx.sleep(700);
    await lines(
      ctx,
      [
        <Tag key="1" kind="ok">Stopped ego.service.</Tag>,
        <Tag key="2" kind="ok">Stopped mirror_check.service.</Tag>,
        <Tag key="3" kind="ok">Stopped preworkout.service (it took a while).</Tag>,
        <Tag key="4" kind="ok">Unmounted /dev/pump.</Tag>,
        <Tag key="5" kind="ok">Reached target Couch.</Tag>,
      ],
      260,
    );
    await ctx.sleep(600);
    ctx.clear();
    await ctx.sleep(500);
    await lines(
      ctx,
      [
        <M key="a">SwoleOS 24.04 LTS — booting kernel 6.9.0-hypertrophy …</M>,
        <Tag key="b" kind="ok">Started recovery_daemon.service.</Tag>,
        <Tag key="c" kind="ok">Started protein_synthesis.service.</Tag>,
        <Tag key="d" kind="ok">Started sleep.target (8h requested, 5h12m granted).</Tag>,
        <Tag key="e" kind="warn">DOMS detected on /dev/chest. Proceeding anyway.</Tag>,
        <Tag key="f" kind="ok">Reached target Gym.</Tag>,
      ],
      300,
    );
    ctx.print(<G>Recovery protocols activated.</G>);
    ctx.print(<M>Welcome back. You look exactly the same. That&apos;s normal.</M>);
  },
};

const touch: Command = {
  match: ["touch"],
  usage: "touch grass",
  summary: "go outside (allegedly)",
  group: "gains",
  complete: () => ["grass", "barbell"],
  run(ctx) {
    const t = ctx.args[0];
    if (!t) {
      ctx.print(<span>touch: missing file operand</span>);
      return;
    }
    if (t.toLowerCase() === "grass") {
      ctx.print(<R>touch: cannot touch &apos;grass&apos;: Command rejected.</R>);
      ctx.print(<span>Go touch a barbell instead. <M>(try: touch barbell)</M></span>);
      ctx.reject();
      return;
    }
    if (t.toLowerCase() === "barbell") {
      ctx.print(<Ok>barbell: touched. +1 rep. That&apos;s a start.</Ok>);
      return;
    }
    const err = ctx.fs.touch(t);
    if (err) ctx.print(<span>{err}</span>);
  },
};

export const gainsCommands: Command[] = [
  sudoGetBig,
  sudoGetBigger,
  sudoGetSmall,
  aptInstall,
  aptRemove,
  aptUpdate,
  aptList,
  aptUpgrade,
  rm,
  systemctl,
  journalctl,
  reboot,
  touch,
];

