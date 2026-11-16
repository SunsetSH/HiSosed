#!/usr/bin/env sh
# HiSosed audio node, one command on the Proxmox VE host (see ADR-0004).
#
#   jack:      a privileged Debian LXC "hisosed-audio" gets the host sound cards
#              (/dev/snd: onboard 3.5 mm or a USB sound card plugged into the server).
#   bluetooth: a small Debian VM "hisosed-bt" gets the host Bluetooth adapter over
#              USB passthrough (Bluetooth sockets do not work inside a container).
#
# Both run audio-node.sh inside and print the address to enter in
# HiSosed -> Speakers -> Connect. Run as root in the Proxmox shell:
#
#   sh host-setup.sh --mode jack|bluetooth [--players 1-4] [--id N] [--storage NAME]
#                    [--bridge vmbr0] [--usb VID:PID] [--pair] [--check]
#
# Re-running reuses the existing container/VM and only reinstalls the node.
# --check prints what the node sees and plays a test sound; nothing is changed.
set -eu

mode=""
players=2
vmid=""
storage=""
bridge="vmbr0"
usb=""
pair=0
check=0
base="${HISOSED_BASE_URL:-https://raw.githubusercontent.com/SunsetSH/HiSosed/main}"
ct_name="hisosed-audio"
vm_name="hisosed-bt"
image_url="https://cloud.debian.org/images/cloud/bookworm/latest/debian-12-generic-amd64.qcow2"
cache="/var/lib/vz/template/hisosed"

usage() {
  echo "Usage: $0 --mode jack|bluetooth [--players 1-4] [--id N] [--storage NAME] [--bridge vmbr0] [--usb VID:PID] [--pair] [--check]" >&2
  exit 2
}

while [ $# -gt 0 ]; do
  case "$1" in
    --mode) mode="${2:-}"; shift 2 ;;
    --players) players="${2:-}"; shift 2 ;;
    --id) vmid="${2:-}"; shift 2 ;;
    --storage) storage="${2:-}"; shift 2 ;;
    --bridge) bridge="${2:-}"; shift 2 ;;
    --usb) usb="${2:-}"; shift 2 ;;
    --pair) pair=1; shift ;;
    --check) check=1; shift ;;
    -h|--help) usage ;;
    *) usage ;;
  esac
done

case "$mode" in jack|bluetooth) ;; *) usage ;; esac
case "$players" in 1|2|3|4) ;; *) echo "--players must be 1..4" >&2; exit 2 ;; esac
[ "$(id -u)" -eq 0 ] || { echo "Run as root in the Proxmox shell." >&2; exit 1; }
command -v pct >/dev/null && command -v qm >/dev/null || { echo "This is not a Proxmox VE host: run it in Proxmox -> node -> Shell." >&2; exit 1; }

say() { printf '\n==> %s\n' "$*"; }
die() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

# First active storage that accepts the given content type.
pick_storage() {
  pvesm status --content "$1" 2>/dev/null | awk 'NR > 1 && $3 == "active" { print $1; exit }'
}

fetch() {
  wget -q -O "$2" "$1" || curl -fsSL -o "$2" "$1"
}

node_script=""
trap 'rm -f "$node_script"' EXIT
download_node() {
  node_script="$(mktemp)"
  say "Downloading audio-node.sh"
  fetch "$base/scripts/proxmox/audio-node.sh" "$node_script" || die "cannot download $base/scripts/proxmox/audio-node.sh"
}

