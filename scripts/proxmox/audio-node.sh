#!/usr/bin/env sh
# HiSosed audio node: turns a small Debian 12 VM/LXC on Proxmox into one or more
# MPD players (media_player in Home Assistant) on a 3.5 mm jack, USB sound card
# or Bluetooth speaker. PipeWire mixes the players, so HiSosed layers assigned to
# different players sound at the same time.
#
#   sh audio-node.sh --mode jack|bluetooth [--players N] [--user NAME]   (as root)
#
# Usually started by host-setup.sh on the Proxmox host. Nothing here talks to the
# Internet except apt. Re-running is safe.
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
[ "$(id -u)" -eq 0 ] || { echo "Run as root." >&2; exit 1; }
command -v apt-get >/dev/null || { echo "Debian/Ubuntu with apt is required." >&2; exit 1; }

echo "==> Installing packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
packages="mpd pipewire pipewire-pulse wireplumber pulseaudio-utils dbus-user-session alsa-utils"
[ "$mode" = bluetooth ] && packages="$packages bluez libspa-0.2-bluetooth"
# shellcheck disable=SC2086
apt-get install -y -q $packages

if [ "$mode" = bluetooth ] && grep -q '^ID=debian' /etc/os-release; then
  # Intel and Realtek adapters do not start without non-free firmware; Debian cloud images ship only "main".
  codename="$(sed -n 's/^VERSION_CODENAME=//p' /etc/os-release)"
  echo "deb http://deb.debian.org/debian $codename non-free-firmware" > /etc/apt/sources.list.d/hisosed-firmware.list
  apt-get update -q
  apt-get install -y -q firmware-misc-nonfree firmware-realtek firmware-iwlwifi || true
  # Reload the driver so freshly installed firmware is picked up without a reboot.
  modprobe -r btusb 2>/dev/null && modprobe btusb 2>/dev/null || true
fi

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
# A re-run with fewer players must not leave the old extra ones running.
while [ "$i" -lt 4 ]; do
  as_user systemctl --user disable --now "hisosed-mpd@$i.service" >/dev/null 2>&1 || true
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
#   hisosed-bt-pair            scan and ask for the address
#   hisosed-bt-pair XX:...:XX  pair that address without questions (used by host-setup.sh)
set -eu
bluetoothctl power on >/dev/null
mac="${1:-}"
if [ -z "$mac" ]; then
  hisosed-bt-scan
  printf "Speaker address (XX:XX:XX:XX:XX:XX): "
  read -r mac
fi
echo "$mac" | grep -Eq '^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$' || { echo "Invalid address" >&2; exit 1; }
bluetoothctl pair "$mac" || true
bluetoothctl trust "$mac"
echo "$mac" > /etc/hisosed/bt-mac
# A speaker often needs a few seconds after pairing; the reconnect timer finishes the job.
bluetoothctl connect "$mac" || echo "Not connected yet; it will be retried every 30 seconds."
echo "Paired. The speaker will be reconnected automatically."
EOF
  cat > /usr/local/bin/hisosed-bt-scan <<'EOF'
#!/usr/bin/env sh
# Scan for 20 seconds and print "MAC name" lines of every device seen.
bluetoothctl power on >/dev/null 2>&1 || true
echo "Put the speaker into pairing mode. Scanning for 20 seconds..." >&2
bluetoothctl --timeout 20 scan on >/dev/null 2>&1 || true
bluetoothctl devices | sed -n 's/^Device //p'
EOF
  cat > /usr/local/bin/hisosed-bt-reconnect <<'EOF'
#!/usr/bin/env sh
# Reconnect the saved speaker when it powered off or walked out of range.
[ -s /etc/hisosed/bt-mac ] || exit 0
mac="$(cat /etc/hisosed/bt-mac)"
bluetoothctl info "$mac" 2>/dev/null | grep -q "Connected: yes" && exit 0
bluetoothctl connect "$mac" >/dev/null 2>&1 || true
EOF
  chmod 0755 /usr/local/bin/hisosed-bt-pair /usr/local/bin/hisosed-bt-scan /usr/local/bin/hisosed-bt-reconnect
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

if [ "$mode" = jack ]; then
  echo "==> Unmuting the sound card"
  # Proxmox hosts have no alsa-utils, so the codec comes up muted after every host boot.
  cat > /usr/local/bin/hisosed-unmute <<'EOF'
#!/usr/bin/env sh
for card in $(sed -n 's/^ *\([0-9][0-9]*\) \[.*/\1/p' /proc/asound/cards); do
  amixer -q -c "$card" sset 'Auto-Mute Mode' Disabled 2>/dev/null || true
  for control in Master Headphone Speaker Front 'Line Out' PCM; do
    amixer -q -c "$card" sset "$control" 90% unmute 2>/dev/null || true
  done
done
EOF
  chmod 0755 /usr/local/bin/hisosed-unmute
  cat > /etc/systemd/system/hisosed-unmute.service <<'EOF'
[Unit]
Description=Unmute the sound card for HiSosed
After=sound.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/hisosed-unmute

