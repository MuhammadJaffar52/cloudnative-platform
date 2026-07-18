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