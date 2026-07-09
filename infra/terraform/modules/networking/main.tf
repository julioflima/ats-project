# Custom-mode VPC (PLAN.md section 8.2a): no implicit subnets, no implicit
# firewall rules — nothing is reachable until explicitly allowed below.
resource "google_compute_network" "vpc" {
  name                    = "${var.name}-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = "${var.name}-subnet"
  network       = google_compute_network.vpc.id
  ip_cidr_range = "10.10.0.0/24"
  region        = var.region

  # VM reaches Secret Manager / Artifact Registry / GCS over Google's internal
  # path instead of its public interface.
  private_ip_google_access = true
}

# Tag-scoped rules: apply only to instances that carry the tag, so any future
# instance in this VPC starts with zero access unless explicitly tagged.
resource "google_compute_firewall" "allow_web" {
  name        = "${var.name}-allow-web"
  network     = google_compute_network.vpc.id
  target_tags = ["${var.name}-web"]

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = ["0.0.0.0/0"]
}

resource "google_compute_firewall" "allow_ssh" {
  name        = "${var.name}-allow-ssh"
  network     = google_compute_network.vpc.id
  target_tags = ["${var.name}-ssh"]

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = [var.my_ip_cidr] # deliberately not 0.0.0.0/0
}
