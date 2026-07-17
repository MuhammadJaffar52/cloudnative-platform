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



Module 12 – Platform Security
Big Picture

Imagine your Kubernetes cluster is a large office building.

Office Building (Kubernetes Cluster)

├── Front Desk (Frontend)
├── Reception (Gateway)
├── HR Office (User Service)
├── Product Department
├── Order Department
└── Finance Department

Without security:

Anyone can enter every room.
Everyone has master keys.
Passwords are written on sticky notes.
Employees work as the CEO.

Obviously that's dangerous.

So we added five layers of security.

1. ServiceAccount
Real World Example

Imagine every employee enters the office using an ID card.

Employee
    │
    ▼
ID Card

The security guard doesn't recognize the person's face.

He checks the ID card.

Exactly the same thing happens in Kubernetes.

Without ServiceAccount
Pod
 │
 ▼
"I don't have an identity."

Kubernetes gives it the default identity.

With ServiceAccount
Pod
 │
 ▼
ServiceAccount
 │
 ▼
Identity
 │
 ▼
Kubernetes API

Now Kubernetes knows:

This Pod is "app-sa".

In our project

We created

shared-sa.yaml
ServiceAccount

Name:

app-sa

Then every Deployment uses it.

Example:

serviceAccountName: app-sa

Now every Pod carries this identity.

Workflow
Deployment

        │

        ▼

Creates Pod

        │

        ▼

Pod receives ServiceAccount

        │

        ▼

Kubernetes knows

"This Pod is app-sa."
2. RBAC

Now Kubernetes knows who you are.

Next question:

What are you allowed to do?

This is RBAC.

Real World Example

Imagine a hospital.

Doctor

Can

✔ View patient

✔ Update patient

❌ Manage salaries
Receptionist

Can

✔ View appointments

❌ Perform surgery

Every person has permissions.

Exactly same in Kubernetes.

We created

Role

which says

Allowed

get pods

list pods

watch pods

get services

get configmaps

But

Denied

delete pods

create pods

get secrets

Then

RoleBinding says

Role

↓

belongs to

↓

ServiceAccount

Workflow

Pod

↓

ServiceAccount

↓

RoleBinding

↓

Role

↓

Permission Check

↓

Allowed or Denied

When we ran

kubectl auth can-i

Kubernetes literally checked

Is app-sa allowed?

↓

YES

or

NO
3. Kubernetes Secrets

Now imagine this.

You own a bank account.

Would you write

Password

ATM PIN

OTP Secret

inside your notebook?

No.

Applications also need

Database Password

JWT Secret

API Key

These are sensitive.

Earlier people write

ConfigMap

↓

DB_PASSWORD=123456

Bad practice.

Instead

We created

Secret

↓

app-secret

Inside

DB_USERNAME

DB_PASSWORD

JWT_SECRET

API_KEY

Workflow

Secret

↓

Stored inside Kubernetes

↓

Deployment references Secret

↓

Pod receives Secret

↓

Application reads Secret

We injected using

env:

valueFrom:

secretKeyRef

Meaning

Go to Secret

↓

Read DB_PASSWORD

↓

Create Environment Variable

Then NodeJS simply reads

process.env.DB_PASSWORD

The application doesn't know where it came from.

Folder

security/

└── secrets/

      app-secret.yaml
4. Security Context

Imagine you hire a cleaner.

Would you give him

Master Key

CEO Laptop

Bank Password

Of course not.

You give minimum permissions.

Containers normally run as

root

Root means

Administrator

Can do almost everything

Very dangerous.

So we changed Dockerfile.

Earlier

root

Now

USER node

Now application becomes

Normal User

Then Kubernetes verifies

runAsNonRoot: true

Meaning

If someone tries

run as root

↓

Reject

Next

allowPrivilegeEscalation: false

Imagine

Employee

tries

↓

Become CEO

Security says

NO

Exactly same.

Next

readOnlyRootFilesystem

Imagine office files.

Instead of

