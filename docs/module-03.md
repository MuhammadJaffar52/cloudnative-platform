# Module 03 – Local Container Registry & First Kubernetes Application

## Status

✅ Completed

---

# Objective

The objective of this module was to establish the complete local application deployment workflow.

Instead of pulling images from a public container registry like Docker Hub or Amazon ECR, we created our own local Docker Registry. This provides a development workflow similar to enterprise environments, where images are stored in a private registry before deployment.

We also built and deployed the first Kubernetes application using Kustomize, validating the complete path from source code to a running application inside the Kubernetes cluster.

---

# Why This Module Exists

Deploying applications to Kubernetes requires container images.

In production, these images are typically stored in a private registry such as:

- Amazon ECR
- Harbor
- GitHub Container Registry
- Azure Container Registry
- Google Artifact Registry

For local development, we implemented our own private Docker Registry.

This enables us to:

- Build images locally
- Store images locally
- Push images without internet dependency
- Simulate enterprise image management
- Prepare for future migration to Amazon ECR

---

# Architecture

```
Developer

     │

Docker Build

     │

Docker Image

     │

Local Docker Registry

     │

Kind Kubernetes Cluster

     │

containerd

     │

Deployment

     │

Pods

     │

Service

     │

Browser
```

---

# Repository Changes

The following project components were created during this module.

## Applications

```
apps/

└── demo-nginx/
    └── Dockerfile
```

---

## Kubernetes Manifests

```
kubernetes/

└── base/

    └── demo-nginx/

        ├── deployment.yaml
        ├── service.yaml
        ├── namespace.yaml
        └── kustomization.yaml
```

---

## Infrastructure

```
infrastructure/

└── kind/

    └── kind-config.yaml
```

The Kind configuration was updated to support the local registry by configuring a `containerd` registry mirror.

---

# What Was Built

## 1. Local Docker Registry

Created a private Docker Registry container.

Container Name

```
local-registry
```

Port

```
5001
```

Verification

```
docker ps
```

```
curl http://localhost:5001/v2/
```

Expected Output

```
{}
```

---

## 2. Registry Integration with Kind

Configured Kind so that Kubernetes nodes use the local registry when pulling images.

This eliminates the need to push images to Docker Hub during development.

The registry mirror was configured using:

```
containerdConfigPatches
```

inside

```
kind-config.yaml
```

This closely mirrors production registry configurations.

---

## 3. Docker Image

Created the first application image.

Application

```
demo-nginx
```

Image

```
localhost:5001/demo-nginx:1.0
```

Workflow

```
Dockerfile

↓

docker build

↓

docker tag

↓

docker push

↓

Local Registry
```

---

## 4. Kubernetes Namespace

Created a dedicated namespace.

Namespace

```
demo
```

Using separate namespaces provides:

- isolation
- organization
- easier RBAC management
- cleaner deployments

---

## 5. Deployment

Created a Deployment resource.

The Deployment manages:

- desired replicas
- rolling updates
- pod recovery
- application lifecycle

Configuration included:

- replicas
- labels
- selectors
- container image
- exposed port

---

## 6. Service

Created a ClusterIP Service.

Purpose:

- stable networking
- service discovery
- load balancing

Application traffic now flows through the Service instead of directly to Pods.

---

## 7. Kustomize

Instead of applying YAML files individually, we used Kustomize.

Directory

```
kubernetes/base/demo-nginx
```

Resources

```
namespace.yaml

deployment.yaml

service.yaml
```

Managed by

```
kustomization.yaml
```

Deployment

```
kubectl apply -k kubernetes/base/demo-nginx
```

Advantages

- reusable manifests
- overlays
- environment separation
- production-ready structure

---

## 8. Makefile Automation

Created automation targets to simplify repetitive commands.

Examples

```
make cluster-create

make cluster-delete

make deploy

make clean
```

This forms the basis for future platform automation.

---

# Problems Encountered

During implementation, several issues were encountered and resolved.

---

## Incorrect Repository Structure

Initially, Kubernetes manifests were accidentally created under:

```
apps/kubernetes/
```

This mixed application source code with infrastructure manifests.

### Solution

Moved manifests to

```
kubernetes/base/demo-nginx/
```

Final separation

