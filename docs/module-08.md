Module 08 – NGINX Ingress Controller (Local)
Objective

In previous modules, our application (demo-nginx) was accessible only inside the Kubernetes cluster through a ClusterIP Service.

The objective of this module was to expose the application using an NGINX Ingress Controller, allowing HTTP requests from outside the cluster to reach the application through a single entry point.

This module introduced Layer-7 routing, host-based routing, and the Kubernetes Ingress resource.

Learning Objectives

By completing this module, I learned:

What an Ingress is
Why Ingress is needed
Difference between Service and Ingress
What an Ingress Controller does
How NGINX Ingress works
Host-based routing
Request flow inside Kubernetes
Debugging Kubernetes networking
Common Ingress issues in Kind clusters
Architecture Before Module 08
Browser
    │
    ✗
Cannot access application
    │
──────────────────────────────

Kubernetes Cluster

Deployment
      │
      ▼
Pods
      ▲
      │
ClusterIP Service

Only pods inside the cluster could communicate with the service.

External users could not.

Architecture After Module 08
Browser
    │
http://demo.local
    │
    ▼
NGINX Ingress Controller
    │
    ▼
Ingress Rules
    │
    ▼
ClusterIP Service
    │
    ▼
Deployment
    │
    ▼
Pods

Now all HTTP traffic enters through the Ingress Controller.

What is an Ingress?

An Ingress is a Kubernetes object that defines routing rules for HTTP and HTTPS traffic.

Example:

demo.local
      │
      ▼
demo-nginx Service

Important:

Ingress itself does not receive traffic.

It only stores routing rules.

What is an Ingress Controller?

An Ingress Controller is a running application that continuously watches Kubernetes for Ingress resources.

Whenever an Ingress changes, the controller automatically updates its web server configuration.

We used:

NGINX Ingress Controller
Request Flow

A browser request now follows this path:

Browser

↓

demo.local

↓

NGINX Ingress Controller

↓

Ingress Rule

↓

ClusterIP Service

↓

Pods

Understanding this request flow is one of the most important Kubernetes networking concepts.

Components Added
1. NGINX Ingress Controller

Installed inside

ingress-nginx

namespace.

Verified using:

kubectl get pods -n ingress-nginx
2. IngressClass

The controller registers an IngressClass.

Verified:

kubectl get ingressclass

Output:

nginx

This tells Kubernetes which controller should manage our Ingress resources.

3. Ingress Resource

Created:

kubernetes/base/demo-nginx/ingress.yaml

Example:

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
4. Kustomization Update

Added Ingress to:

kubernetes/base/demo-nginx/kustomization.yaml
resources:
- namespace.yaml
- deployment.yaml
- service.yaml
- ingress.yaml

ArgoCD automatically synchronized the change.

How ArgoCD Helped

After pushing changes:

Git

↓

GitHub

↓

ArgoCD detects change

↓

Applies Ingress

↓

Ingress Controller reloads configuration

No manual deployment was required.

Verification Commands

Verify controller:

kubectl get pods -n ingress-nginx

Verify Ingress:

kubectl get ingress -n demo

Describe Ingress:

kubectl describe ingress demo-nginx -n demo

Check Service:

kubectl get svc -n demo

Check Endpoints:

kubectl get endpoints -n demo

Check Controller Logs:

kubectl logs -n ingress-nginx deployment/ingress-nginx-controller
Problems Faced
Problem 1
demo.local could not be resolved

Error:

curl: Could not resolve host

Cause:

No DNS entry existed for

demo.local

Solution:

Added to

/etc/hosts
127.0.0.1 demo.local

Lesson:

DNS resolution happens outside Kubernetes.

Problem 2

Ingress existed but application was inaccessible.

Everything appeared healthy:

Pods ✓
Service ✓
Endpoints ✓
Ingress ✓

This taught that Kubernetes resources being healthy does not automatically guarantee external connectivity.

Problem 3

Connection Reset

Connection reset by peer