Everyone can edit.

Now

Read Only

Even if attacker enters

Cannot modify system files.

Workflow

Container Starts

↓

Kubernetes checks

↓

Running as root?

↓

YES

↓

Reject

↓

NO

↓

Allow

Folder

Nothing new.

SecurityContext lives inside

deployment.yaml

because it belongs to the container.

5. Network Policies

This is probably the easiest to visualize.

Imagine school classrooms.

Without NetworkPolicy

Every student

Can enter

Every classroom.

Very unsafe.

After NetworkPolicy

Class 10

↓

Only allowed

Science Lab

Not Principal Office

Exactly same.

Without policy

Frontend

↓

Can access everything

Gateway

↓

Everything

User

↓

Everything

After policy

Frontend

↓

Gateway

↓

User

↓

Allowed

Everything else

↓

Blocked

We first created

default-deny

Meaning

Nobody can enter anywhere.

Then

gateway-to-user

Meaning

Gateway

↓

User Service

Allowed

Everything else

Denied

Workflow

Pod A

↓

Requests Pod B

↓

Network Policy checks

↓

Allowed?

↓

YES

↓

Traffic passes

OR

↓

NO

↓

Traffic blocked
Folder Structure

Here's how we organized the security resources:

kubernetes/
└── base/
    └── security/
        ├── kustomization.yaml
        ├── serviceaccount/
        │   └── shared-sa.yaml
        ├── rbac/
        │   ├── shared-role.yaml
        │   └── shared-rolebinding.yaml
        ├── secrets/
        │   └── app-secret.yaml
        └── network-policies/
            ├── default-deny.yaml
            └── gateway-to-user.yaml

Each feature has its own folder. That keeps related files together and makes it easy to extend later.

How Kustomize Works

Think of kustomization.yaml as a table of contents.

If a file isn't listed, Kubernetes ignores it.

Security kustomization
security/
│
├── serviceaccount/
├── rbac/
├── secrets/
├── network-policies/
└── kustomization.yaml

security/kustomization.yaml says:

resources:
  - serviceaccount/shared-sa.yaml
  - rbac/shared-role.yaml
  - rbac/shared-rolebinding.yaml
  - secrets/app-secret.yaml
  - network-policies/default-deny.yaml
  - network-policies/gateway-to-user.yaml

This tells Kustomize:

"When someone includes the security folder, apply all of these resources."

Then base/kustomization.yaml includes the whole security folder:

resources:
  - namespace
  - security
  - frontend
  - gateway
  - user-service
  - product-service
  - order-service
  - payment-service

Finally, your overlay includes the base:

resources:
  - ../../base

So when you run:

kubectl apply -k kubernetes/overlays/local

the flow is:

overlays/local
        │
        ▼
base
        │
        ▼
security
        │
        ├── ServiceAccount
        ├── RBAC
        ├── Secret
        └── Network Policies
        │
        ▼
Microservices
        │
        ▼
Everything is applied together

You don't have to remember individual YAML files. You manage them through the Kustomize hierarchy.

Final Summary

Think of your Kubernetes cluster as a secure office:

Security Feature	Office Analogy	Purpose
ServiceAccount	Employee ID card	Gives each Pod an identity.
RBAC	Employee job permissions	Controls what the Pod is allowed to do.
Secrets	Locked safe containing passwords	Stores sensitive information securely (better than ConfigMaps).
Security Context	Employees work with limited privileges	Prevents containers from running with excessive permissions.
NetworkPolicy	Doors and security guards between rooms	Controls which Pods are allowed to communicate with each other.

These five concepts form the core of Kubernetes security that a junior DevOps engineer is expected to understand and apply. More advanced topics exist (Pod Security Admission, OPA/Gatekeeper, Kyverno, image signing, runtime security, etc.), but they build on the foundation you've now implemented.




Module 12 – Security Verification Commands
1. ServiceAccount
What did we implement?

We created a ServiceAccount named:

app-sa

and attached it to all microservices.

