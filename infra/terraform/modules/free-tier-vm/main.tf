# The Always-Free e2-micro (PLAN.md section 8.1/8.2): the whole cluster —
# k3s, Traefik, KEDA, and all app pods — runs on this one VM.
resource "google_compute_instance" "vm" {
  name         = var.name
  machine_type = var.machine_type
  zone         = var.zone
  tags         = var.tags

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = 30            # GB — matches the Always Free 30 GB-month allotment
      type  = "pd-standard" # Always Free covers pd-standard, not pd-ssd
    }
  }

  network_interface {
    subnetwork = var.subnetwork_id
    access_config {} # ephemeral external IP — verify current billing (PLAN.md 8.1/8.6)
  }

  service_account {
    email  = var.service_account_email
    scopes = ["cloud-platform"] # broad transport scope; real access is IAM-limited in root main.tf
  }

  metadata_startup_script = var.startup_script
}