This indicated traffic reached Docker but was not successfully forwarded to the controller.

Problem 4

LoadBalancer remained Pending

EXTERNAL-IP: Pending

This is expected in Kind because there is no cloud provider assigning external IP addresses.

This is not an error.

Problem 5

NodePort Test

Testing directly:

http://172.x.x.x:30130

worked successfully.

This confirmed:

Pods were healthy.
Service was working.
Ingress Controller was working.
Ingress rules were correct.

The remaining issue was host-to-cluster networking.

Debugging Methodology

Instead of randomly changing manifests, every networking layer was verified individually.

Step 1

Pods

kubectl get pods

Healthy?

Yes.

Step 2

Service

kubectl get svc

Working?

Yes.

Step 3

Endpoints

kubectl get endpoints

Correct?

Yes.

Step 4

Ingress

kubectl get ingress

Rules correct?

Yes.

Step 5

Ingress Controller Logs

Backend successfully reloaded

Controller accepted the configuration.

Step 6

NodePort Test

Traffic reached the application.

Therefore the Kubernetes application stack was healthy.

The remaining issue was external networking.

Commands Learned
kubectl get ingress

kubectl describe ingress

kubectl get ingressclass

kubectl get svc

kubectl get endpoints

kubectl get pods -o wide

kubectl logs deployment/ingress-nginx-controller -n ingress-nginx

docker inspect

docker exec

curl
Folder Structure
kubernetes/
└── base/
    └── demo-nginx/
        ├── deployment.yaml
        ├── service.yaml
        ├── namespace.yaml
        ├── ingress.yaml
        └── kustomization.yaml
Key Concepts Learned
ClusterIP

Internal Kubernetes networking only.

Ingress

Stores HTTP routing rules.

Ingress Controller

Reads Ingress resources and configures NGINX automatically.

Host-Based Routing

Example:

demo.local

↓

demo-nginx Service

Later we can use:

grafana.local

↓

Grafana
argocd.local

↓

ArgoCD
prometheus.local

↓

Prometheus

All using the same Ingress Controller.

Interview Questions
Why do we need an Ingress?

To expose multiple Kubernetes services through a single HTTP/HTTPS entry point using host- or path-based routing.

Difference between Service and Ingress
Service	Ingress
Layer 4	Layer 7
Exposes Pods	Routes HTTP/HTTPS traffic
Internal networking	External HTTP routing
One service endpoint	One entry point for many services
What does an Ingress Controller do?

It watches Kubernetes Ingress resources and automatically configures a reverse proxy (such as NGINX) to route incoming traffic to backend Services.

Why was the LoadBalancer service in Pending?

Kind does not include a cloud provider, so no external IP address is allocated. This is expected behavior.

How did you troubleshoot the Ingress issue?

I verified each layer independently:

Pods were healthy.
Service endpoints were available.
Ingress rules were correct.
The NGINX controller had loaded the configuration.
NodePort access worked.
This isolated the issue to external host-to-cluster networking rather than the application or Kubernetes resources.
AWS Migration Mapping
Local Environment	AWS Production
Kind Cluster	Amazon EKS
/etc/hosts	Amazon Route 53
NGINX Ingress	AWS Load Balancer Controller (or NGINX)
Local HTTP	Internet-facing ALB
ClusterIP Service	Same
Ingress Resource	Same
Deployment	Same
Pods	Same

Notice that the Kubernetes manifests (Deployment, Service, Ingress) remain largely unchanged. The primary difference is that AWS provides managed networking (ALB, Route 53, ACM) instead of the local Kind networking setup.

Module Summary

By completing Module 08, I successfully exposed a Kubernetes application through an NGINX Ingress Controller using host-based routing. I learned how HTTP requests flow from a browser to Kubernetes workloads, how Ingress differs from Services, and how an Ingress Controller dynamically configures routing based on Kubernetes resources. Most importantly, I practiced a structured debugging approach by validating each networking layer—Pods, Services, Endpoints, Ingress, and the Ingress Controller—before isolating the issue to external networking. These concepts form the foundation for exposing platform services (ArgoCD, Grafana, Prometheus, Istio Gateways, and future microservices) both in the local environment and later in AWS using Route 53 and the AWS Load Balancer Controller.



