#!/usr/bin/env sh
# HiSosed audio node: turns a small Debian 12 VM/LXC on Proxmox into one or more
# MPD players (media_player in Home Assistant) on a 3.5 mm jack, USB sound card
# or Bluetooth speaker. PipeWire mixes the players, so HiSosed layers assigned to
# different players sound at the same time.
#
#   sudo sh audio-node.sh --mode jack|bluetooth [--players N] [--user NAME]
#
# Nothing here talks to the Internet except apt. Re-running is safe.
set -eu

mode=""
players=2
user="hisosed"

usage() {
  echo "Usage: $0 --mode jack|bluetooth [--players 1-4] [--user NAME]" >&2
  exit 2
}

while [ $# -gt 0 ]; do
  case "$1" in
    --mode) mode="${2:-}"; shift 2 ;;
    --players) players="${2:-}"; shift 2 ;;
    --user) user="${2:-}"; shift 2 ;;
    -h|--help) usage ;;
    *) usage ;;
  esac
done

case "$mode" in jack|bluetooth) ;; *) usage ;; esac
case "$players" in 1|2|3|4) ;; *) echo "--players must be 1..4" >&2; exit 2 ;; esac
[ "$(id -u)" -eq 0 ] || { echo "Run as root (sudo)." >&2; exit 1; }
command -v apt-get >/dev/null || { echo "Debian/Ubuntu with apt is required." >&2; exit 1; }

echo "==> Installing packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
packages="mpd pipewire pipewire-pulse wireplumber pulseaudio-utils dbus-user-session alsa-utils"
[ "$mode" = bluetooth ] && packages="$packages bluez libspa-0.2-bluetooth"
# shellcheck disable=SC2086
apt-get install -y -q $packages

# The distro MPD runs as a system service without a PipeWire session; we use per-user instances.
systemctl disable --now mpd.service mpd.socket >/dev/null 2>&1 || true

home="/var/lib/$user"
if ! id "$user" >/dev/null 2>&1; then
  echo "==> Creating user $user"
  useradd --system --create-home --home-dir "$home" --shell /usr/sbin/nologin "$user"
fi
usermod -aG audio "$user"
[ "$mode" = bluetooth ] && usermod -aG bluetooth "$user"
uid="$(id -u "$user")"

echo "==> Configuring PipeWire for a headless session"
# WirePlumber only enables Bluetooth for a user on an active seat; a headless node has no seat.
install -d -o "$user" -g "$user" "$home/.config/wireplumber/bluetooth.lua.d" "$home/.config/wireplumber/wireplumber.conf.d"
cat > "$home/.config/wireplumber/bluetooth.lua.d/80-hisosed-headless.lua" <<'EOF'
bluez_monitor.properties["with-logind"] = false
EOF
cat > "$home/.config/wireplumber/wireplumber.conf.d/80-hisosed-headless.conf" <<'EOF'
wireplumber.profiles = {
  main = {
    monitor.bluez.seat-monitoring = disabled
  }
}
EOF

echo "==> Configuring $players MPD player(s)"
install -d -o "$user" -g "$user" "$home/.config/mpd" "$home/.config/systemd/user" "$home/music" "$home/mpd"
i=0
while [ "$i" -lt "$players" ]; do
  port=$((6600 + i))
  cat > "$home/.config/mpd/mpd-$i.conf" <<EOF
music_directory    "$home/music"
playlist_directory "$home/mpd/playlists-$i"
db_file            "$home/mpd/db-$i"
state_file         "$home/mpd/state-$i"
bind_to_address    "any"
port               "$port"
audio_output {
  type "pulse"
  name "HiSosed $((i + 1))"
}
EOF
  install -d -o "$user" -g "$user" "$home/mpd/playlists-$i"
  i=$((i + 1))
done
cat > "$home/.config/systemd/user/hisosed-mpd@.service" <<'EOF'
[Unit]
Description=HiSosed MPD player %i
After=pipewire-pulse.service
Wants=pipewire-pulse.service

[Service]
ExecStart=/usr/bin/mpd --no-daemon %h/.config/mpd/mpd-%i.conf
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
EOF
chown -R "$user:$user" "$home/.config" "$home/mpd"

