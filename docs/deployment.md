Developer pushes a new image.

frontend:sha-abc123

Kubernetes detects:

"The Pod template changed."

It does not modify existing Pods.

Instead, it creates a new ReplicaSet.

Deployment

│

├── ReplicaSet v1

└── ReplicaSet v2

This is a key concept:

Deployments don't update Pods. Deployments create new ReplicaSets, and ReplicaSets create new Pods.

Internal Rollout Flow

Imagine you have:

ReplicaSet v1

Pod A

Pod B

Pod C

A new image is deployed.

Kubernetes creates:

ReplicaSet v2

Initially:

ReplicaSet v1

Pod A

Pod B

Pod C

ReplicaSet v2

(no Pods)

Then:

Create one new Pod

↓

Wait until Ready

↓

Delete one old Pod

↓

Repeat

Eventually:

ReplicaSet v1

0 Pods

ReplicaSet v2

Pod D

Pod E

Pod F

This gradual replacement is what avoids downtime.


Production Flow

Developer

↓

git push

↓

GitHub Actions

↓

Docker Build

↓

GHCR

↓

Manifest Updated

↓

Argo CD

↓

Deployment Updated

↓

New ReplicaSet

↓

New Pods

↓

Old Pods Removed

↓

Users Continue Using Application


Q1: Does a Deployment directly create Pods?

Answer:

No.

Deployment

↓

ReplicaSet

↓

Pods

The Deployment manages ReplicaSets, and ReplicaSets manage Pods.

Q2: Why are old ReplicaSets kept?

Answer:

To support fast rollbacks. Kubernetes can simply scale a previous ReplicaSet back up instead of rebuilding it.

Q3: When is a new ReplicaSet created?

Answer:

Whenever the Pod template (spec.template) changes, such as an image update, environment variable change, probe update, resource change, or label modification.

Q4:-n microservices Why don't existing Pods get updated?

Answer:

Pods are treated as immutable. Kubernetes replaces old Pods with new ones created from the updated template, ensuring predictable deployments and easy rollbacks.


What does maxSurge: 25% mean?

Suppose:

replicas = 4

25% of 4 is:

4 × 25% = 1

So Kubernetes is allowed to create 1 extra Pod during the update.

Normally:

4 Pods

During the update:

5 Pods

Example:

Before:

Old-1
Old-2
Old-3
Old-4

Kubernetes first creates a new Pod:

Old-1
Old-2
Old-3
Old-4
New-1

There are now 5 Pods, which is allowed because of maxSurge.

Once the new Pod is healthy, Kubernetes removes one old Pod.

Old-2
Old-3
Old-4
New-1

Back to 4 Pods.

Then it repeats the process.

Why create an extra Pod?

Because users continue receiving requests.

If you had only four Pods and deleted one first:

3 Pods serving traffic

Creating an extra Pod first helps maintain capacity while the update is happening.

What does maxUnavailable: 25% mean?

Again:

replicas = 4

25% of 4 = 1

So Kubernetes allows at most 1 Pod to be unavailable during the update.

If one Pod is being deleted or isn't ready yet, that's okay.

For example:

Old-1
Old-2
Old-3
Old-4

Delete one Pod:

Old-1
Old-2
Old-3

Only one Pod is unavailable, which is within the limit.

Kubernetes will not allow two Pods to be unavailable at the same time with these settings.

Timeline with 4 replicas
Initial

Old-1
Old-2
Old-3
Old-4

↓

Create one extra Pod (maxSurge = 1)

Old-1
Old-2
Old-3
Old-4
New-1

↓

Delete one old Pod (maxUnavailable = 1)

Old-2
Old-3
Old-4
New-1

↓

Create another new Pod

Old-2
Old-3
Old-4
New-1
New-2

↓

Delete another old Pod

Old-3
Old-4
New-1
New-2

This continues until all Pods run the new version.

Production example

Suppose your company has an e-commerce website with 100 Pods serving customers.

Configuration:

strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 25%
    maxUnavailable: 25%

During a deployment:

Kubernetes may temporarily run 125 Pods (100 desired + up to 25 extra).
It may have up to 25 Pods unavailable while replacing them.
At least 75 Pods continue serving traffic, so customers can keep using the site while the new version is rolled out.
Interview answer

What is maxSurge?

"maxSurge specifies how many extra Pods Kubernetes can create above the desired replica count during a RollingUpdate. This helps keep application capacity available while new Pods are starting."

What is maxUnavailable?

"maxUnavailable specifies the maximum number of Pods that can be unavailable during a RollingUpdate. It controls how much temporary reduction in service capacity is allowed while old Pods are being replaced."


Interview Questions

Q1: What is a Kubernetes rollback?

Answer: Restoring a Deployment to a previously working revision.

Q2: Which command performs a rollback?

kubectl rollout undo deployment/frontend -n microservices

Q3: What does Kubernetes use to perform a rollback?

Answer: The previous ReplicaSet stored in the Deployment history.

Q4: Why is rollback fast?

Answer: Kubernetes already has the previous ReplicaSet definition, so it scales it back up instead of recreating everything from scratch.

