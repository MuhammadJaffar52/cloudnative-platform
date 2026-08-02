# CloudNative Platform — Complete Project Documentation

## From Zero to Production: A Step-by-Step Guide

**Author:** Muhammad Jaffar  
**Date:** July 2026  
**Platform:** Kubernetes (Kind) + ArgoCD + Istio + NGINX Ingress + Velero

---

# Table of Contents

- [Chapter 1: What Are We Building?](#chapter-1-what-are-we-building)
- [Chapter 2: Project Structure](#chapter-2-project-structure)
- [Chapter 3: Step 1 — Create the Kubernetes Cluster (Kind)](#chapter-3-step-1--create-the-kubernetes-cluster-kind)
- [Chapter 4: Step 2 — Set Up the Local Docker Registry](#chapter-4-step-2--set-up-the-local-docker-registry)
- [Chapter 5: Step 3 — Build and Push Docker Images](#chapter-5-step-3--build-and-push-docker-images)
- [Chapter 6: Step 4 — Install NGINX Ingress Controller](#chapter-6-step-4--install-nginx-ingress-controller)
- [Chapter 7: Step 5 — Deploy the Demo Application](#chapter-7-step-5--deploy-the-demo-application)
- [Chapter 8: Step 6 — Install ArgoCD](#chapter-8-step-6--install-argocd)
- [Chapter 9: Step 7 — GitOps Bootstrap with ArgoCD](#chapter-9-step-7--gitops-bootstrap-with-argocd)
- [Chapter 10: Step 8 — Understanding Our Microservices](#chapter-10-step-8--understanding-our-microservices)
- [Chapter 11: Step 9 — Kustomize: Base and Overlays](#chapter-11-step-9--kustomize-base-and-overlays)
- [Chapter 12: Step 10 — Kubernetes Security](#chapter-12-step-10--kubernetes-security)
- [Chapter 13: Step 11 — Install Istio Service Mesh](#chapter-13-step-11--install-istio-service-mesh)
- [Chapter 14: Step 12 — Istio Traffic Management](#chapter-14-step-12--istio-traffic-management)
- [Chapter 15: Step 13 — Deployment Strategies](#chapter-15-step-13--deployment-strategies)
- [Chapter 16: Step 14 — Disaster Recovery with Velero](#chapter-16-step-14--disaster-recovery-with-velero)
- [Chapter 17: Step 15 — Troubleshooting and Common Issues](#chapter-17-step-15--troubleshooting-and-common-issues)
- [Chapter 18: Complete Verification Checklist](#chapter-18-complete-verification-checklist)
- [Chapter 19: Interview Preparation](#chapter-19-interview-preparation)
- [Chapter 20: Complete Command Reference](#chapter-20-complete-command-reference)

---

# Chapter 1: What Are We Building?

## 1.1 The Big Picture

Imagine you are a company. You have a website. Customers come, browse products, place orders, and make payments.

In the old days, you would put ALL of this in ONE big application. One server. One codebase. One database.

Then problems appeared:
- If one feature broke, the ENTIRE website went down.
- If you wanted to update one part, you had to redeploy EVERYTHING.
- If 1 million users hit the product page, you had to scale EVERYTHING even though only products needed scaling.

**The Solution: Microservices**

Instead of one big application, we break it into small, independent services:

```
Browser
   |
   v
[Frontend]  -- React app that users see
   |
   v
[Gateway]  -- API Gateway that routes requests
   |
   +---> [User Service]     -- Handles user accounts
   +---> [Product Service]  -- Handles product catalog
   +---> [Order Service]    -- Handles orders
   +---> [Payment Service]  -- Handles payments
   |
   v
[PostgreSQL Database]
```

Each service:
- Runs in its own container
- Has its own code
- Can be updated independently
- Can be scaled independently
- Can fail without taking down everything else

## 1.2 What Technologies Do We Use?

| Technology | What It Does | Why We Need It |
|------------|-------------|----------------|
| **Kubernetes (Kind)** | Runs our containers | Manages, scales, and heals our services |
| **Docker** | Builds container images | Packages each service into a deployable unit |
| **Local Registry** | Stores Docker images locally | Kind nodes pull images from here |
| **NGINX Ingress** | Routes external traffic into the cluster | The front door to our platform |
| **ArgoCD** | GitOps deployment | Automatically deploys when we push to Git |
| **Istio** | Service mesh | Controls traffic between services, adds security |
| **Velero** | Disaster recovery | Backs up and restores the entire platform |
| **Kustomize** | Configuration management | Manages different environments (dev, stage, prod) |
| **PostgreSQL** | Database | Stores users, products, orders, payments |

## 1.3 The Flow: Developer to Production

```
Developer writes code
       |
       v
Push to GitHub
       |
       v
ArgoCD detects changes
       |
       v
ArgoCD pulls Kubernetes manifests from Git
       |
       v
ArgoCD applies manifests to Kubernetes cluster
       |
       v
Kubernetes pulls images and runs containers
       |
       v
NGINX Ingress / Istio routes traffic to services
       |
       v
Users access the application
```

This is called **GitOps** — Git is the single source of truth for everything.

---

# Chapter 2: Project Structure

## 2.1 Directory Layout

Every file in our project has a purpose. Here is the complete structure:

```
cloudnative-platform/
|
|-- apps/                          # Application source code
|   |-- frontend/                  # React frontend
|   |-- gateway/                   # API Gateway (Node.js)
|   |-- user-service/              # User microservice
|   |-- product-service/           # Product microservice
|   |-- order-service/             # Order microservice
|   |-- payment-service/           # Payment microservice
|   |-- demo-nginx/                # Simple nginx demo
|
|-- infrastructure/
|   |-- kind/
|       |-- kind-config.yaml       # Kind cluster configuration
|
|-- kubernetes/
|   |-- base/                      # Base Kubernetes manifests
|   |   |-- namespace/             # Namespace definition
|   |   |-- security/              # Security resources
|   |   |   |-- serviceaccount/    # ServiceAccount
|   |   |   |-- rbac/              # Roles and RoleBindings
|   |   |   |-- secrets/           # Application secrets
|   |   |   |-- network-policies/  # Network Policies
|   |   |-- frontend/              # Frontend deployment
|   |   |-- gateway/               # Gateway deployment
|   |   |-- user-service/          # User service deployment
|   |   |-- product-service/       # Product service deployment
|   |   |-- order-service/         # Order service deployment
|   |   |-- payment-service/       # Payment service deployment
|   |   |-- postgres/              # PostgreSQL database
|   |   |-- demo-nginx/            # Demo nginx
|   |   |-- istio/                 # Istio traffic rules
|   |   |-- kustomization.yaml     # Main kustomization
|   |
|   |-- overlays/                  # Environment-specific configs
|   |   |-- local/                 # Local (Kind) environment
|   |   |-- dev/                   # Development environment
|   |   |-- stage/                 # Staging environment
|   |   |-- prod/                  # Production environment
|   |
|   |-- strategies/                # Deployment strategies
|       |-- blue-green/            # Blue-Green deployment
|       |-- canary/                # Canary deployment
|
|-- gitops/                        # ArgoCD GitOps configuration
|   |-- bootstrap/
|   |   |-- root-app.yaml          # ArgoCD root application
|   |-- projects/
|   |   |-- platform.yaml          # Platform project
|   |   |-- applications.yaml      # Applications project
|   |-- applications/
|       |-- workloads/
|           |-- microservices.yaml  # Microservices app
|           |-- demo-nginx.yaml     # Demo nginx app
|           |-- microservices-dev.yaml
|           |-- microservices-stage.yaml
|           |-- microservices-prod.yaml
|
|-- docs/                          # Documentation
|-- Makefile                       # Automation commands
```

## 2.2 How Files Connect to Each Other

Think of it like a tree:

```
root-app.yaml (ArgoCD)
    |
    +---> microservices.yaml (ArgoCD Application)
    |         |
    |         +---> kubernetes/overlays/local/kustomization.yaml
    |                    |
    |                    +---> kubernetes/base/kustomization.yaml
    |                              |
    |                              +---> namespace/
    |                              +---> security/
    |                              +---> frontend/
    |                              +---> gateway/
    |                              +---> user-service/
    |                              +---> product-service/
    |                              +---> order-service/
    |                              +---> payment-service/
    |                              +---> postgres/
    |                              +---> istio/
    |
    +---> demo-nginx.yaml (ArgoCD Application)
              |
              +---> kubernetes/base/demo-nginx/
```

When ArgoCD syncs, it follows this chain from top to bottom, applying everything.

---

# Chapter 3: Step 1 — Create the Kubernetes Cluster (Kind)

## 3.1 What Is Kind?

**Kind** stands for **Kubernetes IN Docker**. It creates a real Kubernetes cluster running inside Docker containers on your laptop.

Why Kind?
- You don't need a cloud account (AWS, GCP, Azure)
- It starts in seconds
- It creates a multi-node cluster (control-plane + workers) just like production
- It is free

## 3.2 The Kind Configuration File

File: `infrastructure/kind/kind-config.yaml`

```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4

name: cloudnative

containerdConfigPatches:
- |-
  [plugins."io.containerd.grpc.v1.cri".registry.mirrors."localhost:5001"]
    endpoint = ["http://local-registry:5000"]

networking:
  disableDefaultCNI: false
  kubeProxyMode: iptables

nodes:
  - role: control-plane
    image: kindest/node:v1.31.0
    extraPortMappings:
      - containerPort: 80
        hostPort: 80
      - containerPort: 443
        hostPort: 443
      - containerPort: 30000
        hostPort: 30000

  - role: worker
    image: kindest/node:v1.31.0

  - role: worker
    image: kindest/node:v1.31.0
```

### What Each Part Means

**`name: cloudnative`** — The cluster name. When you run `kubectl`, it connects to this cluster.

**`containerdConfigPatches`** — This tells containerd (the container runtime inside each node) that when it sees an image from `localhost:5001`, it should actually pull from our local registry at `http://local-registry:5000`. This is how our Kind nodes access images from the local registry.

**`networking.kubeProxyMode: iptables`** — Uses iptables for kube-proxy, which handles network routing between pods.

**`nodes`** — We create 3 nodes:
- 1 control-plane node (runs Kubernetes API server, scheduler, controller manager)
- 2 worker nodes (run our actual application pods)

**`extraPortMappings`** — Maps host ports to the control-plane node:
- Port 80: HTTP traffic (NGINX Ingress)
- Port 443: HTTPS traffic
- Port 30000: NodePort range

## 3.3 Creating the Cluster

### Command:
```bash
kind create cluster \
  --name cloudnative \
  --config infrastructure/kind/kind-config.yaml
```

### What Happens:
1. Kind pulls the `kindest/node:v1.31.0` Docker image (if not already pulled)
2. Creates 3 Docker containers (one for each node)
3. Installs Kubernetes on each container
4. Sets up networking between them
5. Configures containerd to use our local registry mirror
6. Creates a kubeconfig file so `kubectl` can talk to the cluster

### Expected Output:
```
Creating cluster "cloudnative" ...
 ✓ Ensuring node image (kindest/node:v1.31.0) 🖼
 ✓ Preparing nodes 📦
 ✓ Writing configuration 📜
 ✓ Starting control-plane 🕹️
 ✓ Installing CNI 🔌
 ✓ Installing StorageClass 💾
 ✓ Joining worker nodes 🚜
Set kubectl context to "kind-cloudnative"
```

## 3.4 Verifying the Cluster

### Check Nodes:
```bash
kubectl get nodes
```

### Expected Output:
```
NAME                        STATUS   ROLES           AGE   VERSION
cloudnative-control-plane   Ready    control-plane   5m    v1.31.0
cloudnative-worker          Ready    <none>          4m    v1.31.0
cloudnative-worker2         Ready    <none>          4m    v1.31.0
```

**All 3 nodes must show STATUS = Ready.** If any shows NotReady, something is wrong.

### Check System Pods:
```bash
kubectl get pods -n kube-system
```

### Expected Output:
```
NAME                                                READY   STATUS    RESTARTS   AGE
coredns-6f6b679f8f-xxxxx                            1/1     Running   0          5m
coredns-6f6b679f8f-yyyyy                            1/1     Running   0          5m
etcd-cloudnative-control-plane                      1/1     Running   0          5m
kindnet-xxxxx                                       1/1     Running   0          5m
kindnet-yyyyy                                       1/1     Running   0          5m
kindnet-zzzzz                                       1/1     Running   0          5m
kube-apiserver-cloudnative-control-plane            1/1     Running   0          5m
kube-controller-manager-cloudnative-control-plane   1/1     Running   0          5m
kube-proxy-xxxxx                                    1/1     Running   0          5m
kube-proxy-yyyyy                                    1/1     Running   0          5m
kube-proxy-zzzzz                                    1/1     Running   0          5m
kube-scheduler-cloudnative-control-plane            1/1     Running   0          5m
```

**All pods must be Running.** kube-proxy must be running on all 3 nodes.

### Check kube-proxy Specifically:
```bash
kubectl get pods -n kube-system -l k8s-app=kube-proxy -o wide
```

This shows which node each kube-proxy pod runs on. You should see 3 pods, one per node.

## 3.5 What Problem Could Go Wrong Here?

**Problem: kube-proxy crashes with "too many open files"**

This happened during our project. The kube-proxy pods kept crash-looping because of a kernel-level iptables/nftables conflict on the Kind nodes.

**Symptom:**
```
kube-proxy-xxxxx   0/1     CrashLoopBackOff   0   (x over 5m)
```

**Diagnosis:**
```bash
kubectl logs -n kube-system kube-proxy-xxxxx
# Shows: "failed complete: too many open files"
```

**Solution:**
Delete the corrupted cluster and recreate it:
```bash
kind delete cluster --name cloudnative
kind create cluster --name cloudnative --config infrastructure/kind/kind-config.yaml
```

**Why it worked:** Recreating the cluster gives fresh nodes with clean kernel state.

---

# Chapter 4: Step 2 — Set Up the Local Docker Registry

## 4.1 Why Do We Need a Registry?

When Kubernetes wants to run a container, it needs to pull a Docker image. In a cloud environment, it pulls from Docker Hub or AWS ECR. But on our laptop with Kind, we need a **local registry** that our Kind nodes can access.

## 4.2 Starting the Local Registry

### Command:
```bash
docker run -d --restart=always -p 5001:5000 --name local-registry registry:2
```

### What This Does:
- `-d`: Run in detached mode (background)
- `--restart=always`: Restart if it crashes
- `-p 5001:5000`: Map host port 5001 to container port 5000
- `--name local-registry`: Name the container
- `registry:2`: Use the official Docker Registry image version 2

### Why Port 5001?

The Kind config maps `localhost:5001` to `local-registry:5000`. This is the bridge between your host machine and the Kind cluster. When a node tries to pull `localhost:5001/myimage:v1`, it actually pulls from `http://local-registry:5000/myimage:v1` inside the Docker network.

## 4.3 Verifying the Registry

### Check It Is Running:
```bash
docker ps | grep local-registry
```

### Expected Output:
```
CONTAINER ID   IMAGE       COMMAND                  CREATED        STATUS        PORTS                    NAMES
abc123def456   registry:2  "/entrypoint.sh /etc…"   2 hours ago    Up 2 hours    0.0.0.0:5001->5000/tcp   local-registry
```

### Check the Registry Catalog:
```bash
curl http://localhost:5001/v2/_catalog
```

### Expected Output (after pushing images):
```json
{"repositories":["demo-nginx","frontend","gateway","order-service","payment-service","product-service","user-service"]}
```

## 4.4 Stopping and Restarting the Registry

If you need to stop or restart it:
```bash
# Stop (images are preserved)
docker stop local-registry

# Start again
docker start local-registry

# Check status
docker ps | grep local-registry
```

**Important:** The registry container persists across cluster recreations. You do NOT need to rebuild images every time you recreate the cluster.

---

# Chapter 5: Step 3 — Build and Push Docker Images

## 5.1 Our Application Source Code

We have 7 applications inside the `apps/` directory:

| Service | Language | Port | Description |
|---------|----------|------|-------------|
| frontend | React (Vite) | 80 | User interface |
| gateway | Node.js (Express) | 8000 | API Gateway / Reverse Proxy |
| user-service | Node.js (Express) | 3001 | User CRUD operations (PostgreSQL) |
| product-service | Node.js (Express) | 3002 | Product catalog (in-memory) |
| order-service | Node.js (Express) | 3003 | Order management |
| payment-service | Node.js (Express) | 3004 | Payment processing |
| demo-nginx | Nginx | 80 | Simple HTML page |

## 5.2 How Dockerfiles Work

Each service has a Dockerfile. Let us look at two examples:

### Example 1: Frontend (Multi-stage Build)

File: `apps/frontend/Dockerfile`

```dockerfile
# Stage 1: Build the React app
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Why two stages?**
- Stage 1 installs ALL dependencies (including dev tools like Vite) and builds the React app
- Stage 2 copies ONLY the built files into a tiny Nginx image
- Result: Small image (20MB instead of 200MB)

### Example 2: User Service (Non-root user)

File: `apps/user-service/Dockerfile`

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN chown -R node:node /app
USER node
EXPOSE 3001
CMD ["node", "server.js"]
```

**Key security feature:** `USER node` runs the app as a non-root user. This is a security best practice.

## 5.3 Building and Pushing Images

### Commands:
```bash
# Set the registry prefix
REGISTRY="localhost:5001"

# Build and push each image
for SERVICE in frontend gateway user-service product-service order-service payment-service; do
  docker build -t $REGISTRY/$SERVICE:1.0 apps/$SERVICE/
  docker push $REGISTRY/$SERVICE:1.0
  echo "Pushed $SERVICE"
done

# Build and push demo-nginx
docker build -t $REGISTRY/demo-nginx:v1 apps/demo-nginx/
docker push $REGISTRY/demo-nginx:v1
```

### Expected Output:
```
[+] Building 12.3s (10/10) FINISHED
...
Pushed frontend
[+] Building 8.7s (9/9) FINISHED
...
Pushed gateway
...
```

## 5.4 Verifying Images in the Registry

```bash
# List all images
curl -s http://localhost:5001/v2/_catalog | python3 -m json.tool

# List tags for a specific image
curl -s http://localhost:5001/v2/frontend/tags/list

# List tags for all images
for repo in demo-nginx frontend gateway order-service payment-service product-service user-service; do
  echo "$repo: $(curl -s http://localhost:5001/v2/$repo/tags/list)"
done
```

### Expected Output:
```
demo-nginx: {"name":"demo-nginx","tags":["v1"]}
frontend: {"name":"frontend","tags":["1.0"]}
gateway: {"name":"gateway","tags":["1.0"]}
order-service: {"name":"order-service","tags":["1.0"]}
payment-service: {"name":"payment-service","tags":["1.0"]}
product-service: {"name":"product-service","tags":["1.0"]}
user-service: {"name":"user-service","tags":["1.0","1.1"]}
```

---

# Chapter 6: Step 4 — Install NGINX Ingress Controller

## 6.1 What Is an Ingress Controller?

Think of your cluster as a building. Inside the building, there are many rooms (services). But the building needs a front door — a receptionist who receives visitors and directs them to the right room.

The **NGINX Ingress Controller** is that front door.

```
Internet/User
      |
      v
[NGINX Ingress Controller]  <-- The front door (port 80, 443)
      |
      v
[Service]  <-- The rooms inside
      |
      v
[Pod]  <-- The actual workers
```

## 6.2 Installing NGINX Ingress

### Command:
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.12.1/deploy/static/provider/kind/deploy.yaml
```

This downloads and applies the official NGINX Ingress configuration for Kind clusters.

### Expected Output:
```
namespace/ingress-nginx created
serviceaccount/ingress-nginx created
serviceaccount/ingress-nginx-admission created
role.rbac.authorization.k8s.io/ingress-nginx created
clusterrole.rbac.authorization.k8s.io/ingress-nginx created
deployment.apps/ingress-nginx-controller created
...
```

## 6.3 Labeling the Control-Plane Node

The NGINX Ingress Controller for Kind requires a specific node label:

```bash
kubectl label node cloudnative-control-plane ingress-ready=true
```

**Why?** The NGINX Ingress Controller uses a node affinity rule that requires `ingress-ready=true`. Without this label, the pod stays in `Pending` state forever.

## 6.4 Verifying NGINX Ingress

### Check Pods:
```bash
kubectl get pods -n ingress-nginx
```

### Expected Output:
```
NAME                                        READY   STATUS      RESTARTS   AGE
ingress-nginx-admission-create-xxxxx        0/1     Completed   0          2m
ingress-nginx-admission-patch-xxxxx         0/1     Completed   0          2m
ingress-nginx-controller-xxxxxxxxx-xxxxx    1/1     Running     0          2m
```

The two `admission-create` and `admission-patch` pods are one-time jobs that create TLS certificates. They should show `Completed`. The `controller` pod should show `Running`.

### Check Service:
```bash
kubectl get svc -n ingress-nginx
```

### Expected Output:
```
NAME                       TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)                      AGE
ingress-nginx-controller   NodePort       10.96.x.x      <none>        80:3xxxx/TCP,443:3xxxx/TCP   2m
ingress-nginx-controller-admission   ClusterIP   10.96.x.x   <none>   443/TCP                      2m
```

### Test Ingress:
```bash
curl -s http://localhost -H "Host: demo.local" | head -5
```

---

# Chapter 7: Step 5 — Deploy the Demo Application

## 7.1 What Is the Demo Application?

The demo-nginx is a simple Nginx server that shows "CloudNative Platform - Running inside Kind Cluster". It serves as our first test to verify everything is working.

## 7.2 The Kustomize Structure

The demo-nginx uses Kustomize to organize its resources:

```
kubernetes/base/demo-nginx/
|-- kustomization.yaml     # Lists all files below
|-- namespace.yaml         # Creates the "demo" namespace
|-- deployment.yaml        # Runs 3 nginx pods
|-- service.yaml           # ClusterIP service (internal)
|-- ingress.yaml           # Ingress resource (external access)
```

### kustomization.yaml:
```yaml
resources:
  - namespace.yaml
  - deployment.yaml
  - service.yaml
  - ingress.yaml
```

### namespace.yaml:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: demo
```

### deployment.yaml:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo-nginx
  namespace: demo
spec:
  replicas: 3
  selector:
    matchLabels:
      app: demo-nginx
  template:
    metadata:
      labels:
        app: demo-nginx
    spec:
      containers:
      - name: demo-nginx
        image: localhost:5001/demo-nginx:v1
        imagePullPolicy: Always
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 250m
            memory: 256Mi
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 15
          periodSeconds: 20
```

**Key points:**
- `replicas: 3` — Runs 3 identical copies for high availability
- `image: localhost:5001/demo-nginx:v1` — Pulls from our local registry
- `imagePullPolicy: Always` — Always check the registry for the latest image
- `readinessProbe` — Kubernetes checks if the pod is ready before sending traffic
- `livenessProbe` — Kubernetes restarts the pod if it becomes unresponsive

### ingress.yaml:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: demo-nginx
  namespace: demo
spec:
  ingressClassName: nginx
  rules:
    - host: demo.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: demo-nginx
                port:
                  number: 80
```

**What this does:** When someone visits `http://demo.local`, the NGINX Ingress Controller routes the request to the `demo-nginx` service on port 80.

## 7.3 Deploying the Demo

### Commands:
```bash
kubectl apply -k kubernetes/base/demo-nginx
```

### Verifying:
```bash
# Check pods
kubectl get pods -n demo

# Check service
kubectl get svc -n demo

# Check ingress
kubectl get ingress -n demo

# Test access
curl -s http://localhost -H "Host: demo.local"
```

### Expected Output:
```
# Pods
NAME                        READY   STATUS    RESTARTS   AGE
demo-nginx-xxxxxxxxx-aaaa   1/1     Running   0          30s
demo-nginx-xxxxxxxxx-bbbb   1/1     Running   0          30s
demo-nginx-xxxxxxxxx-cccc   1/1     Running   0          30s

# Service
NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
demo-nginx   ClusterIP   10.96.x.x       <none>        80/TCP    30s

# Ingress
NAME         CLASS   HOSTS         ADDRESS     PORTS   AGE
demo-nginx   nginx   demo.local    localhost   80      30s

# Curl test
<h1>CloudNative Platform</h1><h2>Running inside Kind Cluster</h2>
```

---

# Chapter 8: Step 6 — Install ArgoCD

## 8.1 What Is ArgoCD?

**ArgoCD** is a GitOps tool. It watches your Git repository and automatically deploys changes to your Kubernetes cluster.

Without ArgoCD:
```
Developer changes YAML file
       |
       v
Developer manually runs: kubectl apply -f file.yaml
       |
       v
Changes applied to cluster
```

With ArgoCD:
```
Developer changes YAML file in Git
       |
       v
Developer pushes to GitHub
       |
       v
ArgoCD detects the change (polls every 3 minutes)
       |
       v
ArgoCD automatically applies the changes to the cluster
       |
       v
Cluster updated without manual intervention
```

## 8.2 Installing ArgoCD

### Create Namespace:
```bash
kubectl create namespace argocd
```

### Install ArgoCD Manifests:
```bash
kubectl apply -n argocd --server-side --force-conflicts \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

**Why `--server-side --force-conflicts`?** The ArgoCD CRD for Applications is very large (over 262KB). When you apply it with the regular `kubectl apply`, the annotation field becomes too long. Server-side apply handles this limitation.

### Expected Output:
```
customresourcedefinition.apiextensions.k8s.io/applications.argoproj.io serverside-applied
customresourcedefinition.apiextensions.k8s.io/applicationsets.argoproj.io serverside-applied
customresourcedefinition.apiextensions.k8s.io/appprojects.argoproj.io serverside-applied
serviceaccount/argocd-application-controller serverside-applied
serviceaccount/argocd-server serverside-applied
deployment.apps/argocd-server serverside-applied
...
```

## 8.3 Verifying ArgoCD Installation

### Check Pods:
```bash
kubectl get pods -n argocd
```

### Expected Output:
```
NAME                                                READY   STATUS    RESTARTS   AGE
argocd-application-controller-0                     1/1     Running   0          3m
argocd-applicationset-controller-xxxxxxxxx-xxxxx    1/1     Running   0          3m
argocd-dex-server-xxxxxxxxx-xxxxx                   1/1     Running   0          3m
argocd-notifications-controller-xxxxxxxxx-xxxxx     1/1     Running   0          3m
argocd-redis-xxxxxxxxx-xxxxx                        1/1     Running   0          3m
argocd-repo-server-xxxxxxxxx-xxxxx                  1/1     Running   0          3m
argocd-server-xxxxxxxxx-xxxxx                       1/1     Running   0          3m
```

**All pods must be Running.** If argocd-server is CrashLoopBackOff, check logs:
```bash
kubectl logs -n argocd deployment/argocd-server
```

## 8.4 Getting the ArgoCD Admin Password

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d && echo
```

This prints the admin password. Use it to log in to the ArgoCD web UI.

## 8.5 Accessing ArgoCD UI

```bash
# Port-forward the ArgoCD server
kubectl port-forward -n argocd svc/argocd-server 8080:443 &
```

Then open: `https://localhost:8080`
- Username: `admin`
- Password: (from the command above)

---

# Chapter 9: Step 7 — GitOps Bootstrap with ArgoCD

## 9.1 The App-of-Apps Pattern

Our ArgoCD setup uses the **App of Apps** pattern:

```
root-app (Application)
    |
    +---> microservices (Application)
    |         |
    |         +---> Deploys: kubernetes/overlays/local
    |                      |
    |                      +---> All microservices, security, istio
    |
    +---> demo-nginx (Application)
              |
              +---> Deploys: kubernetes/base/demo-nginx
```

One "root" application manages all other applications. This makes it easy to bootstrap the entire platform.

## 9.2 The ArgoCD Projects

### Platform Project (gitops/projects/platform.yaml):
```yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: platform
  namespace: argocd
spec:
  description: Platform Engineering Project
  sourceRepos:
    - "https://github.com/MuhammadJaffar52/cloudnative-platform.git"
  destinations:
    - namespace: demo
      server: https://kubernetes.default.svc
    - namespace: argocd
      server: https://kubernetes.default.svc
```

**What this does:** Defines a project that can only deploy to the `demo` and `argocd` namespaces. This is a safety guard — it prevents accidental deployments to wrong namespaces.

### Applications Project (gitops/projects/applications.yaml):
```yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: applications
  namespace: argocd
spec:
  description: Application Team Workloads
  destinations:
    - namespace: "*"
      server: https://kubernetes.default.svc
```

**What this does:** The applications project can deploy to ANY namespace. This gives our application team flexibility.

## 9.3 The Root Application

File: `gitops/bootstrap/root-app.yaml`

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: root-app
  namespace: argocd
spec:
  project: platform
  source:
    repoURL: https://github.com/MuhammadJaffar52/cloudnative-platform.git
    targetRevision: main
    path: gitops/applications/workloads
    directory:
      recurse: true
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

**Key settings:**
- `path: gitops/applications/workloads` — Scans this directory for Application YAML files
- `directory.recurse: true` — Looks in subdirectories too
- `syncPolicy.automated.prune: true` — If you delete a resource from Git, ArgoCD deletes it from the cluster
- `syncPolicy.automated.selfHeal: true` — If someone manually changes something in the cluster, ArgoCD reverts it to match Git

## 9.4 The Microservices Application

File: `gitops/applications/workloads/microservices.yaml`

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: microservices
  namespace: argocd
spec:
  project: applications
  source:
    repoURL: https://github.com/MuhammadJaffar52/cloudnative-platform.git
    targetRevision: main
    path: kubernetes/overlays/local
  destination:
    server: https://kubernetes.default.svc
    namespace: microservices
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

**Key settings:**
- `path: kubernetes/overlays/local` — Uses the local overlay (Kind-specific config)
- `destination.namespace: microservices` — Deploys to the `microservices` namespace
- `CreateNamespace=true` — Automatically creates the namespace if it does not exist

## 9.5 Applying the GitOps Bootstrap

### Commands:
```bash
# Step 1: Apply the ArgoCD Projects
kubectl apply -f gitops/projects/platform.yaml
kubectl apply -f gitops/projects/applications.yaml

# Step 2: Apply the Root Application
kubectl apply -f gitops/bootstrap/root-app.yaml
```

### Expected Output:
```
appproject.argoproj.io/platform created
appproject.argoproj.io/applications created
application.argoproj.io/root-app created
```

## 9.6 Verifying GitOps Deployment

### Watch ArgoCD Applications:
```bash
kubectl get applications -A -w
```

### Expected Output (after 30-60 seconds):
```
NAMESPACE   NAME            SYNC STATUS   HEALTH STATUS   REVISION                                  PROJECT
argocd      demo-nginx      Synced        Healthy         973d8b29d53c23b84707102b08a4f5528f3ddce3   applications
argocd      microservices   Synced        Healthy         973d8b29d53c23b84707102b08a4f5528f3ddce3   applications
argocd      root-app        Synced        Healthy         973d8b29d53c23b84707102b08a4f5528f3ddce3   platform
```

**All 3 applications must show SYNCED and HEALTHY.**

### Check All Pods:
```bash
kubectl get pods -A
```

At this point, you should see pods running in:
- `kube-system` — Kubernetes system pods
- `argocd` — ArgoCD pods
- `ingress-nginx` — NGINX Ingress pods
- `demo` — Demo nginx pods
- `microservices` — All your microservice pods

---

# Chapter 10: Step 8 — Understanding Our Microservices

## 10.1 The Microservices Architecture

Our platform has 7 services working together:

```
                         User Browser
                              |
                              v
                     [NGINX Ingress / Istio Gateway]
                              |
                              v
                     [Frontend :80]  (React SPA)
                              |
                              v
                     [Gateway :8000]  (API Gateway)
                    /    |     |     \
                   v     v     v      v
           [User]  [Product] [Order] [Payment]
           :3001   :3002     :3003   :3004
                   |
                   v
              [PostgreSQL :5432]
```

## 10.2 Service Details

### Frontend (React)
- **Port:** 80
- **Technology:** React built with Vite, served by Nginx
- **Function:** User interface that users see in their browser
- **Deployment:** Multiple replicas with blue-green and canary versions

### Gateway (API Gateway)
- **Port:** 8000
- **Technology:** Node.js + Express + http-proxy-middleware
- **Function:** Routes requests to the correct microservice
- **Routes:**
  - `/api/users` -> user-service:3001
  - `/api/products` -> product-service:3002
  - `/api/orders` -> order-service:3003
  - `/api/payments` -> payment-service:3004

### User Service
- **Port:** 3001
- **Technology:** Node.js + Express + PostgreSQL (pg)
- **Function:** CRUD operations for users
- **Database:** Connects to PostgreSQL for persistent storage
- **Tables:** users

### Product Service
- **Port:** 3002
- **Technology:** Node.js + Express
- **Function:** CRUD operations for products
- **Storage:** In-memory Map (data resets on restart)
- **Pre-loaded:** Laptop, Smartphone, Headphones, Keyboard, Monitor

### Order Service
- **Port:** 3003
- **Technology:** Node.js + Express + axios
- **Function:** Creates orders by calling user-service, product-service, and payment-service
- **Flow:** Check user -> Check product stock -> Process payment -> Create order

### Payment Service
- **Port:** 3004
- **Technology:** Node.js + Express
- **Function:** Processes payments with 90% simulated success rate
- **Features:** Process payment, refund payment

### PostgreSQL Database
- **Port:** 5432
- **Technology:** PostgreSQL 16
- **Function:** Persistent storage for user data
- **Tables:** users, products, orders, payments

## 10.3 How Services Talk to Each Other

Within the Kubernetes cluster, services communicate using DNS names:

```
user-service       -> http://user-service:3001
product-service    -> http://product-service:3002
order-service      -> http://order-service:3003
payment-service    -> http://payment-service:3004
postgres           -> postgres-headless:5432
```

Kubernetes automatically creates DNS entries for every Service. So when order-service calls `http://user-service:3001`, Kubernetes resolves `user-service` to the correct pod IP.

## 10.4 ConfigMaps and Secrets

Each service has a ConfigMap for non-sensitive configuration:

```yaml
# Example: gateway-config
data:
  USER_SERVICE_URL: "http://user-service:3001"
  PRODUCT_SERVICE_URL: "http://product-service:3002"
  ORDER_SERVICE_URL: "http://order-service:3003"
  PAYMENT_SERVICE_URL: "http://payment-service:3004"
```

Sensitive data is stored in Secrets:

```yaml
# Example: app-secret
stringData:
  DB_USERNAME: admin
  DB_PASSWORD: admin123
  JWT_SECRET: my-super-secret-key
  API_KEY: demo-api-key-123
```

ConfigMaps and Secrets are injected as environment variables into the containers.

---

# Chapter 11: Step 9 — Kustomize: Base and Overlays

## 11.1 What Is Kustomize?

Kustomize is a Kubernetes configuration management tool. It lets you define a **base** configuration and then customize it for different environments using **overlays**.

Think of it like a template:
- **Base:** The common configuration shared by all environments
- **Overlay:** Environment-specific customizations (dev, staging, production)

## 11.2 Our Base Configuration

File: `kubernetes/base/kustomization.yaml`

```yaml
resources:
  - namespace
  - security
  - frontend
  - gateway
  - user-service
  - product-service
  - order-service
  - payment-service
  - postgres
  - istio
```

This lists ALL the resources that make up our platform. Each resource is a directory containing its own kustomization.yaml and YAML files.

## 11.3 The Overlay Hierarchy

```
overlays/local/kustomization.yaml
    |
    +---> resources: ../../base
              |
              +---> All base resources
```

### Local Overlay:
```yaml
resources:
  - ../../base
```

This simply references the base with no modifications. For Kind clusters, we use the base as-is.

### Dev Overlay (for development):
```yaml
resources:
  - ../../base
```

### Stage Overlay (for staging):
```yaml
resources:
  - ../../base
```

### Prod Overlay (for production):
```yaml
resources:
  - ../../base
```

## 11.4 How Kustomize Works

When you run:
```bash
kubectl apply -k kubernetes/overlays/local
```

Kustomize follows this chain:
1. Reads `overlays/local/kustomization.yaml`
2. Sees it references `../../base`
3. Reads `base/kustomization.yaml`
4. Finds all 10 resources (namespace, security, frontend, gateway, etc.)
5. For each resource, reads ALL YAML files in that directory
6. Combines everything into one large YAML document
7. Applies it to Kubernetes

## 11.5 Each Microservice's Kustomize Structure

Every microservice follows the same pattern:

```
kubernetes/base/<service>/
|-- kustomization.yaml     # Lists resources
|-- deployment.yaml        # How to run the pods
|-- service.yaml           # How to access the pods
|-- configmap.yaml         # Non-sensitive configuration
```

Example for frontend:
```yaml
# kustomization.yaml
resources:
  - configmap.yaml
  - service.yaml
  - deployment.yaml
```

---

# Chapter 12: Step 10 — Kubernetes Security

## 12.1 The Five Layers of Security

We implemented 5 security layers in our platform:

```
Layer 1: ServiceAccount   — Identity (Who are you?)
Layer 2: RBAC             — Permissions (What can you do?)
Layer 3: Secrets          — Sensitive Data (Passwords, Keys)
Layer 4: Security Context — Container Safety (How do you run?)
Layer 5: Network Policy   — Traffic Control (Who can talk to whom?)
```

## 12.2 Layer 1: ServiceAccount

### What Is It?
A ServiceAccount gives each Pod an identity in Kubernetes. Without it, a Pod uses the `default` account which has no specific permissions.

### Our ServiceAccount:
```yaml
# kubernetes/base/security/serviceaccount/shared-sa.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-sa
  namespace: microservices
```

### How Pods Use It:
Every deployment specifies:
```yaml
spec:
  template:
    spec:
      serviceAccountName: app-sa
```

### Verify:
```bash
kubectl get serviceaccount -n microservices
```

Expected:
```
NAME      SECRETS   AGE
app-sa    0         10m
default   1         10m
```

### Check Which ServiceAccount a Pod Uses:
```bash
kubectl get pod <pod-name> -n microservices \
  -o jsonpath="{.spec.serviceAccountName}"
```

Expected: `app-sa`

## 12.3 Layer 2: RBAC (Role-Based Access Control)

### What Is It?
RBAC controls WHAT a ServiceAccount is allowed to do. We created a Role that allows reading but not writing.

### Our Role:
```yaml
# kubernetes/base/security/rbac/shared-role.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: app-reader
  namespace: microservices
rules:
- apiGroups: [""]
  resources:
    - pods
    - services
    - endpoints
    - configmaps
  verbs:
    - get
    - list
    - watch
```

**Allowed:** get, list, watch (read-only)
**Denied:** create, update, delete (no write access)

### Our RoleBinding:
```yaml
# kubernetes/base/security/rbac/shared-rolebinding.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: app-reader-binding
  namespace: microservices
subjects:
- kind: ServiceAccount
  name: app-sa
  namespace: microservices
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: app-reader
```

**What this does:** Connects the `app-sa` ServiceAccount to the `app-reader` Role.

### Verify Allowed Actions:
```bash
# Should return "yes"
kubectl auth can-i get pods \
  --as=system:serviceaccount:microservices:app-sa \
  -n microservices

# Should return "yes"
kubectl auth can-i list pods \
  --as=system:serviceaccount:microservices:app-sa \
  -n microservices

# Should return "no"
kubectl auth can-i delete pods \
  --as=system:serviceaccount:microservices:app-sa \
  -n microservices

# Should return "no"
kubectl auth can-i get secrets \
  --as=system:serviceaccount:microservices:app-sa \
  -n microservices
```

## 12.4 Layer 3: Kubernetes Secrets

### What Are They?
Secrets store sensitive data (passwords, API keys, certificates) securely. They are base64-encoded and stored in etcd.

### Our Application Secret:
```yaml
# kubernetes/base/security/secrets/app-secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
  namespace: microservices
type: Opaque
stringData:
  DB_USERNAME: admin
  DB_PASSWORD: admin123
  JWT_SECRET: my-super-secret-key
  API_KEY: demo-api-key-123
```

### Our PostgreSQL Secret:
```yaml
# kubernetes/base/postgres/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
  namespace: microservices
type: Opaque
stringData:
  POSTGRES_DB: cloudnative_platform
  POSTGRES_USER: postgres
  POSTGRES_PASSWORD: postgres123
```

### How Pods Receive Secrets:
```yaml
# In user-service deployment
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: postgres-secret
        key: POSTGRES_PASSWORD
  - name: JWT_SECRET
    valueFrom:
      secretKeyRef:
        name: app-secret
        key: JWT_SECRET
```

### Verify Secrets:
```bash
# List secrets
kubectl get secrets -n microservices

# Describe a secret
kubectl describe secret app-secret -n microservices

# Decode a secret value
kubectl get secret app-secret -n microservices \
  -o jsonpath="{.data.DB_PASSWORD}" | base64 -d && echo

# Check if a pod has the secret
kubectl exec -it <pod-name> -n microservices -- env | grep -E "DB_|JWT|API"
```

Expected:
```
DB_USERNAME=admin
DB_PASSWORD=admin123
JWT_SECRET=my-super-secret-key
API_KEY=demo-api-key-123
```

## 12.5 Layer 4: Security Context

### What Is It?
A SecurityContext defines how a container should run. We ensure containers do NOT run as root.

### Our Dockerfile Setting:
```dockerfile
RUN chown -R node:node /app
USER node
```

### Verify Running User:
```bash
kubectl exec -it <user-service-pod> -n microservices -- id
```

Expected: `uid=1000(node) gid=1000(node)`
Not: `uid=0(root)`

## 12.6 Layer 5: Network Policies

### What Are They?
Network Policies control which Pods can talk to which other Pods. Think of them as firewalls between pods.

### Default Deny Policy:
```yaml
# kubernetes/base/security/network-policies/default-deny.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: microservices
spec:
  podSelector: {}
  policyTypes:
    - Ingress
```

**What this does:** Blocks ALL incoming traffic to ALL pods. Nothing can communicate unless explicitly allowed.

### Gateway to User Service:
```yaml
# kubernetes/base/security/network-policies/gateway-to-user.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: gateway-to-user
  namespace: microservices
spec:
  podSelector:
    matchLabels:
      app: user-service
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: gateway
      ports:
        - protocol: TCP
          port: 3001
```

**What this does:** Only the `gateway` pod can send traffic to `user-service` on port 3001. All other traffic is blocked.

### Istio Ingress to Frontend:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: istio-ingress-to-frontend
  namespace: microservices
spec:
  podSelector:
    matchLabels:
      app: frontend
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: istio-system
          podSelector:
            matchLabels:
              istio: ingressgateway
      ports:
        - protocol: TCP
          port: 80
```

**What this does:** Only Istio's ingress gateway (in `istio-system` namespace) can send traffic to `frontend` on port 80.

### Allow Services to PostgreSQL:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-services-to-postgres
  namespace: microservices
spec:
  podSelector:
    matchLabels:
      app: postgres
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: user-service
        - podSelector:
            matchLabels:
              app: product-service
        - podSelector:
            matchLabels:
              app: order-service
        - podSelector:
            matchLabels:
              app: payment-service
      ports:
        - port: 5432
          protocol: TCP
```

**What this does:** Only our 4 microservices can connect to PostgreSQL on port 5432.

### Verify Network Policies:
```bash
kubectl get networkpolicy -n microservices
```

Expected:
```
NAME                           POD-SELECTOR   AGE
default-deny                   <none>         5m
gateway-to-user                app=gateway    5m
istio-ingress-to-frontend      app=frontend   5m
allow-services-to-postgres     app=postgres   5m
```

---

# Chapter 13: Step 11 — Install Istio Service Mesh

## 13.1 What Is a Service Mesh?

Remember our microservices communicate with each other:

```
Gateway -> User Service -> PostgreSQL
```

But what if:
- User Service is temporarily down? (Retries needed)
- We want to send 10% of traffic to a new version? (Traffic splitting)
- We want to encrypt traffic between services? (Mutual TLS)
- We want to see which service is slow? (Observability)

Kubernetes does NOT provide these features. **Istio** does.

## 13.2 How Istio Works

Istio adds a small proxy (Envoy) to every pod. This proxy handles all network traffic:

```
Without Istio:
  [Frontend] --direct--> [Gateway]

With Istio:
  [Frontend] --[Envoy Proxy]--> [Envoy Proxy]-- [Gateway]
                     |                    |
                  Istio controls traffic
```

The application code does NOT change. The proxy is injected automatically.

## 13.3 Installing Istio

### Download Istio:
```bash
curl -sL https://github.com/istio/istio/releases/download/1.24.3/istio-1.24.3-linux-amd64.tar.gz -o /tmp/istio-1.24.3-linux-amd64.tar.gz

tar xzf /tmp/istio-1.24.3-linux-amd64.tar.gz -C /tmp/

export PATH="/tmp/istio-1.24.3/bin:$PATH"
```

### Install Istio:
```bash
istioctl install --set profile=demo -y
```

**Profile options:**
- `default` — Minimal installation
- `demo` — Includes Istio + Ingress Gateway + Egress Gateway (for learning/demo)
- `minimal` — Only istiod (the control plane)
- `production` — Full production setup

We use `demo` because it includes everything we need for learning.

### Expected Output:
```
        |\
        | \
        |  \
        |   \
      /||    \
     / ||     \
    /  ||      \
   /   ||       \
  /    ||        \
 /     ||         \
/______||__________\
...
✔ Istio core installed
✔ Istiod installed
✔ Egress gateways installed
✔ Ingress gateways installed
✔ Installation complete
```

## 13.4 Enabling Sidecar Injection

This is the **most critical step** that was missing in our setup.

### Label the Namespace:
```bash
kubectl label namespace microservices istio-injection=enabled
```

**What this does:** From now on, any new pod created in the `microservices` namespace will automatically get an Envoy proxy sidecar injected.

### Verify Label:
```bash
kubectl get namespace microservices --show-labels
```

Expected:
```
NAME            STATUS   AGE   LABELS
microservices   Active   10m   app.kubernetes.io/name=microservices,...,istio-injection=enabled
```

### Restart Existing Pods:
After labeling the namespace, existing pods do NOT get the sidecar automatically. You must restart them:

```bash
kubectl rollout restart deployment -n microservices
```

Or restart specific deployments:
```bash
kubectl rollout restart deployment frontend -n microservices
kubectl rollout restart deployment gateway -n microservices
kubectl rollout restart deployment user-service -n microservices
kubectl rollout restart deployment product-service -n microservices
kubectl rollout restart deployment order-service -n microservices
kubectl rollout restart deployment payment-service -n microservices
```

## 13.5 Verifying Sidecar Injection

### Check Pod Containers:
Each pod should now have 2 containers (app + istio-proxy):

```bash
kubectl get pods -n microservices -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{range .spec.containers[*]}{.name}{" "}{end}{"\n"}{end}'
```

Expected:
```
frontend-xxxxx    frontend istio-proxy
gateway-xxxxx     gateway istio-proxy
user-service-xxxxx    user-service istio-proxy
...
```

### Check Specifically:
```bash
kubectl get pod <pod-name> -n microservices -o jsonpath='{.spec.containers[*].name}'
```

Expected: `frontend istio-proxy` (two names, space-separated)

### Check Istio Proxy Status:
```bash
istioctl proxy-status
```

Expected:
```
SYNCED  CDS  EDS  LDS  RDS  PILOT-VERSION
xxxxx   SYNCED  SYNCED  SYNCED  SYNCED  1.24.3
```

### Run Istio Proxy Analysis:
```bash
istioctl analyze -n microservices
```

If everything is correct, you should see:
```
Info [IST0001] No validation issues found when analyzing namespace: microservices.
```

## 13.6 Verifying Istio Components

### Check Istio Pods:
```bash
kubectl get pods -n istio-system
```

Expected:
```
NAME                                    READY   STATUS    RESTARTS   AGE
istio-egressgateway-xxxxxxxxx-xxxxx     1/1     Running   0          10m
istio-ingressgateway-xxxxxxxxx-xxxxx    1/1     Running   0          10m
istiod-xxxxxxxxx-xxxxx                  1/1     Running   0          10m
```

### Check Istio Services:
```bash
kubectl get svc -n istio-system
```

Expected:
```
NAME                   TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)                                                                      AGE
istio-egressgateway    ClusterIP      10.96.x.x       <none>        80/TCP,443/TCP                                                               10m
istio-ingressgateway   LoadBalancer   10.96.x.x       <pending>     15021:3xxxx/TCP,80:3xxxx/TCP,443:3xxxx/TCP,31400:3xxxx/TCP,15443:3xxxx/TCP   10m
istiod                 ClusterIP      10.96.x.x       <none>        15010/TCP,15012/TCP,443/TCP,15014/TCP                                        10m
```

### Check Istio Version:
```bash
istioctl version
```

Expected:
```
client version: 1.24.3
control plane version: 1.24.3
data plane version: 1.24.3 (2 proxies)
```

## 13.7 Common Istio Problems and Solutions

### Problem: Pod has only 1 container (no sidecar)
```bash
# Check namespace label
kubectl get namespace microservices --show-labels

# Fix: Add the label
kubectl label namespace microservices istio-injection=enabled

# Restart pods
kubectl rollout restart deployment -n microservices
```

### Problem: istiod CrashLoopBackOff
```bash
kubectl logs -n istio-system deployment/istiod
# Usually caused by missing CRDs or resource limits
```

### Problem: VirtualService/DestinationRule not working
```bash
# Check if resources exist
kubectl get virtualservice,destinationrule,gateway -n microservices

# Analyze for issues
istioctl analyze -n microservices
```

---

# Chapter 14: Step 12 — Istio Traffic Management

## 14.1 The Gateway

```yaml
# kubernetes/base/istio/gateway.yaml
apiVersion: networking.istio.io/v1
kind: Gateway
metadata:
  name: frontend-gateway
  namespace: microservices
spec:
  selector:
    istio: ingressgateway
  servers:
    - port:
        number: 80
        name: http
        protocol: HTTP
      hosts:
        - "*"
```

**What this does:** Configures Istio's ingress gateway to accept HTTP traffic on port 80 from any host. This is the "front door" for Istio-managed traffic.

## 14.2 Destination Rules

Destination Rules define HOW traffic reaches specific subsets of a service.

### Canary Destination Rule:
```yaml
# kubernetes/base/istio/destinationrule-canary.yaml
apiVersion: networking.istio.io/v1
kind: DestinationRule
metadata:
  name: frontend
  namespace: microservices
spec:
  host: frontend
  subsets:
    - name: stable
      labels:
        version: stable
    - name: canary
      labels:
        version: canary
```

**What this does:** Defines two subsets for the `frontend` service:
- `stable` — Pods with label `version: stable`
- `canary` — Pods with label `version: canary`

### Blue-Green Destination Rule:
```yaml
# kubernetes/base/istio/destinationrule-bluegreen.yaml
apiVersion: networking.istio.io/v1
kind: DestinationRule
metadata:
  name: frontend-bluegreen
  namespace: microservices
spec:
  host: frontend
  subsets:
    - name: blue
      labels:
        version: blue
    - name: green
      labels:
        version: green
```

### PostgreSQL Destination Rule:
```yaml
# kubernetes/base/istio/destinationrule-postgres.yaml
apiVersion: networking.istio.io/v1
kind: DestinationRule
metadata:
  name: postgres-tcp
  namespace: microservices
spec:
  host: postgres-headless.microservices.svc.cluster.local
  trafficPolicy:
    tls:
      mode: DISABLE
```

**What this does:** Disables Istio's TLS for PostgreSQL traffic because PostgreSQL does not support Istio's mutual TLS.

## 14.3 Virtual Services

Virtual Services define WHERE traffic goes.

### Canary Virtual Service:
```yaml
# kubernetes/base/istio/virtualservice-canary.yaml
apiVersion: networking.istio.io/v1
kind: VirtualService
metadata:
  name: frontend
  namespace: microservices
spec:
  hosts:
    - "*"
  gateways:
    - frontend-gateway
  http:
    - route:
        - destination:
            host: frontend
            subset: stable
          weight: 90
        - destination:
            host: frontend
            subset: canary
          weight: 10
```

**What this does:** Sends 90% of traffic to `stable` and 10% to `canary`.

### Blue-Green Virtual Service:
```yaml
# kubernetes/base/istio/virtualservice-bluegreen.yaml
apiVersion: networking.istio.io/v1
kind: VirtualService
metadata:
  name: frontend-bluegreen
  namespace: microservices
spec:
  hosts:
    - "*"
  gateways:
    - frontend-gateway
  http:
    - route:
        - destination:
            host: frontend
            subset: blue
          weight: 0
        - destination:
            host: frontend
            subset: green
          weight: 100
```

**What this does:** Sends 100% of traffic to `green`. This is blue-green deployment where you switch all traffic at once.

## 14.4 Service Entry

```yaml
# kubernetes/base/istio/serviceentry-postgres.yaml
apiVersion: networking.istio.io/v1
kind: ServiceEntry
metadata:
  name: postgres-tcp
  namespace: microservices
spec:
  hosts:
    - postgres-headless.microservices.svc.cluster.local
  location: MESH_INTERNAL
  ports:
    - number: 5432
      name: tcp-postgres
      protocol: TCP
  resolution: DNS
```

**What this does:** Tells Istio that PostgreSQL is an internal service in the mesh. Without this, Istio might not know how to route traffic to PostgreSQL.

## 14.5 Telemetry

```yaml
# kubernetes/base/istio/telemetry.yaml
apiVersion: telemetry.istio.io/v1alpha1
kind: Telemetry
metadata:
  name: mesh-default
  namespace: microservices
spec:
  metrics:
  - providers:
    - name: prometheus
  tracing:
  - providers:
    - name: jaeger
  accessLogging:
  - providers:
    - name: otel
```

**What this does:** Configures Istio to send metrics to Prometheus, traces to Jaeger, and access logs to OpenTelemetry. (Note: These providers must be installed separately for full functionality.)

## 14.6 Verifying Istio Traffic Resources

```bash
# List all Istio resources
kubectl get gateway,virtualservice,destinationrule,serviceentry,telemetry -n microservices

# Describe a virtual service
kubectl describe virtualservice frontend -n microservices

# Analyze for issues
istioctl analyze -n microservices
```

---

# Chapter 15: Step 13 — Deployment Strategies

## 15.1 Why Deployment Strategies Matter

When you update an application, how do you do it? Options:
1. **Rolling Update** — Gradually replace old pods with new ones (Kubernetes default)
2. **Blue-Green** — Have two environments, switch traffic instantly
3. **Canary** — Send a small percentage of traffic to the new version first

## 15.2 Blue-Green Deployment

### Concept:
```
Before:
  [Blue (v1)] <-- 100% traffic

After (switch):
  [Blue (v1)] <-- 0% traffic
  [Green (v2)] <-- 100% traffic

Rollback:
  [Blue (v1)] <-- 100% traffic
  [Green (v2)] <-- 0% traffic
```

### Our Blue Deployment:
```yaml
# kubernetes/strategies/blue-green/frontend-blue/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-blue
  namespace: microservices
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
      version: blue
  template:
    metadata:
      labels:
        app: frontend
        version: blue
    spec:
      serviceAccountName: app-sa
      containers:
      - name: frontend
        image: ghcr.io/muhammadjaffar52/frontend:sha-c7332c3
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 80
```

### Our Green Deployment:
```yaml
# kubernetes/strategies/blue-green/frontend-green/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-green
  namespace: microservices
spec:
  replicas: 4
  selector:
    matchLabels:
      app: frontend
      version: green
  template:
    metadata:
      labels:
        app: frontend
        version: green
    spec:
      serviceAccountName: app-sa
      containers:
      - name: frontend
        image: ghcr.io/muhammadjaffar52/frontend:sha-c7332c3
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 80
```

### How Traffic Switches:
The VirtualService controls which version receives traffic:
```yaml
# Current: Green gets 100%
- destination:
    host: frontend
    subset: green
  weight: 100
```

To switch to blue:
```yaml
# Switch: Blue gets 100%
- destination:
    host: frontend
    subset: blue
  weight: 100
```

## 15.3 Canary Deployment

### Concept:
```
Step 1:
  [Stable v1] <-- 90% traffic
  [Canary v2] <-- 10% traffic

Step 2 (if no errors):
  [Stable v1] <-- 50% traffic
  [Canary v2] <-- 50% traffic

Step 3 (if no errors):
  [Stable v1] <-- 0% traffic
  [Canary v2] <-- 100% traffic
```

### Our Canary Deployment:
```yaml
# kubernetes/strategies/canary/frontend-canary/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-canary
  namespace: microservices
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
      version: canary
  template:
    metadata:
      labels:
        app: frontend
        version: canary
    spec:
      serviceAccountName: app-sa
      containers:
      - name: frontend
        image: ghcr.io/muhammadjaffar52/frontend:sha-c7332c3
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 80
```

### Traffic Splitting:
```yaml
# 90% to stable, 10% to canary
http:
  - route:
      - destination:
          host: frontend
          subset: stable
        weight: 90
      - destination:
          host: frontend
          subset: canary
        weight: 10
```

## 15.4 Verifying Deployment Strategies

```bash
# Check blue-green deployments
kubectl get deployments -n microservices -l app=frontend -o custom-columns=\
NAME:.metadata.name,\
REPLICAS:.spec.replicas,\
READY:.status.readyReplicas,\
VERSION:.spec.template.metadata.labels.version

# Check canary deployment
kubectl get deployments -n microservices -l version=canary

# Check Istio traffic configuration
kubectl get virtualservice -n microservices -o yaml | grep -A 20 "route:"
```

---

# Chapter 16: Step 14 — Disaster Recovery with Velero

## 16.1 What Is Disaster Recovery?

Disaster Recovery (DR) means: "If everything goes wrong, how do we recover?"

In our case:
1. We have a running platform
2. A disaster happens (someone deletes the entire namespace)
3. We need to restore everything from backup

## 16.2 Velero Architecture

```
Kubernetes Cluster (Kind)
    |
    v
[Namespace: microservices]
  Deployments, Services, Secrets, ConfigMaps, Istio Resources, RBAC...
    |
    v
Velero Backup
    |
    v
Velero Server (in velero namespace)
    |
    v
S3 API (AWS Plugin)
    |
    v
[LocalStack S3]  (Local AWS emulation)
    Bucket: velero-backups
```

## 16.3 Components

| Component | Purpose |
|-----------|---------|
| Velero | Backup and restore controller |
| AWS Plugin | S3-compatible storage integration |
| LocalStack | Local AWS services emulation (S3) |
| S3 Bucket | Where backups are stored |

## 16.4 Prerequisites

### Start LocalStack:
```bash
# If using docker-compose
cd infrastructure/localstack
docker compose up -d

# Verify
docker ps | grep localstack
```

### Create S3 Bucket:
```bash
aws --endpoint-url=http://localhost:4566 s3 mb s3://velero-backups
```

### Install Velero:
```bash
velero install \
  --provider aws \
  --bucket velero-backups \
  --secret-file ./credentials-velero \
  --backup-location-config region=us-east-1,s3ForcePathStyle=true,s3Url=http://localstack.default:4566 \
  --snapshot-location-config region=us-east-1 \
  --use-node-agent
```

## 16.5 Creating a Backup

```bash
# Backup the entire microservices namespace
velero backup create microservices-backup \
  --include-namespaces microservices

# Wait for backup to complete
velero backup get
```

Expected:
```
NAME                  STATUS      ERRORS   WARNINGS   AGE     EXPIRES   STORAGE LOCATION   SELECTOR
microservices-backup   Completed   0        0          2m      30d       default            <none>
```

### Detailed Backup Info:
```bash
velero backup describe microservices-backup --details
```

### View Backup Logs:
```bash
velero backup logs microservices-backup
```

### Verify Backup in S3:
```bash
aws --endpoint-url=http://localhost:4566 s3 ls s3://velero-backups --recursive
```

Expected files:
```
backups/microservices-backup/velero-backup.json
backups/microservices-backup/backup.tar.gz
backups/microservices-backup/logs.gz
backups/microservices-backup/resource-list.json.gz
backups/microservices-backup/results.gz
```

## 16.6 Simulating Disaster

```bash
# Delete the entire microservices namespace
kubectl delete namespace microservices

# Verify it is gone
kubectl get ns microservices
# Error: NotFound

# Verify resources are gone
kubectl get all -n microservices
# Error: NotFound
```

## 16.7 Restoring from Backup

```bash
# Restore
velero restore create --from-backup microservices-backup

# Wait for restore to complete
velero restore get
```

Expected:
```
NAME                          STATUS      ERRORS   WARNINGS   AGE
restore-microservices-backup   Completed   0        0          1m
```

### Verify Recovery:
```bash
# Check namespace is back
kubectl get ns microservices

# Check pods are running
kubectl get pods -n microservices

# Check all resources
kubectl get all -n microservices
kubectl get secrets -n microservices
kubectl get configmap -n microservices
kubectl get networkpolicy -n microservices
kubectl get sa -n microservices
kubectl get role,rolebinding -n microservices
kubectl get gateway,virtualservice,destinationrule -n microservices
```

**Everything should be restored to its exact pre-disaster state.**

---

# Chapter 17: Step 15 — Troubleshooting and Common Issues

## 17.1 Problem: Pods Stuck in Pending

### Check:
```bash
kubectl get pods -n <namespace> | grep Pending
kubectl describe pod <pod-name> -n <namespace>
```

### Common Causes:
1. **Node affinity mismatch** — Pod requires a specific node label
2. **Insufficient resources** — Not enough CPU/memory
3. **PVC not bound** — PersistentVolumeClaim waiting for storage

### Example: NGINX Ingress stuck in Pending
```bash
# Symptom
kubectl get pods -n ingress-nginx
# ingress-nginx-controller-xxx   0/1   Pending

# Cause
kubectl describe pod -n ingress-nginx ingress-nginx-controller-xxx | grep -A 5 Events
# 0/3 nodes are available: 3 node(s) didn't match Pod's node affinity/selector

# Fix
kubectl label node cloudnative-control-plane ingress-ready=true
```

## 17.2 Problem: Pods in CrashLoopBackOff

### Check:
```bash
kubectl get pods -n <namespace> | grep CrashLoop
kubectl logs -n <namespace> <pod-name> --previous
```

### Common Causes:
1. **Application error** — Code has a bug
2. **Missing environment variable** — ConfigMap/Secret not found
3. **Cannot connect to database** — DB pod is down or wrong hostname
4. **Liveness probe failing** — App not responding on health endpoint

### Example:
```bash
kubectl logs -n microservices user-service-xxx
# Error: connect ECONNREFUSED postgres-headless:5432

# Fix: Check if postgres is running
kubectl get pods -n microservices -l app=postgres
```

## 17.3 Problem: kube-proxy CrashLoopBackOff

### Check:
```bash
kubectl get pods -n kube-system -l k8s-app=kube-proxy
kubectl logs -n kube-system kube-proxy-xxx
```

### Symptom:
```
failed complete: too many open files
```

### Fix:
This is a kernel-level issue. Recreate the cluster:
```bash
kind delete cluster --name cloudnative
kind create cluster --name cloudnative --config infrastructure/kind/kind-config.yaml
```

## 17.4 Problem: ImagePullBackOff

### Check:
```bash
kubectl get pods -n <namespace> | grep ImagePull
kubectl describe pod <pod-name> -n <namespace>
```

### Common Causes:
1. **Image does not exist in registry** — Build and push it
2. **Wrong image name/tag** — Check the deployment YAML
3. **Registry not reachable** — Check containerd mirror config

### Example:
```bash
# The pods reference ghcr.io/muhammadjaffar52/frontend:sha-592c6ed
# But ghcr.io is not reachable from Kind nodes

# Fix: Configure containerd to mirror ghcr.io to local registry
# On each node:
docker exec <node> bash -c '
cat > /etc/containerd/config.toml << EOFCONF
[plugins."io.containerd.grpc.v1.cri".registry.mirrors."ghcr.io"]
  endpoint = ["http://local-registry:5000"]
EOFCONF
systemctl restart containerd
'
```

## 17.5 Problem: ArgoCD Application OutOfSync

### Check:
```bash
kubectl get applications -n argocd
```

### Fix:
```bash
# Manual sync
argocd app sync microservices

# Or let automatic sync handle it (if syncPolicy.automated is set)
```

## 17.6 Problem: ArgoCD Server CrashLoopBackOff

### Check:
```bash
kubectl logs -n argocd deployment/argocd-server
```

### Common Fix: Apply with server-side
```bash
kubectl apply -n argocd --server-side --force-conflicts \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

## 17.7 Problem: containerd Config Broken

### Check:
```bash
docker exec <node> systemctl status containerd
```

### Symptom:
```
kubelet: "unknown service runtime.v1.RuntimeService"
```

### Fix:
Copy a known-good config:
```bash
# From a working node
docker cp <working-node>:/etc/containerd/config.toml /tmp/good-config.toml

# To the broken node
docker cp /tmp/good-config.toml <broken-node>:/etc/containerd/config.toml
docker exec <broken-node> systemctl restart containerd
```

---

# Chapter 18: Complete Verification Checklist

## 18.1 Cluster Health

```bash
# Check nodes
kubectl get nodes
# All 3 nodes should be Ready

# Check system pods
kubectl get pods -n kube-system
# All pods should be Running

# Check kube-proxy on all nodes
kubectl get pods -n kube-system -l k8s-app=kube-proxy -o wide
# Should show 3 pods, one per node, all Running
```

## 18.2 NGINX Ingress

```bash
# Check pods
kubectl get pods -n ingress-nginx
# controller should be Running

# Check service
kubectl get svc -n ingress-nginx
# Should have NodePort type

# Test with demo app
curl -s http://localhost -H "Host: demo.local"
# Should return HTML content
```

## 18.3 Local Registry

```bash
# Check registry is running
docker ps | grep local-registry

# Check images
curl -s http://localhost:5001/v2/_catalog
# Should list all 7 services + demo-nginx
```

## 18.4 ArgoCD

```bash
# Check all ArgoCD pods
kubectl get pods -n argocd
# All should be Running

# Check applications
kubectl get applications -n argocd
# root-app, microservices, demo-nginx all Synced + Healthy

# Check projects
kubectl get appprojects -n argocd
# platform, applications should exist
```

## 18.5 Microservices

```bash
# Check all pods in microservices namespace
kubectl get pods -n microservices
# All should be Running (frontend, gateway, user-service, etc.)

# Check services
kubectl get svc -n microservices
# Should show frontend, gateway, user-service, product-service, etc.

# Check database
kubectl get pods -n microservices -l app=postgres
# postgres-0 should be Running
```

## 18.6 Security

```bash
# ServiceAccount
kubectl get sa -n microservices
# Should show app-sa

# RBAC
kubectl auth can-i get pods --as=system:serviceaccount:microservices:app-sa -n microservices
# yes

kubectl auth can-i delete pods --as=system:serviceaccount:microservices:app-sa -n microservices
# no

# Secrets
kubectl get secrets -n microservices
# Should show app-secret, postgres-secret

# Network Policies
kubectl get networkpolicy -n microservices
# Should show default-deny, gateway-to-user, etc.
```

## 18.7 Istio

```bash
# Check Istio pods
kubectl get pods -n istio-system
# istiod, istio-ingressgateway, istio-egressgateway all Running

# Check sidecar injection
kubectl get pods -n microservices -o jsonpath='{.items[0].spec.containers[*].name}'
# Should show: <app-name> istio-proxy

# Check Istio CRs
kubectl get gateway,virtualservice,destinationrule -n microservices
# Should show all Istio traffic resources

# Analyze
istioctl analyze -n microservices
# No errors
```

## 18.8 Full System Status Command

Run this single command to see everything:

```bash
echo "=== CLUSTER ===" && \
kubectl get nodes && \
echo "" && \
echo "=== ALL PODS ===" && \
kubectl get pods -A -o wide && \
echo "" && \
echo "=== ALL SERVICES ===" && \
kubectl get svc -A && \
echo "" && \
echo "=== ARGOCD APPS ===" && \
kubectl get applications -n argocd && \
echo "" && \
echo "=== ISTIO ===" && \
kubectl get pods -n istio-system && \
echo "" && \
echo "=== SECURITY ===" && \
kubectl get sa,role,rolebinding,networkpolicy,secret -n microservices && \
echo "" && \
echo "=== ISTIO TRAFFIC ===" && \
kubectl get gateway,virtualservice,destinationrule -n microservices
```

---

# Chapter 19: Interview Preparation

## 19.1 Architecture Questions

### Q: Explain the overall architecture of your platform.

**Answer:**
"Our platform is a microservices-based cloud-native application running on a Kind Kubernetes cluster with 3 nodes (1 control-plane + 2 workers).

Traffic flows: User -> NGINX Ingress/Istio Gateway -> Frontend (React) -> API Gateway -> Microservices (User, Product, Order, Payment) -> PostgreSQL.

We use ArgoCD for GitOps deployment, Istio for service mesh, NGINX Ingress for external access, and Velero for disaster recovery. Security is implemented with ServiceAccounts, RBAC, Secrets, SecurityContext, and NetworkPolicies."

### Q: What is GitOps and how do you use it?

**Answer:**
"GitOps means Git is the single source of truth for all infrastructure and application configuration. We use ArgoCD which watches our GitHub repository. When we push changes, ArgoCD automatically detects and applies them to the cluster. We use the App-of-Apps pattern where one root application manages child applications for microservices and demo-nginx."

### Q: Why did you choose Kind over Minikube?

**Answer:**
"Kind creates a multi-node cluster that more closely mirrors production. We have 1 control-plane + 2 worker nodes, which lets us test pod scheduling across nodes, test node affinity, and use features like taints and tolerations. It also starts faster than Minikube."

## 19.2 Security Questions

### Q: How have you secured your Kubernetes platform?

**Answer:**
"We implemented 5 layers:
1. ServiceAccount `app-sa` for pod identity
2. RBAC Role `app-reader` allowing only read access (get, list, watch)
3. Secrets for database credentials and API keys
4. Non-root container execution via USER node in Dockerfiles
5. NetworkPolicies implementing default-deny with explicit allow rules"

### Q: How do you verify RBAC is working?

**Answer:**
"Using `kubectl auth can-i`:
```bash
kubectl auth can-i get pods --as=system:serviceaccount:microservices:app-sa -n microservices
# yes
kubectl auth can-i delete pods --as=system:serviceaccount:microservices:app-sa -n microservices
# no
```"

## 19.3 Service Mesh Questions

### Q: What is Istio and why did you install it?

**Answer:**
"Istio is a service mesh that adds a proxy (Envoy) to every pod. It provides traffic management (canary, blue-green), security (mTLS), and observability (metrics, tracing). We installed it to manage traffic between our microservices without changing application code."

### Q: What is sidecar injection?

**Answer:**
"Sidecar injection automatically adds an Envoy proxy container to every pod in the namespace. We enabled it with `kubectl label namespace microservices istio-injection=enabled`. Each pod then has 2 containers: the application and the istio-proxy sidecar."

## 19.4 Deployment Strategy Questions

### Q: What is the difference between Blue-Green and Canary deployments?

**Answer:**
"Blue-Green: Two identical environments. 100% traffic goes to Blue. When ready, switch 100% to Green instantly. Rollback by switching back.

Canary: Gradually shift traffic. Start with 10% to new version, monitor for errors, then increase to 50%, then 100%. Allows safer, incremental rollouts."

## 19.5 Troubleshooting Questions

### Q: A pod is stuck in CrashLoopBackOff. What do you do?

**Answer:**
"1. Check logs: `kubectl logs <pod> --previous`
2. Check events: `kubectl describe pod <pod>`
3. Common causes: missing config, wrong env vars, app bugs, can't reach database
4. Fix the root cause and restart the pod"

### Q: kube-proxy was crashing with 'too many open files'. What happened?

**Answer:**
"This was a kernel-level iptables/nftables conflict on Kind nodes. The fix was to delete the corrupted cluster and recreate it. Recreating gives fresh nodes with clean kernel state."

---

# Chapter 20: Complete Command Reference

## 20.1 Cluster Management

```bash
# Create cluster
kind create cluster --name cloudnative --config infrastructure/kind/kind-config.yaml

# Delete cluster
kind delete cluster --name cloudnative

# Check cluster info
kubectl cluster-info

# Check nodes
kubectl get nodes

# Check all pods
kubectl get pods -A
```

## 20.2 Local Registry

```bash
# Start registry
docker run -d --restart=always -p 5001:5000 --name local-registry registry:2

# Stop/start registry
docker stop local-registry
docker start local-registry

# List images in registry
curl -s http://localhost:5001/v2/_catalog

# List tags for an image
curl -s http://localhost:5001/v2/frontend/tags/list

# Build and push all images
REGISTRY="localhost:5001"
for SERVICE in frontend gateway user-service product-service order-service payment-service; do
  docker build -t $REGISTRY/$SERVICE:1.0 apps/$SERVICE/
  docker push $REGISTRY/$SERVICE:1.0
done
docker build -t $REGISTRY/demo-nginx:v1 apps/demo-nginx/
docker push $REGISTRY/demo-nginx:v1
```

## 20.3 NGINX Ingress

```bash
# Install
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.12.1/deploy/static/provider/kind/deploy.yaml

# Label node
kubectl label node cloudnative-control-plane ingress-ready=true

# Check
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx
```

## 20.4 ArgoCD

```bash
# Install
kubectl create namespace argocd
kubectl apply -n argocd --server-side --force-conflicts \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Bootstrap
kubectl apply -f gitops/projects/platform.yaml
kubectl apply -f gitops/projects/applications.yaml
kubectl apply -f gitops/bootstrap/root-app.yaml

# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d && echo

# Port-forward UI
kubectl port-forward -n argocd svc/argocd-server 8080:443

# Check applications
kubectl get applications -n argocd
```

## 20.5 Microservices

```bash
# Check all pods
kubectl get pods -n microservices

# Check specific service
kubectl get pods -n microservices -l app=user-service

# Check services
kubectl get svc -n microservices

# Restart all deployments
kubectl rollout restart deployment -n microservices

# Check logs
kubectl logs -n microservices deployment/user-service
kubectl logs -n microservices deployment/gateway
kubectl logs -n microservices deployment/frontend

# Exec into a pod
kubectl exec -it <pod-name> -n microservices -- sh

# Check environment variables
kubectl exec -it <pod-name> -n microservices -- env | grep -E "DB_|JWT|API"
```

## 20.6 Istio

```bash
# Install
istioctl install --set profile=demo -y

# Enable sidecar injection
kubectl label namespace microservices istio-injection=enabled

# Check proxy status
istioctl proxy-status

# Analyze
istioctl analyze -n microservices

# Check Istio pods
kubectl get pods -n istio-system

# Check Istio resources
kubectl get gateway,virtualservice,destinationrule -n microservices
```

## 20.7 Security

```bash
# ServiceAccount
kubectl get sa -n microservices
kubectl get pod <pod> -n microservices -o jsonpath="{.spec.serviceAccountName}"

# RBAC
kubectl auth can-i get pods --as=system:serviceaccount:microservices:app-sa -n microservices
kubectl auth can-i delete pods --as=system:serviceaccount:microservices:app-sa -n microservices

# Secrets
kubectl get secrets -n microservices
kubectl get secret app-secret -n microservices -o jsonpath="{.data.DB_PASSWORD}" | base64 -d

# Network Policies
kubectl get networkpolicy -n microservices
kubectl describe networkpolicy default-deny -n microservices

# Non-root verification
kubectl exec -it <pod> -n microservices -- id
```

## 20.8 Deployment Strategies

```bash
# Apply blue-green
kubectl apply -k kubernetes/strategies/blue-green/frontend-blue/
kubectl apply -k kubernetes/strategies/blue-green/frontend-green/

# Apply canary
kubectl apply -k kubernetes/strategies/canary/frontend-canary/

# Check versions
kubectl get pods -n microservices -o custom-columns=\
NAME:.metadata.name,\
VERSION:.metadata.labels.version
```

## 20.9 Disaster Recovery

```bash
# Create backup
velero backup create microservices-backup --include-namespaces microservices

# Check backup
velero backup get
velero backup describe microservices-backup --details

# Verify in S3
aws --endpoint-url=http://localhost:4566 s3 ls s3://velero-backups --recursive

# Simulate disaster
kubectl delete namespace microservices

# Restore
velero restore create --from-backup microservices-backup

# Check restore
velero restore get
velero restore describe restore-xxxxx --details
```

## 20.10 Troubleshooting

```bash
# Check pod events
kubectl describe pod <pod> -n <namespace>

# Check pod logs (current)
kubectl logs -n <namespace> <pod>

# Check pod logs (previous crash)
kubectl logs -n <namespace> <pod> --previous

# Check node resources
kubectl top nodes
kubectl top pods -n <namespace>

# Check DNS resolution from inside a pod
kubectl exec -it <pod> -n microservices -- nslookup user-service

# Test connectivity between services
kubectl exec -it <pod> -n microservices -- wget -qO- http://user-service:3001/health

# Full system check
kubectl get pods -A -o wide
kubectl get events -A --sort-by='.lastTimestamp'
```

## 20.11 Full System Status

```bash
echo "=== CLUSTER ===" && \
kubectl get nodes && \
echo "" && \
echo "=== ALL PODS ===" && \
kubectl get pods -A -o wide && \
echo "" && \
echo "=== ALL SERVICES ===" && \
kubectl get svc -A && \
echo "" && \
echo "=== ARGOCD APPS ===" && \
kubectl get applications -n argocd && \
echo "" && \
echo "=== ISTIO ===" && \
kubectl get pods -n istio-system && \
echo "" && \
echo "=== SECURITY ===" && \
kubectl get sa,role,rolebinding,networkpolicy,secret -n microservices && \
echo "" && \
echo "=== ISTIO TRAFFIC ===" && \
kubectl get gateway,virtualservice,destinationrule -n microservices
```

---

# Appendix A: Project File Reference

## Complete File List

| File | Purpose |
|------|---------|
| `Makefile` | Automation commands for cluster, registry, deploy, LocalStack, Terraform |
| `infrastructure/kind/kind-config.yaml` | Kind cluster configuration (3 nodes, registry mirror) |
| `gitops/bootstrap/root-app.yaml` | ArgoCD root application (App of Apps) |
| `gitops/projects/platform.yaml` | ArgoCD project for platform (demo + argocd namespaces) |
| `gitops/projects/applications.yaml` | ArgoCD project for apps (all namespaces) |
| `gitops/applications/workloads/microservices.yaml` | ArgoCD Application for microservices |
| `gitops/applications/workloads/demo-nginx.yaml` | ArgoCD Application for demo-nginx |
| `kubernetes/base/kustomization.yaml` | Main Kustomize base (lists all resources) |
| `kubernetes/base/namespace/namespace.yaml` | microservices namespace |
| `kubernetes/base/security/serviceaccount/shared-sa.yaml` | ServiceAccount app-sa |
| `kubernetes/base/security/rbac/shared-role.yaml` | Role app-reader (get, list, watch) |
| `kubernetes/base/security/rbac/shared-rolebinding.yaml` | RoleBinding for app-sa |
| `kubernetes/base/security/secrets/app-secret.yaml` | Application secrets |
| `kubernetes/base/security/network-policies/default-deny.yaml` | Default deny all ingress |
| `kubernetes/base/security/network-policies/gateway-to-user.yaml` | Allow gateway to user-service |
| `kubernetes/base/security/network-policies/istio-ingress-to-frontend.yaml` | Allow Istio to frontend |
| `kubernetes/base/security/network-policies/allow-services-to-postgres.yaml` | Allow services to PostgreSQL |
| `kubernetes/base/frontend/deployment.yaml` | Frontend Deployment |
| `kubernetes/base/frontend/service.yaml` | Frontend Service |
| `kubernetes/base/frontend/configmap.yaml` | Frontend ConfigMap |
| `kubernetes/base/gateway/deployment.yaml` | Gateway Deployment |
| `kubernetes/base/gateway/service.yaml` | Gateway Service |
| `kubernetes/base/gateway/configmap.yaml` | Gateway ConfigMap (service URLs) |
| `kubernetes/base/user-service/deployment.yaml` | User Service Deployment |
| `kubernetes/base/user-service/service.yaml` | User Service Service |
| `kubernetes/base/user-service/configmap.yaml` | User Service ConfigMap |
| `kubernetes/base/product-service/deployment.yaml` | Product Service Deployment |
| `kubernetes/base/product-service/service.yaml` | Product Service Service |
| `kubernetes/base/product-service/configmap.yaml` | Product Service ConfigMap |
| `kubernetes/base/order-service/deployment.yaml` | Order Service Deployment |
| `kubernetes/base/order-service/service.yaml` | Order Service Service |
| `kubernetes/base/order-service/configmap.yaml` | Order Service ConfigMap |
| `kubernetes/base/payment-service/deployment.yaml` | Payment Service Deployment |
| `kubernetes/base/payment-service/service.yaml` | Payment Service Service |
| `kubernetes/base/payment-service/configmap.yaml` | Payment Service ConfigMap |
| `kubernetes/base/postgres/statefulset.yaml` | PostgreSQL StatefulSet |
| `kubernetes/base/postgres/service.yaml` | PostgreSQL Service |
| `kubernetes/base/postgres/service-headless.yaml` | PostgreSQL Headless Service |
| `kubernetes/base/postgres/secrets.yaml` | PostgreSQL Secrets |
| `kubernetes/base/postgres/configmap.yaml` | PostgreSQL init.sql |
| `kubernetes/base/postgres/pvc.yaml` | PostgreSQL PersistentVolumeClaim |
| `kubernetes/base/demo-nginx/deployment.yaml` | Demo Nginx Deployment |
| `kubernetes/base/demo-nginx/service.yaml` | Demo Nginx Service |
| `kubernetes/base/demo-nginx/ingress.yaml` | Demo Nginx Ingress |
| `kubernetes/base/demo-nginx/namespace.yaml` | Demo namespace |
| `kubernetes/base/istio/gateway.yaml` | Istio Gateway |
| `kubernetes/base/istio/virtualservice-canary.yaml` | VirtualService for canary |
| `kubernetes/base/istio/virtualservice-bluegreen.yaml` | VirtualService for blue-green |
| `kubernetes/base/istio/destinationrule-canary.yaml` | DestinationRule for canary |
| `kubernetes/base/istio/destinationrule-bluegreen.yaml` | DestinationRule for blue-green |
| `kubernetes/base/istio/destinationrule-postgres.yaml` | DestinationRule for PostgreSQL |
| `kubernetes/base/istio/serviceentry-postgres.yaml` | ServiceEntry for PostgreSQL |
| `kubernetes/base/istio/telemetry.yaml` | Telemetry configuration |
| `kubernetes/overlays/local/kustomization.yaml` | Local overlay (Kind) |
| `kubernetes/overlays/dev/kustomization.yaml` | Dev overlay |
| `kubernetes/overlays/stage/kustomization.yaml` | Stage overlay |
| `kubernetes/overlays/prod/kustomization.yaml` | Production overlay |
| `kubernetes/strategies/blue-green/frontend-blue/deployment.yaml` | Blue deployment |
| `kubernetes/strategies/blue-green/frontend-green/deployment.yaml` | Green deployment |
| `kubernetes/strategies/canary/frontend-canary/deployment.yaml` | Canary deployment |
| `apps/frontend/` | React frontend source code |
| `apps/gateway/` | API Gateway source code |
| `apps/user-service/` | User Service source code |
| `apps/product-service/` | Product Service source code |
| `apps/order-service/` | Order Service source code |
| `apps/payment-service/` | Payment Service source code |
| `apps/demo-nginx/` | Demo Nginx source code |

---

# Appendix B: Port Reference

| Service | Port | Protocol |
|---------|------|----------|
| Frontend | 80 | HTTP |
| Gateway | 8000 | HTTP |
| User Service | 3001 | HTTP |
| Product Service | 3002 | HTTP |
| Order Service | 3003 | HTTP |
| Payment Service | 3004 | HTTP |
| PostgreSQL | 5432 | TCP |
| NGINX Ingress | 80, 443 | HTTP, HTTPS |
| Istio Ingress Gateway | 80, 443, 15021, 31400, 15443 | HTTP/HTTPS |
| Istiod | 15010, 15012, 443, 15014 | HTTP/HTTPS |
| ArgoCD Server | 8080 (forwarded) | HTTPS |
| Local Registry | 5001 | HTTP |

---

# Appendix C: Namespace Reference

| Namespace | Purpose | Components |
|-----------|---------|------------|
| kube-system | Kubernetes system | CoreDNS, kube-proxy, etcd, API server |
| argocd | ArgoCD deployment | argocd-server, argocd-repo-server, etc. |
| istio-system | Istio control plane | istiod, istio-ingressgateway, istio-egressgateway |
| ingress-nginx | NGINX Ingress Controller | ingress-nginx-controller |
| microservices | Application workloads | frontend, gateway, services, postgres |
| demo | Demo application | demo-nginx |
| local-path-storage | Dynamic provisioning | local-path-provisioner |

---

# Appendix D: Troubleshooting Quick Reference

| Symptom | Command | Fix |
|---------|---------|-----|
| Pod Pending | `kubectl describe pod <pod>` | Check node affinity, resources, PVC |
| CrashLoopBackOff | `kubectl logs <pod> --previous` | Check logs, fix application error |
| ImagePullBackOff | `kubectl describe pod <pod>` | Check image name, registry access |
| NotReady node | `kubectl describe node <name>` | Check kubelet, containerd status |
| ArgoCD OutOfSync | `kubectl get applications -n argocd` | Manual sync or wait for auto-sync |
| No sidecar injection | `kubectl get namespace --show-labels` | Add istio-injection=enabled label |
| Service unreachable | `kubectl exec -it <pod> -- nslookup <svc>` | Check DNS, network policy |

---

# Appendix E: Complete Restart Guide

## Stopping the Entire Platform

To shut down everything completely:

```bash
# Step 1: Delete the Kind cluster (removes all pods, services, configs)
kind delete cluster --name cloudnative

# Step 2: Stop the local registry (images are preserved on disk)
docker stop local-registry
```

After stopping, nothing remains running:
- No Kubernetes cluster
- No pods, services, or configs
- Registry is stopped but images are preserved

## What Is Preserved When You Stop?

| Resource | Preserved? | Details |
|----------|-----------|---------|
| Docker images in registry | Yes | Images stay in registry container volume |
| Application source code | Yes | Files in `apps/` directory unchanged |
| Kubernetes YAML configs | Yes | All files in `kubernetes/`, `gitops/` unchanged |
| Cluster state | No | Deleted with `kind delete cluster` |
| PostgreSQL data | No | Data in the pod is gone |
| ArgoCD state | No | Deleted with cluster |

## Restarting Everything from Scratch

If you stopped everything and want to restart:

### Step 1: Start the Local Registry
```bash
# Start the registry (images are still there)
docker start local-registry

# Verify it is running
docker ps | grep local-registry

# Check images are still there
curl -s http://localhost:5001/v2/_catalog
```

### Step 2: Create the Kind Cluster
```bash
# Create fresh 3-node cluster
kind create cluster --name cloudnative --config infrastructure/kind/kind-config.yaml

# Verify all 3 nodes are Ready
kubectl get nodes

# Verify kube-proxy is running on all nodes
kubectl get pods -n kube-system -l k8s-app=kube-proxy
```

### Step 3: Install NGINX Ingress Controller
```bash
# Install
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.12.1/deploy/static/provider/kind/deploy.yaml

# Label control-plane node for ingress scheduling
kubectl label node cloudnative-control-plane ingress-ready=true

# Wait for controller to be Running
kubectl wait --namespace ingress-nginx --for=condition=ready pod -l app.kubernetes.io/component=controller --timeout=120s
```

### Step 4: Configure containerd for ghcr.io mirror
```bash
# Apply ghcr.io mirror config to all 3 nodes
for node in cloudnative-control-plane cloudnative-worker cloudnative-worker2; do
  docker exec "$node" bash -c '
    cat > /etc/containerd/config.toml << EOFCONF
version = 2

[plugins]
  [plugins."io.containerd.grpc.v1.cri"]
    restrict_oom_score_adj = false
    sandbox_image = "registry.k8s.io/pause:3.10"
    tolerate_missing_hugepages_controller = true
    [plugins."io.containerd.grpc.v1.cri".containerd]
      default_runtime_name = "runc"
      discard_unpacked_layers = true
      snapshotter = "overlayfs"
      [plugins."io.containerd.grpc.v1.cri".containerd.runtimes]
        [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
          base_runtime_spec = "/etc/containerd/cri-base.json"
          runtime_type = "io.containerd.runc.v2"
          [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
            SystemdCgroup = true
        [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.test-handler]
          base_runtime_spec = "/etc/containerd/cri-base.json"
          runtime_type = "io.containerd.runc.v2"
          [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.test-handler.options]
            SystemdCgroup = true
    [plugins."io.containerd.grpc.v1.cri".registry]
      [plugins."io.containerd.grpc.v1.cri".registry.mirrors]
        [plugins."io.containerd.grpc.v1.cri".registry.mirrors."localhost:5001"]
          endpoint = ["http://local-registry:5000"]
        [plugins."io.containerd.grpc.v1.cri".registry.mirrors."ghcr.io"]
          endpoint = ["http://local-registry:5000"]

[proxy_plugins]
  [proxy_plugins.fuse-overlayfs]
    address = "/run/containerd-fuse-overlayfs.sock"
    type = "snapshot"
EOFCONF
  systemctl restart containerd
' 2>&1
  echo "$node: done"
done

# Wait for all 3 nodes to become Ready again
sleep 45
kubectl get nodes
```

### Step 5: Install ArgoCD
```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD with server-side apply
kubectl apply -n argocd --server-side --force-conflicts \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD pods to be ready
kubectl wait --namespace argocd --for=condition=ready pod \
  -l app.kubernetes.io/name=argocd-server --timeout=180s
```

### Step 6: Bootstrap GitOps with ArgoCD
```bash
# Apply ArgoCD projects
kubectl apply -f gitops/projects/platform.yaml
kubectl apply -f gitops/projects/applications.yaml

# Apply root application
kubectl apply -f gitops/bootstrap/root-app.yaml

# Wait for ArgoCD to sync (this deploys ALL microservices)
sleep 90

# Check all applications are Synced and Healthy
kubectl get applications -n argocd
```

### Step 7: Install Istio
```bash
# Ensure istioctl is available
export PATH="/tmp/istio-1.24.3/bin:$PATH"
which istioctl || (curl -sL https://github.com/istio/istio/releases/download/1.24.3/istio-1.24.3-linux-amd64.tar.gz -o /tmp/istio.tar.gz && tar xzf /tmp/istio.tar.gz -C /tmp/ && export PATH="/tmp/istio-1.24.3/bin:$PATH")

# Install Istio demo profile
istioctl install --set profile=demo -y
```

### Step 8: Enable Istio Sidecar Injection
```bash
# Label the namespace for automatic sidecar injection
kubectl label namespace microservices istio-injection=enabled

# Restart all deployments to inject the sidecar
kubectl rollout restart deployment -n microservices

# Wait for all pods to be ready with sidecar
sleep 60
kubectl get pods -n microservices
```

### Step 9: Verify Everything is Running

```bash
# Run the full system check
kubectl get nodes && \
echo "---" && \
kubectl get pods -A --no-headers | grep -v Running | grep -v Completed && \
echo "ALL PODS RUNNING ✓" && \
echo "---" && \
kubectl get applications -n argocd && \
echo "---" && \
istioctl proxy-status
```

## Quick One-Line Restart (If You Are Confident)

If you just want to rebuild from scratch fast, run this entire block:

```bash
kind delete cluster --name cloudnative
kind create cluster --name cloudnative --config infrastructure/kind/kind-config.yaml && \
docker start local-registry && \
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.12.1/deploy/static/provider/kind/deploy.yaml && \
kubectl label node cloudnative-control-plane ingress-ready=true && \
kubectl create namespace argocd && \
kubectl apply -n argocd --server-side --force-conflicts \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml && \
kubectl apply -f gitops/projects/platform.yaml && \
kubectl apply -f gitops/projects/applications.yaml && \
kubectl apply -f gitops/bootstrap/root-app.yaml && \
echo "Cluster, Ingress, ArgoCD installed. Run Istio install separately."
```

**Note:** After the quick restart, you still need to:
1. Configure containerd ghcr.io mirror (Step 4)
2. Install Istio (Step 7)
3. Enable sidecar injection (Step 8)

---

**End of Documentation**

*This document covers the complete CloudNative Platform project from cluster creation to disaster recovery. It includes every command, every configuration file, and every verification step needed to understand, stop, and restart the platform from scratch.*
