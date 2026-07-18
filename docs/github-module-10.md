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

Module 13 – CI/CD Pipeline with GitHub Actions & GitOps
Objective

Build a complete production-style CI/CD pipeline that:

Automatically builds Docker images
Scans source code and Docker images for vulnerabilities
Pushes secure images to GitHub Container Registry (GHCR)
Updates Kubernetes manifests automatically
Commits updated manifests back to GitHub
Lets Argo CD detect the Git change
Automatically deploys the new version into Kubernetes

This follows the GitOps model where Git is the single source of truth.

Architecture
Developer
    │
git push
    │
    ▼
GitHub Repository
    │
    ▼
GitHub Actions
    │
    ├───────────────┐
    │               │
Checkout Code      Matrix Build (6 Services)
                    │
                    ▼
            Docker Build
                    │
                    ▼
        Trivy Filesystem Scan
                    │
                    ▼
          Trivy Image Scan
                    │
                    ▼
       Push Image to GHCR
                    │
                    ▼
      Update deployment.yaml
                    │
                    ▼
       Commit Updated SHA Tag
                    │
                    ▼
             GitHub Repository
                    │
                    ▼
                Argo CD
                    │
                    ▼
             Kubernetes Cluster
                    │
                    ▼
             Rolling Update
                    │
                    ▼
              New Running Pods
Technologies Used
GitHub Actions
Docker Buildx
Docker Metadata Action
Docker Login Action
GitHub Container Registry (GHCR)
Trivy
Kubernetes
Kustomize
Argo CD
GitOps
What We Built
1. GitHub Actions Workflow

Created

.github/workflows/ci.yml

This workflow automatically executes whenever code is pushed.

2. Matrix Build

Instead of writing six separate jobs, we used a matrix.

Services

frontend

gateway

user-service

product-service

order-service

payment-service

GitHub Actions automatically creates one parallel job for each service.

Result

Build Frontend

Build Gateway

Build User-Service

Build Product-Service

Build Order-Service

Build Payment-Service
3. Checkout Repository

Purpose

Download repository into GitHub Runner.

Action

actions/checkout

Without this, the runner has no project files.

4. Docker Buildx

Purpose

Prepare Docker BuildKit.

Benefits

Faster builds
Better caching
Multi-platform support
Production standard
5. Docker Metadata

Purpose

Generate Docker image tags automatically.

Generated tags

latest

sha-xxxxxxxx

Example

frontend:latest

frontend:sha-43a59dc
Why SHA Tags?

Instead of

latest

we deploy

sha-43a59dc

Advantages

Immutable
Traceable
Rollback friendly
Production standard
6. Repository Variables

Verified

REGISTRY

Purpose

Understand GitHub Repository Variables.

7. Repository Secrets

Verified

DEMO_API_KEY

Purpose

Learn how GitHub securely stores sensitive values.

Never hardcode

Passwords
API Keys
Tokens
8. Docker Build

Each microservice builds independently.

Example

apps/frontend

apps/gateway

apps/user-service

Images are built locally on GitHub Runner.

9. Docker Image Verification

Used

docker images

Purpose

Verify successful image creation before scanning.

10. Trivy Filesystem Scan

Scans project source code.

Checks

Secrets
Vulnerabilities
Misconfigurations

Command

trivy fs .
11. Trivy Image Scan

Scans Docker image.

Checks

Installed packages
OS vulnerabilities
Critical CVEs

Command

trivy image IMAGE_NAME
Difference Between Two Trivy Scans

Filesystem Scan

Scans

Repository Source Code

Image Scan

Scans

Docker Image Layers

Both are important.

12. Push to GHCR

After scans succeed

Images are pushed

Example

ghcr.io/muhammadjaffar52/frontend:sha-43a59dc

and

ghcr.io/muhammadjaffar52/frontend:latest
13. Manifest Update Job

A second GitHub Actions job starts only after every image build succeeds.

Purpose

Update Kubernetes manifests automatically.

Example

Before

image:

frontend:sha-old

After

