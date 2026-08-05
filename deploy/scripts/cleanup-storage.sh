#!/usr/bin/env bash
set -euo pipefail

release_root=/opt/lto-uars/releases
backup_root=/opt/lto-uars/backups
active_release="$(readlink -f /opt/lto-uars/current)"

[[ "$active_release" == "$release_root"/* ]] || { echo "Refusing cleanup: active release is outside $release_root" >&2; exit 1; }

# Keep the active release plus the newest non-active release as rollback.
mapfile -t releases < <(find "$release_root" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' | sort -nr | awk '{print $2}')
rollback_kept=0
for release in "${releases[@]}"; do
  [[ "$release" == "$active_release" ]] && continue
  if (( rollback_kept == 0 )); then rollback_kept=1; continue; fi
  [[ "$release" == "$release_root"/* && "$release" != "$release_root" ]] || { echo "Unsafe release path: $release" >&2; exit 1; }
  rm -rf --one-file-system "$release"
done

# Keep the five newest database backups. Backups are never removed by age alone.
if [[ -d "$backup_root" ]]; then
  mapfile -t backups < <(find "$backup_root" -mindepth 1 -maxdepth 1 -type f -name '*.dump' -printf '%T@ %p\n' | sort -nr | awk 'NR>5 {print $2}')
  for backup in "${backups[@]}"; do
    [[ "$backup" == "$backup_root"/* ]] || { echo "Unsafe backup path: $backup" >&2; exit 1; }
    rm -f "$backup"
  done
fi

find /opt/lto-uars/.npm/_logs -type f -mtime +14 -delete 2>/dev/null || true
if [[ -d /opt/lto-uars/.npm/_cacache ]]; then
  find /opt/lto-uars/.npm/_cacache -mindepth 1 -delete
fi
journalctl --vacuum-size=150M >/dev/null
apt-get clean

echo "Storage cleanup complete. Active: $active_release; rollback releases kept: $rollback_kept"
