output "network_id" {
  value = google_compute_network.vpc.id
}

output "subnetwork_id" {
  value = google_compute_subnetwork.subnet.id
}