Q5: Why is kubectl rollout undo not the preferred production method with Argo CD?

Answer: Because Git is the source of truth. Argo CD will eventually reconcile the cluster back to what's in Git unless Git is also updated.

# Additional Production Notes (Recommended Improvements)

---

# 1. EndpointSlice and Service Routing (Modern Kubernetes)

In earlier Kubernetes versions, a Service used the **Endpoints** object to determine which Pods should receive traffic.

Modern Kubernetes uses **EndpointSlices**, which are more scalable and efficient.

Instead of thinking:

```
Service

↓

Ready Pods
```

Think of the actual internal flow:

```
Service

↓

Select Pods using Labels

↓

EndpointSlice Controller watches Pods

↓

EndpointSlices are updated

↓

kube-proxy updates iptables/IPVS rules

↓

Traffic reaches only Ready Pods
```

## Internal Working

1. Deployment creates Pods.
2. Pods pass their Readiness Probe.
3. EndpointSlice Controller detects Ready Pods.
4. EndpointSlice is updated automatically.
5. kube-proxy updates networking rules.
6. Service immediately starts routing traffic to the new Ready Pods.
7. Pods that are Not Ready are automatically removed from EndpointSlices and stop receiving traffic.

This mechanism is one of the key reasons Kubernetes can perform **Zero Downtime Deployments**.

---

# 2. kube-proxy's Role During a Rolling Update

Many diagrams stop at the Service layer.

In reality, kube-proxy is responsible for programming the networking rules that forward traffic to Pods.

The complete architecture is:

```
Deployment

↓

ReplicaSet

↓

Pods

↓

EndpointSlice

↓

kube-proxy

↓

Service

↓

Users
```

## Internal Working

Deployment creates Pods.

↓

Pods become Ready.

↓

EndpointSlices are updated.

↓

kube-proxy refreshes iptables/IPVS rules.

↓

Service forwards traffic only to healthy Pods.

↓

Users never notice the update.

Without kube-proxy, the Service would have no way to forward traffic correctly.

---

# 3. How ReplicaSet Names Are Generated

Every ReplicaSet has a different suffix.

Example:

```
frontend-67bd5ddccf

↓

frontend-59d549d88d
```

Many beginners think Kubernetes generates random names.

It does not.

## Internal Working

Kubernetes calculates a **hash** from the Deployment's **Pod Template (`spec.template`)**.

The hash includes items such as:

- Container image
- Environment variables
- Labels
- Annotations
- Resource Requests
- Resource Limits
- Ports
- Volumes
- Commands
- Arguments

If **anything inside `spec.template` changes**, Kubernetes generates a different hash.

Different hash

↓

Different ReplicaSet Name

↓

New ReplicaSet Created

↓

Rolling Update Begins

This allows Kubernetes to distinguish different application versions.

---

# 4. Rollout Pause and Resume

Kubernetes allows you to temporarily stop an ongoing rollout.

## Pause

```bash
kubectl rollout pause deployment/frontend -n microservices
```

### Verify

```bash
kubectl rollout status deployment/frontend -n microservices
```

Output shows the rollout is paused.

### Production Use Cases

- QA verification
- Manual approval
- Production change windows
- Business validation before continuing

---

## Resume

```bash
kubectl rollout resume deployment/frontend -n microservices
```

### Verify

```bash
kubectl rollout status deployment/frontend -n microservices
```

Expected Output

```
deployment "frontend" successfully rolled out
```

Production teams frequently pause deployments during business hours and resume them after verification.

---

# 5. Rollout Status Command

One of the most commonly used rollout commands is:

```bash
kubectl rollout status deployment/frontend -n microservices
```

## Purpose

Continuously monitors the Deployment until it either succeeds or fails.

## Successful Output

```
deployment "frontend" successfully rolled out
```

## Failed Output

If Pods never become Ready, Kubernetes eventually reports a rollout failure after the configured progress deadline.

## Why Production Engineers Use It

It provides live deployment progress and is usually the first command executed after starting a rollout.

---

# 6. Why Scaling Does NOT Create a New Deployment Revision

A common misconception is that increasing or decreasing replicas creates a new Deployment revision.

Example:

```bash
kubectl scale deployment frontend --replicas=4 -n microservices
```

Many assume:

```
New ReplicaSet

↓

New Revision
```

This is incorrect.

## What Actually Happens

Scaling changes only:

```yaml
spec:
  replicas:
```

The **Pod Template (`spec.template`)** remains exactly the same.

Because the Pod Template did not change:

- No new ReplicaSet is created.
- No new Deployment revision is generated.
- Kubernetes simply adds or removes Pods in the existing ReplicaSet.

---

## When Is a New ReplicaSet Created?

A new ReplicaSet is created only when the Pod Template changes.

Examples:

- New Docker image
- Environment variable changes
- Labels
- Annotations
- Resource Requests
- Resource Limits
- Container Ports
- Commands
- Arguments
- Volume Mounts

Internal Flow

```
Pod Template Changes

↓

New Hash Generated

↓

New ReplicaSet Created

↓

Deployment Revision Increased

↓

Rolling Update Starts
```

