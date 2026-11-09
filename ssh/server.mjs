/*
  ssh gains.sudogetbig.com

  A public SSH server that serves one thing: the SwoleOS terminal app in
  tui.mjs. There is no shell, no files, no exec, no forwarding. Any username
  works and no password or key is checked, because there is nothing behind
  the door except a lift log.
*/
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import ssh2 from "ssh2";
import { lifts, startData } from "./data.mjs";
import { Session } from "./tui.mjs";

const { Server, utils } = ssh2;

const PORT = Number(process.env.PORT || 2222);
const DATA = process.env.DATA_DIR || "/data";
const MAX_CONN = Number(process.env.MAX_CONN || 100);
const MAX_PER_IP = Number(process.env.MAX_PER_IP || 4);
const IDLE_MS = 10 * 60 * 1000;
const MAX_SESSION_MS = 45 * 60 * 1000;

/* ---------- host key (generated once, kept in the volume) ---------- */
mkdirSync(DATA, { recursive: true });
const keyFile = `${DATA}/host_ed25519`;
if (!existsSync(keyFile)) {
  const { private: priv } = utils.generateKeyPairSync("ed25519");
  writeFileSync(keyFile, priv, { mode: 0o600 });
  console.log("generated a new host key");
}

/* ---------- visitor counter (a number, nothing about who) ---------- */
const visitsFile = `${DATA}/visits`;
let visits = 0;
try {
  visits = Number(readFileSync(visitsFile, "utf8")) || 0;
} catch {
  /* first run */
}
const bump = () => {
  visits++;
  try {
    writeFileSync(visitsFile, String(visits));
  } catch {
    /* not fatal */
  }
  return visits;
};

/* ---------- connection limits ---------- */
let open = 0;
const perIp = new Map();

const server = new Server(
  {
    hostKeys: [readFileSync(keyFile)],
    ident: "SwoleOS_24.04",
    banner: undefined,
  },
  (client, info) => {
    const ip = info.ip || "?";
    if (open >= MAX_CONN || (perIp.get(ip) ?? 0) >= MAX_PER_IP) {
      client.end();
      return;
    }
    open++;
    perIp.set(ip, (perIp.get(ip) ?? 0) + 1);
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      open--;
      const n = (perIp.get(ip) ?? 1) - 1;
      if (n <= 0) perIp.delete(ip);
      else perIp.set(ip, n);
    };
    client.on("close", release);
    client.on("error", () => {});

    // Hard limit on how long one connection can stay.
    const hard = setTimeout(() => client.end(), MAX_SESSION_MS);
    client.on("close", () => clearTimeout(hard));

    let user = "guest";
    // Accept everyone. "none" first means OpenSSH never prompts for a password.
    client.on("authentication", (ctx) => {
      user = ctx.username || "guest";
      ctx.accept();
    });

    client.on("ready", () => {
      client.on("session", (accept) => {
        const session = accept();
        let pty = { cols: 80, rows: 24 };
        let app = null;

        session.on("pty", (acc, _rej, info) => {
          pty = { cols: info.cols, rows: info.rows };
          acc?.();
        });
        session.on("window-change", (acc, _rej, info) => {
          pty = { cols: info.cols, rows: info.rows };
          app?.resize(info.cols, info.rows);
          acc?.();
        });
        session.on("env", (acc) => acc?.()); // accepted and ignored
        session.on("shell", (acc) => {
          const stream = acc();
          let idle;
          const poke = () => {
            clearTimeout(idle);
            idle = setTimeout(() => app?.close(), IDLE_MS);
          };
          app = new Session(stream, { user, cols: pty.cols, rows: pty.rows, data: lifts, visits: bump(), onClose: () => client.end() });
          stream.on("data", (d) => {
            poke();
            app.input(d);
          });
          stream.on("close", () => {
            clearTimeout(idle);
            app.close(false);
          });
          stream.on("error", () => {});
          poke();
          app.start();
        });
        // `ssh gains.sudogetbig.com some-command`: no.
        session.on("exec", (acc, _rej, info) => {
          const stream = acc();
          stream.write(`SwoleOS: '${String(info.command).slice(0, 40)}' is not installed. Neither are your calves.\r\nTry: ssh gains.sudogetbig.com\r\n`);
          stream.exit(127);
          stream.end();
        });
        session.on("subsystem", (_acc, rej) => rej?.()); // no sftp
      });
    });
  },
);

server.on("error", (e) => console.error("server error:", e.message));
await startData();
server.listen(PORT, "0.0.0.0", () => console.log(`SwoleOS ssh listening on ${PORT} (data ${lifts() ? "loaded" : "not loaded yet"})`));

for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => process.exit(0));
