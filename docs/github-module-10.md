Module 13 — CI/CD with GitHub Actions (Documentation)

This document captures everything we completed so far in Module 13 before moving to the final automation stage.

Module Objective

Build a production-style CI pipeline that:

Builds Docker images
Scans code and images for vulnerabilities
Pushes images to GitHub Container Registry (GHCR)
Uses GitOps (Argo CD) for deployment
Prepares the project for fully automated Continuous Deployment
Architecture Before Module 13
Developer
     │
git push
     │
     ▼
GitHub Repository
     │
     ▼
Nothing happened automatically

Deployment was manual.

Images were built locally.

Kind pulled images from:

localhost:5001
Architecture After Module 13 (Current Progress)
Developer
     │
git push
     │
     ▼
GitHub Actions
     │
     ▼
Matrix Build
     │
     ▼
Trivy Scan
     │
     ▼
Push Images to GHCR
     │
     ▼
GitOps Repository
     │
     ▼
Argo CD
     │
     ▼
Kind Cluster

The only remaining automation is updating deployment manifests automatically.

Topics Covered
Git Fundamentals

Learned:

Working Directory
Staging Area
Local Repository
Remote Repository

Commands:

git add
git commit
git push
git pull
git fetch
git merge
git rebase
Branching Strategy

Implemented:

Feature Branch Workflow

main
   │
feature/module-13-github-actions

Learned:

Feature branches
Pull Requests
Merge
Branch deletion
Protected branches (concept)
GitHub Actions

Learned:

Workflow
Jobs
Steps
Runner
Triggers
GitHub-hosted Runner

Workflow execution:

git push

↓

GitHub creates Runner

↓

Repository checkout

↓

Execute workflow

↓

Destroy Runner

Important concept:

Every runner is temporary.

Nothing persists.

Buildx

Installed:

Docker Buildx

Purpose:

BuildKit
Better caching
Multi-platform support
Production Docker builds
Docker Metadata

Implemented:

docker/metadata-action

Generated automatically:

latest

sha-xxxxxxxx

Also generated OCI labels.

Benefits:

No manual tagging.

Matrix Strategy

Instead of writing six jobs:

frontend

gateway

user-service

product-service

order-service

payment-service

GitHub Actions automatically creates parallel jobs.

Result:

One workflow builds all services.

Repository Verification

Verified:

Current directory

pwd

Repository files

ls

GitHub workspace

Environment variables

Repository Variables

Repository Secrets

Purpose:

Understand GitHub Runner internals.

GitHub Repository Variables

Created:

REGISTRY

Accessed using:

${{ vars.REGISTRY }}
GitHub Repository Secrets

Created:

DEMO_API_KEY

Accessed using:

${{ secrets.DEMO_API_KEY }}

Purpose:

Secure sensitive values.

GitHub Container Registry (GHCR)

Configured:

Authentication

docker/login-action

Used:

GITHUB_TOKEN

Permissions:

contents: read

packages: write

Image naming:

ghcr.io/muhammadjaffar52/frontend
Docker Build

Implemented:

docker/build-push-action

Pipeline:

Checkout

↓

Metadata

↓

Build

↓

Verify
Trivy Security

Instead of GitHub Action:

Used:

Trivy CLI

Reason:

Same commands work everywhere.

Covered:

Filesystem Scan

trivy fs .

Image Scan

trivy image IMAGE

Learned:

Difference between:

Filesystem Scan

vs

Docker Image Scan

Severity:

LOW
MEDIUM
HIGH
CRITICAL
Push Images

Successfully pushed:

frontend
gateway
user-service
product-service
order-service
payment-service

To:

GHCR
GitOps Migration

Old deployment images:

localhost:5001/service:1.0

Migrated to:

ghcr.io/muhammadjaffar52/service:latest

Then verified SHA deployment:

ghcr.io/muhammadjaffar52/frontend:sha-09a3915
Argo CD Verification

Verified:

Application

Synced
Healthy

Observed:

Changing Deployment YAML

↓

Git Commit

↓

Argo CD detects change

↓

New ReplicaSet

↓

Rolling Update

↓

New Pod

This proved GitOps is working correctly.

Current Deployment Flow
Developer

↓

git push

↓

GitHub Actions

↓

Checkout

↓

Docker Metadata

↓

Build

↓

Trivy Filesystem Scan

↓

Trivy Image Scan

↓

Push Images to GHCR

↓

(Manual Deployment Manifest Update)

↓

Git Commit

↓

Argo CD

↓

Rolling Update

↓

Kind Cluster
What Is Left

Only one manual step remains:

Updating:

deployment.yaml

from

latest

to

sha-xxxxxxxx

This will be automated next.

Final Architecture (After Automation)
Developer
      │
git push
      │
      ▼
GitHub Actions
      │
Build Images
      │
Trivy Scan
      │
Push Images
      │
Update Deployment YAML
      │
Git Commit
      │
Git Push
      ▼
Argo CD
      ▼
Rolling Update
      ▼
Kind Cluster

No manual deployment.

What We Learned
CI vs CD
GitHub Actions architecture
GitHub Runner lifecycle
Docker Buildx
Docker Metadata
Matrix Strategy
GitHub Variables
GitHub Secrets
GHCR authentication
Docker image tagging
Trivy scanning
GitOps deployment flow
Argo CD synchronization
Rolling Updates
Scenario-Based Interview Questions
Git & GitHub Actions

Q1: A developer pushes code. Explain everything that happens until the workflow starts.

Q2: Why is actions/checkout required?

Q3: What happens if checkout is removed?

Q4: Explain the lifecycle of a GitHub-hosted runner.

Q5: Difference between a Job and a Step?

Q6: Why use a matrix strategy instead of six separate jobs?

Q7: Why are GitHub runners considered ephemeral?

Docker

Q8: Why use Docker Buildx instead of docker build?

Q9: What is BuildKit?

Q10: Why generate SHA tags?

Q11: Why should production avoid latest tags?

Q12: Difference between Docker image tags and image digests?

GHCR

Q13: How does GitHub Actions authenticate to GHCR?

Q14: Which permissions are required to push packages?

Q15: Where can you verify pushed images on GitHub?

Trivy

Q16: Difference between:

trivy fs

and

trivy image

Q17: Why scan before pushing?

Q18: Would you fail the pipeline on HIGH vulnerabilities?

Discuss trade-offs between strict security and developer productivity.

GitOps

Q19: Why not run kubectl apply directly from GitHub Actions?

Q20: Explain the complete GitOps workflow.

Q21: What is the source of truth in GitOps?

Q22: How does Argo CD detect changes?

Q23: What happens internally after Argo CD detects a new commit?

Q24: Why did changing the Deployment image create a new ReplicaSet?

Q25: How did you verify that a Rolling Update occurred?

Troubleshooting

Q26: GitHub Actions succeeded, but Kubernetes still runs the old image. Where would you investigate first?

Q27: Argo CD shows OutOfSync. What are the possible causes?

Q28: Pods are in ImagePullBackOff after updating the image. What would you check?

Q29: The workflow pushes an image successfully, but it never gets deployed. Which components would you inspect in order?

Expected reasoning:

GitHub Actions
GHCR
Git manifest update
Argo CD sync status
Deployment image
ReplicaSets
Pods
Events and logs

Q30: Why is updating Git manifests preferable to updating the cluster directly from GitHub Actions?