---

# 7. What Does NOT Create a New ReplicaSet?

The following Deployment changes **do not** create a new ReplicaSet because they do not modify the Pod Template.

Examples:

- replicas
- strategy
- revisionHistoryLimit
- progressDeadlineSeconds
- minReadySeconds

These settings affect Deployment behavior only.

The existing ReplicaSet continues to be used.

---

# 8. What DOES Create a New ReplicaSet?

Any modification inside **spec.template** creates a new ReplicaSet.

Examples include:

- Changing the container image
- Updating environment variables
- Modifying labels
- Updating annotations
- Changing resource requests
- Changing resource limits
- Updating container ports
- Modifying volume mounts
- Changing startup commands
- Updating command arguments

Internal Process

```
spec.template Changed

↓

Hash Changes

↓

New ReplicaSet

↓

New Deployment Revision

↓

Rolling Update

↓

Old ReplicaSet Gradually Scaled Down

↓

New ReplicaSet Becomes Active
```

---

# Summary

## Service Traffic Flow

```
Deployment

↓

ReplicaSet

↓

Pods

↓

EndpointSlice

↓

kube-proxy

↓

Service

↓

Users
```

---

## Rolling Update Trigger

```
Pod Template Changed

↓

New Hash

↓

New ReplicaSet

↓

New Revision

↓

Rolling Update
```

---

## Scaling Flow

```
Replica Count Changed

↓

Existing ReplicaSet Scaled

↓

Pods Added or Removed

↓

No New Revision

↓

No New ReplicaSet
```

---

# Key Takeaways

- Services route traffic through EndpointSlices, not directly to Pods.
- kube-proxy updates networking rules so Services always send traffic to healthy Pods.
- ReplicaSet names are generated from a hash of the Pod Template, not randomly.
- Rollout Pause and Resume allow controlled deployments in production.
- `kubectl rollout status` is the primary command for monitoring deployments.
- Scaling changes only the number of Pods and does not create a new Deployment revision.
- Only changes inside `spec.template` create a new ReplicaSet and trigger a Rolling Update.
- Understanding these internals is essential for troubleshooting, production operations, and Kubernetes interviews.


mportant Question

You might ask:

Kubernetes already has Rolling Updates. Why do we need Canary?

Because Rolling Update controls Pod replacement, not user traffic.

Rolling Update answers:

How should Pods be replaced?

Canary answers:

Which users should receive the new version?

Completely different problems.




Module 14 (Part 3): Canary Deployment – Complete Theory
Learning Objectives

By the end of this module, you should be able to answer:

What is Canary Deployment?
Why is it used?
How is it different from Rolling Update?
How does Istio split traffic?
Why can't Kubernetes Service do Canary?
How do GitHub Actions, GHCR, GitOps, Argo CD, Istio, Kubernetes, and Envoy work together?
How do companies like Netflix and Google deploy safely?
How do you troubleshoot a Canary deployment?
Chapter 1 — What is a Canary Deployment?
Definition

A Canary Deployment is a deployment strategy where two versions of the same application run simultaneously, and only a small percentage of user traffic is sent to the new version. If the new version performs well, its traffic share is gradually increased until it serves all users. If problems are detected, traffic is shifted back to the stable version.

Key Idea

The most important point to remember is:

Rolling Update replaces Pods. Canary controls user traffic.

These solve different problems.

Chapter 2 — Why Do We Need Canary?

Imagine your company has:

10 million users
One frontend application
A new release every Friday

Without Canary:

Deploy v2
      ↓
100% users receive v2
      ↓
Bug exists
      ↓
100% users affected

With Canary:

Deploy v2
      ↓
5% users receive v2
      ↓
Monitor
      ↓
Healthy?
      ↓
Increase traffic

If something goes wrong:

5% users affected
↓
Traffic shifted back
↓
95% users never notice

The purpose of Canary is risk reduction, not faster deployments.

Chapter 3 — Deployment Strategy Comparison
1. Recreate
Delete old application
↓
Create new application

Advantages:

Very simple

Disadvantages:

Downtime
High risk
Not production-friendly
2. Rolling Update
Old Old Old Old

↓

Old Old Old New

↓

Old Old New New

↓

Old New New New

↓

New New New New

Advantages:

Zero downtime
Built into Kubernetes
Simple

Disadvantages:

Eventually all users receive the new version
No control over which users receive it
3. Canary
95% → Version 1

5% → Version 2

Advantages:

Controlled exposure
Easy rollback
Real user testing
Safer releases

Disadvantages:

More infrastructure
Requires advanced traffic management
Chapter 4 — Rolling Update vs Canary

This is one of the most common interview questions.

Rolling Update	Canary
Replaces Pods gradually	Runs both versions simultaneously
Kubernetes feature	Traffic management strategy
No traffic control	Precise traffic control
One Deployment evolves	Two application versions coexist
Every user eventually gets the new version	Only selected users receive the new version initially

A simple way to remember it:

Rolling Update = Pod replacement
Canary = Traffic distribution
Chapter 5 — Why Kubernetes Service Cannot Perform Canary