Chapter 2 – What is a Service Mesh?

Forget Istio for a moment.

Let's understand the idea behind a Service Mesh.

Imagine There Is No Service Mesh

Suppose we have four microservices.

Order Service

Payment Service

Inventory Service

Notification Service

The communication looks like this:

                 HTTP/gRPC

Order ------------------> Payment

  │                         │

  │                         ▼

  └-----------------> Inventory

                            │

                            ▼

                     Notification

Looks simple.

Now let's ask some production questions.

Question 1

How many times should Order retry Payment?

Order

↓

Payment

Who decides?

Order Service.

Question 2

How long should Order wait?

Timeout = ?

5 seconds?

10 seconds?

30 seconds?

The application developer decides.

Question 3

Should communication be encrypted?

Again...

The application developer writes the code.

Question 4

How do we collect metrics?

Developer writes code.

Question 5

How do we create distributed tracing?

Developer writes code.

Question 6

How do we perform canary deployment?

Developer writes code.

Imagine 100 Microservices

Now imagine this:

100 Services

↓

Each service contains

Retry Logic

Timeout Logic

TLS

Metrics

Logging

Tracing

Authentication

Authorization

Every team writes the same logic.

Every language does it differently.

Java team.

Go team.

Python team.

Node.js team.

Nothing is consistent.

This Is a Big Problem

Notice something.

None of this is actually business logic.

Your application should answer questions like:

How much should I charge?

Is the inventory available?

Should the payment succeed?

Instead it is busy handling:

Retry

Timeout

TLS

Monitoring

Routing

These are cross-cutting concerns—features needed by many services regardless of what the service actually does.

Better Idea

What if applications only contained business logic?

Application

↓

Business Logic Only

And something else handled networking.

Introducing the Sidecar

Instead of the application talking directly to other services...

We place another container beside it.

+---------------------------+

 Pod

+---------------------------+

|                           |

| Application               |

|                           |

|---------------------------|

| Envoy Proxy               |

|                           |

+---------------------------+

This second container is called a sidecar.

Why "Sidecar"?

Think of a motorcycle.

Motorcycle

      +

Sidecar

The sidecar doesn't replace the motorcycle.

It travels with it.

Similarly:

Application

      +

Envoy Proxy

The application still runs normally.

The proxy travels alongside it.

That's why it's called the Sidecar Pattern.

Every Pod Gets a Sidecar

Suppose we have:

Order

Payment

Inventory

Instead of:

Order

↓

Payment

↓

Inventory

We now have:

Order App

+

Envoy

↓

Payment App

+

Envoy

↓

Inventory App

+

Envoy

The applications no longer communicate directly.

The Envoy proxies communicate with each other.

Actual Traffic Flow

Without Istio:

Order

↓

Payment

With Istio:

Order App

↓

Order Envoy

↓

Payment Envoy

↓

Payment App

Notice:

Applications never talk directly anymore.

Everything passes through Envoy.

Why Is This Powerful?

Now Envoy can do things before forwarding traffic.

For example:

Request arrives.

Envoy checks:

Is TLS enabled?

↓

Should I retry?

↓

Should I log?

↓

Should I trace?

↓

Should I shift traffic?

↓

Forward request

The application knows nothing about this.

Think of Envoy as a Security Guard

Imagine entering a company office.

Visitor

↓

Security Guard

↓

Office

The guard decides:

Who can enter
Where they go
Whether they need a badge
Whether to log their visit

The office workers don't deal with visitors directly.

Envoy works the same way.

Every request first goes through Envoy.

Service Mesh

Now zoom out.

Instead of one proxy...

Every Pod has one.

Envoy ↔ Envoy ↔ Envoy ↔ Envoy ↔ Envoy

