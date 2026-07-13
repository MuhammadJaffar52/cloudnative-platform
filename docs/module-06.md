# Module 06 – GitOps with Argo CD

---

# Objective

In this module, we learned GitOps using Argo CD and integrated it with our GitHub repository.

Instead of manually deploying Kubernetes resources using `kubectl apply`, Argo CD continuously watches our Git repository and automatically keeps the Kubernetes cluster synchronized with the desired state stored in Git.

The goal of this module is to make Git the **Single Source of Truth** for our Kubernetes platform.

---

# What is GitOps?

Before GitOps:

Developer

↓

kubectl apply

↓

Kubernetes Cluster

The developer is responsible for deploying every change manually.

Problems:

- Manual work
- Human mistakes
- Configuration drift
- Difficult to audit changes

---

With GitOps:

Developer

↓

Git Commit

↓

Git Push

↓

GitHub Repository

↓

Argo CD

↓

Kubernetes Cluster

Now Git becomes the source of truth.

Argo CD continuously watches Git and automatically updates the cluster whenever changes are detected.

---

# What We Built

We installed Argo CD inside our Kind Kubernetes cluster.

Argo CD continuously monitors our GitHub repository.

Whenever a manifest changes in GitHub:

- Argo CD detects the change.
- Compares Git with the cluster.
- Synchronizes the cluster automatically.
- Keeps both states identical.

---

# Repository Structure

gitops/

├── bootstrap/
│
│   └── root-app.yaml
│
├── projects/
│
│   ├── platform.yaml
│
│   └── applications.yaml
│
└── applications/
    ├── platform/
    │
    └── workloads/
        └── demo-nginx.yaml

kubernetes/

└── base/
    └── demo-nginx/
        ├── deployment.yaml
        ├── service.yaml
        ├── namespace.yaml
        └── kustomization.yaml

---

# Understanding Each Folder

## gitops/

Contains Argo CD configuration.

These files tell Argo CD **what to manage**.

---

## kubernetes/

Contains Kubernetes manifests.

These files tell Kubernetes **what resources to create**.

---

# Application Flow

Step 1

We created an Argo CD Application.

demo-nginx.yaml

This file does NOT create Pods.

Instead, it tells Argo CD:

"Deploy everything located inside:

kubernetes/base/demo-nginx"

---

Step 2

Argo CD reads:

source:

path: kubernetes/base/demo-nginx

---

Step 3

Argo CD loads the Kubernetes manifests.

deployment.yaml

service.yaml

namespace.yaml

---

Step 4

Argo CD applies them to Kubernetes.

Equivalent to:

kubectl apply -k kubernetes/base/demo-nginx

---

Step 5

Pods are created.

Our application becomes Healthy and Synced.

---

# Desired State vs Actual State

Desired State

The configuration stored inside GitHub.

Example:

Replicas = 3

---

Actual State

The current state running inside Kubernetes.

---

Argo CD continuously compares both.

If both are equal:

Healthy

Synced

---

# Drift Detection

Suppose someone manually deletes the Deployment.

kubectl delete deployment demo-nginx -n demo

Now:

Git says:

Deployment should exist.

Cluster says:

Deployment is missing.

This difference is called:

Drift

---

# Self Healing

Argo CD detects the drift.

It automatically recreates the missing Deployment.

No manual intervention is required.

---

# Reconciliation

Every few seconds Argo CD performs:

Read Git

↓

Read Cluster

↓

Compare

↓

Difference?

↓

Yes

↓

Synchronize

↓

Cluster Fixed

This continuous process is called:

Reconciliation

---

# AppProject

Initially every application belongs to:

default

We created our own projects.

platform

applications

Purpose:

- Organize applications.
- Improve security.
- Control where applications can deploy.

---

# Repository Restriction

Inside AppProject we specified:

Only this GitHub repository is allowed.

This prevents unauthorized repositories from deploying applications.

---

# Destination Restriction

We also restricted deployment destinations.

Example:

Only:

demo namespace

or

argocd namespace

Applications cannot deploy anywhere else.

This improves platform security.

---

# App of Apps Pattern

Initially:

We manually created every Application.

Example:

kubectl apply -f demo-nginx.yaml

Later:

kubectl apply -f prometheus.yaml

kubectl apply -f grafana.yaml

As the platform grows this becomes repetitive.

---

Solution:

Root Application

The Root Application automatically creates child Applications.

Instead of:

You

↓

demo-nginx

↓

Prometheus

↓

Grafana

We have:

You

↓

root-app

↓

demo-nginx

↓

Prometheus

↓

Grafana

---

Current Example

Today our Root Application manages:

demo-nginx

Later it will also manage:

Ingress

Prometheus

Grafana

Loki

Cert Manager

External Secrets

Velero

No changes are required in the Root Application.

We simply add another child Application YAML into:

gitops/applications/

Argo CD automatically discovers it.

---

# Complete Workflow

Developer

↓

Git Commit

↓

Git Push

↓

GitHub

↓

Root Application

↓

Child Applications

↓

Kubernetes Manifests

↓

Deployment

↓

Pods

↓

Running Application

---

# Production Benefits

- Git becomes the single source of truth.
- Automatic synchronization.
- Self-healing platform.
- Easier auditing.
- Repeatable deployments.
- Better security using AppProjects.
- Scalable architecture using App of Apps.

---

# Real Production Issue Solved

During installation we faced:

ApplicationSet Controller CrashLoopBackOff

Reason:

Missing ApplicationSet CRD

Troubleshooting:

- Checked Pod status.
- Read controller logs.
- Verified CRDs.
- Reinstalled Argo CD.
- Confirmed healthy installation.

This provided valuable real-world troubleshooting experience.

---

# Commands Used Frequently

Install Application

kubectl apply -f application.yaml

View Applications

kubectl get applications -n argocd

Describe Application

kubectl describe application demo-nginx -n argocd

View Projects

kubectl get appprojects -n argocd

Delete Application

kubectl delete application demo-nginx -n argocd

Watch Resources

kubectl get applications -n argocd -w

---

# Interview Questions

Q. What is GitOps?

GitOps is a deployment methodology where Git is the single source of truth and changes are automatically synchronized to Kubernetes using tools like Argo CD.

---

Q. What is Argo CD?

Argo CD is a GitOps controller that continuously watches Git repositories and synchronizes Kubernetes clusters.

---

Q. What is Desired State?

The configuration stored in Git.

---

Q. What is Actual State?

The resources currently running inside Kubernetes.

---

Q. What is Drift?

A difference between Desired State and Actual State.

---

Q. What is Reconciliation?

The continuous process where Argo CD compares Git with the cluster and fixes any differences.

---

Q. What is Self-Healing?

Argo CD automatically restores deleted or modified resources so the cluster matches Git.

---

Q. What is an AppProject?

An AppProject groups Applications and defines security rules such as allowed repositories and deployment destinations.

---

Q. What is the App of Apps Pattern?

A Parent Application that automatically creates and manages multiple Child Applications, making large platforms easier to bootstrap and manage.

---

# Module Summary

In this module we transformed our Kubernetes deployment process from manual deployments to a fully GitOps-based workflow.

We learned how Argo CD continuously monitors GitHub, detects configuration drift, automatically synchronizes the cluster, enforces deployment policies through AppProjects, and scales application management using the App of Apps pattern.

This module forms the GitOps foundation for all future platform components.

---

# Next Module

Module 07 – Helm Package Manager

Topics:

- Why Helm exists
- Helm Charts
- Releases
- Values.yaml
- Installing applications using Helm
- Integrating Helm with Argo CD