image:

frontend:sha-new
14. Compute SHA

Computed

git rev-parse --short HEAD

Generated

sha-43a59dc

This becomes the deployment image tag.

15. Update Deployment Files

Automatically updated

frontend

gateway

user-service

product-service

order-service

payment-service

deployment.yaml

using

sed
16. Commit Changes

GitHub Actions commits

Updated deployment files

back to GitHub.

Commit example

ci: update image tags to sha-43a59dc
17. Push Changes

GitHub Actions pushes

Updated manifests

back into

main

branch.

18. Argo CD

Argo CD continuously watches GitHub.

Workflow

Git Changed

↓

Argo Detects

↓

Sync

↓

Deploy

↓

Healthy

No manual

kubectl apply

required.

19. Kubernetes Rolling Update

Old Pods

↓

New Pods

↓

Traffic shifts

↓

Old Pods removed

No downtime.

Complete CI/CD Flow
Developer

↓

Git Push

↓

GitHub Actions

↓

Docker Build

↓

Filesystem Scan

↓

Docker Image Scan

↓

Push to GHCR

↓

Update deployment.yaml

↓

Commit Changes

↓

Push to GitHub

↓

ArgoCD

↓

Sync

↓

Kubernetes

↓

Rolling Update

↓

Application Updated
Production Concepts Learned
CI
CD
GitOps
Matrix Builds
Docker Metadata
SHA Tagging
Immutable Images
Security Scanning
Container Registry
GitHub Secrets
GitHub Variables
Automated Manifest Updates
Git Commit Automation
Git Push Automation
Argo CD Auto Sync
Kubernetes Rolling Updates
Problems We Faced
1. latest Tag

Problem

Deployment always pointed to latest.

Solution

Changed deployment to SHA tags.

2. Dynamic SHA

Problem

Every build creates new SHA.

Solution

GitHub Actions automatically updates deployment manifests.

3. InvalidImageName

Problem

Image repository name became invalid.

Cause

Repository owner name case mismatch / typo.

Example

MuhammadJaffar52

vs

muhammadjaffar52

and a typo like:

ghcr.io/juhammadjaffar52/...

Solution

Normalize the owner name (lowercase) and correct the image path.

4. ImagePullBackOff

Cause

Image not found in GHCR.

Solution

Correct image reference and rerun the pipeline.

5. Argo CD Degraded

Cause

Pods failed to start due to invalid image.

Solution

Fix image reference → GitHub Actions updated manifests → Argo CD synchronized successfully.

6. Old Pods Still Running

Reason

Rolling update keeps old ReplicaSet running until new Pods become healthy.

Understanding this behavior helped explain why both old and new Pods were visible during a failed rollout.

Commands Used
Verify Images
kubectl get deployment -n microservices \
-o custom-columns=NAME:.metadata.name,IMAGE:.spec.template.spec.containers[*].image
Verify Pods
kubectl get pods -n microservices
Verify Rollout
kubectl rollout status deployment/frontend -n microservices
Verify ArgoCD
kubectl get applications -n argocd
Verify Git Status
git status
Verify Commit
git log --oneline -5
Verify GHCR Image
docker pull ghcr.io/muhammadjaffar52/frontend:sha-43a59dc
Interview Questions
Basic
What is CI?
What is CD?
What is GitOps?
What is GitHub Actions?
What is a GitHub Runner?
What is a Matrix Build?
What are GitHub Secrets?
What are GitHub Variables?
What is Docker Buildx?
What is GHCR?
What is Trivy?
Why use SHA tags instead of latest?
Intermediate
Why separate CI from CD?
Why is Git considered the source of truth in GitOps?
How does Argo CD know something changed?
What happens when a deployment manifest changes?
What is the difference between a filesystem scan and an image scan?
Why is immutable image tagging important?
How does Kubernetes perform a rolling update?
What happens if a new Pod never becomes Ready?
Why does Argo CD show Degraded?
Troubleshooting
A deployment is stuck in ImagePullBackOff. How do you debug it?
GitHub Actions completed successfully, but Kubernetes wasn't updated. What do you check?
Argo CD shows OutOfSync. What could be the reasons?
Why might kubectl rollout status exceed its progress deadline?
How do you verify which image tag a Deployment is using?
What would you check if only one microservice failed to update while the others succeeded?
Key Takeaways