All these proxies together form the Service Mesh.

That's why it's called a mesh: every service is connected through a network of proxies rather than communicating directly.

Does Istio Replace Kubernetes Services?

No.

Kubernetes Service still exists.

Pod

↓

Service

↓

Pod

Istio works on top of Kubernetes, not instead of it.

A request still resolves through Kubernetes networking, but Envoy intercepts and manages the traffic.

Real Architecture

Our platform becomes:

Browser

↓

NGINX / Istio Gateway

↓

Kubernetes Service

↓

Envoy

↓

Application

↓

Envoy

↓

Another Service

↓

Envoy

↓

Application

Every internal service-to-service request is observed and can be controlled.

Benefits of the Service Mesh
Without Service Mesh	With Service Mesh
Retry code in every application	Centralized retry policies
TLS implemented per service	Consistent mTLS between services
Logging added individually	Automatic telemetry collection
Tracing implemented manually	Distributed tracing support
Complex deployments require app logic	Traffic policies handle routing
Teams duplicate networking code	Networking concerns are standardized
Important Clarification

Many people say:

"Istio is a service mesh."

A more precise statement is:

Service Mesh is the architectural pattern.
Istio is one implementation of that pattern.
Envoy is the data-plane proxy used by Istio.

Other service mesh implementations also exist, but the underlying idea is the same: move networking concerns out of application code and into a dedicated infrastructure layer.

What You Should Remember

You should now be able to answer:

What is a Service Mesh?
Why do we use sidecars?
Why do applications no longer communicate directly?
What is Envoy's role?
Why is it called a "mesh"?
Does Istio replace Kubernetes Services?

If you can explain those six points without looking at notes, you're building the mental model that makes the rest of Istio much easier.



Chapter 3 – Istio Architecture (The Brain and the Workers)
First, Think About Kubernetes

Let's compare it with something you already know.

When we studied Kubernetes, we learned:

                Kubernetes Cluster

        +----------------------------+
        |      Control Plane         |
        |                            |
        | API Server                 |
        | Scheduler                  |
        | Controller Manager         |
        | ETCD                       |
        +----------------------------+

                  │
                  │ Controls
                  ▼

        +----------------------------+
        |       Worker Nodes         |
        |                            |
        | Pods                       |
        | Containers                 |
        +----------------------------+

Notice the pattern.

The Control Plane makes decisions.

The Worker Nodes execute those decisions.

Istio Uses the Same Idea

Istio also has:

Control Plane

↓

Data Plane

Exactly like Kubernetes.

Think Like a Company

Imagine a food delivery company.

There are two groups.

Office
Manager

Planning Team

Dispatch Team
Delivery Riders
Rider 1

Rider 2

Rider 3

Who decides where each order goes?

The office.

Who delivers the food?

The riders.

Istio works exactly the same way.

Istio Architecture
                Istio

        +----------------------+
        |   Control Plane       |
        |                      |
        |      istiod          |
        +----------------------+

                 │

         Sends Configuration

                 │

                 ▼

+---------+   +---------+   +---------+

 Envoy        Envoy        Envoy

 Order        Payment      Inventory

 App          App          App

Notice something.

Applications never communicate with istiod.

Only Envoy communicates with istiod.

Two Main Components
1. Control Plane

This is the brain.

In modern Istio, the control plane is mainly:

istiod

Think of it as:

"The manager of the entire service mesh."

What Does istiod Do?

It does not forward application traffic.

Instead, it manages the mesh by:

Watching Kubernetes resources.
Reading Istio configuration.
Distributing configuration to Envoy proxies.
Managing certificates for mTLS.
Discovering services.

A useful analogy:

Kubernetes API Server manages Kubernetes resources.

istiod manages the service mesh.

2. Data Plane

The data plane is Envoy.

Every application Pod gets an Envoy sidecar.

Example:

Pod

+----------------------+

Application

------------------------

Envoy Proxy

+----------------------+

