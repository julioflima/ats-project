#!/usr/bin/env bash
# VM startup script (Terraform metadata_startup_script — PLAN.md section 8.4).
# Installs k3s (Traefik bundled) + KEDA + the KEDA HTTP Add-on. App manifests
# are applied afterwards from your machine / Cloud Shell:
#   gcloud compute ssh leadtech-ats-poc -- sudo cat /etc/rancher/k3s/k3s.yaml   # kubeconfig
#   kubectl apply -f infra/k8s/
set -euo pipefail

KEDA_VERSION="2.16.1"
KEDA_HTTP_ADDON_VERSION="0.10.0"

# --- k3s (single node: server + agent in one) -------------------------------
if ! command -v k3s >/dev/null 2>&1; then
  curl -sfL https://get.k3s.io | sh -
fi

export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

# Wait for the node to be Ready before installing anything on top.
until k3s kubectl wait --for=condition=Ready node --all --timeout=10s >/dev/null 2>&1; do
  sleep 5
done

# --- KEDA core + HTTP Add-on (scale-to-zero, PLAN.md section 8.2) ------------
# Applied from the official release manifests rather than Helm: no extra
# tooling on the VM, and versions are pinned right here in git.
k3s kubectl apply --server-side \
  -f "https://github.com/kedacore/keda/releases/download/v${KEDA_VERSION}/keda-${KEDA_VERSION}.yaml"

k3s kubectl apply --server-side \
  -f "https://github.com/kedacore/http-add-on/releases/download/v${KEDA_HTTP_ADDON_VERSION}/keda-add-ons-http-${KEDA_HTTP_ADDON_VERSION}.yaml"

echo "k3s + KEDA ready. Apply the app manifests with: kubectl apply -f infra/k8s/"
