# Leadtech ATS — AI-Powered CV Screener

RAG-based CV screening SaaS: upload or generate fake candidate CVs (PDF), then
chat with an LLM that answers **only** from the CVs on file, with source
citations. Built for the Leadtech Full-Stack AI Engineer technical task.

Full design rationale, cost model, and deployment story: **[PLAN.md](PLAN.md)**.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + TanStack Router + TanStack Query + shadcn/ui (grayscale theme) |
| API | FastAPI + Strawberry GraphQL (single `/graphql` endpoint, multipart uploads) |
| RAG | LangChain (PyPDFLoader, splitter, grounded LCEL chain) + Gemini 2.0 Flash |
| Vector store | Chroma (standalone server) with its default ONNX MiniLM embeddings — no torch |
| Registry | SQLite via SQLModel (candidate list) |
| Infra | Terraform + k3s on one Always-Free `e2-micro` GCP VM, KEDA scale-to-zero |

## Run locally

```bash
cp .env.example .env          # add your GOOGLE_API_KEY (free: aistudio.google.com/apikey)
docker compose up --build     # frontend :5173, backend :8000, chroma :8001
```

- App: http://localhost:5173
- GraphiQL explorer: http://localhost:8000/graphql
- Health probe: http://localhost:8000/api/health

### Pre-seed 25–30 candidates (optional — the UI's Generate button also works)

```bash
docker compose run --rm backend python /srv/scripts/generate_cvs.py --count 28
```

## Deploy to GCP (Terraform + k3s, ~$0/month — PLAN.md section 8)

```bash
cd infra/terraform
terraform init
terraform apply -var project_id=YOUR_PROJECT -var my_ip_cidr=YOUR_IP/32
# Outputs include app_hostname_sslip — a ready-made zero-cost hostname like
# ats.34.42.1.2.sslip.io (or use your own domain: one A record -> the VM IP).

# Build & push images to Artifact Registry (output shows the repo URL), then:
gcloud compute ssh leadtech-ats-poc --command 'sudo cat /etc/rancher/k3s/k3s.yaml' > kubeconfig
# (edit server: IP in kubeconfig to the VM's external IP)

# Set the hostname in infra/k8s/ingress.yaml (host) + config.yaml
# (ALLOWED_ORIGINS), and your email in traefik-tls.yaml (Let's Encrypt), then:
KUBECONFIG=./kubeconfig kubectl apply -f ../k8s/
```

The VM startup script installs k3s + KEDA automatically; frontend/backend scale
to zero when idle and wake on the first request. PDFs + SQLite are snapshotted
to Cloud Storage twice a day and auto-restored onto a fresh volume. Serving:
Traefik terminates HTTPS via Let's Encrypt (reliable with your own domain,
best-effort on sslip.io — plain HTTP always works as fallback), and the
backend's CORS is locked to the app hostname (PLAN.md sections 8.2b / 8.5a).

## Repo map

```
backend/    FastAPI + GraphQL + RAG pipeline
frontend/   React shell (candidate list, upload dialog, generate sheet, chat)
scripts/    batch CV pre-seed, k3s install (VM startup), manual backup restore
infra/      Terraform (VPC, VM, IAM, GCS, Artifact Registry) + k8s manifests
```