Envoy is responsible for processing the actual network traffic.

Who Does What?

Let's separate responsibilities.

istiod

Responsible for:

Configuration

Certificates

Service Discovery

Traffic Rules

Security Policies
Envoy

Responsible for:

Receive Request

↓

Check Rules

↓

Retry

↓

Timeout

↓

Load Balance

↓

Encrypt

↓

Forward Traffic
Real Request Flow

Suppose a customer opens:

demo.local

The request travels like this:

Browser

↓

Ingress Gateway (Envoy)

↓

Order Envoy

↓

Order Application

↓

Order Envoy

↓

Payment Envoy

↓

Payment Application

Notice something.

Every hop passes through an Envoy proxy.

The applications themselves are not making routing decisions.

Where Does Configuration Come From?

Suppose you create this:

VirtualService

Question:

How does every Envoy know about it?

The flow is:

kubectl apply

↓

Kubernetes API Server

↓

Istiod detects change

↓

Istiod updates all Envoy proxies

↓

Envoy immediately uses new rules

No application restart is required.

Example

Suppose you apply:

weight:
  - v1: 90
  - v2: 10

What happens internally?

Step 1

You execute:

kubectl apply -f virtualservice.yaml
Step 2

Kubernetes stores it.

API Server

↓

etcd
Step 3

istiod watches the Kubernetes API.

It notices:

"A new VirtualService has been created."

Step 4

istiod converts that YAML into Envoy configuration.

Step 5

It pushes the configuration to every relevant Envoy proxy.

Istiod

↓

Envoy 1

↓

Envoy 2

↓

Envoy 3
Step 6

The next request follows the new routing rule immediately.

No application restart.

No Pod restart.

No Deployment rollout.

Just updated proxy configuration.

Think of istiod as Google Maps

Imagine Google Maps.

Traffic Accident

↓

Google Server Updates

↓

Drivers Receive New Route

Drivers don't decide the new route themselves.

Google tells them.

Similarly:

New VirtualService

↓

Istiod Updates

↓

Envoy Receives New Rules

↓

Traffic Changes
Service Discovery

How does Envoy know where the Payment service is?

Not from hardcoded IPs.

It asks istiod.

istiod learns about services from Kubernetes and distributes that information to the proxies.

This is why Pods can be created and destroyed without manually updating routing.

Certificates

Suppose we enable mTLS later.

Question:

Who generates certificates?

Answer:

istiod.

Envoy receives certificates automatically.

Applications don't have to manage certificates themselves.

Why Is This Better?

Imagine 200 microservices.

Without Istio:

Every service needs its own networking logic.

With Istio:

One Manager

↓

200 Envoy Proxies

↓

200 Applications

Networking behavior becomes centralized and consistent.

Complete Architecture
                     Kubernetes API

                           │

                           ▼

                     +-------------+
                     |   istiod    |
                     +-------------+

                     ▲           │
   Watches Resources │           │ Pushes Config

                     │           ▼

+---------------------------------------------------+

 Pod A              Pod B              Pod C

+---------+       +---------+       +---------+

 App       │       App       │       App

-----------│      -----------│      -----------

 Envoy     │<----> Envoy     │<----> Envoy

+---------+       +---------+       +---------+

+---------------------------------------------------+
Control Plane vs Data Plane
Control Plane (istiod)	Data Plane (Envoy)
Manages the mesh	Handles application traffic
Watches Kubernetes	Intercepts requests
Pushes configuration	Applies routing rules
Issues certificates	Encrypts traffic
Discovers services	Performs retries, timeouts, load balancing
Doesn't forward user requests	Processes every request
Interview Questions

You should now be able to answer:

What is the difference between the Control Plane and the Data Plane?
What is istiod?
Does istiod process application traffic?
What is Envoy?
How does a VirtualService reach the proxies?
Why doesn't updating a VirtualService require restarting Pods?
What responsibilities belong to istiod versus Envoy?

If you can explain these concepts clearly, you're understanding Istio beyond simply applying manifests.

