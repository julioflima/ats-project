terraform {
  required_version = ">= 1.7"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }

  # Remote state on GCS (create the bucket once, out-of-band — PLAN.md 8.4):
  #   gcloud storage buckets create gs://YOUR_PROJECT-tfstate --location=us-central1
  # Then uncomment:
  # backend "gcs" {
  #   bucket = "YOUR_PROJECT-tfstate"
  #   prefix = "leadtech-ats"
  # }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