A Kubernetes Service selects Pods based on labels.

Example:

selector:
  app: frontend

If four Pods match:

frontend-1
frontend-2
frontend-3
frontend-4

The Service distributes traffic across all four.

It cannot understand:

90% to version 1
10% to version 2

It simply load-balances among all matching Pods.

That is why a Service alone cannot implement a true Canary deployment.

Chapter 6 — Who Performs Traffic Splitting?

Traffic splitting is handled by a service mesh or another advanced proxy.

Examples include:

Istio
Linkerd
AWS App Mesh
NGINX Plus
Argo Rollouts (with traffic providers)

In your platform, we'll use Istio.

Chapter 7 — Istio Components Used in Canary

We'll use four main components.

1. Deployment

Creates Pods.

Example:

frontend-v1

Pods
frontend-v2

Pods
2. Service

Provides a stable endpoint.

Clients call:

frontend

The Service hides the individual Pods behind one address.

3. DestinationRule

Groups Pods into named subsets.

Example:

subset: v1

label:
version=v1
subset: v2

label:
version=v2

These subsets allow Istio to distinguish between versions.

4. VirtualService

Controls traffic routing.

Example:

90%

↓

v1
10%

↓

v2

This is where the Canary percentages are configured.

Chapter 8 — Internal Request Flow

Let's trace a request.

Browser

↓

Istio Ingress Gateway

↓

VirtualService

↓

DestinationRule

↓

Subset

↓

Pod

↓

Response

Detailed flow:

User opens the website.
Request reaches the Istio Ingress Gateway.
Gateway forwards the request to the VirtualService.
VirtualService checks routing rules.
It chooses a subset (for example, v2 10% of the time).
DestinationRule maps the subset to Pods with version=v2.
Envoy forwards the request to one of those Pods.
The response is returned.
Chapter 9 — Where Does Envoy Fit?

One of Istio's core components is Envoy.

Every Pod in the mesh has an Envoy sidecar.

Instead of:

User

↓

Pod

The path becomes:

User

↓

Ingress Gateway

↓

Envoy

↓

Application

↓

Envoy

↓

Response

Envoy is responsible for enforcing the routing rules defined by Istio.

Chapter 10 — Weighted Routing

Suppose you define:

Version 1

90%
Version 2

10%

If 1,000 requests arrive:

Approximately:

900

↓

v1
100

↓

v2

It's important to understand that this is probabilistic, not a strict sequence. Over many requests, the observed distribution approaches the configured weights.

Chapter 11 — Progressive Delivery

Canary is usually part of Progressive Delivery.

Example:

5%

↓

Monitor

↓

10%

↓

Monitor

↓

25%

↓

Monitor

↓

50%

↓

Monitor

↓

100%

At every stage, teams monitor:

Error rate
Response time
CPU usage
Memory usage
User feedback
Business metrics (e.g., checkout success)

If everything looks healthy, they increase the traffic.

Chapter 12 — What If Something Goes Wrong?

Suppose:

90%

↓

v1
10%

↓

v2

The new version starts returning HTTP 500 errors.

Instead of rolling back Pods, you can simply change the routing:

100%

↓

v1
0%

↓

v2

This is often much faster than a full deployment rollback.

Chapter 13 — Canary vs Rollback

Canary is proactive.

Rollback is reactive.

Canary:

Small audience

↓

Observe

↓

Expand

Rollback:

Deploy

↓

Failure

↓

Restore previous version

Canary aims to prevent the need for rollback.

Chapter 14 — GitOps Integration

Your deployment pipeline already works like this:

Git Push
        │
        ▼
GitHub Actions
        │
        ▼
Build Images
        │
        ▼
Trivy Scans
        │
        ▼
Push Images to GHCR
        │
        ▼
Update Kubernetes Manifests
        │
        ▼
Commit to Git
        │
        ▼
Argo CD Sync
        │
        ▼
Kubernetes Applies Changes
        │
        ▼
Istio Routes Traffic

The GitOps pipeline remains the source of truth. Canary behavior is defined in Git through Istio manifests, and Argo CD synchronizes those changes to the cluster.

Chapter 15 — Production Best Practices
Use immutable image tags (SHA-based), not latest.
Keep the stable version running until the Canary is proven.
Start with a small percentage (1–5%).
Increase traffic gradually.
Monitor technical and business metrics before each increase.
Automate promotion and rollback where possible.
Manage all routing rules through Git in a GitOps environment.
Ensure both versions are compatible with the same APIs and database schema during the transition.
Chapter 16 — Common Interview Questions

Q1. What is a Canary Deployment?

A deployment strategy where two versions run simultaneously, and only a small percentage of traffic is sent to the new version before gradually increasing it.

Q2. How is Canary different from Rolling Update?

Rolling Update gradually replaces Pods. Canary keeps multiple versions running and controls how user traffic is distributed between them.

Q3. Why can't a Kubernetes Service implement Canary by itself?

Because a Service load-balances equally among matching Pods and has no concept of weighted routing or versions.

Q4. Which Istio resources are used for Canary?

Deployment
Service
DestinationRule
VirtualService