Before we install anything

At this point, you have the conceptual foundation. In the next chapter, we'll connect this theory to your CloudNative Platform by deciding:

Where Istio fits in your existing architecture
How it integrates with Argo CD, NGINX Ingress, and your demo application
Whether to replace NGINX Ingress with the Istio Ingress Gateway or run them together
The production-oriented approach we'll implement in this project



Chapter 4 – Integrating Istio into Our CloudNative Platform

Let's first look at our current architecture.

Current Platform (Modules 00–08)
                    Developer
                        │
                        ▼
                     GitHub
                        │
                        ▼
                     ArgoCD
                        │
                        ▼
                 Kind Kubernetes
                        │
        ┌───────────────┼────────────────┐
        │               │                │
        ▼               ▼                ▼
   ingress-nginx     demo namespace   argocd
        │
        ▼
   NGINX Ingress Controller
        │
        ▼
      Service
        │
        ▼
       Pods

Infrastructure:

Terraform
LocalStack
Local Registry

Everything is working.

Where Does Istio Fit?

Many beginners think:

"Istio replaces Kubernetes."

❌ Wrong.

Others think:

"Istio replaces Services."

❌ Wrong.

Others think:

"Istio replaces ArgoCD."

❌ Wrong.

Others think:

"Istio replaces Terraform."

❌ Wrong.

Istio only solves service-to-service networking.

Platform After Installing Istio

Our platform becomes:

                     GitHub
                        │
                        ▼
                     ArgoCD
                        │
                        ▼
                 Kubernetes Cluster
                        │
        ┌───────────────┼────────────────┐
        │               │                │
        ▼               ▼                ▼
    istio-system     ingress-nginx    argocd
        │
        ▼
      istiod
        │
        ▼
   Envoy Sidecars
        │
        ▼
   Kubernetes Services
        │
        ▼
    Applications

Notice:

Everything still exists.

Istio is added, not substituted.

Does Istio Replace NGINX Ingress?

This is one of the most common interview questions.

Answer:

It depends on the architecture.

There are several valid approaches.

Option 1 – NGINX Only (Your current platform)
Internet

↓

NGINX Ingress

↓

Services

↓

Pods

Good for simple Kubernetes deployments.

Option 2 – Istio Gateway Only
Internet

↓

Istio Ingress Gateway

↓

VirtualService

↓

Pods

Many service-mesh-centric platforms use this approach.

Option 3 – NGINX + Istio (Common in Enterprise)
Internet

↓

NGINX

↓

Istio Gateway

↓

Services

↓

Pods

Organizations sometimes keep NGINX for edge concerns while using Istio internally.

Which Option Will We Use?

For this project, I recommend the following progression:

Phase 1 (Learning)

Keep NGINX Ingress.

Install Istio.

Use Istio for internal service mesh.

Reason:

You already understand NGINX.

We isolate the new concepts.

Phase 2

Replace NGINX with the Istio Ingress Gateway.

This helps you understand:

Why Gateways exist.
How they differ from Kubernetes Ingress.
Traffic management with Istio.
Phase 3

When we migrate to AWS, we'll discuss how external traffic is typically handled with components like the AWS Load Balancer Controller or other ingress solutions alongside or instead of the Istio Ingress Gateway, depending on the platform design.

Why Not Remove NGINX Immediately?

Because you're learning.

If something breaks, you won't know whether the issue is:

Kubernetes
NGINX
Istio
DNS
VirtualService
Gateway

Learning one layer at a time makes troubleshooting much easier.

How Argo CD Fits

Question:

Should Istio be installed manually?

Or by Argo CD?

Production Answer

In GitOps environments, Istio resources and configuration are commonly managed through Git and synchronized by Argo CD.

However, the initial installation of Istio itself can be handled in different ways:

istioctl
Helm
Argo CD (Helm or manifests)

All are used in production.

What Will We Do?

We'll follow a practical learning path:

Step 1

