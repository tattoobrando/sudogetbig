# sudo get big — ROOT ACCESS TO GAINS.

A joke website for developers who lift (and lifters who deploy). It looks like a real
command-line product at first glance and gets more absurd the longer you poke at it.

Live at **https://sudogetbig.com** (once deployed — see below).

## What's in it

| Section | What it does |
|---|---|
| **Terminal** (hero) | A working client-side shell: parsing with quotes, ↑/↓ history, Tab completion (commands, packages, files), Ctrl+C / Ctrl+L, prompts that wait for input (`[Y/n]`), a tiny filesystem (`ls`, `cd`, `cat`, `touch`), themes, root mode, and ~60 commands including 10 hidden easter eggs. |
| **Health strip** | Live gains uptime, protein bandwidth, an excuse process counter you can `kill -9` (it respawns). |
| **Physique Control Panel** | CUT / BULK / DIRTY BULK. Switching changes status, metrics, warnings, the ASCII torso, the weight trend and a live journal. |
| **Gains Installer** | Staged install with two real decisions (calves.dll, dirty_bulk) and different branches/endings. Replayable. |
| **Modules** | Six fake packages with live terminal previews. |
| **Docs** | Hidden until you click *View Documentation*: a `gains(1)` man page and release notes. |
| **Diagnostics** | `legscan` vulnerability scanner, a bug-report generator (copy as markdown), and a shareable Gains System Report. |
| **Extras** | Toast alerts, Konami code, achievements saved in localStorage, reduced-motion support. |

## curl mode (it works in a real terminal)

`src/proxy.ts` spots command-line clients (curl, wget, HTTPie, PowerShell) and serves text
instead of HTML. Browsers are unaffected.

```bash
curl -L sudogetbig.com                      # animated terminal homepage
curl -L sudogetbig.com/github/<username>    # GitHub physique report
curl -sL sudogetbig.com/install | bash      # harmless "installer" (it only prints text — read it first)
curl -L sudogetbig.com/lifts                # real training log (+ ?lift=leg%20press for one lift)
curl -L sudogetbig.com/neofetch
curl -L sudogetbig.com/fortune
curl -L sudogetbig.com/help
ssh gains.sudogetbig.com                    # full-screen SwoleOS app (see ssh/README.md)
```

Animations are drawn with newline-terminated frames, so curl shows them live in normal terminals.
In Git Bash's window (and sometimes Windows consoles) curl buffers output — add `-N`
(`curl -NL sudogetbig.com`) to see the animation there.

`-L` matters: without `https://`, curl uses plain http, and Vercel answers http with a redirect to
https ("Redirecting..."). `-L` follows it. `curl https://sudogetbig.com` works too.

Add `?plain` for no colors/animation. On Windows PowerShell use `curl.exe` (plain `curl` is an
alias for Invoke-WebRequest there). `NO_COLOR=1` turns off colors in the install script.

## GitHub physique

`sudo get big --github <user>` (or `physique <user>`) in the browser terminal, or
`curl -L sudogetbig.com/github/<user>`. It reads public GitHub data only — the profile, owned repos and
the last ~90 days of public events — and maps it to a physique: commits are reps, weekends are leg
day, languages are muscle groups. Logic lives in `src/lib/physique.ts`.

Sharing `https://sudogetbig.com/github/<user>` opens the site and runs the report automatically.

**Rate limits:** browsers call GitHub directly (60 requests/hour per visitor, 3 per report). The curl
endpoint calls GitHub from Vercel's servers, which share a limit, so add a token there:
GitHub → Settings → Developer settings → Fine-grained tokens → generate one with **public repository
access only and no permissions**, then in Vercel → Project → Settings → Environment Variables add
`GITHUB_TOKEN` and redeploy. Results are also cached for 10 minutes.

## Lift log (/lifts)

`sudogetbig.com/lifts` shows real training history from a Liftoff export: totals, weekly streak,
estimated-1RM progression per lift, muscle-group balance and the decline of leg day. The same data
powers `curl -L sudogetbig.com/lifts` and the `lifts` terminal command.

To update it, export your workout data from Liftoff as CSV, then:

```bash
npm run lifts -- ~/Downloads/liftoff_workout_data.csv
git add src/data/lifts.json && git commit -m "Update lift log" && git push
```

Or skip the computer: **iPhone sync.** An iOS Shortcut sends the export straight to
`POST /api/lifts`, which builds the same summary in memory and commits only
`src/data/lifts.json` to GitHub, so Vercel redeploys on its own. It needs two Vercel environment
variables: `LIFTS_UPLOAD_TOKEN` (a long random secret, also pasted into the Shortcut) and
`LIFTS_GITHUB_TOKEN` (fine-grained token, this repo only, Contents read/write). Uploads with fewer
sessions than the site already has are refused (add `?force` to override). `GET /api/lifts` returns
the public summary as JSON.

Only the summary (`src/data/lifts.json`) is committed. Notes, RPE, timestamps and the raw rows are
never written, and `*.csv` is git-ignored so the export can't be committed by accident. Muscle groups
are matched from exercise names in `src/lib/liftsSummary.mjs`; the script lists any it can't place.

## ssh gains.sudogetbig.com

