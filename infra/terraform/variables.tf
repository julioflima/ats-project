variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "Must be an Always-Free-eligible region for the e2-micro VM (PLAN.md 8.1)"
  type        = string
  default     = "us-central1"

  validation {
    condition     = contains(["us-west1", "us-central1", "us-east1"], var.region)
    error_message = "Always Free e2-micro is only available in us-west1, us-central1, or us-east1."
  }
}

variable "my_ip_cidr" {
  description = "Your IP in CIDR form (e.g. 203.0.113.7/32) — SSH is scoped to this, not 0.0.0.0/0"
  type        = string
}

variable "machine_type" {
  description = "e2-micro is the Always-Free shape; e2-small (~$12/mo) is the paid headroom upgrade (PLAN.md 8.3)"
  type        = string
  default     = "e2-micro"
}