Verify the ServiceAccount exists
kubectl get serviceaccount -n microservices

Expected:

NAME      SECRETS   AGE
app-sa    ...
default   ...
Verify a Pod is using it
kubectl describe pod user-service-<pod-name> -n microservices

Look for:

Service Account: app-sa
Or using JSONPath
kubectl get pod user-service-<pod-name> \
-n microservices \
-o jsonpath="{.spec.serviceAccountName}"

Expected:

app-sa
Boss asks:

How do you know the Pod is using your ServiceAccount?

Show:

kubectl describe pod <pod> -n microservices
2. RBAC
What did we implement?

We allowed:

get
list
watch

We denied:

delete
create
secrets
Verify Allowed
kubectl auth can-i get pods \
--as=system:serviceaccount:microservices:app-sa \
-n microservices

Expected:

yes
Verify Denied
kubectl auth can-i delete pods \
--as=system:serviceaccount:microservices:app-sa \
-n microservices

Expected:

no

Another example

kubectl auth can-i get secrets \
--as=system:serviceaccount:microservices:app-sa \
-n microservices

Expected:

no
Boss asks

How do you know RBAC is working?

Run:

kubectl auth can-i ...

This is the standard Kubernetes authorization check.

3. Kubernetes Secrets
List Secrets
kubectl get secrets -n microservices

Expected:

NAME
app-secret
Describe Secret
kubectl describe secret app-secret -n microservices

Expected:

DB_USERNAME

DB_PASSWORD

JWT_SECRET

API_KEY

Notice the values are hidden.

Show Secret YAML
kubectl get secret app-secret \
-n microservices \
-o yaml

You'll see Base64 encoded values.

Decode One Value
kubectl get secret app-secret \
-n microservices \
-o jsonpath="{.data.DB_PASSWORD}" | base64 -d && echo

Expected:

admin123
Verify the Pod received the Secret
kubectl exec -it user-service-<pod> \
-n microservices \
-- env | grep -E "DB_|JWT|API"

Expected:

DB_USERNAME=admin

DB_PASSWORD=admin123

JWT_SECRET=my-super-secret-key

API_KEY=demo-api-key-123
Boss asks

Is your application actually using the Secret?

Show:

kubectl exec ... env

This proves the Secret is available inside the container.

4. Security Context
Verify running user
kubectl exec -it user-service-<pod> \
-n microservices \
-- id

Expected:

uid=1000(node)

Not

uid=0(root)
Verify Security Context in Pod spec
kubectl get pod user-service-<pod> \
-n microservices \
-o yaml

Search for

securityContext:

or use:

kubectl get pod user-service-<pod> \
-n microservices \
-o jsonpath="{.spec.containers[0].securityContext}"

Expected:

allowPrivilegeEscalation:false

readOnlyRootFilesystem:true

runAsNonRoot:true
Boss asks

How do you know the container isn't running as root?

Run:

kubectl exec ... id

This is the quickest and clearest proof.

5. Network Policy
List Policies
kubectl get networkpolicy -n microservices

Expected:

default-deny

gateway-to-user
Describe Policy
kubectl describe networkpolicy default-deny -n microservices

Another

kubectl describe networkpolicy gateway-to-user \
-n microservices
Show YAML
kubectl get networkpolicy gateway-to-user \
-n microservices \
-o yaml
Can we test traffic?

For your Kind cluster, probably not.

Reason:

Kind's default networking does not enforce NetworkPolicy. Enforcement depends on the CNI plugin (for example, Calico or Cilium).

So the correct demonstration is:

kubectl get networkpolicy
kubectl describe networkpolicy

and explain:

"The policies are successfully created. In a cluster with a NetworkPolicy-capable CNI, these rules would be enforced."

This is an accurate and professional explanation.

Complete Demo Flow (5–7 Minutes)

If your boss asks you to demonstrate Module 12, you can follow this sequence:

ServiceAccount

kubectl describe pod <pod> -n microservices

Point to:

Service Account: app-sa

