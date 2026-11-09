#!/usr/bin/env bash
# ssh gains.sudogetbig.com installer for the DigitalOcean droplet.
#
# Port 22 is the one everyone's ssh client uses, so the SwoleOS app takes it
# and your admin SSH moves to 2222. That happens in two safe steps:
#
#   sudo ./install.sh          step 1: admin SSH listens on BOTH 22 and 2222
#                              -> test "ssh -p 2222 root@<ip>" in a NEW window
#   sudo ./install.sh finish   step 2: admin SSH on 2222 only, app on 22
#
# Undo everything:  sudo ./install.sh undo
set -euo pipefail
cd "$(dirname "$0")"

ADMIN_PORT=2222
CONF=/etc/ssh/sshd_config.d/10-sudogetbig-port.conf
G=$'\033[32m'; Y=$'\033[33m'; R=$'\033[31m'; B=$'\033[1m'; X=$'\033[0m'
say() { printf '%s\n' "$*"; }
die() { say "${R}✗ $*${X}"; exit 1; }

[ "$(id -u)" = 0 ] || die "Run as root (you are probably already root on the droplet)."
command -v docker >/dev/null || die "Docker isn't installed. (The put.io app installer sets it up.)"
docker compose version >/dev/null 2>&1 || die "docker compose isn't available."
IP=$(curl -fsS -4 --max-time 5 https://ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

reload_ssh() {
  # Ubuntu 22.10+ starts sshd from ssh.socket; ports come from sshd_config via a generator.
  sshd -t || die "sshd config test failed; not reloading. Check $CONF."
  if systemctl is-enabled ssh.socket >/dev/null 2>&1 || systemctl is-active ssh.socket >/dev/null 2>&1; then
    systemctl daemon-reload
    systemctl restart ssh.socket
    systemctl restart ssh.service 2>/dev/null || true
  else
    systemctl restart ssh 2>/dev/null || systemctl restart sshd
  fi
  sleep 1
}
# What answers on a local port? Reads the SSH greeting, e.g. "SSH-2.0-OpenSSH_9.6".
banner() { timeout 3 bash -c "exec 3<>/dev/tcp/127.0.0.1/$1 && head -n1 <&3" 2>/dev/null | tr -d "\r" || true; }
is_openssh() { banner "$1" | grep -q OpenSSH; }
is_swoleos() { banner "$1" | grep -q SwoleOS; }

case "${1:-}" in
"" | prep)
  say "${B}Step 1 of 2:${X} admin SSH will listen on 22 ${B}and${X} $ADMIN_PORT."
  printf 'Port 22\nPort %s\n' "$ADMIN_PORT" > "$CONF"
  if ufw status 2>/dev/null | grep -q "Status: active"; then ufw allow "$ADMIN_PORT"/tcp comment 'admin ssh' >/dev/null; fi
  reload_ssh
  is_openssh "$ADMIN_PORT" || die "sshd isn't answering on $ADMIN_PORT. Nothing else was changed; run: sudo ./install.sh undo"
  say "${G}✓ sshd is listening on 22 and $ADMIN_PORT.${X}"
  say ""
  say "${Y}Now, WITHOUT closing this window${X}, open a new PowerShell window and run:"
  say ""
  say "    ssh -p $ADMIN_PORT root@$IP"
  say ""
  say "If that logs you in, come back here and run:  ${B}sudo ./install.sh finish${X}"
  say "If it hangs: a DigitalOcean Cloud Firewall may be blocking $ADMIN_PORT (Networking → Firewalls)."
  ;;

finish)
  [ -f "$CONF" ] || die "Run step 1 first: sudo ./install.sh"
  read -r -p "Did 'ssh -p $ADMIN_PORT root@$IP' work in a new window? [y/N] " ok
  case "$ok" in [yY]*) ;; *) die "Not continuing. Test port $ADMIN_PORT first." ;; esac

  say "${B}Step 2 of 2:${X} admin SSH → $ADMIN_PORT only, SwoleOS app → 22."
  printf 'Port %s\n' "$ADMIN_PORT" > "$CONF"
  reload_ssh
  is_openssh "$ADMIN_PORT" || die "sshd isn't answering on $ADMIN_PORT; aborting. Run: sudo ./install.sh undo"
  if is_openssh 22; then die "sshd is still on 22 (another config sets Port 22?). Check: grep -ri '^Port' /etc/ssh/"; fi

  docker compose up -d --build
  for _ in 1 2 3 4 5; do is_swoleos 22 && break; sleep 2; done
  is_swoleos 22 || die "The app isn't answering on 22 yet. Check: docker compose logs"
  say "${G}✓ Done.${X} The SwoleOS app is on port 22, your admin SSH is on $ADMIN_PORT."
  say ""
  say "  Visitors:  ssh gains.sudogetbig.com     (after the DNS record exists)"
  say "  You:       ssh -p $ADMIN_PORT root@$IP"
  say "  Logs:      docker compose logs -f"
  say "  Update:    cd $(cd .. && pwd) && git pull && cd ssh && docker compose up -d --build"
  ;;

undo)
  docker compose down 2>/dev/null || true
  rm -f "$CONF"
  reload_ssh
  say "${G}✓ Undone:${X} app stopped, admin SSH back on 22 only."
  ;;

*)
  die "usage: sudo ./install.sh [prep|finish|undo]"
  ;;
esac
