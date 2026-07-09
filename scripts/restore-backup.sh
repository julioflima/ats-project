#!/usr/bin/env bash
# Manual restore from a GCS snapshot (PLAN.md section 8.5a).
#
# The chroma StatefulSet's initContainer already auto-restores latest.tar.gz
# onto a *fresh, empty* volume — this script is the manual override, e.g. to
# force-restore an older timestamped snapshot over existing data.
#
# Usage (on the VM, or anywhere with kubectl access + gsutil):
#   ./restore-backup.sh <bucket> [snapshot-object]
#   ./restore-backup.sh my-project-leadtech-ats-cvs                       # latest
#   ./restore-backup.sh my-project-leadtech-ats-cvs backups/20260709T060000.tar.gz
set -euo pipefail

BUCKET="${1:?usage: restore-backup.sh <bucket> [snapshot-object]}"
OBJECT="${2:-backups/latest.tar.gz}"
DATA_DIR="${DATA_DIR:-/var/lib/rancher/k3s/storage}"

echo ">> Scaling the app down so nothing writes during the restore"
kubectl scale statefulset/chroma --replicas=0
kubectl wait --for=delete pod/chroma-0 --timeout=120s || true

PVC_DIR=$(find "${DATA_DIR}" -maxdepth 1 -type d -name '*data-chroma-0*' | head -n1)
if [ -z "${PVC_DIR}" ]; then
  echo "!! Could not find chroma's local-path volume under ${DATA_DIR}" >&2
  exit 1
fi

echo ">> Restoring gs://${BUCKET}/${OBJECT} into ${PVC_DIR}"
TMP=$(mktemp)
gsutil cp "gs://${BUCKET}/${OBJECT}" "${TMP}"
tar -xzf "${TMP}" -C "${PVC_DIR}"
rm -f "${TMP}"

echo ">> Bringing chroma back up"
kubectl scale statefulset/chroma --replicas=1

echo ">> Done. Chroma's vector index is rebuilt from PDFs on next ingest if it"
echo "   was not part of the snapshot (it is derived data — PLAN.md 8.5a)."