RBAC

kubectl auth can-i get pods \
--as=system:serviceaccount:microservices:app-sa \
-n microservices

kubectl auth can-i delete pods \
--as=system:serviceaccount:microservices:app-sa \
-n microservices

Explain: one returns yes, the other no.

Secrets

kubectl get secrets -n microservices

kubectl exec -it <user-pod> \
-n microservices \
-- env | grep -E "DB_|JWT|API"

Explain that the application receives sensitive values without hardcoding them.

Security Context

kubectl exec -it <user-pod> \
-n microservices \
-- id

Point out that the process runs as node (non-root), not root.

Network Policies

kubectl get networkpolicy -n microservices

kubectl describe networkpolicy gateway-to-user \
-n microservices

Explain the "default deny, explicit allow" model and note that enforcement requires a CNI supporting NetworkPolicy.

One important correction

Earlier we enabled:

readOnlyRootFilesystem: true

If your application is still running correctly, that's great. If it had failed, the correct production solution would have been to mount writable paths (for example, with emptyDir) rather than simply disabling the setting. Knowing that distinction is useful if someone asks how you'd handle applications that need temporary write access.


Module 12 — Scenario-Based Interview Questions
Part 1 — ServiceAccount
Scenario 1

Your application needs to read ConfigMaps from Kubernetes, but it cannot access the Kubernetes API.

Questions

Why might this happen?
How would you verify which ServiceAccount the Pod is using?
How would you fix it?
Scenario 2

A Pod is using the default ServiceAccount instead of app-sa.

How do you identify the issue?

What needs to be changed?

Scenario 3

Your manager says:

"Every application should have its own identity."

How would you implement that?

Would you use one shared ServiceAccount or separate ServiceAccounts?

Why?

Scenario 4

A Pod starts successfully but cannot authenticate to the Kubernetes API.

Where would you begin troubleshooting?

Scenario 5

How do you prove that a Pod is using the correct ServiceAccount?

Part 2 — RBAC
Scenario 6

Your application needs to list Pods but receives:

403 Forbidden

How would you troubleshoot?

Scenario 7

A developer asks for permission to delete Pods.

Would you allow it?

Why or why not?

Scenario 8

Your application can read Pods but cannot read Secrets.

Why?

How do you verify?

Scenario 9

Someone accidentally gives a ServiceAccount cluster-admin.

Why is that dangerous?

Scenario 10

How do you verify RBAC permissions without modifying anything?

Scenario 11

Your Pod suddenly loses access to ConfigMaps after a deployment.

Where would you investigate?

Scenario 12

A Role exists.

A RoleBinding exists.

The ServiceAccount exists.

The application still gets "Forbidden."

Possible causes?

Part 3 — Kubernetes Secrets
Scenario 13

A developer stores a database password inside a ConfigMap.

Would you approve the change?

Why?

Scenario 14

Your application cannot read:

process.env.DB_PASSWORD

How would you troubleshoot?

Scenario 15

The Secret exists.

The Pod is running.

The environment variable is empty.

Possible causes?

Scenario 16

A Secret was updated.

The application still uses the old value.

Why?

Scenario 17

Someone says:

"Secrets are encrypted."

Is that completely true?

Explain.

Scenario 18

Your company wants all passwords stored in AWS Secrets Manager.

How would Kubernetes consume them?

Scenario 19

A Secret was accidentally committed to GitHub.

What should be done immediately?

Scenario 20

How do you verify that a Secret is actually available inside a running Pod?

Part 4 — Security Context
Scenario 21

Your security team says:

"Containers must never run as root."

How would you implement this?

Scenario 22

You enabled:

runAsNonRoot: true

Now the Pod won't start.

Why?

Scenario 23

After enabling:

readOnlyRootFilesystem: true

The application crashes.

What could be happening?

How would you troubleshoot?

Scenario 24

How do you verify that a container is running as a non-root user?

Scenario 25

Your Dockerfile contains:

USER root

