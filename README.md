# Leadtech ATS — AI-Powered CV Screener

Prototype for the Leadtech Full-Stack AI Engineer task: generate/upload fake CV
PDFs, index them with a RAG pipeline, and chat with an LLM about the candidates
with source citations.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React, Vite, TanStack Router, TanStack Query, Tailwind |
| Backend | FastAPI, Strawberry GraphQL |
| AI/RAG | LangChain, Gemini, Chroma |
| Storage | SQLite + local PDF files |
| Local run | Docker Compose |
| Optional deploy | Terraform + k3s on one GCP VM |

## Run locally

1. Create `.env`:

```bash
cp .env.example .env
```

2. Add your Gemini key from <https://aistudio.google.com/apikey>:

```bash
GOOGLE_API_KEY=your_key_here
```

3. Start everything:

```bash
docker compose up
```

Open:

- App: <http://localhost:5173>
- GraphQL: <http://localhost:8000/graphql>
- Health: <http://localhost:8000/api/health>

The frontend runs with Vite hot reload inside Docker, so UI changes do not need a
Docker rebuild.

## Add demo candidates

Use the **Generate candidate** button in the UI, or pre-seed a batch:

```bash
docker compose run --rm backend python /srv/scripts/generate_cvs.py --count 28
```

Local generated data lives in `data/`.

## Stop or reset

```bash
docker compose down
```

Reset all local data:

```bash
docker compose down -v
rm -rf data/
```

## Optional GCP deploy

You need `gcloud`, `terraform`, `kubectl`, Docker, and a GCP project with billing
enabled.

1. Enable APIs:

```bash
gcloud services enable \
  compute.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  storage.googleapis.com
```

2. Create infrastructure:

```bash
cd infra/terraform
terraform init
terraform apply \
  -var project_id=YOUR_PROJECT_ID \
  -var my_ip_cidr="$(curl -s ifconfig.me)/32"
```

3. Add the Gemini key to Secret Manager:

```bash
printf '%s' 'YOUR_GOOGLE_API_KEY' | \
  gcloud secrets versions add leadtech-ats-llm-api-key --data-file=-
```

4. Build and push images:

```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
REPO="us-central1-docker.pkg.dev/YOUR_PROJECT_ID/leadtech-ats"

docker buildx build --platform linux/amd64 -t "$REPO/backend:latest" --push ./backend
docker buildx build --platform linux/amd64 -t "$REPO/frontend:latest" --push ./frontend
```

5. Replace placeholders in `infra/k8s/`:

- image paths in `backend-deployment.yaml` and `frontend-deployment.yaml`
- `GCS_BUCKET` in `config.yaml`
- hostname in `config.yaml` and `ingress.yaml`
- email in `traefik-tls.yaml`

6. Get kubeconfig and open an SSH tunnel:

```bash
gcloud compute ssh leadtech-ats-poc \
  --zone us-central1-a \
  --command 'sudo cat /etc/rancher/k3s/k3s.yaml' > kubeconfig

gcloud compute ssh leadtech-ats-poc \
  --zone us-central1-a \
  -- -L 6443:127.0.0.1:6443
```

Keep the tunnel running in that terminal.

7. Apply the app:

```bash
KUBECONFIG=./kubeconfig kubectl create secret generic llm-api-key \
  --from-literal=GOOGLE_API_KEY="$(gcloud secrets versions access latest \
    --secret=leadtech-ats-llm-api-key)" \
  --dry-run=client -o yaml | KUBECONFIG=./kubeconfig kubectl apply -f -

KUBECONFIG=./kubeconfig kubectl apply -f ../k8s/
KUBECONFIG=./kubeconfig kubectl get pods
```

Open the Terraform output `app_hostname_sslip`, for example:

```text
http://ats.34.42.1.2.sslip.io
```

## Repo map

```text
backend/          FastAPI + GraphQL + RAG
frontend/         React/Vite UI
scripts/          CV generation and k3s helper scripts
infra/terraform/  GCP infrastructure
infra/k8s/        Kubernetes manifests
PLAN.md           Full architecture and cost rationale
```

## Troubleshooting

```bash
docker compose ps
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f chroma
```
