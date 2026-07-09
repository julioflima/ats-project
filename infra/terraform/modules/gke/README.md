# GKE Autopilot — the scale-up alternative (not applied by default)

This module directory is intentionally a stub: PLAN.md section 8.7 documents
the GKE Autopilot + KEDA design as the priced, comparison-only alternative to
the free `e2-micro` + k3s primary deployment. Even after applying GKE's Always
Free credit (which waives only the cluster management fee — never compute or
network), Autopilot's per-pod billing plus a GCE Load Balancer make it the
more expensive option at this scale (~$2.74 per 3-day review window vs. $0).

Build it here (google_container_cluster with enable_autopilot = true) if/when
the app outgrows a single VM — the k8s manifests in ../../k8s port over with
two changes: local-path storage becomes a real PersistentDisk-backed
StorageClass, and the Secret Manager CSI driver replaces the VM service
account metadata flow.
