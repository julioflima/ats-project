output "vm_external_ip" {
  description = "Public IP — the app URL is http://<this-ip>/ once manifests are applied"
  value       = module.vm.external_ip
}

# Zero-cost hostname (PLAN.md 8.2b): sslip.io resolves any <name>.<ip>.sslip.io
# to <ip> — no registrar, no DNS zone, no charge. Paste this into
# infra/k8s/ingress.yaml (host) and config.yaml (ALLOWED_ORIGINS).
output "app_hostname_sslip" {
  description = "Ready-made hostname via sslip.io wildcard DNS"
  value       = "ats.${module.vm.external_ip}.sslip.io"
}

output "dns_instructions" {
  description = "Using your own domain instead (the reliable path for HTTPS)"
  value       = "Create an A record: ats.yourdomain.com -> ${module.vm.external_ip}, then set that host in infra/k8s/ingress.yaml + config.yaml and your email in traefik-tls.yaml"
}

output "artifact_registry_repo" {
  description = "Push backend/frontend images here"
  value       = module.artifact_registry.repository_url
}

output "cv_bucket" {
  description = "PDF copies + twice-daily snapshots land here (PLAN.md 8.5a)"
  value       = google_storage_bucket.cv_source.name
}

output "llm_api_key_secret" {
  description = "Add your Gemini key: gcloud secrets versions add <this> --data-file=-"
  value       = google_secret_manager_secret.llm_api_key.secret_id
}
