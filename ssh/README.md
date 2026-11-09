# ssh gains.sudogetbig.com

A public SSH "server" with exactly one program behind it: the SwoleOS terminal
app. Anyone can connect with any username and no password, because there is no
shell, no files, no command execution, no SFTP and no port forwarding. It shows
the live lift log (from `https://sudogetbig.com/api/lifts`), a training heatmap,
a fake installer and fortunes.

| File | What it is |
|---|---|
| `server.mjs` | SSH server (ssh2): accepts everyone, limits connections (100 total, 4 per IP), 10 min idle / 45 min max, refuses exec/sftp/forwarding |
| `tui.mjs` | The full-screen app: boot sequence, tabs, keyboard handling, redraws |
| `data.mjs` | Fetches the lift summary every 10 minutes, caches the last good copy in `/data` |
| `install.sh` | Moves admin SSH to port 2222 in two safe steps, then starts the app on 22 |

It imports `src/lib/liftsCore.ts` and `src/lib/fortunes.ts` from the website, so
charts and jokes match the site. Node 22.18+ runs those `.ts` files directly.

## Install on the droplet

1. Cloudflare → DNS → add an **A** record: name `gains`, IPv4 `165.232.136.150`,
   **DNS only** (grey cloud — Cloudflare's proxy doesn't carry SSH).
2. On the droplet:
   ```bash
   git clone https://github.com/tattoobrando/sudogetbig.git /opt/sudogetbig
   cd /opt/sudogetbig/ssh
   sudo ./install.sh          # step 1: admin SSH on 22 and 2222
   ```
3. In a **new** window, check `ssh -p 2222 root@165.232.136.150` works.
4. Back in the first window: `sudo ./install.sh finish`.

From then on your own login is `ssh -p 2222 root@165.232.136.150` (and `scp -P 2222 …`).

## Update

```bash
cd /opt/sudogetbig && git pull && cd ssh && docker compose up -d --build
```

## Run locally

```bash
cd ssh && npm install
DATA_DIR=./.data PORT=2222 node server.mjs
ssh -p 2222 localhost
```

`sudo ./install.sh undo` stops the app and puts admin SSH back on 22.
