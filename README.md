# CloudNative Platform

A full-stack, cloud-native microservices platform built as a production-style reference implementation for Platform Engineering. It runs an e-commerce style demo (users, products, orders, payments) on top of Kubernetes (Kind), secured with RBAC + NetworkPolicies, routed through an Istio service mesh, deployed via GitOps (Argo CD), built and scanned by GitHub Actions (CI/CD), and emulates AWS locally with LocalStack + Terraform.

Everything runs **completely on your local machine** — no cloud account required.

---

## Table of Contents

- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Quick Start — Docker Compose (Fastest)](#quick-start--docker-compose-fastest)
- [Full Platform Workflow (Kind + K8s + Istio + ArgoCD)](#full-platform-workflow-kind--k8s--istio--argocd)
  - [Step 1 — AWS CLI localstack profile](#step-1--aws-cli-localstack-profile)
  - [Step 2 — LocalStack (local AWS)](#step-2--localstack-local-aws)
  - [Step 3 — Terraform (IaC)](#step-3--terraform-iac)
  - [Step 4 — Local container registry](#step-4--local-container-registry)
  - [Step 5 — Kind cluster](#step-5--kind-cluster)
  - [Step 6 — Build & deploy the demo app](#step-6--build--deploy-the-demo-app)
  - [Step 7 — Deploy microservices stack](#step-7--deploy-microservices-stack)
  - [Step 8 — Istio service mesh](#step-8--istio-service-mesh)
  - [Step 9 — Argo CD GitOps](#step-9--argo-cd-gitops)
- [API Endpoints](#api-endpoints)
- [Deployment Strategies](#deployment-strategies)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring & Observability](#monitoring--observability)
- [Makefile Command Reference](#makefile-command-reference)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)

---

## Architecture

The platform is layered like a real production system:

```
 Clients (Browser / Mobile / API / CLI)
                  │
                  ▼
 Istio Ingress Gateway (port 80, istio-system) ──► VirtualService (traffic splitting)
                  │
                  ▼
 Frontend (React 18 + Vite 5, served by Nginx on :80)
                  │   /api/*  →  gateway:8000
                  ▼
 API Gateway (Express.js :8000, http-proxy-middleware)
   /api/users ─► User Service (:3001)
   /api/products ─► Product Service (:3002)
   /api/orders ─► Order Service (:3003)  ── orchestrator
   /api/payments ─► Payment Service (:3004)
                  │
                  ▼
 PostgreSQL 16 (StatefulSet, headless service, PVC)
```

**Request / data flow** (see `APP-STACK.txt` for the full diagram):

```
Browser → Istio Gateway → VirtualService → Frontend (Nginx)
                                          → API Gateway
                                            → User / Product / Order / Payment services
                                            → Order service orchestrates:
                                                1. GET user    2. GET product
                                                3. Check stock 4. Create order
                                                5. Reserve stock (PUT product)
                                                6. POST payment 7. Rollback stock on failure
```

**Deployment layers at a glance:**

| Layer | Technology | Purpose |
|---|---|---|
| Client | React 18, Vite 5 | Frontend UI |
| Ingress | Istio Gateway + VirtualService | Traffic routing / mesh |
| Reverse Proxy | Nginx 1.27 | Static files + `/api/*` proxy |
| API Gateway | Express.js 4.18 | Request routing |
| Microservices | Express.js 4.18, Axios | Business logic (CRUD + orchestration) |
| Service Mesh | Istio (Gateway, VS, DR) | Canary / Blue-Green traffic management |
| Security | RBAC, NetworkPolicy, Secrets | Zero-trust access control |
| Orchestration | Kubernetes 1.31 (Kind) | Container orchestration |
| Infrastructure | Terraform, LocalStack | AWS resource management (local) |
| Container Runtime | Docker, containerd | Image build / run |
| CI/CD | GitHub Actions, Trivy | Build, scan, deploy |
| GitOps | Argo CD, Kustomize | Continuous delivery |
| Observability | Prometheus, Jaeger, OpenTelemetry | Metrics / tracing / logs |
| Database | PostgreSQL 16 | Persistence (user service) |

---

## Technology Stack

- **Frontend:** React 18, Vite 5, Nginx
- **Backend:** Node.js 20, Express.js 4.18, Axios
- **Database:** PostgreSQL 16 (StatefulSet + PVC)
- **Orchestration:** Kubernetes 1.31, Kind (multi-node)
- **Service Mesh:** Istio (Gateway, VirtualService, DestinationRule, Telemetry)
- **Security:** ServiceAccount, RBAC Role/RoleBinding, Secrets, NetworkPolicies (default-deny + allow rules)
- **GitOps:** Argo CD (App-of-Apps pattern), Kustomize (base + dev/stage/prod overlays)
- **CI/CD:** GitHub Actions (matrix build, Trivy scan, GHCR push, manifest auto-update)
- **Infra as Code:** Terraform + LocalStack (S3, SQS, DynamoDB, Secrets Manager)
- **Registry:** GHCR (GitHub Container Registry) + local registry on `:5001`
- **Deployments:** Kubernetes rolling updates, Istio canary (90/10) & blue-green (0/100)

---

## Repository Structure

```
cloudnative-platform/
├── apps/                          # All application source code
│   ├── frontend/                  # React + Vite + Nginx
│   ├── gateway/                   # Express API gateway (proxy)
│   ├── user-service/              # Express + PostgreSQL (CRUD)
│   ├── product-service/           # Express, in-memory store (CRUD)
│   ├── order-service/             # Express orchestrator (calls all services)
│   ├── payment-service/           # Express, simulated payments + refunds
│   └── demo-nginx/                # Simple nginx demo image for Kind smoke test
├── docker-compose.yml             # Run the whole app stack locally (no K8s)
├── kubernetes/
│   ├── base/                      # Reusable Kustomize base manifests
│   │   ├── namespace/             # microservices namespace
│   │   ├── security/              # SA, RBAC, Secrets, NetworkPolicies
│   │   ├── frontend/  gateway/  user-service/  product-service/
│   │   ├── order-service/  payment-service/
│   │   ├── postgres/              # StatefulSet + PVC + init SQL
│   │   ├── istio/                 # Gateway, VirtualService, DestinationRule, Telemetry
│   │   └── demo-nginx/            # Demo app (deploy-demo target)
│   ├── overlays/                  # Environment overlays
│   │   ├── local/                 # → base
│   │   ├── dev/  stage/  prod/    # per-env namespace, image tags, replicas
│   └── strategies/                # Deployment strategies
│       ├── canary/frontend-canary/
│       └── blue-green/frontend-blue/ frontend-green/
├── gitops/                        # Argo CD configuration
│   ├── bootstrap/root-app.yaml    # App-of-Apps entry point
│   ├── applications/workloads/    # microservices (local/dev/stage/prod), demo-nginx
│   └── projects/                  # AppProjects: platform + applications
├── infrastructure/
│   ├── kind/kind-config.yaml      # Multi-node cluster config
│   └── localstack/                # docker-compose, init scripts, validation
├── .github/workflows/ci.yml       # CI/CD pipeline
├── Makefile                       # All automation targets
├── APP-STACK.txt                  # Full architecture diagram
├── PROJECT-DOCUMENTATION.md       # Full project write-up
└── docs/                          # Module-by-module documentation
```

---

## Prerequisites

| Tool | Version / Purpose |
|---|---|
| Docker & Docker Compose | Container runtime |
| Kind | Local Kubernetes cluster (`kind create cluster`) |
| kubectl | Kubernetes client |
| Helm | (optional) Istio / Argo CD installs |
| istioctl | Istio installation & dashboards |
| Terraform | Infrastructure as Code |
| AWS CLI | Talk to LocalStack |
| Node.js 20 | Local JS development |
| jq, yq, curl, make | Utilities |

Verify your toolchain:

```bash
docker --version && docker compose version
kind --version
kubectl version --client
istioctl version 2>/dev/null || echo "istioctl not installed"
terraform version
aws --version
node --version
```

---

## Quick Start — Docker Compose (Fastest)

This runs the entire application stack (frontend + gateway + 4 microservices) without any Kubernetes.

```bash
# 1. Start the whole stack
docker compose up -d --build

# 2. Verify all containers are running
docker compose ps

# 3. Open the UI
#    http://localhost:3000

# 4. Try the API through the gateway
curl http://localhost:8000/health
curl http://localhost:8000/api/products
curl http://localhost:8000/api/users

# 5. Create an order (orchestrated across services)
curl -X POST http://localhost:8000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "productId": 2, "quantity": 1}'

# 6. Tear everything down
docker compose down
```

**Ports (Docker Compose):**

| Service | Port |
|---|---|
| Frontend (Nginx) | 3000 |
| API Gateway | 8000 |
| User Service | 3001 |
| Product Service | 3002 |
| Order Service | 3003 |
| Payment Service | 3004 |

> Note: In the Docker Compose path the user service expects a `postgres` DB; the product/order/payment services use in-memory stores.

---

## Full Platform Workflow (Kind + K8s + Istio + ArgoCD)

This is the complete, production-style workflow. It runs entirely on your machine.

### Step 1 — AWS CLI localstack profile

LocalStack init/validation scripts use an AWS CLI profile named `localstack`.

```bash
aws configure --profile localstack
#   AWS Access Key ID:     test
#   AWS Secret Access Key: test
#   Default region name:   us-east-1
#   Default output format: json

# Confirm you are talking to LocalStack (returns account 000000000000)
aws --endpoint-url=http://localhost:4566 --profile localstack sts get-caller-identity
```

### Step 2 — LocalStack (local AWS)

```bash
# Start LocalStack (S3, SQS, DynamoDB, SecretsManager, IAM, STS)
make localstack-up

# Wait for it to be ready
make localstack-health

# Create S3 bucket, SQS queue, DynamoDB table, and Secret (idempotent)
make localstack-bootstrap

# Validate all resources exist
make localstack-validate

# Optional management commands
make localstack-logs      # tail container logs
make localstack-restart   # restart
make localstack-down      # stop
```

Resources provisioned (via `infrastructure/localstack/init/`):

| AWS Service | Resource |
|---|---|
| S3 | `cloudnative-platform-artifacts` |
| SQS | `cloudnative-events` |
| DynamoDB | `platform-config` |
| Secrets Manager | `platform/database/password` |

### Step 3 — Terraform (IaC)

Terraform provisions the same AWS resources declaratively against LocalStack.

```bash
# Initialize (downloads providers) — must run before anything else
make terraform-init

# Format + validate your code
make terraform-fmt
make terraform-validate

# Preview the changes
make terraform-plan

# Apply the infrastructure
make terraform-apply

# Show outputs
make terraform-output

# Verify resources were actually created on LocalStack
make terraform-verify-s3
make terraform-verify-sqs
make terraform-verify-dynamodb
make terraform-verify-secrets

# Destroy when done
make terraform-destroy
```

> `make terraform-all` runs fmt → validate → plan in one shot.

### Step 4 — Local container registry

Kind is configured to pull from a local registry at `localhost:5001`.

```bash
# Create the registry container (first time only)
docker run -d --rm --name local-registry -p 5001:5000 registry:2

# Connect it to the Kind docker network so cluster nodes can reach it
# (run after the cluster exists — see step 5)
docker network connect kind local-registry 2>/dev/null || true

# Later, to stop/start it
make registry-stop
make registry-start
```

### Step 5 — Kind cluster

Creates a 3-node cluster (`cloudnative`) — 1 control-plane + 2 workers — with port mappings for the ingress gateway.

```bash
make cluster-create
#   kind create cluster --name cloudnative --config infrastructure/kind/kind-config.yaml

# Verify
make cluster-info
kubectl get nodes -o wide
kubectl get pods -A
```

To delete the cluster when you are done:

```bash
make cluster-delete
```

### Step 6 — Build & deploy the demo app

A small Nginx demo proves the cluster + local registry pipeline end-to-end.

```bash
# Build and push the demo image to the local registry
docker build -t localhost:5001/demo-nginx:v1 apps/demo-nginx
docker push localhost:5001/demo-nginx:v1

# Verify the registry is serving the image
curl http://localhost:5001/v2/_catalog

# Deploy the demo (Deployment × 3 + Service + Ingress + Namespace "demo")
make deploy-demo
#   kubectl apply -k kubernetes/base/demo-nginx

# Check it
kubectl get pods -n demo
kubectl get ingress -n demo

# Remove it
make remove-demo
```

### Step 7 — Deploy microservices stack

The full microservices platform is managed by Kustomize from `kubernetes/base` (namespace, security, frontend, gateway, user/product/order/payment services, PostgreSQL, Istio resources).

```bash
# Preview what will be created
kubectl kustomize kubernetes/overlays/local

# Apply the full stack
kubectl apply -k kubernetes/overlays/local

# Watch everything come up (use the -w flag to stream)
kubectl get pods -n microservices -w
kubectl get svc -n microservices
kubectl get deploy -n microservices
kubectl get statefulset -n microservices
```

Environment overlays are also provided. Each overlays onto `../../base` with its own namespace, image tags and replica counts:

| Overlay | Namespace | Replicas |
|---|---|---|
| `local` | `microservices` | 1 |
| `dev` | `microservices-dev` | 1 |
| `stage` | `microservices-stage` | 2 |
| `prod` | `microservices-prod` | 3 |

```bash
kubectl apply -k kubernetes/overlays/dev
kubectl apply -k kubernetes/overlays/stage
kubectl apply -k kubernetes/overlays/prod
```

### Step 8 — Istio service mesh

Istio routes external traffic to the frontend through an ingress gateway and splits traffic between release versions.

```bash
# Install Istio (once)
istioctl install --set profile=demo -y

# Label the namespace for automatic sidecar injection
kubectl label namespace microservices istio-injection=enabled

# The mesh resources (Gateway, VirtualServices, DestinationRules, Telemetry)
# are already included in kubernetes/base/istio and applied with the stack.
kubectl get gateway -n microservices
kubectl get virtualservice -n microservices
kubectl get destinationrule -n microservices
kubectl get pods -n istio-system

# Port-forward the ingress gateway and test traffic
kubectl port-forward -n istio-system svc/istio-ingressgateway 8080:80 &
curl -H "Host: frontend.local" http://localhost:8080/
```

**Traffic splitting is already preconfigured:**
- **Canary** (`virtualservice-canary.yaml`): `stable` 90% / `canary` 10%
- **Blue-Green** (`virtualservice-bluegreen.yaml`): `blue` 0% / `green` 100%

See [Deployment Strategies](#deployment-strategies) for how to activate each.

### Step 9 — Argo CD GitOps

Argo CD continuously syncs the cluster with Git (this repo), using an App-of-Apps pattern.

```bash
# Create the argocd namespace and install Argo CD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# (or, if installed via Helm)
helm repo add argo https://argoproj.github.io/argo-helm
helm install argocd argo/argo-cd -n argocd

# Get the admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d; echo

# Port-forward the Argo CD UI
kubectl port-forward svc/argocd-server -n argocd 8081:443
#   Open https://localhost:8081  (admin / password above)

# Point the cluster at the repository (GitOps config lives in gitops/)
kubectl apply -f gitops/projects/platform.yaml
kubectl apply -f gitops/projects/applications.yaml
kubectl apply -f gitops/applications/workloads/microservices.yaml
kubectl apply -f gitops/applications/workloads/microservices-dev.yaml
kubectl apply -f gitops/applications/workloads/microservices-stage.yaml
kubectl apply -f gitops/applications/workloads/microservices-prod.yaml
kubectl apply -f gitops/applications/workloads/demo-nginx.yaml
kubectl apply -f gitops/bootstrap/root-app.yaml

# Watch Argo CD reconcile the apps
kubectl get applications -n argocd -w
kubectl get appprojects -n argocd
```

Argo CD sync policies are set to `automated` with `prune: true` and `selfHeal: true`, so any push to `main` in the tracked paths is automatically applied to the cluster.

---

## API Endpoints

All traffic enters through the API Gateway.

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Gateway health |
| GET | `/api/users` | List users (PostgreSQL) |
| GET | `/api/users/:id` | Get one user |
| POST | `/api/users` | Create user (`{ name, email }`) |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |
| GET | `/api/products` | List products (in-memory) |
| GET | `/api/products/:id` | Get product |
| POST | `/api/products` | Create product (`{ name, price }`) |
| PUT | `/api/products/:id` | Update product (incl. `stock`) |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/api/orders` | List orders |
| POST | `/api/orders` | Create order — orchestrates user → product → stock → payment (`{ userId, productId, quantity }`) |
| GET | `/api/payments` | List payments |
| POST | `/api/payments` | Process payment (90% success simulation) |
| POST | `/api/payments/:id/refund` | Refund a completed payment |

Each microservice also exposes its own `/health` endpoint.

```bash
# Example end-to-end smoke test (gateway on :8000)
curl http://localhost:8000/api/products
curl -X POST http://localhost:8000/api/users -H "Content-Type: application/json" \
  -d '{"name":"Jaffar","email":"jaffar@example.com"}'
curl -X POST http://localhost:8000/api/orders -H "Content-Type: application/json" \
  -d '{"userId":1,"productId":2,"quantity":1}'
```

---

## Deployment Strategies

Istio enables weighted traffic shifting between versions of the frontend. The strategies live in `kubernetes/strategies/` and the mesh routing in `kubernetes/base/istio/`.

### Canary (90% stable / 10% canary)

Deploys a second frontend variant labeled `version=canary`; the VirtualService already sends 10% of traffic to it.

```bash
# Deploy the canary workload
kubectl apply -k kubernetes/strategies/canary/frontend-canary

# Verify routing
kubectl get virtualservice frontend -n microservices -o yaml
istioctl proxy-config routes deploy/frontend -n microservices

# Promote: flip weights to 100/0 in virtualservice-canary.yaml, then
kubectl apply -k kubernetes/base/istio
```

### Blue-Green (0% blue / 100% green)

```bash
# Deploy both environments
kubectl apply -k kubernetes/strategies/blue-green/frontend-blue
kubectl apply -k kubernetes/strategies/blue-green/frontend-green

# Traffic already routes 100% to green, 0% to blue
kubectl get virtualservice frontend-bluegreen -n microservices -o yaml
istioctl proxy-config routes deploy/frontend-green -n microservices

# Switch to blue: edit weights in virtualservice-bluegreen.yaml
```

> For these strategies the base `kustomization.yaml` has `frontend-blue/green/canary` commented out — uncomment the one you want for GitOps-managed strategy deployments.

---

## CI/CD Pipeline

`.github/workflows/ci.yml` runs on pushes to `main` (or `feature/module-13-github-actions`) that touch `apps/**` or the workflow itself.

```
1. Compute Variables ── single source of truth: tag = sha-<short-sha>, lowercase owner
2. Build (matrix × 6 services) ── frontend, gateway, user, product, order, payment
   ├─ Docker Buildx + metadata (ghcr.io/<owner>/<service>:sha-<sha> & latest)
   ├─ Trivy filesystem scan (HIGH, CRITICAL)
   ├─ Trivy container image scan
   └─ Push approved image to GHCR
3. Update Manifests ── bumps image tags in kubernetes/overlays/dev/kustomization.yaml
   and commits them back (Argo CD then auto-syncs the cluster)
```

This creates a closed loop: **code push → build → scan → push → manifest update → Argo CD sync**.

To enable the pipeline you need:

- The repository on GitHub.
- `GHCR` permissions (the workflow uses the auto-provided `GITHUB_TOKEN`).
- (Optional) a repository secret `DEMO_API_KEY` and variable `REGISTRY` — referenced by the workflow.

---

## Monitoring & Observability

Istio Telemetry (`kubernetes/base/istio/telemetry.yaml`) wires the mesh to:

| Backend | Purpose |
|---|---|
| Prometheus | Metrics (`istioctl dashboard prometheus`) |
| Jaeger | Distributed tracing (`istioctl dashboard jaeger`) |
| OpenTelemetry | Access logging |

Dashboards (requires the addons installed):

```bash
istioctl dashboard kiali
istioctl dashboard prometheus
istioctl dashboard jaeger
istioctl dashboard grafana
```

---

## Makefile Command Reference

```
Cluster
  make cluster-create        Create Kind cluster (cloudnative)
  make cluster-delete        Delete the cluster
  make cluster-info          Cluster + node info

Registry
  make registry-start        Start local registry container
  make registry-stop         Stop local registry container

Applications
  make deploy-demo           kubectl apply -k kubernetes/base/demo-nginx
  make remove-demo           kubectl delete -k kubernetes/base/demo-nginx

LocalStack
  make localstack-up         Start LocalStack via docker compose
  make localstack-down       Stop LocalStack
  make localstack-restart    Restart LocalStack
  make localstack-bootstrap  Run init scripts (S3/SQS/DynamoDB/Secrets)
  make localstack-health     Health check
  make localstack-validate   Validate resources
  make localstack-logs       Tail logs

Terraform
  make terraform-init        terraform init
  make terraform-fmt         terraform fmt -recursive
  make terraform-validate    terraform validate
  make terraform-plan        terraform plan
  make terraform-apply       terraform apply
  make terraform-output      terraform output
  make terraform-destroy     terraform destroy
  make terraform-all         fmt + validate + plan
  make terraform-verify-s3 / -sqs / -dynamodb / -secrets
```

`make help` prints the same list.

---

## Troubleshooting

**Pods stuck in `ImagePullBackOff` / `ErrImagePull`**
- Confirm images were pushed to GHCR and the tag matches `kubernetes/overlays/<env>/kustomization.yaml`.
- For the local demo image, ensure the registry is up (`curl http://localhost:5001/v2/_catalog`) and the Kind nodes can reach it (`docker network connect kind local-registry`).

**Istio sidecars not injected**
- `kubectl label namespace microservices istio-injection=enabled` and recreate pods.

**NetworkPolicy blocking traffic**
- The `microservices` namespace has `default-deny` ingress. Traffic must be explicitly allowed (see `kubernetes/base/security/network-policies/`). Only gateway→user, istio-ingress→frontend, and services→postgres are open.

**LocalStack not reachable**
- `make localstack-health`; if it fails, `make localstack-restart` and wait ~10s.

**User service shows "Database Error"**
- PostgreSQL StatefulSet must be `Running` first; secrets `postgres-secret` must exist. Verify with `kubectl get statefulset,pods,svc -n microservices`.

**Port 80/443 already in use (Kind)**
- The Kind config maps host ports 80/443/30000. Change `extraPortMappings` in `infrastructure/kind/kind-config.yaml` if occupied.

---

## Documentation

- `APP-STACK.txt` — full layered architecture diagram and tech stack summary
- `PROJECT-DOCUMENTATION.md` — complete project documentation
- `docs/` — module-by-module write-ups (00 repository foundation → GitOps, Istio, PostgreSQL integration, deployment strategies)
- `PROJECT-ANALYSIS.odt` — project analysis