But your Deployment contains:

runAsNonRoot: true

What happens?

Scenario 26

What is the purpose of:

allowPrivilegeEscalation: false

Can you give a practical example?

Scenario 27

Would you enable readOnlyRootFilesystem for every application?

Why or why not?

Part 5 — Network Policies
Scenario 28

All Pods can communicate with each other.

Is that secure?

What would you recommend?

Scenario 29

The security team asks you to implement a "default deny" policy.

What does that mean?

Scenario 30

Only the Gateway should communicate with the User Service.

How would you enforce that?

Scenario 31

You applied a NetworkPolicy.

Nothing changed.

Why?

Scenario 32

How do you verify that NetworkPolicies exist in the cluster?

Scenario 33

A Pod cannot communicate with another Pod.

How would you determine whether a NetworkPolicy is responsible?

Scenario 34

What is the difference between:

Ingress policy
Egress policy
Scenario 35

Can NetworkPolicies block Internet traffic?

Explain.

Mixed Scenarios
Scenario 36

An application receives:

403 Forbidden

What would you check first?

ServiceAccount
RBAC
Secret
NetworkPolicy

Explain your reasoning.

Scenario 37

An application starts but cannot access the database password.

Where would you investigate?

Scenario 38

An attacker compromises the User Service.

What security mechanisms in your project help limit the damage?

Scenario 39

A Pod keeps restarting after a security change.

Which features could be responsible?

Scenario 40

Your manager asks:

"How have you secured this Kubernetes platform?"

How would you answer in 2–3 minutes?

Hands-On Troubleshooting
Scenario 41

Verify that the correct ServiceAccount is attached.

Scenario 42

Verify RBAC permissions.

Scenario 43

Verify the Secret exists.

Scenario 44

Verify the Secret is injected into the container.

Scenario 45

Verify the container is not running as root.

Scenario 46

Verify the NetworkPolicies exist.

Real Production Scenarios
Scenario 47

A junior developer accidentally grants:

verbs:
- "*"
resources:
- "*"

Would you approve this?

Why?

Scenario 48

A developer hardcodes an API key in the Docker image.

Why is this dangerous?

What would you recommend instead?

Scenario 49

Your security audit finds that every Pod runs as root.

What remediation plan would you propose?

Scenario 50

Your manager asks:

"Which Kubernetes security features have you implemented on this platform?"

How would you summarize your work?

Mini Practical Test (Great for Self-Practice)

Imagine you're given a fresh Kubernetes cluster and asked to secure a new application. Without looking at notes, explain the steps you would take:

Create a dedicated ServiceAccount.
Grant only the minimum RBAC permissions required.
Store sensitive values in a Secret instead of a ConfigMap.
Configure the application to consume the Secret.
Ensure the container runs as a non-root user with an appropriate securityContext.
Restrict Pod-to-Pod communication with NetworkPolicies.
Verify each security control using kubectl commands.

If you can confidently explain and demonstrate these steps, you'll be well prepared for junior DevOps interviews covering Kubernetes security.

Interview Readiness

If I were interviewing for a Junior DevOps Engineer role, the questions I'd consider must-know from this module are:

⭐⭐⭐⭐⭐ ServiceAccount vs RBAC
⭐⭐⭐⭐⭐ ConfigMap vs Secret
⭐⭐⭐⭐⭐ How to verify RBAC (kubectl auth can-i)
⭐⭐⭐⭐⭐ How to verify a Secret inside a Pod
⭐⭐⭐⭐⭐ Why containers should not run as root
⭐⭐⭐⭐ How runAsNonRoot works
⭐⭐⭐⭐ Purpose of allowPrivilegeEscalation
⭐⭐⭐⭐ Default-deny NetworkPolicy concept
⭐⭐⭐ How to troubleshoot "403 Forbidden"
⭐⭐⭐ Basic understanding of NetworkPolicy enforcement (CNI dependency)

These topics are among the most frequently discussed in Kubernetes-focused junior DevOps interviews.