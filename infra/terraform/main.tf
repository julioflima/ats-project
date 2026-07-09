# Root wiring — modules split by concern (PLAN.md section 8.4). The gke module
# directory is the documented scale-up alternative (section 8.7) and is
# deliberately NOT referenced here.

module "networking" {
  source     = "./modules/networking"
  name       = "leadtech-ats"
  region     = var.region
  my_ip_cidr = var.my_ip_cidr
}

module "artifact_registry" {
  source     = "./modules/artifact-registry"
  project_id = var.project_id
  region     = var.region
  repo_name  = "leadtech-ats"
}

# --- Identity: one service account shared by everything on the VM ------------
# (Plain Compute Engine has no per-pod Workload Identity — PLAN.md 8.5a.)
resource "google_service_account" "vm_sa" {
  account_id   = "leadtech-ats-vm"
  display_name = "Leadtech ATS free-tier VM"
}

# --- Secret Manager: the LLM API key, never in images/state/YAML -------------
resource "google_secret_manager_secret" "llm_api_key" {
  secret_id = "leadtech-ats-llm-api-key"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_iam_member" "vm_can_read_llm_key" {
  secret_id = google_secret_manager_secret.llm_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.vm_sa.email}"
}

# --- Cloud Storage: per-write PDF copies + twice-daily snapshots (8.5a) ------
resource "google_storage_bucket" "cv_source" {
  name                        = "${var.project_id}-leadtech-ats-cvs"
  location                    = "US"
  force_destroy               = true
  uniform_bucket_level_access = true

  # Auto-prune timestamped snapshot history; latest.tar.gz is re-uploaded
  # every run so its age resets and it never hits this rule (PLAN.md 8.5a).
  lifecycle_rule {
    condition {
      age = 7
    }
    action {
      type = "Delete"
    }
  }
}

resource "google_storage_bucket_iam_member" "vm_can_write_backups" {
  bucket = google_storage_bucket.cv_source.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.vm_sa.email}"
}

# VM pulls backend/frontend images from Artifact Registry.
resource "google_artifact_registry_repository_iam_member" "vm_can_pull" {
  repository = module.artifact_registry.repository_id
  location   = var.region
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${google_service_account.vm_sa.email}"
}

# --- The VM: k3s + the whole app (PLAN.md section 8.2) -----------------------
module "vm" {
  source = "./modules/free-tier-vm"

  name                  = "leadtech-ats-poc"
  machine_type          = var.machine_type
  zone                  = "${var.region}-a"
  subnetwork_id         = module.networking.subnetwork_id
  tags                  = ["leadtech-ats-web", "leadtech-ats-ssh"]
  service_account_email = google_service_account.vm_sa.email
  startup_script        = file("${path.module}/../../scripts/install-k3s.sh")
}
