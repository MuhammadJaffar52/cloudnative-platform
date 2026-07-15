Module 09 – Istio
Chapter 1: Why Was Istio Created?

Before installing anything, let's understand the problem.

Imagine Our Current Platform

So far, we have built:

Developer
     │
     ▼
GitHub
     │
     ▼
ArgoCD
     │
     ▼
Kind Cluster
     │
     ▼
NGINX Ingress
     │
     ▼
Service
     │
     ▼
Pods

Everything works.

Question:

If Kubernetes already works, why do companies install Istio?

Let's Think Like a Growing Company

Currently, we have only one application.

demo-nginx

Very simple.

Now imagine after Module 10 we build:

Order Service

Payment Service

Inventory Service

Notification Service

User Service

Email Service

Shipping Service

Authentication Service

Now instead of one service...

We have 20–100 microservices.

What Happens Now?

Suppose a customer clicks:

Buy Now

Request flow becomes:

Browser

↓

Order Service

↓

Payment Service

↓

Inventory Service

↓

Notification Service

↓

Email Service

One request may travel through 5–10 services.

New Problems Appear

Let's say:

Order Service

calls

Payment Service

What if Payment Service is down?

Order

↓

Payment ❌

Now what?

Without any additional logic:

Request Failed

Customer sees:

500 Internal Server Error

Bad user experience.

Can Kubernetes Solve This?

Kubernetes gives us:

Pods
Deployments
Services
Ingress
ReplicaSets
Autoscaling

But Kubernetes does not automatically provide advanced service-to-service communication features like:

Intelligent retries
Circuit breaking
Traffic shifting
Fine-grained observability
Mutual TLS between services
Advanced authorization policies

These capabilities can be implemented in different ways (including inside applications), but Kubernetes itself doesn't provide them as built-in networking features.

Example 1 — Retry

Payment Service crashes for 2 seconds.

Order

↓

Payment ❌

Without retry:

Order Failed

With retry:

Order

↓

Payment ❌

↓

Retry

↓

Payment ✅

Customer never notices.

Example 2 — Canary Deployment

You create

Payment v2

Should all customers immediately use it?

No.

Much safer:

90%

↓

Payment v1

10%

↓

Payment v2

Observe.

If everything is healthy:

50%

↓

50%

Eventually:

100%

↓

Payment v2

Doing this manually is difficult.

Example 3 — Security

Suppose:

Payment

receives requests from

Inventory

Should Inventory be allowed?

Maybe.

Should an unknown Pod be allowed?

Probably not.

How do we verify identities and encrypt service-to-service traffic?

Example 4 — Observability

Customer says:

Payment is slow.

Which service is responsible?

Browser

↓

Order

↓

Inventory

↓

Payment

↓

Email

Where is the delay?

Without distributed tracing, it's hard to know.

Example 5 — Logging

Suppose 50 services each generate logs.

Questions like:

Which service handled the request?
Which service failed?
How long did each hop take?

become difficult to answer without consistent telemetry.

Example 6 — Traffic Control

Suppose:

Payment v1

Payment v2

Payment v3

We want:

60% → v1
30% → v2
10% → v3

Or:

Route mobile users differently from web users.
Route beta users to a new version.

Kubernetes Services don't provide this level of routing logic.

Traditional Approach (Before Service Mesh)

Each development team wrote this logic into every application.

Every microservice needed code for:

Retry
Timeouts
Circuit breaking
TLS
Metrics
Logging
Tracing

Imagine 100 services.

Every team reimplemented the same concerns.

This leads to inconsistency and higher maintenance.

Better Idea

Instead of putting networking logic inside every application...

Move it outside the application.

Application

↓

Business Logic Only

Networking responsibilities become a separate layer.

This Is the Birth of the Service Mesh

Instead of every application handling communication...

A dedicated infrastructure layer manages:

Service-to-service communication
Security
Traffic routing
Retries
Observability
Resilience

Applications can focus primarily on business logic.

Where Does Istio Fit?

Your architecture evolves from:

Browser

↓

NGINX

↓

Service

↓

Application

to:

Browser

↓

NGINX / Istio Gateway

↓

Envoy Proxy

↓

Application

↓

Envoy Proxy

↓

Another Application

Every request flows through proxies that apply networking policies consistently.

Think Like a Platform Engineer

Our platform now has clear responsibilities:

Component	Responsibility
Kubernetes	Run and schedule containers
Ingress	Accept external traffic
Argo CD	GitOps deployment
Terraform	Infrastructure provisioning
LocalStack	Local AWS emulation
Istio	Advanced service-to-service networking

Notice that Istio doesn't replace Kubernetes. It extends Kubernetes with capabilities that become increasingly valuable as platforms grow in size and complexity.

End of Chapter 1

At this point, you should be able to answer these questions in your own words:

Why do microservices introduce new networking challenges?
What limitations of plain Kubernetes lead teams to adopt a service mesh?
Why is putting retry, security, and traffic logic inside every application difficult to maintain?
What problem is Istio trying to solve?
Why doesn't Istio replace Kubernetes?
Don't install anything yet.

Understanding why Istio exists is the foundation. In the next chapter, we'll answer the question:

What exactly is a Service Mesh, and how does it work internally?

Once that mental model is clear, the Istio architecture will be much easier to understand.