echo "==> Starting the user session at boot"
loginctl enable-linger "$user"
systemctl start "user@$uid.service"
as_user() {
  runuser -u "$user" -- env XDG_RUNTIME_DIR="/run/user/$uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$uid/bus" "$@"
}
as_user systemctl --user daemon-reload
as_user systemctl --user enable --now pipewire.socket pipewire-pulse.socket wireplumber.service
i=0
while [ "$i" -lt "$players" ]; do
  as_user systemctl --user enable --now "hisosed-mpd@$i.service"
  i=$((i + 1))
done

if [ "$mode" = bluetooth ]; then
  echo "==> Configuring Bluetooth"
  if [ -f /etc/bluetooth/main.conf ]; then
    sed -i 's/^#\{0,1\}AutoEnable=.*/AutoEnable=true/' /etc/bluetooth/main.conf
    grep -q '^AutoEnable=' /etc/bluetooth/main.conf || printf '\n[Policy]\nAutoEnable=true\n' >> /etc/bluetooth/main.conf
  fi
  systemctl enable --now bluetooth.service
  install -d /etc/hisosed
  cat > /usr/local/bin/hisosed-bt-pair <<'EOF'
#!/usr/bin/env sh
# Pair, trust and connect one Bluetooth speaker; its address is kept for auto-reconnect.
set -eu
bluetoothctl power on >/dev/null
echo "Put the speaker into pairing mode. Scanning for 20 seconds..."
bluetoothctl --timeout 20 scan on >/dev/null 2>&1 || true
bluetoothctl devices
printf "Speaker address (XX:XX:XX:XX:XX:XX): "
read -r mac
case "$mac" in
  [0-9A-Fa-f][0-9A-Fa-f]:*) ;;
  *) echo "Invalid address" >&2; exit 1 ;;
esac
bluetoothctl pair "$mac" || true
bluetoothctl trust "$mac"
bluetoothctl connect "$mac"
echo "$mac" > /etc/hisosed/bt-mac
echo "Paired. HiSosed will reconnect this speaker automatically."
EOF
  cat > /usr/local/bin/hisosed-bt-reconnect <<'EOF'
#!/usr/bin/env sh
# Reconnect the saved speaker when it powered off or walked out of range.
[ -s /etc/hisosed/bt-mac ] || exit 0
mac="$(cat /etc/hisosed/bt-mac)"
bluetoothctl info "$mac" 2>/dev/null | grep -q "Connected: yes" && exit 0
bluetoothctl connect "$mac" >/dev/null 2>&1 || true
EOF
  chmod 0755 /usr/local/bin/hisosed-bt-pair /usr/local/bin/hisosed-bt-reconnect
  cat > /etc/systemd/system/hisosed-bt-reconnect.service <<'EOF'
[Unit]
Description=Reconnect the HiSosed Bluetooth speaker
After=bluetooth.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/hisosed-bt-reconnect
EOF
  cat > /etc/systemd/system/hisosed-bt-reconnect.timer <<'EOF'
[Unit]
Description=Reconnect the HiSosed Bluetooth speaker every 30 seconds

[Timer]
OnBootSec=20
OnUnitActiveSec=30

[Install]
WantedBy=timers.target
EOF
  systemctl daemon-reload
  systemctl enable --now hisosed-bt-reconnect.timer
fi

address="$(hostname -I 2>/dev/null | awk '{print $1}')"
echo
echo "Done. In Home Assistant add the 'Music Player Daemon (MPD)' integration for each player:"
i=0
while [ "$i" -lt "$players" ]; do
  echo "  host ${address:-<this machine IP>}  port $((6600 + i))"
  i=$((i + 1))
done
if [ "$mode" = bluetooth ]; then
  echo "Next: run 'sudo hisosed-bt-pair' with the speaker in pairing mode."
else
  echo "Check the output: runuser -u $user -- env XDG_RUNTIME_DIR=/run/user/$uid pactl list short sinks"
  echo "Pick another one with:  ... pactl set-default-sink <name>"
fi
echo "Then in HiSosed → Speakers press 'Test signal'."
