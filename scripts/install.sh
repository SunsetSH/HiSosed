#!/usr/bin/env sh
set -eu

repository="${1:?Usage: install.sh <github-owner/repository> [tag-or-branch] [ha-config-dir]}"
release_ref="${2:-main}"
config_dir="${3:-/config}"
target_dir="$config_dir/custom_components/hi_sosed"
archive_url="https://github.com/$repository/archive/refs/heads/$release_ref.tar.gz"

case "$release_ref" in
  v*|[0-9]*) archive_url="https://github.com/$repository/archive/refs/tags/$release_ref.tar.gz" ;;
esac

work_dir="$(mktemp -d)"
cleanup() { rm -rf "$work_dir"; }
trap cleanup EXIT INT TERM

command -v tar >/dev/null || { echo "tar is required" >&2; exit 1; }

if command -v curl >/dev/null; then
  curl --fail --location --silent --show-error "$archive_url" --output "$work_dir/release.tar.gz"
elif command -v wget >/dev/null; then
  wget -qO "$work_dir/release.tar.gz" "$archive_url"
else
  echo "curl or wget is required" >&2
  exit 1
fi
mkdir "$work_dir/unpacked"
tar -xzf "$work_dir/release.tar.gz" -C "$work_dir/unpacked"
component_dir="$(find "$work_dir/unpacked" -type d -path '*/custom_components/hi_sosed' -print -quit)"
[ -n "$component_dir" ] || { echo "HiSosed component is missing from archive" >&2; exit 1; }

mkdir -p "$config_dir/custom_components"
staging_parent="$(mktemp -d "$config_dir/custom_components/.hi_sosed.staging.XXXXXX")"
staging_dir="$staging_parent/hi_sosed"
cp -R "$component_dir" "$staging_dir"
if [ -e "$target_dir" ]; then
  backup_dir="$target_dir.backup-$(date +%Y%m%d%H%M%S)"
  mv "$target_dir" "$backup_dir"
  echo "Previous installation moved to $backup_dir"
fi
mv "$staging_dir" "$target_dir"
rmdir "$staging_parent"
echo "Installed HiSosed into $target_dir. Restart Home Assistant."
