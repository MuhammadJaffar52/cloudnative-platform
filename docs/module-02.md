# Module 02 – Local Kubernetes Cluster

## Status

✅ Completed

---

# Objective

Create a production-like local Kubernetes cluster using Kind.

Instead of a single-node cluster, a multi-node architecture was chosen to better simulate a real Kubernetes environment.

---

# Why Kind?

Kind provides:

- Lightweight Kubernetes
- Fast cluster creation
- Easy recreation
- Docker-based nodes
- Excellent local development experience

---

# Architecture

Ubuntu Host

↓

Docker

↓

Kind Cluster

├── Control Plane

├── Worker 1

└── Worker 2

---

# Cluster Configuration

Created:

infrastructure/kind/kind-config.yaml

Configured:

- Control Plane
- Two Worker Nodes
- Port mappings
- Networking
- Storage

---

# Cluster Creation

Cluster created using:

kind create cluster

---

# Validation

Verified:

- Nodes
- System Pods
- StorageClass
- Kubernetes API
- Cluster Info
- Networking

Commands used:

kubectl get nodes

kubectl get pods -A

kubectl cluster-info

kubectl get storageclass

---

# Deliverables

- Multi-node Kubernetes cluster
- Production-like topology
- Healthy Kubernetes environment

---

# Key Learnings

- Kubernetes architecture
- Control Plane
- Worker Nodes
- Storage
- Networking
- Kind configuration

---

# Next Module

Module 03 – Local Registry & First Deployment