Install Istio using istioctl.

Why?

Because it is:

Official
Easy to verify
Simple to troubleshoot
Great for understanding the platform
Step 2

Once Istio is working:

Move its configuration into Git.

Argo CD will manage:

Gateways
VirtualServices
DestinationRules
AuthorizationPolicies
PeerAuthentications

This matches the GitOps workflow you've already built.

Where Will Istio Live?

We'll create a dedicated namespace:

istio-system

It will contain components such as:

istiod

istio-ingressgateway

istio-egressgateway (optional)

Istio CRDs

Applications remain in their own namespaces.

Example:

argocd

demo

istio-system

ingress-nginx

This keeps responsibilities separated.

What Changes Inside an Application Pod?

Current Pod:

+----------------------+

demo-nginx

+----------------------+

After enabling Istio:

+----------------------+

demo-nginx

------------------------

Envoy Proxy

+----------------------+

The application container itself does not change.

Istio injects the additional sidecar container.

Will My YAML Files Change?

Only a little.

Your Deployment remains largely the same.

You'll add labels or annotations as needed for injection.

New Istio resources include:

Gateway
VirtualService
DestinationRule

Your existing Kubernetes objects (Deployments, Services, ConfigMaps, etc.) continue to exist.

Our Updated Platform Architecture

By the end of Module 09, your platform will look like this:

                           GitHub
                              │
                              ▼
                           ArgoCD
                              │
                              ▼
                      Kubernetes Cluster
                              │
     ┌──────────────┬──────────┴──────────┬───────────────┐
     │              │                     │               │
     ▼              ▼                     ▼               ▼
 istio-system    ingress-nginx         argocd          demo
     │                                                  │
     ▼                                                  ▼
   istiod                                  +----------------------+
                                            | demo-nginx          |
                                            |----------------------|
                                            | Envoy Sidecar       |
                                            +----------------------+
How This Evolves on AWS

The nice part is that most of your Istio configuration is portable.

When we migrate:

Local	AWS
Kind	Amazon EKS
Local Registry	Amazon ECR
LocalStack	AWS Services
Argo CD	Argo CD
Istio	Istio
VirtualService	VirtualService
DestinationRule	DestinationRule
AuthorizationPolicy	AuthorizationPolicy

This portability is one of the strengths of building on Kubernetes.

Interview Questions

You should now be able to answer:

Does Istio replace Kubernetes?
Does Istio replace Kubernetes Services?
Does Istio replace Argo CD?
Can NGINX and Istio coexist?
Why might a team keep NGINX while introducing Istio?
Should Istio be installed manually or through GitOps?
Which Istio resources are good candidates for GitOps management?
We've Finished the Conceptual Foundation

At this point, you understand:

✅ Why Istio exists
✅ What a Service Mesh is
✅ Control Plane vs Data Plane
✅ How istiod and Envoy work
✅ Where Istio fits in your platform

This is enough theory to start building without treating the YAML as magic.

Next Chapter — Hands-on Installation

From this point onward, we'll switch to implementation.

We'll proceed in this order:

Install the istioctl CLI.
Install Istio into your Kind cluster.
Verify every component in istio-system.
Understand what each installed resource does.
Enable sidecar injection for the demo namespace.
Inspect the injected Envoy sidecar.
Trace the request path through the mesh.

This is where the theory you've built starts becoming visible in your running platform.



Q1. Why do Pods become 2/2 after enabling sidecar injection?

Answer:
Because the Pod now contains two running containers:

The application container.
The istio-proxy (Envoy) sidecar.
Q2. What is the purpose of istio-init?

Answer:
It runs before the application starts and configures iptables rules so that Pod traffic is transparently redirected through the Envoy sidecar.

Q3. Does istiod process application traffic?

Answer:
No. istiod is the control plane. It distributes configuration to Envoy proxies. The Envoy sidecars process the actual application traffic.

Where We Go Next

Now that you understand how Pods join the mesh, we move to what makes Istio powerful.