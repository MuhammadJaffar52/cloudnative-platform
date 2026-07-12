Module 05 — Terraform
Objective

The objective of this module is to introduce Terraform as the Infrastructure as Code (IaC) tool for our CloudNative Platform. Instead of manually creating cloud resources, we define them in code so they can be created, updated, and deleted automatically.

In this module, Terraform provisions infrastructure against LocalStack, allowing us to build and test AWS infrastructure locally before migrating to real AWS.

Why Terraform?

Before Terraform:

Resources are created manually.
Every environment may be different.
Difficult to reproduce infrastructure.
Easy to make mistakes.

After Terraform:

Infrastructure is written as code.
Environments are reproducible.
Infrastructure changes are version controlled.
Easy to automate using CI/CD.
Same code can later be deployed to AWS.
Where Terraform Fits in Our Platform
Developer
    │
    ▼
Git Repository
    │
    ▼
Terraform
    │
    ▼
AWS Provider
    │
    ▼
LocalStack
    │
    ▼
S3
SQS
DynamoDB
Secrets Manager

Terraform acts as the bridge between our code and the cloud platform.

Repository Structure
infrastructure/
└── terraform/
    ├── environments/
    │   ├── local/
    │   │   ├── provider.tf
    │   │   ├── main.tf
    │   │   ├── variables.tf
    │   │   ├── outputs.tf
    │   │   ├── terraform.tfvars
    │   │   └── versions.tf
    │   └── aws/
    ├── modules/
    │   ├── s3/
    │   ├── sqs/
    │   ├── dynamodb/
    │   └── secrets-manager/
    └── README.md
Terraform Fundamentals
Provider

A provider is a plugin that allows Terraform to communicate with a platform.

Example:

Terraform
     │
     ▼
AWS Provider
     │
     ▼
LocalStack / AWS
Resource

A resource is anything Terraform creates or manages.

Examples:

S3 Bucket
SQS Queue
DynamoDB Table
Secrets Manager Secret
Variables

Variables make Terraform reusable.

Instead of hardcoding values, they allow different environments to use different configurations.

Outputs

Outputs display important values after deployment.

Examples:

Bucket Name
Queue URL
Table Name
Secret ARN
Modules

Modules are reusable Terraform components.

Instead of writing the same code repeatedly, we created separate modules for:

S3
SQS
DynamoDB
Secrets Manager
State

Terraform stores everything it manages inside the state file.

terraform.tfstate

The state allows Terraform to know:

What already exists
What changed
What should be updated
What should be deleted
Backend

Currently:

Local Backend
↓

terraform.tfstate

Future (AWS):

S3 Bucket
+
DynamoDB Lock

This enables safe collaboration between multiple engineers.

Terraform Workflow
terraform fmt
↓

terraform validate
↓

terraform init
↓

terraform plan
↓

terraform apply
↓

terraform output
↓

terraform destroy
Command Summary
Command	Purpose
terraform fmt	Format Terraform files
terraform validate	Validate syntax
terraform init	Download providers and initialize
terraform plan	Preview infrastructure changes
terraform apply	Create or update infrastructure
terraform output	Display outputs
terraform destroy	Delete managed resources
What We Implemented
1. Provider

Configured the AWS provider to communicate with LocalStack instead of AWS.

2. S3 Module

Created a reusable module that provisions:

S3 Bucket
Versioning

Output:

Bucket Name
Bucket ARN
3. SQS Module

Created a reusable module that provisions:

SQS Queue

Output:

Queue Name
Queue URL
Queue ARN
4. DynamoDB Module

Created a reusable module that provisions:

DynamoDB Table
PAY_PER_REQUEST billing mode
Hash Key

Output:

Table Name
Table ID
Table ARN
5. Secrets Manager Module

Created a reusable module that provisions:

Secret
Secret Version

Output:

Secret Name
Secret ID
Secret ARN
6. Environment Configuration

Created the Local environment containing:

Provider configuration
Module calls
Variables
Outputs
tfvars

This environment acts as the entry point for Terraform.

Makefile Integration

Added automation commands.

make terraform-init

make terraform-fmt

make terraform-validate

make terraform-plan

make terraform-apply

make terraform-output

make terraform-destroy

make terraform-verify-s3

make terraform-verify-sqs

make terraform-verify-dynamodb

make terraform-verify-secrets

make terraform-all
Verification

Verified all resources using AWS CLI against LocalStack.

S3
aws s3 ls

Result:

cloudnative-platform-local
SQS
aws sqs list-queues

Result:

cloudnative-platform-queue
DynamoDB
aws dynamodb list-tables

Result:

cloudnative-platform-table
Secrets Manager
aws secretsmanager list-secrets

Result:

cloudnative-platform-secret
What We Learned
Infrastructure as Code (IaC)
Terraform architecture
Providers
Resources
Variables
Outputs
Modules
State management
Environment separation
AWS provider configuration
LocalStack integration
Makefile automation
Infrastructure verification
Best Practices
Use reusable modules.
Avoid hardcoded values.
Store secrets securely.
Always run terraform fmt.
Validate before applying.
Review terraform plan.
Separate environments (local, dev, stage, prod).
Commit Terraform code, not .terraform/ or state files (for local development).
Common Mistakes
Running terraform apply without reviewing the plan.
Hardcoding names or secrets.
Editing the state file manually.
Keeping everything in one large main.tf.
Not using modules.
Forgetting to run terraform init after provider changes.
Interview Questions

1. What is Terraform?
Terraform is an Infrastructure as Code (IaC) tool that provisions and manages infrastructure using declarative configuration files.

2. What is a Provider?
A provider is a plugin that enables Terraform to communicate with platforms such as AWS, Azure, Kubernetes, or Docker.

3. What is a Resource?
A resource represents an infrastructure object that Terraform creates, updates, or deletes.

4. What is a Module?
A module is a reusable collection of Terraform resources that helps reduce duplication and improve maintainability.

5. What is Terraform State?
Terraform State maps the configuration to real infrastructure, allowing Terraform to track existing resources and calculate required changes.

6. Difference between terraform plan and terraform apply?
plan previews the changes, while apply executes those changes.

7. Why use Variables?
Variables make Terraform reusable and configurable across different environments.

8. Why use Outputs?
Outputs expose useful information, such as resource IDs or ARNs, for users, other modules, or automation tools.

9. Why use LocalStack?
LocalStack emulates AWS services locally, enabling development and testing without an AWS account or cloud costs.

10. Why use Makefile with Terraform?
A Makefile provides simple, consistent commands, reduces typing, and standardizes workflows across a team.

Summary

In Module 5, we transformed our platform from manually managed infrastructure to Infrastructure as Code using Terraform. We built reusable modules for S3, SQS, DynamoDB, and Secrets Manager, provisioned them on LocalStack, automated common operations with Make, and verified all resources. This establishes a reusable, production-style foundation that can later target AWS with minimal changes.