```
apps/

Application source

kubernetes/

Deployment manifests
```

---

## Incorrect Working Directory

Several deployment commands failed because they were executed from nested directories.

Example

```
kubectl apply -k kubernetes/base/demo-nginx
```

failed when executed inside

```
apps/kubernetes/
```

### Solution

Execute commands from the project root.

---

## Port Already in Use

Port forwarding failed.

Reason

```
8080
```

was already occupied.

### Solution

Stopped the existing process or used another local port.

---

## Readiness Probe

During deployment, Pods briefly showed

```
Readiness probe failed
```

Reason

NGINX required a few seconds to start.

Resolution

Pods became Ready automatically after startup.

No configuration changes were required.

---

# Validation

The following validations were completed successfully.

---

## Cluster Health

```
kubectl get nodes
```

All nodes

```
Ready
```

---

## Pods

```
kubectl get pods -A
```

All system Pods

```
Running
```

Demo application

```
Running
```

---

## Deployment

```
kubectl get deployments -n demo
```

Replica count verified.

---

## Service

```
kubectl get svc -n demo
```

ClusterIP assigned successfully.

---

## Registry

```
curl http://localhost:5001/v2/
```

Registry responded successfully.

---

## Application

Accessed via

```
kubectl port-forward svc/demo-nginx 8080:80 -n demo
```

Opened

```
http://localhost:8080
```

Displayed

```
Welcome to nginx!
```

This confirmed:

- image pull
- deployment
- service
- networking
- Kubernetes functionality

---

# Deliverables

By the end of this module we achieved:

✅ Local Docker Registry

✅ Registry integration with Kind

✅ Private image storage

✅ Docker image build

✅ Docker image push

✅ Kubernetes Namespace

✅ Deployment

✅ Service

✅ Kustomize deployment

✅ Working application

✅ Repository cleanup

✅ Makefile automation

---

# Key Learnings

This module introduced several important Platform Engineering concepts.

- Docker image lifecycle
- Container registries
- Private registries
- Kubernetes Deployments
- Kubernetes Services
- Namespaces
- Kustomize
- Port forwarding
- Image distribution
- Repository organization
- Local development workflow

---

# Production Mapping

| Local Development | AWS Equivalent |
|-------------------|----------------|
| Local Registry | Amazon ECR |
| Kind Cluster | Amazon EKS |
| Docker Build | CI/CD Pipeline |
| kubectl apply | ArgoCD Sync |
| Local Images | ECR Images |
| localhost | Route53 + ALB |

This mapping ensures that the architecture built locally can be migrated to AWS with minimal structural changes.

---hjghj

# Interview Questionshhh

You should now be able to answer questions such as:

- Why do we need a container registry?
- What is the purpose of containerd?
- Why use a private registry instead of Docker Hub?
- How does Kubernetes pull images?
- What is ImagePullPolicy?
- What is a Deployment?
- What is a Service?
- Why use a Namespace?
- What is Kustomize?
- Why use Kustomize instead of multiple YAML files?
- What is the difference between ClusterIP, NodePort, and LoadBalancer?
- How does port-forward work?
- Why separate application code from Kubernetes manifests?
- Why automate deployments with a Makefile?
- How would this local setup translate to AWS?

---

# Git Commit

```
git add .

git commit -m "feat: deploy first application using local registry and Kustomize"
```

---

# Summary

Module 03 marked the transition from infrastructure setup to application delivery.

We implemented the first complete deployment pipeline:

1. Built a Docker image.
2. Stored it in a private local registry.
3. Configured Kind to consume images from that registry.
4. Defined Kubernetes resources using Kustomize.
5. Deployed the application to the cluster.
6. Validated networking and application accessibility.

This establishes the foundation for all future modules, where additional platform components such as LocalStack, Terraform, Argo CD, observability, and service mesh will build upon this deployment workflow.

---

# Next Module

**Module 04 – Local AWS Cloud with LocalStack**

In the next module, we will introduce LocalStack to emulate core AWS services (such as S3, SQS, IAM, Secrets Manager, and DynamoDB) on the local machine. This allows us to develop and test cloud-native integrations without using an actual AWS account, preparing the project for a seamless migration to Amazon Web Services in later modules.