[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
  systemctl enable hisosed-unmute.service >/dev/null
  /usr/local/bin/hisosed-unmute

  # HDA cards also expose HDMI outputs; prefer the analog one (3.5 mm / line out).
  find_sink() {
    sink=""
    n=0
    while [ "$n" -lt "$1" ]; do
      sink="$(as_user pactl list short sinks 2>/dev/null | awk '{print $2}' | grep -iE 'analog|hisosed_jack' | head -n 1 || true)"
      [ -n "$sink" ] && return 0
      sleep 1
      n=$((n + 1))
    done
  }
  find_sink 15
  if [ -z "$sink" ]; then
    # An LXC container has no udev, so WirePlumber never sees the cards even though
    # /dev/snd is there. Declare the first non-HDMI playback device as a static node.
    pcm=""
    for info in /proc/asound/card*/pcm*p/info; do
      [ -r "$info" ] || continue
      case "$(sed -n 's/^name: //p' "$info")" in *HDMI*|*DisplayPort*) continue ;; esac
      pcm="hw:$(sed -n 's/^card: //p' "$info"),$(sed -n 's/^device: //p' "$info")"
      break
    done
    if [ -n "$pcm" ]; then
      echo "==> Adding output $pcm to PipeWire"
      install -d -o "$user" -g "$user" "$home/.config/pipewire" "$home/.config/pipewire/pipewire.conf.d"
      cat > "$home/.config/pipewire/pipewire.conf.d/80-hisosed-jack.conf" <<EOF
context.objects = [
  { factory = adapter
    args = {
      factory.name     = api.alsa.pcm.sink
      node.name        = "hisosed_jack"
      node.description = "HiSosed jack"
      media.class      = "Audio/Sink"
      api.alsa.path    = "$pcm"
      priority.driver  = 2000
      priority.session = 2000
    }
  }
]
EOF
      chown "$user:$user" "$home/.config/pipewire/pipewire.conf.d/80-hisosed-jack.conf"
      as_user systemctl --user restart pipewire.service pipewire-pulse.service wireplumber.service
      # MPD keeps a dead connection to the old PipeWire; restart the players too.
      i=0
      while [ "$i" -lt "$players" ]; do
        as_user systemctl --user restart "hisosed-mpd@$i.service" || true
        i=$((i + 1))
      done
      find_sink 15
    fi
  fi
  if [ -n "$sink" ]; then
    as_user pactl set-default-sink "$sink" || echo "WARNING: could not select $sink" >&2
  else
    echo "WARNING: no analog output found. Check: hisosed-check" >&2
  fi
fi

{
  echo '#!/usr/bin/env sh'
  echo "# Show what the HiSosed audio node sees and play a test sound on the default output."
  echo "user=\"$user\""
  cat <<'EOF'
uid="$(id -u "$user")"
as_user() {
  runuser -u "$user" -- env XDG_RUNTIME_DIR="/run/user/$uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$uid/bus" "$@"
}
echo "== Sound cards"
cat /proc/asound/cards 2>/dev/null || echo "none"
echo "== Playback devices"
for info in /proc/asound/card*/pcm*p/info; do
  [ -r "$info" ] || continue
  echo "  hw:$(sed -n 's/^card: //p' "$info"),$(sed -n 's/^device: //p' "$info") $(sed -n 's/^name: //p' "$info")"
done
echo "== Outputs (* = used by HiSosed)"
default="$(as_user pactl get-default-sink 2>/dev/null || true)"
sinks="$(as_user pactl list short sinks 2>/dev/null || true)"
if [ -n "$sinks" ]; then
  echo "$sinks" | awk -v d="$default" '{ print ($2 == d ? "* " : "  ") $2 }'
else
  echo "  none: PipeWire sees no output. Re-run the installer."
fi
echo "== Players"
as_user systemctl --user --no-legend list-units 'hisosed-mpd@*' 2>/dev/null
if [ -s /etc/hisosed/bt-mac ]; then
  echo "== Bluetooth speaker"
  bluetoothctl info "$(cat /etc/hisosed/bt-mac)" | grep -E 'Name|Connected'
fi
echo "== Test sound"
if as_user paplay /usr/share/sounds/alsa/Front_Center.wav; then
  echo "Played. You should have heard \"Front center\"."
else
  echo "Could not play the test sound."
fi
EOF
} > /usr/local/bin/hisosed-check
chmod 0755 /usr/local/bin/hisosed-check

address="$(hostname -I 2>/dev/null | tr ' ' '\n' | grep -E '^[0-9]+(\.[0-9]+){3}$' | head -n 1 || true)"
echo
echo "Audio node is ready: ${address:-<this machine IP>}, players on ports 6600..$((6600 + players - 1))."
echo "In Home Assistant open HiSosed -> Speakers -> Connect and enter this address."
if [ "$mode" = bluetooth ] && [ ! -s /etc/hisosed/bt-mac ]; then
  echo "Pair the speaker: hisosed-bt-pair"
fi