By completing this module, you can confidently explain and demonstrate:

A production-style CI pipeline using GitHub Actions.
Secure container image scanning with Trivy.
Publishing images to GHCR with immutable SHA tags.
Automated Kubernetes manifest updates.
GitOps-based continuous deployment with Argo CD.
Kubernetes rolling updates without manual kubectl apply.
Real-world troubleshooting of image and deployment issues.

This module forms the foundation for the next phase: advanced deployment strategies such as Rolling Update tuning, Recreate, Blue-Green, Canary, Rollbacks, and Zero-Downtime deployments.



Module 13 Interview Questions & Answers
CI/CD Basics
1. What is CI?

Simple Answer

CI (Continuous Integration) automatically builds and tests code whenever a developer pushes changes to Git.

Production Answer

Every code change is automatically validated before deployment.

2. What is CD?

Simple Answer

CD (Continuous Deployment/Delivery) automatically deploys the new version after CI succeeds.

In our project:

GitHub Actions updates Git.

ArgoCD deploys automatically.

3. Difference between CI and CD?

CI

Build
Test
Scan
Create Docker image

CD

Deploy
Update Kubernetes
Release application
4. What is GitOps?

Git becomes the source of truth.

Instead of manually changing Kubernetes,

we change Git.

ArgoCD watches Git and updates Kubernetes.

5. Why GitOps instead of kubectl apply?

Because:

Version control
Rollback
Audit history
Automatic synchronization
No manual deployment
GitHub Actions
6. What is GitHub Actions?

GitHub Actions is GitHub's automation service.

It runs workflows automatically.

7. What is a Workflow?

A workflow is an automated pipeline.

Example

Push

↓

Build

↓

Scan

↓

Deploy
8. What triggers a workflow?

Events.

Example

on:
  push:

Whenever code is pushed,

workflow starts.

9. What is a Runner?

Runner is the machine that executes workflow jobs.

GitHub provides Ubuntu runners.

10. What is a Job?

A job is a group of related steps.

Example

Build Job

Update Manifest Job

11. What is a Step?

Each action inside a job.

Example

Checkout

Login

Build

Push

12. Why use Matrix Strategy?

Instead of writing six jobs,

one job builds all services.

Example

Frontend

Gateway

User

Product

Order

Payment

run in parallel.

13. Why is Matrix better?
Less code
Faster execution
Easier maintenance
Easy to add new services
Docker
14. Why build Docker images?

Because Kubernetes deploys containers,

not source code.

15. Why Docker Buildx?

Modern Docker builder.

Supports

Cache
Multi-platform
Faster builds
16. What is Docker Metadata Action?

Automatically creates Docker tags.

Example

latest

sha-43a59dc
Image Tags
17. Why not deploy latest?

Because latest changes.

You never know what version is running.

18. Why use SHA tag?

SHA never changes.

Example

frontend:sha-43a59dc

Advantages

Immutable
Easy rollback
Traceable
19. What is immutable image?

Image cannot change.

Same SHA

Same image forever.

GHCR
20. What is GHCR?

GitHub Container Registry.

Stores Docker images.

21. Why push images to GHCR?

Because Kubernetes pulls images from registry.

Security
22. What is Trivy?

Trivy is a security scanner.

It scans

Source code
Docker images
23. Difference between Trivy FS and Image Scan?

Filesystem

Scans project files.

Image Scan

Scans Docker image.

24. Why scan images?

To detect

Vulnerabilities
CVEs
Security risks

before deployment.

GitHub Secrets
25. What are GitHub Secrets?

Encrypted values.

Example

Passwords

API Keys

Tokens

26. Why not hardcode secrets?

Because anyone can read them.