Q5. What does DestinationRule do?

It defines subsets (such as v1 and v2) by matching Pod labels.

Q6. What does VirtualService do?

It defines how traffic is routed between subsets, including weighted percentages.

Q7. What role does Envoy play?

Envoy proxies enforce the routing rules configured by Istio.

Q8. Why is Canary considered safer?

Because only a small percentage of users are exposed to the new version initially, reducing the impact of potential issues.

We are now ready for the practical section.

In the practical, we'll implement a real production-style Canary deployment on your existing platform using:

Your current frontend application
Istio DestinationRule
Istio VirtualService
GitOps with Argo CD
GitHub Actions and GHCR

We'll observe real traffic shifting (e.g., 90/10 → 50/50 → 100/0) and verify the behavior step by step.




Module 14 (Part 3): Practical Canary Deployment
Today's Goal

By the end of this practical, your platform will look like this:

                   Internet
                       │
                       ▼
             Istio Ingress Gateway
                       │
                       ▼
               VirtualService
                       │
          ┌────────────┴────────────┐
          │                         │
       90% Traffic              10% Traffic
          │                         │
          ▼                         ▼
     frontend-v1              frontend-v2

This is exactly how many production systems begin a progressive deployment.

Step 1 — Understand What We Are Going to Build

Currently your platform looks like this:

Users
   │
   ▼
Istio Gateway
   │
   ▼
Service (frontend)
   │
   ▼
Frontend Pods

There is only one version of the application.

We are going to transform it into this:

Users
   │
   ▼
Istio Gateway
   │
   ▼
VirtualService
   │
   ├──────────────► frontend-v1
   │
   └──────────────► frontend-v2

Notice something important.

We are not replacing the old application.

We are adding another version.

For some time, both versions will run simultaneously.

This is the biggest difference between Rolling Update and Canary.

Step 2 — What Needs to Change?

Our current frontend Deployment looks roughly like this:

Deployment

We will create another Deployment.

Instead of:

frontend

We'll have:

frontend-v1

and

frontend-v2

Each Deployment will have its own Pods.

Step 3 — How Will Istio Know Which Pod Is Which?

This is one of the most important concepts in Istio.

Every Pod already has labels like:

app: frontend

Now we'll add another label.

Version 1 Pods:

labels:
  app: frontend
  version: v1

Version 2 Pods:

labels:
  app: frontend
  version: v2

These labels are the foundation of Canary deployments.

Without them, Istio cannot distinguish between versions.

Step 4 — Why Labels Matter

Imagine six frontend Pods.

Without version labels:

frontend-1

frontend-2

frontend-3

frontend-4

frontend-5

frontend-6

Istio has no idea which Pods belong to which version.

Now add labels.

frontend-1
version=v1
frontend-2
version=v1
frontend-3
version=v1
frontend-4
version=v2
frontend-5
version=v2
frontend-6
version=v2

Now Istio can separate them into two groups.

Step 5 — DestinationRule

This is where many people get confused.

A DestinationRule does not split traffic.

Its job is much simpler.

It says:

"Pods with version=v1 belong to subset v1."

"Pods with version=v2 belong to subset v2."

Think of it as creating named groups.

Internally:

All Frontend Pods
        │
        ▼
DestinationRule
        │
 ┌──────┴──────┐
 │             │
 ▼             ▼
Subset v1   Subset v2

It doesn't decide how much traffic each subset gets.

It only defines who belongs to each subset.

Step 6 — VirtualService

This is the "brain" of Canary.

VirtualService says:

90%

↓

Subset v1

and

10%

↓

Subset v2

Notice the difference.

DestinationRule:

Creates groups.

VirtualService:

Decides traffic.

A simple analogy:

DestinationRule = Class roster (who is in Class A, who is in Class B).
VirtualService = Teacher deciding how many students go to each classroom activity.
Step 7 — How Does a Request Travel?

Let's follow one HTTP request.

1. User opens the website
https://your-app.example.com

↓

2. DNS resolves the hostname

↓

3. Request reaches the Istio Ingress Gateway

↓

4. Gateway forwards the request to the VirtualService

↓

5. VirtualService checks the configured weights
90%

↓

or

10%

↓

6. It selects a subset (v1 or v2)

↓

7. DestinationRule maps that subset to Pods with the matching version label

↓

8. Envoy forwards the request to one of those Pods

↓

9. The application responds

The application itself doesn't know it is part of a Canary deployment. Istio handles the routing.

Step 8 — Where Does Kubernetes Fit?

Kubernetes is still responsible for:

Creating Deployments
Managing ReplicaSets
Creating Pods
Restarting failed Pods
Scheduling Pods on Nodes

Istio is responsible for:

Traffic routing
Weighted routing
Canary logic
Retry policies
Timeouts
Circuit breaking (later topic)

This separation of responsibilities is important.

Step 9 — How Does This Fit into Your Existing GitOps Pipeline?

Your pipeline already looks like this:

Developer
    │
    ▼
Git Push
    │
    ▼
GitHub Actions
    │
    ▼
Build Images
    │
    ▼
