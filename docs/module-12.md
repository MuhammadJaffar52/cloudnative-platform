Module 12.2 — RBAC (Role-Based Access Control)
7% Theory

Authentication answers:

Who are you?

Authorization answers:

What are you allowed to do?

RBAC provides authorization.

The API server evaluates requests in this order:

Pod
 │
 ▼
ServiceAccount
 │
 ▼
Authentication ✓
 │
 ▼
RBAC Authorization ✓/✗
 │
 ▼
API Server

ServiceAccount = Identity

RBAC = Permissions

Practical 1 — Check Your Current Permissions

Run:

kubectl auth can-i get pods \
--as=system:serviceaccount:microservices:default \
-n microservices

Then check more actions:

kubectl auth can-i list pods \
--as=system:serviceaccount:microservices:default \
-n microservices

kubectl auth can-i create deployments \
--as=system:serviceaccount:microservices:default \
-n microservices

kubectl auth can-i get secrets \
--as=system:serviceaccount:microservices:default \
-n microservices

Observe which return yes and which return no.

Practical 2 — Create a Dedicated Service Account

Create product-sa.yaml:

apiVersion: v1
kind: ServiceAccount

metadata:
  name: product-sa
  namespace: microservices

Apply it:

kubectl apply -f product-sa.yaml

Verify:

kubectl get sa -n microservices
Practical 3 — Create a Read-Only Role

Create product-role.yaml:

apiVersion: rbac.authorization.k8s.io/v1
kind: Role

metadata:
  name: product-reader
  namespace: microservices

rules:
- apiGroups: [""]
  resources:
    - pods
    - services
    - configmaps
  verbs:
    - get
    - list
    - watch

Apply:

kubectl apply -f product-role.yaml

Verify:

kubectl get role -n microservices
Practical 4 — Bind the Role

Create product-rolebinding.yaml:

apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding

metadata:
  name: product-reader-binding
  namespace: microservices

subjects:
- kind: ServiceAccount
  name: product-sa
  namespace: microservices

roleRef:
  kind: Role
  name: product-reader
  apiGroup: rbac.authorization.k8s.io

Apply:

kubectl apply -f product-rolebinding.yaml
Practical 5 — Test the Permissions

Now check the new ServiceAccount:

kubectl auth can-i get pods \
--as=system:serviceaccount:microservices:product-sa \
-n microservices

Expected:

yes

Now test:

kubectl auth can-i delete pods \
--as=system:serviceaccount:microservices:product-sa \
-n microservices

Expected:

no

Test:

kubectl auth can-i create deployments \
--as=system:serviceaccount:microservices:product-sa \
-n microservices

Expected:

no

Test:

kubectl auth can-i watch configmaps \
--as=system:serviceaccount:microservices:product-sa \
-n microservices

Expected:

yes
Practical 6 — Attach the Service Account

Edit the product-service Deployment:

spec:
  template:
    spec:
      serviceAccountName: product-sa

Apply:

kubectl apply -f product-deployment.yaml

Wait:

kubectl rollout status deployment/product-service -n microservices

Verify:

kubectl describe pod <new-product-pod> -n microservices

You should now see:

Service Account: product-sa
Production Insight

In a production environment, you typically do not create one ServiceAccount per replica. Instead, you create one ServiceAccount per application or workload.

For your platform, a common pattern would be:

frontend-sa
gateway-sa
user-service-sa
product-service-sa
order-service-sa
payment-service-sa

Each ServiceAccount gets only the RBAC permissions that workload actually requires, following the principle of least privilege.

Interview Questions
What is RBAC?
Kubernetes authorization mechanism that controls what authenticated users or ServiceAccounts can do.
What is the difference between a Role and a ClusterRole?
A Role grants permissions within a single namespace.
A ClusterRole grants cluster-wide permissions or permissions to cluster-scoped resources.
What is a RoleBinding?
It associates a Role with a user, group, or ServiceAccount.
How do you verify permissions?
Using kubectl auth can-i.

Complete these RBAC exercises, and then we'll move directly to Kubernetes Secrets, which is another topic every junior DevOps engineer is expected to know.

Today 8:10 AM
you hav provided me the files and yaml code but not tell me in which folder should i make these files 

Good catch. From now on, I won't just give you YAML—I will tell you exactly where to create every file according to our project structure. We will keep the repository production-like.

Based on our repository, the security manifests should live under the Kubernetes manifests.

Recommended Folder Structure
cloudnative-platform/
│
├── kubernetes/
│   ├── base/
│   │   ├── frontend/
│   │   ├── gateway/
│   │   ├── user-service/
│   │   ├── product-service/
│   │   ├── order-service/
│   │   ├── payment-service/
│   │   └── security/
│   │       ├── serviceaccounts/
│   │       ├── rbac/
│   │       ├── secrets/
│   │       ├── networkpolicies/
│   │       ├── resourcequota/
│   │       └── limitrange/
For This Lesson

Create these directories:

mkdir -p kubernetes/base/security/serviceaccounts
mkdir -p kubernetes/base/security/rbac
File 1

Create:

kubernetes/base/security/serviceaccounts/product-sa.yaml
File 2

Create:

kubernetes/base/security/rbac/product-role.yaml
File 3

Create:

kubernetes/base/security/rbac/product-rolebinding.yaml
Apply Them
kubectl apply -f kubernetes/base/security/serviceaccounts/

kubectl apply -f kubernetes/base/security/rbac/

Kubernetes will automatically apply every YAML file inside those directories.

Future Modules

We'll keep everything organized like this:

kubernetes/
└── base/
    └── security/
        ├── serviceaccounts/
        ├── rbac/
        ├── secrets/
        ├── networkpolicies/
        ├── resourcequota/
        └── limitrange/

This mirrors how many production repositories separate security resources from application resources, making them easier to manage and review.

Rule We'll Follow

From now on, every practical step will include:

Where to create the file (exact path)
YAML content
Why we're creating it
How to apply it
How to verify it
How it works internally