`ssh/` is a small public SSH app (Node + ssh2) that runs on the DigitalOcean droplet in Docker:
any username, no password, no shell — just the SwoleOS terminal app with the live lift log. See
[`ssh/README.md`](ssh/README.md) for install (it moves admin SSH to port 2222).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Motion · Lucide icons ·
self-hosted fonts (Archivo, JetBrains Mono via Fontsource). No backend, no database, no API keys.
The whole site is statically prerendered.

## Run it locally

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev          # http://localhost:3000
```

Checks:

```bash
npm run lint         # ESLint
npm run typecheck    # TypeScript
npm run build        # production build
npm run check        # all three
```

## Project layout

```
src/
  app/                      layout, page, metadata, OG image, icon, robots, sitemap
  components/
    terminal/
      engine.ts             tokenizer, command matching, tab completion, did-you-mean
      fs.ts                 in-memory filesystem
      Out.tsx               output primitives (colors, progress bars, spinners)
      Terminal.tsx          the shell UI: history, keyboard, prompts, intro
      commands/             command definitions, grouped by theme
        gains.tsx  dev.tsx  system.tsx  eggs.tsx  github.tsx  index.tsx (registry + help + man)
    sections/               page sections (Hero, ControlPanel, Installer, ...)
    providers/              shared state (mode, eggs, stats, toasts)
    ui/                     Toaster, Ambient (Konami + alerts), SectionHead
  lib/
    physique.ts             GitHub fetch + analysis + ASCII build (browser and server)
    cli.ts                  ANSI colors, streaming, renderers for curl mode
    installScript.ts        the harmless bash script behind /install
    lifts.ts                lift-log data bound to liftsCore helpers (page, curl, terminal)
    liftsCore.ts            lift helpers with no app imports (also used by ssh/)
    liftsSummary.mjs        Liftoff CSV → summary (npm run lifts + iPhone sync)
  data/lifts.json           summarized Liftoff export (from npm run lifts)
    ...                     random, storage, clipboard, report, eggs, fortunes
  app/lifts                 the lift log page
  app/api/lifts             GET summary JSON · POST iPhone sync
  app/cli, cli/lifts, install, github/[user], neofetch, fortune, help    curl endpoints
scripts/lifts.mjs           Liftoff CSV → src/data/lifts.json
ssh/                        ssh gains.sudogetbig.com (runs on the droplet)
  proxy.ts                  routes curl/wget/HTTPie/PowerShell to the text version
```

### Adding a command

Add an object to any file in `src/components/terminal/commands/` and make sure it's in that file's
exported array. That's it — `help`, Tab completion and "did you mean" pick it up automatically.

```tsx
const flex: Command = {
  match: ["flex"],                 // words after an optional leading `sudo`
  usage: "flex [--both-arms]",
  summary: "show off",
  group: "misc",                   // gains | dev | system | files | misc
  // hidden: true,                 // keep it out of help + completion (easter egg)
  async run(ctx) {
    ctx.print(<span>💪 flexing…</span>);
    await ctx.sleep(500);          // Ctrl+C-aware, shortened for reduced motion
    const a = await ctx.ask("Both arms? [Y/n] ");
    ctx.print(<Ok>{/^n/i.test(a) ? "One arm. Humble." : "Both arms. Unhumble."}</Ok>);
  },
};
```

`ctx` also gives you `sudo`, `args`, `fs`, `unlock(eggId)`, `toast()`, `setTheme()`, `setRoot()`,
`setTrap()` (to capture input, like the vim egg) and more — see `Ctx` in `engine.ts`.

## Deploy (GitHub → Vercel)

1. **Create a GitHub repo** named `sudogetbig` (empty — no README, no .gitignore).
2. **Push this folder** (it's already a git repo with one commit):
   ```bash
   git remote add origin https://github.com/<your-username>/sudogetbig.git
   git push -u origin main
   ```
   The first push opens a browser window to sign in to GitHub.
3. **Import into Vercel:** vercel.com → *Add New… → Project* → *Import Git Repository* → pick `sudogetbig`.
   Framework preset is detected as Next.js. No environment variables. Click **Deploy**.
4. From then on, **every push to `main` deploys automatically**, and every pull request gets a preview URL.

## Custom domain: sudogetbig.com (DNS on Cloudflare)

1. Vercel → your project → **Settings → Domains** → add `sudogetbig.com`, then add `www.sudogetbig.com`
   and set it to redirect to `sudogetbig.com`.
2. Vercel shows the exact records to create. Use **those values**. They are typically:
   - `sudogetbig.com` (Name `@`): an **A** record to Vercel's IP, or a **CNAME** to a project-specific
     `…vercel-dns…com` target. Cloudflare allows a CNAME at `@` (it flattens it).
   - `www`: a **CNAME** to the target Vercel shows.
3. In Cloudflare → **DNS → Records**, add them with **Proxy status: DNS only (grey cloud)** so Vercel
   can issue the HTTPS certificate. Delete any old `@` or `www` records that conflict.
4. **Do not touch the `media` (and `chat`) A records** — those point to the DigitalOcean server that
   runs the put.io app at media.sudogetbig.com.
5. Vercel verifies the domain and issues the certificate, usually within a few minutes.

## License

MIT for the code. The jokes are free; gains are not.