Trivy Scan
    │
    ▼
Push Images to GHCR
    │
    ▼
Update Kubernetes Manifests
    │
    ▼
Commit Changes
    │
    ▼
Argo CD Sync
    │
    ▼
Kubernetes

We'll extend the Kubernetes part:

Kubernetes
     │
     ▼
Deploy frontend-v1
Deploy frontend-v2
     │
     ▼
DestinationRule
     │
     ▼
VirtualService
     │
     ▼
Istio Traffic Routing

No changes are needed to GitHub Actions or GHCR for this exercise.

Before We Touch Any YAML

There is one architectural decision we need to make because it affects the rest of the practical.

There are two common production approaches:

Option 1 (Recommended for Learning)

Keep two separate Deployments:

frontend-v1
frontend-v2

This makes it very easy to see both versions running and understand how traffic is split.

Option 2 (Common with Progressive Delivery Tools)

Keep a single logical application and let tools such as Argo Rollouts manage the canary ReplicaSets automatically.

For your learning and interviews, we'll use Option 1.

It is more explicit, easier to debug, and helps you understand exactly how Istio performs traffic splitting. Once you understand this model, learning Argo Rollouts later becomes much easier because you'll already understand the underlying concepts.

Next step: we'll inspect your current frontend Deployment, duplicate it into frontend-v1 and frontend-v2, add the required labels, and wire them into Istio one piece at a time. This way you'll understand every resource instead of just applying YAML.



Phase 1 — Designing the Architecture (Before Writing YAML)

A mistake many beginners make is immediately creating YAML files without understanding why each resource exists.

Let's think like a Platform Engineer.

Current Platform

Right now your frontend looks something like this:

Deployment (frontend)
        │
        ▼
ReplicaSet
        │
        ▼
4 Frontend Pods
        │
        ▼
Service (frontend)
        │
        ▼
Istio Gateway
        │
        ▼
Users

There is only one Deployment.

Only one ReplicaSet.

Only one version.

Life is simple.

What is the Problem?

Suppose your frontend currently runs

Frontend v1

Now your developers build

Frontend v2

Question:

Where should Kubernetes run it?

Option A

Replace v1.

Frontend v1

↓

Delete

↓

Frontend v2

That's Rolling Update.

We already learned this.

Option B

Keep both.

Frontend v1

Running

AND

Frontend v2

Running

Now we have something new.

We have two different applications running simultaneously.

First Big Question

If both are running...

How does Kubernetes know which user should go where?

Suppose we have

frontend-v1

Pod A

Pod B

and

frontend-v2

Pod C

Pod D

A browser sends

GET /

Which Pod receives it?

Pod A?

Pod D?

Random?

This is the entire challenge Canary Deployment solves.

Let's Follow the Request

Imagine you open

https://shop.company.com

The request begins.

Browser

↓

DNS

↓

Ingress Gateway

↓

???

↓

Frontend

There is a missing piece.

Who decides between

frontend-v1

or

frontend-v2

That missing piece is

VirtualService
VirtualService Is Like a Traffic Police Officer

Imagine a road.

Cars

↓

Traffic Police

↓

Road A

or

Road B

The police officer decides

90% of cars

Road A

10% of cars

Road B

VirtualService does exactly that.

It never creates Pods.

It never creates Deployments.

It simply says

This request goes there.

Second Big Question

How does VirtualService know which Pods belong to v1?

Pods are just Pods.

Suppose Kubernetes has

Pod 1

Pod 2

Pod 3

Pod 4

How can Istio identify them?

The answer is

Labels.

Labels Are Everything

Right now your Pods probably look similar to this.

labels:
  app: frontend

Istio needs another label.

Version 1

labels:
  app: frontend
  version: v1

Version 2

labels:
  app: frontend
  version: v2

Now every Pod has an identity.

Think of it like employees.

Ali

Department: Sales
Ahmed

Department: Sales
Sara

Department: HR

You can now group them.

Pods work exactly the same way.

DestinationRule

This resource confuses almost everyone at first.

Let's simplify it.

Imagine your company has

100 Employees

Someone asks

Show me only HR.

You create a group.

HR Group

↓

Sara

↓

Ayesha

↓

Bilal

Another group.

Sales Group

↓

Ali

↓

Ahmed

DestinationRule creates these groups.

Instead of employees, it groups Pods.

Internally:

Frontend Pods

↓

DestinationRule

↓

Subset v1

↓

Subset v2

Notice

DestinationRule never says

90%

10%

It only says

These Pods belong together.

Now Everything Connects

Let's combine everything.

Browser

↓

Ingress Gateway

↓

VirtualService

↓

DestinationRule

↓

Subset

↓

Pod

↓

Response

Each component has one job:

Component	Responsibility
Deployment	Create Pods
Service	Stable network endpoint
DestinationRule	Define Pod groups (subsets)
VirtualService	Decide traffic distribution
Envoy	Enforce routing
Kubernetes	Keep Pods healthy

Notice the single responsibility principle. Every resource has one clear purpose.

The Service Question (Very Important)

Many beginners ask:

If we already have VirtualService, why do we still need a Service?