Secrets stay encrypted.

GitHub Variables
27. Difference between Secret and Variable?

Variable

Not sensitive.

Secret

Sensitive.

GitOps
28. What happens after image push?

GitHub Actions

updates deployment YAML.

29. Why update deployment.yaml?

Because Kubernetes deploys whatever is written in Git.

30. Why commit back to Git?

Git should always represent the actual deployed version.

31. Who detects Git changes?

ArgoCD.

32. What does ArgoCD do?

Compares

Git

vs

Cluster.

If different,

it synchronizes.

33. What is Auto Sync?

ArgoCD deploys automatically.

No manual action.

34. What is Self Heal?

If someone manually changes Kubernetes,

ArgoCD restores it to match Git.

35. What is Prune?

Deletes resources removed from Git.

Kubernetes
36. What happens after ArgoCD sync?

Deployment starts Rolling Update.

37. What is Rolling Update?

Old Pods

↓

New Pods

↓

Traffic Shift

↓

Old Pods Removed

38. Why is Rolling Update good?

No downtime.

Users continue using application.

Troubleshooting
39. What is ImagePullBackOff?

Kubernetes cannot download image.

Reasons

Wrong tag

Wrong registry

Authentication

Image doesn't exist

40. What is InvalidImageName?

Image name format is incorrect.

Example

Wrong repository name

Wrong owner

Uppercase issues

Typo

41. Why did ArgoCD become Degraded?

Pods failed.

Deployment wasn't healthy.

42. How did you solve ImagePullBackOff?

Checked

Deployment image

↓

GHCR image

↓

Corrected image path

↓

Git Push

↓

GitHub Actions

↓

ArgoCD Sync

↓

Pods Running

43. How do you verify deployed image?
kubectl get deployment -n microservices \
-o custom-columns=NAME:.metadata.name,IMAGE:.spec.template.spec.containers[*].image
44. How do you verify ArgoCD?
kubectl get applications -n argocd

Expected

Synced

Healthy
45. How do you verify rollout?
kubectl rollout status deployment/frontend -n microservices
46. What is the complete flow of your project?
Developer

↓

Git Push

↓

GitHub Actions

↓

Checkout

↓

Matrix Build

↓

Docker Build

↓

Filesystem Scan

↓

Image Scan

↓

Push Images

↓

Update Deployment YAML

↓

Commit Changes

↓

Push Changes

↓

ArgoCD

↓

Sync

↓

Rolling Update

↓

Pods Running
Scenario-Based Questions
Q1: A developer pushes code. What happens next?

Answer:
GitHub Actions starts automatically, builds images, scans them, pushes them to GHCR, updates the Kubernetes manifests with the new SHA tag, commits the changes back to Git, and Argo CD detects the Git change and deploys the new version.

Q2: GitHub Actions succeeded, but Kubernetes still runs the old version. What do you check?

Answer:

Verify the manifest update job ran successfully.
Check that the new SHA tag was committed to Git.
Verify Argo CD is Synced.

Check the Deployment image:

kubectl get deployment -n microservices
Check the rollout status.
Q3: One microservice fails while the other five deploy successfully. What would you investigate?

Answer:

Image name and tag
GHCR image exists
Deployment YAML
Pod events (kubectl describe pod)
Container logs (kubectl logs)
GitHub Actions logs for that specific matrix job
Q4: Why did you choose SHA tags instead of latest?

Answer:
SHA tags are immutable and uniquely identify a build. They make deployments reproducible, simplify rollbacks, and let us know exactly which code version is running.

Q5: If someone manually changes a Deployment using kubectl edit, what happens?

Answer:
Because Argo CD has Auto Sync and Self Heal enabled, it detects that the cluster no longer matches Git and automatically changes the Deployment back to the version stored in the repository.

These questions closely match what junior and early mid-level DevOps interviewers ask when discussing a GitHub Actions + GitOps project. Since you implemented this pipeline yourself—including troubleshooting real deployment failures—you'll be able to answer them with practical examples rather than only theoretical knowledge.