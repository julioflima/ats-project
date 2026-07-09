# Regional container registry — same region as the VM for fast, free
# same-region pulls. Its Always Free allotment is 0.5 GB, which is why the
# backend image is torch-free (PLAN.md sections 3.2 / 8.1).
resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = var.repo_name
  format        = "DOCKER"
}