Excellent question.

VirtualService does not replace a Service.

The Service is still required because it provides a stable destination inside Kubernetes.

frontend.default.svc.cluster.local

VirtualService routes traffic to the Service, then uses the DestinationRule subsets to choose the appropriate Pods behind that Service.

So the flow is:

User

↓

Gateway

↓

VirtualService

↓

Service

↓

DestinationRule

↓

Pods

Think of it this way:

Service = The building's main entrance.
DestinationRule = The departments inside the building.
VirtualService = The receptionist deciding which department you should visit.
One Service or Two Services?

This is another interview favorite.

Should we create:

frontend-v1 Service

and

frontend-v2 Service

No.

We'll use one Service:

frontend

Why?

Because clients shouldn't know which version they're talking to.

Clients always access:

frontend

Istio handles version selection transparently.

This keeps the client completely unaware of deployments.

Final Architecture

By the end of the practical, your architecture will be:

                    Internet
                        │
                        ▼
              Istio Ingress Gateway
                        │
                        ▼
                 VirtualService
                        │
        ┌───────────────┴────────────────┐
        │                                │
   90% → subset:v1                  10% → subset:v2
        │                                │
        ▼                                ▼
             Service (frontend)
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
 Deployment frontend-v1     Deployment frontend-v2
        │                         │
   Pods (version=v1)         Pods (version=v2)
Next Step: Build the Resources

Now that you understand why every resource exists, we'll begin creating them in Git—one file at a time—using your existing cloudnative-platform repository. We'll start by examining your current frontend manifests and refactoring them into a production-style Canary layout instead of writing everything from scratch. This approach makes the transition easier to follow and keeps the changes aligned with your existing GitOps workflow.


Before We Write YAML

Let's verify the resources we need.

By the end of the implementation, we'll have:

Resource	Purpose
frontend Deployment	Stable application
frontend-canary Deployment	New version under test
frontend Service	Single stable endpoint
DestinationRule	Defines stable and canary subsets
VirtualService	Splits traffic by weight
Istio Gateway	Receives external traffic

Notice that we're adding only four things:

One new Deployment
One DestinationRule
One VirtualService
Version labels

Everything else in your platform—GitHub Actions, GHCR, Argo CD, Services, Ingress Gateway, and your CI/CD pipeline—stays exactly as it is.
Module 14 Interview Questions (Progressive Delivery)
Section 1 — Basic Understanding
Q1. What happens when you push code to your GitHub repository?

Answer:

In my project, GitHub Actions automatically starts the CI pipeline. It builds Docker images, runs Trivy filesystem and image scans, pushes the images to GHCR, updates the Kubernetes deployment manifests with the new immutable SHA tag, commits those changes back to Git, and Argo CD detects the Git change and synchronizes it to the Kubernetes cluster. That triggers Kubernetes to perform a Rolling Update.

Q2. Why do we update Kubernetes YAML instead of running kubectl apply?

Answer:

Because I'm following GitOps. Git is the single source of truth. If I manually run kubectl apply, the cluster and Git can drift apart. By updating Git, Argo CD keeps everything synchronized automatically.

Q3. Why don't you use the latest image tag?

Answer:

latest isn't predictable. If something breaks, I don't know exactly which version is running. I use immutable SHA tags so every deployment points to one specific image, making rollbacks and debugging much easier.

Section 2 — Rolling Update
Q4. Explain Rolling Update in simple words.

Answer:

Instead of replacing all Pods at once, Kubernetes replaces them gradually. It creates new Pods first, waits until they're Ready, and only then removes the old Pods. That allows users to continue using the application during deployment.

Q5. How does Kubernetes know when to delete the old Pod?

Answer:

It waits until the new Pod passes the Readiness Probe. Only after the Pod becomes Ready does Kubernetes remove one of the old Pods.

Q6. Why is the Readiness Probe important?

Answer:

Without it, Kubernetes may send traffic to a Pod that has started but isn't actually ready to serve requests yet. That can cause user errors during deployment.

Q7. Difference between Readiness and Liveness Probe?

Answer:

Readiness decides if the Pod should receive traffic. Liveness decides whether the container is healthy enough to keep running. If Liveness fails repeatedly, Kubernetes restarts the container.

Q8. What creates Pods?

Answer:

The Deployment creates a ReplicaSet, and the ReplicaSet creates the Pods.

Deployment → ReplicaSet → Pods

Q9. Why are old ReplicaSets kept?

Answer:

They store deployment history. If a new version fails, Kubernetes can roll back to the previous ReplicaSet quickly.

Section 3 — Rollback
Q10. What is Rollback?

Answer:

Rollback means returning the application to a previously working version when the current deployment has problems.

Q11. When would you perform a rollback?

Answer:

If users start reporting errors, monitoring shows failures, or the new deployment has a critical bug, I'd roll back immediately to restore service while the team investigates.

Q12. Does rollback rebuild Docker images?

Answer:

No. It simply redeploys a previously known-good version that already exists.

Section 4 — Canary Deployment
Q13. What is Canary Deployment?

Answer:

Instead of sending all traffic to a new version, I send only a small percentage—say 10%—to the new version while the remaining 90% continues using the stable version. If everything looks healthy, I gradually increase traffic.

Q14. Why is Canary safer than Rolling Update?

Answer:

Rolling Update eventually moves everyone to the new version. Canary exposes only a small group of users first. If there's a problem, only a small percentage is affected.

Q15. Why can't Kubernetes Deployments perform Canary by themselves?

Answer:

Deployments manage Pods, not traffic. Kubernetes doesn't know how to send 90% of requests to one version and 10% to another. That's why we use a service mesh like Istio.

Q16. What does Istio add?

Answer:

Istio controls network traffic. It allows me to decide exactly how requests are distributed between different application versions.

Q17. Why did you create two Deployments?

Answer:

One Deployment runs the stable version with four replicas. The other runs the canary version with one replica. Both are behind the same Service, and Istio controls which version receives traffic.

Q18. Why do both Deployments have the same app label?

Answer:

Because the Service should discover both sets of Pods. The version label is then used by Istio to separate them into different subsets.

Q19. Why add the version label?

Answer:

Without it, Istio wouldn't know which Pods are stable and which are canary.

Q20. What is a DestinationRule?

Answer:

A DestinationRule defines logical groups, called subsets, for a Service. In my project, I created two subsets: stable and canary, based on the version label.

Q21. What is a VirtualService?

Answer:

A VirtualService defines how traffic is routed. I configured it to send 90% of traffic to the stable subset and 10% to the canary subset.

Q22. Why isn't the Service enough?

Answer:

A Kubernetes Service performs load balancing across all matching Pods equally. It can't say "90% to stable and 10% to canary." Istio's VirtualService provides that capability.

Section 5 — GitOps
Q23. What happens after GitHub Actions updates the manifests?

Answer:

Argo CD detects the Git change, compares the desired state in Git with the live cluster, and synchronizes the cluster automatically.

Q24. Why did your push fail earlier?

Answer:

GitHub Actions had already committed updated image tags, so my local branch was behind. Git rejected the push because the remote contained newer commits.

Q25. How did you fix it?

Answer:

I used git pull --rebase, resolved the merge conflict, kept the latest image tag, completed the rebase, and pushed again.

Q26. Why not use git push --force?

Answer:

Force pushing can overwrite valid commits from the CI pipeline or teammates. In GitOps, it's much safer to rebase and preserve history.

Section 6 — Troubleshooting
Q27. Users say they are getting errors after deployment. What do you check first?

Answer:

I first check whether the deployment completed successfully, then verify Pod health, ReplicaSets, Events, Readiness Probes, container logs, and finally Argo CD synchronization status.

Q28. Canary Pods are running but receive no traffic. What would you check?

Answer:

I'd verify the Pod labels, DestinationRule subsets, VirtualService routes and weights, and confirm that the traffic is passing through the Istio proxy.

Q29. Argo CD says OutOfSync. What does that mean?

Answer:

It means the cluster doesn't match what's stored in Git. Either someone changed the cluster manually or Git contains changes that haven't been synchronized yet.

Q30. What would you check if traffic isn't splitting 90/10?

Answer:

I'd verify that both stable and canary Pods exist, the labels match the DestinationRule, the VirtualService references the correct subsets, and that traffic is actually flowing through Istio.

Section 7 — Scenario Questions
Q31. Your canary deployment has a bug affecting 10% of users. What do you do?

Answer:

I would immediately change the VirtualService to send 100% of traffic back to the stable version. Since both versions are already running, the switch is almost instant and doesn't require redeployment.

Q32. Management wants to expose only internal employees to the new version. How would you approach it?

Answer:

Instead of routing by percentage, Istio can route based on request headers, cookies, or user identity. That allows only selected users to reach the canary version.

Q33. Why not simply increase replicas from four to five?

Answer:

Adding replicas doesn't create a new application version. Canary requires two different versions running simultaneously so traffic can be split between them.

Q34. Why did you keep the same Service?

Answer:

The Service provides a single stable endpoint for clients. Istio sits behind that Service and decides which version actually receives each request.

Q35. If your interviewer asked, "What part of this module taught you the most?" what would you say?

Answer:

The biggest lesson was understanding that Kubernetes manages application lifecycle, while Istio manages network traffic. Before this module I thought Deployments handled everything, but now I understand that progressive delivery depends on combining Kubernetes, Istio, GitOps, and CI/CD. That changed how I think about production deployments.

One-liner flow to remember
Developer Push
      ↓
GitHub Actions
      ↓
Build + Trivy
      ↓
Push Image to GHCR
      ↓
Update Git Manifests
      ↓
Argo CD Sync
      ↓
Kubernetes Deployments
      ↓
Stable Pods + Canary Pods
      ↓
Service
      ↓
Istio DestinationRule (stable/canary subsets)
      ↓
Istio VirtualService (90% / 10%)
      ↓
Users

If you're comfortable answering these 35 questions naturally, you'll be well prepared for junior and many mid-level DevOps interviews covering Kubernetes deployments, GitOps, and progressive delivery.