find_ct() {
  for conf in /etc/pve/lxc/*.conf; do
    [ -e "$conf" ] || continue
    if grep -q "^hostname: $ct_name\$" "$conf"; then basename "$conf" .conf; return 0; fi
  done
  return 0
}

find_vm() {
  qm list | awk -v name="$vm_name" '$2 == name { print $1; exit }'
}

banner() {
  echo
  echo "=================================================================="
  echo " Готово. Адрес аудиоузла: $1"
  echo " Home Assistant -> HiSosed -> Колонки -> «Подключить»: введите его."
  echo
  echo " Done. Audio node address: $1"
  echo " Home Assistant -> HiSosed -> Speakers -> Connect: enter it there."
  echo "=================================================================="
}

# ----------------------------------------------------------------- jack (LXC)

setup_jack() {
  ls /dev/snd/pcmC*D*p >/dev/null 2>&1 || die "the host has no playback device in /dev/snd. Plug in the speaker cable or a USB sound card; if the sound card is passed through to a VM, remove that passthrough."

  [ -n "$vmid" ] || vmid="$(find_ct)"
  download_node

  if [ -n "$vmid" ] && [ -e "/etc/pve/lxc/$vmid.conf" ]; then
    if grep -q '^unprivileged: 1' "/etc/pve/lxc/$vmid.conf"; then
      die "container $vmid is unprivileged and cannot open the sound card; delete it or pass --id with a free number"
    fi
    say "Reusing container $vmid"
  else
    [ -n "$vmid" ] || vmid="$(pvesh get /cluster/nextid)"
    [ -n "$storage" ] || storage="$(pick_storage rootdir)"
    [ -n "$storage" ] || die "no storage for containers; pass --storage NAME"
    tstore="$(pick_storage vztmpl)"
    [ -n "$tstore" ] || die "no storage for container templates"
    say "Looking for the Debian 12 template"
    pveam update >/dev/null 2>&1 || true
    template="$(pveam available --section system | awk '{ print $2 }' | grep -E '^debian-12-standard_.*_amd64\.tar\.(zst|gz|xz)$' | sort -V | tail -n 1)"
    [ -n "$template" ] || die "Debian 12 template not found (no Internet on the host?)"
    pveam list "$tstore" | grep -q "$template" || pveam download "$tstore" "$template"
    say "Creating privileged container $vmid ($ct_name)"
    # Privileged: in an unprivileged container /dev/snd shows up owned by nobody and cannot be opened.
    pct create "$vmid" "$tstore:vztmpl/$template" \
      --hostname "$ct_name" --unprivileged 0 --features nesting=1 \
      --cores 1 --memory 512 --swap 256 --rootfs "$storage:4" \
      --net0 "name=eth0,bridge=$bridge,ip=dhcp" --onboot 1 \
      --description "HiSosed audio node (3.5 mm / USB sound card)"
  fi

  conf="/etc/pve/lxc/$vmid.conf"
  changed=0
  if ! grep -q '^lxc.cgroup2.devices.allow: c 116:\* rwm' "$conf"; then
    echo 'lxc.cgroup2.devices.allow: c 116:* rwm' >> "$conf"; changed=1
  fi
  if ! grep -q '^lxc.mount.entry: /dev/snd ' "$conf"; then
    echo 'lxc.mount.entry: /dev/snd dev/snd none bind,optional,create=dir' >> "$conf"; changed=1
  fi

  if pct status "$vmid" | grep -q running; then
    if [ "$changed" -eq 1 ]; then pct stop "$vmid"; pct start "$vmid"; fi
  else
    pct start "$vmid"
  fi

  say "Waiting for the network"
  ip=""
  n=0
  while [ "$n" -lt 60 ]; do
    ip="$(pct exec "$vmid" -- hostname -I 2>/dev/null | tr ' ' '\n' | grep -E '^[0-9]+(\.[0-9]+){3}$' | head -n 1 || true)"
    [ -n "$ip" ] && break
    sleep 2
    n=$((n + 1))
  done
  [ -n "$ip" ] || die "container $vmid got no IP address (is DHCP available on $bridge?)"

  say "Installing the audio node inside container $vmid (2-5 minutes)"
  pct push "$vmid" "$node_script" /root/audio-node.sh --perms 0755
  pct exec "$vmid" -- sh /root/audio-node.sh --mode jack --players "$players"
  banner "$ip"
}

# ------------------------------------------------------------- bluetooth (VM)

# Run a command in the VM through the guest agent and print its stdout.
gexec() {
  timeout_s="$1"
  shift
  qm guest exec "$vmid" --timeout "$timeout_s" -- "$@" | python3 -c '
import json, sys
result = json.load(sys.stdin)
sys.stdout.write(result.get("out-data", ""))
sys.stderr.write(result.get("err-data", ""))
sys.exit(result.get("exitcode", 1) if result.get("exited") else 1)
'
}

find_bt_adapter() {
  for iface in /sys/bus/usb/devices/*:*; do
    [ -r "$iface/bInterfaceClass" ] || continue
    [ "$(cat "$iface/bInterfaceClass")" = e0 ] || continue
    [ "$(cat "$iface/bInterfaceSubClass")" = 01 ] || continue
    [ "$(cat "$iface/bInterfaceProtocol")" = 01 ] || continue
    dev="${iface%:*}"
    echo "$(cat "$dev/idVendor"):$(cat "$dev/idProduct")"
    return 0
  done
  return 1
}

vm_ip() {
  qm guest cmd "$vmid" network-get-interfaces 2>/dev/null | python3 -c '
import json, sys
for iface in json.load(sys.stdin):
    if iface.get("name") == "lo":
        continue
    for addr in iface.get("ip-addresses", []):
        if addr.get("ip-address-type") == "ipv4":
            print(addr["ip-address"])
            sys.exit(0)
' || true
}

setup_bluetooth() {
  command -v python3 >/dev/null || die "python3 is missing on the host"
  [ -n "$vmid" ] || vmid="$(find_vm)"
  download_node

  if [ -n "$vmid" ] && qm config "$vmid" >/dev/null 2>&1; then
    say "Reusing VM $vmid"
    fresh=0
  else
    fresh=1
    if [ -z "$usb" ]; then
      usb="$(find_bt_adapter || true)"
      [ -n "$usb" ] || die "no Bluetooth adapter found on the host USB bus. Plug in a USB Bluetooth dongle or pass --usb VID:PID."
    fi
    if systemctl is-active --quiet bluetooth 2>/dev/null; then
      die "the host itself runs bluetoothd and uses the adapter; stop it first: systemctl disable --now bluetooth"
    fi
    [ -n "$vmid" ] || vmid="$(pvesh get /cluster/nextid)"
    [ -n "$storage" ] || storage="$(pick_storage images)"
    [ -n "$storage" ] || die "no storage for VM disks; pass --storage NAME"

    snippets="$(pick_storage snippets)"
    if [ -z "$snippets" ]; then
      # A separate directory storage so the existing storage config stays untouched.
      snippets="hisosed-snippets"
      say "Adding storage '$snippets' for the cloud-init file"
      mkdir -p /var/lib/vz/hisosed-snippets
      pvesm add dir "$snippets" --path /var/lib/vz/hisosed-snippets --content snippets
    fi

    say "Downloading the Debian 12 cloud image"
    mkdir -p "$cache"
    image="$cache/debian-12-generic-amd64.qcow2"
    [ -s "$image" ] || fetch "$image_url" "$image" || die "cannot download $image_url"

    vendor="hisosed-bt-$vmid.yaml"
    vendor_path="$(pvesm path "$snippets:snippets/$vendor")"
    mkdir -p "$(dirname "$vendor_path")"
    cat > "$vendor_path" <<EOF
#cloud-config
package_update: true
packages: [qemu-guest-agent]
write_files:
  - path: /root/audio-node.sh
    permissions: '0755'
    encoding: b64
    content: $(base64 -w0 "$node_script")
runcmd:
  - [systemctl, enable, --now, qemu-guest-agent]
  - [sh, /root/audio-node.sh, --mode, bluetooth, --players, "$players"]
EOF

    say "Creating VM $vmid ($vm_name) with Bluetooth adapter $usb"
    qm create "$vmid" --name "$vm_name" --ostype l26 --cores 1 --memory 512 \
      --net0 "virtio,bridge=$bridge" --scsihw virtio-scsi-single --agent enabled=1 \
      --serial0 socket --vga serial0 --onboot 1 \
      --description "HiSosed audio node (Bluetooth)"
    qm set "$vmid" --scsi0 "$storage:0,import-from=$image" >/dev/null
    qm resize "$vmid" scsi0 6G >/dev/null
    qm set "$vmid" --boot order=scsi0 --ide2 "$storage:cloudinit" --ipconfig0 ip=dhcp \
      --cicustom "vendor=$snippets:snippets/$vendor" --usb0 "host=$usb,usb3=1" >/dev/null
  fi

  qm status "$vmid" | grep -q running || qm start "$vmid"

  say "Waiting for the VM to boot"
  n=0
  until qm agent "$vmid" ping >/dev/null 2>&1; do
    n=$((n + 1))
    [ "$n" -lt 120 ] || die "the guest agent did not answer in 10 minutes; open the VM console to see what happened"
    sleep 5
  done

  if [ "$fresh" -eq 1 ]; then
    say "Installing the audio node inside VM $vmid (3-10 minutes)"
    n=0
    while :; do
      status="$(gexec 30 cloud-init status 2>/dev/null || true)"
      case "$status" in
        *done*) break ;;
        *error*) die "installation failed; details inside the VM: cloud-init status --long" ;;
      esac
      n=$((n + 1))
      [ "$n" -lt 120 ] || die "installation is taking more than 20 minutes"
      sleep 10
    done
  else
    say "Reinstalling the audio node inside VM $vmid"
    qm guest exec "$vmid" --timeout 30 --pass-stdin 1 -- sh -c 'cat > /root/audio-node.sh' < "$node_script" >/dev/null
    gexec 1200 sh /root/audio-node.sh --mode bluetooth --players "$players"
  fi

  ip="$(vm_ip)"
  [ -n "$ip" ] || die "VM $vmid got no IP address (is DHCP available on $bridge?)"

  paired="$(gexec 10 cat /etc/hisosed/bt-mac 2>/dev/null || true)"
  if [ -z "$paired" ] || [ "$pair" -eq 1 ]; then
    pair_speaker
  else
    say "Speaker $paired is already paired (re-run with --pair to pair another one)"
  fi
  banner "$ip"
}

pair_speaker() {
  # stdin is the piped script, so answers come from the terminal; opened once, an EOF ends the dialog.
  if ! { exec 3< /dev/tty; } 2>/dev/null; then
    echo "Pair later: run this script again with --pair in the Proxmox shell."
    return 0
  fi
  attempt=0
  while [ "$attempt" -lt 5 ]; do
    attempt=$((attempt + 1))
    say "Pairing the speaker (attempt $attempt of 5)"
    printf 'Put the speaker into pairing mode and press Enter... '
    read -r _ <&3 || break
    devices="$(gexec 60 hisosed-bt-scan 2>/dev/null || true)"
    if [ -z "$devices" ]; then
      echo "Nothing found."
      continue
    fi
    echo "$devices" | awk '{ printf "  %d) %s\n", NR, $0 }'
    printf 'Number of your speaker (empty to scan again): '
    read -r choice <&3 || break
    case "$choice" in ''|*[!0-9]*) continue ;; esac
    mac="$(echo "$devices" | sed -n "${choice}p" | cut -d' ' -f1)"
    [ -n "$mac" ] || continue
    if gexec 60 hisosed-bt-pair "$mac"; then
      exec 3<&-
      return 0
    fi
    echo "Pairing failed."
  done
  exec 3<&-
  echo "Not paired. Run this script again with --pair when the speaker is ready."
}

run_check() {
  if [ "$mode" = jack ]; then
    [ -n "$vmid" ] || vmid="$(find_ct)"
    [ -n "$vmid" ] || die "no $ct_name container yet; run without --check first"
    pct exec "$vmid" -- hisosed-check
  else
    [ -n "$vmid" ] || vmid="$(find_vm)"
    [ -n "$vmid" ] || die "no $vm_name VM yet; run without --check first"
    gexec 60 hisosed-check
  fi
}

# Everything runs from functions called on these last lines: with `wget | sh` the shell
# has read the whole script before pct/qm get a chance to consume the rest of stdin.
if [ "$check" -eq 1 ]; then run_check
elif [ "$mode" = jack ]; then setup_jack
else setup_bluetooth
fi
