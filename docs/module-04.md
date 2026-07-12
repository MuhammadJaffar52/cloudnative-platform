docs/module-04.md
Module 04 – Local AWS Cloud with LocalStack
Objective

The objective of this module was to create a local AWS environment using LocalStack so we could develop and test cloud-native applications without using a real AWS account.

Instead of provisioning resources in Amazon Web Services, we built a local environment that behaves like AWS and allows us to experiment safely.

By the end of this module, we had a working local implementation of:

Amazon S3
Amazon SQS
Amazon DynamoDB
AWS Secrets Manager

All running completely on our local machine.

Why Do We Need LocalStack?

Imagine you are developing an application that uploads images.

Normally the application would send those images to Amazon S3.

The architecture would look like this:

Developer

     │

Application

     │

Internet

     │

Amazon AWS

     │

S3

This approach has several disadvantages during development:

Internet connection is required.
AWS credentials are required.
Resources may incur charges.
Mistakes can affect real cloud infrastructure.

Instead, LocalStack provides a local implementation of AWS services.

Now the architecture becomes:

Developer

     │

Application

     │

LocalStack

     │

S3

Everything runs locally.

No AWS account is required.

No internet connection is needed after downloading the container.

No cloud costs are incurred.

What is LocalStack?

Think of Amazon AWS as a huge shopping mall.

Inside that mall are many different stores.

AWS

├── EC2

├── S3

├── IAM

├── DynamoDB

├── SQS

├── Lambda

├── Secrets Manager

Instead of visiting the real shopping mall, LocalStack builds a smaller version of that mall on your laptop.

Although not every AWS service is fully implemented, many important services are available for development and testing.

Why Docker?

Installing AWS services individually would be extremely difficult.

LocalStack packages all required services into a Docker container.

Docker

      │

LocalStack Container

      │

S3

SQS

DynamoDB

Secrets Manager

Using Docker also ensures every developer gets the exact same environment.

Why Docker Compose?

Running LocalStack manually would require a long Docker command.

Instead, we defined everything inside:

docker-compose.yml

Docker Compose acts as a recipe.

Instead of remembering a long command every time, we simply run:

docker compose up -d

Docker Compose automatically creates and starts the LocalStack container according to the configuration file.

Why Port 4566?

Every network service listens on a port.

Examples include:

80      HTTP

443     HTTPS

3306    MySQL

5432    PostgreSQL

LocalStack exposes all AWS APIs through a single endpoint:

localhost:4566

Whenever we communicate with:

http://localhost:4566

we are talking to LocalStack instead of Amazon AWS.

Configuring the AWS CLI

Normally, the AWS CLI communicates with Amazon AWS.

AWS CLI

      │

Amazon AWS

We configured the AWS CLI to communicate with LocalStack instead.

AWS CLI

      │

localhost:4566

      │

LocalStack

This allows every AWS CLI command to operate against the local environment.

Why Did We Use Fake Credentials?

When configuring the AWS CLI we entered:

Access Key

test

Secret Key

test

These credentials are not real.

LocalStack does not authenticate requests like Amazon AWS.

The AWS CLI only requires that some credentials exist.

Verifying the Connection

We executed:

aws sts get-caller-identity

Think of this command as asking:

"Who am I connected to?"

Instead of returning a real AWS account, LocalStack returned:

Account

000000000000

This confirmed that the AWS CLI was communicating with LocalStack rather than Amazon AWS.

Services We Created
Amazon S3

Amazon S3 is an object storage service.

Imagine Google Drive.

Instead of folders, S3 uses buckets.

Bucket

↓

Objects

We created:

cloudnative-platform-artifacts

This bucket can later store:

application artifacts
uploaded files
Terraform state
backups
logs
Amazon SQS

Amazon SQS is a messaging queue.

Imagine customers standing in a line at a bank.

Each customer waits until the cashier becomes available.

Application

      │

Queue

      │

Worker

Instead of processing every request immediately, applications can place work into the queue.

Workers process requests one by one.

This makes applications more reliable and scalable.

Amazon DynamoDB

DynamoDB is a NoSQL database.

Instead of storing data in tables with complex relationships like SQL databases, DynamoDB stores key-value style data.

We created:

platform-config

This table can later store:

application settings
metadata
configuration
AWS Secrets Manager

Applications often require sensitive information such as:

database passwords
API keys
tokens

Bad practice:

password="admin123"

Good practice:

Application

↓

Secrets Manager

↓

Password

Secrets remain centralized and can be rotated without changing application code.

Automation

Initially we created resources manually using AWS CLI commands.

Example:

aws s3api create-bucket ...

Manual commands are difficult to remember and error-prone.

Instead, we automated the entire process using shell scripts.

What is an Idempotent Script?

An idempotent operation produces the same result no matter how many times it is executed.

Bad example:

Create bucket

Running it twice causes an error because the bucket already exists.

Good example:

If bucket exists

↓

Do nothing

Else

↓

Create bucket

This allows scripts to be executed repeatedly without causing failures.

Infrastructure automation should always be idempotent.

Initialization Scripts

We created:

init/

01-create-s3.sh

02-create-sqs.sh

03-create-dynamodb.sh

04-create-secrets.sh

Each script:

checks whether the resource already exists
creates it only if necessary
can be executed multiple times safely
Bootstrap Script

Rather than running every script individually, we created:

bootstrap.sh

The bootstrap script executes every initialization script automatically.

bootstrap.sh

      │

Create S3

      │

Create SQS

      │

Create DynamoDB

      │

Create Secret

One command prepares the entire local AWS environment.

Validation Script

We created:

validate.sh

Its purpose is to verify that every AWS resource exists.

Instead of checking resources manually, one script validates the entire environment.

Health Check

We also implemented:

healthcheck.sh

A container being "running" does not always mean it is ready.

The health check confirms that LocalStack is fully operational before other automation depends on it.

Makefile Automation

Instead of remembering multiple commands:

docker compose up

bootstrap.sh

validate.sh

healthcheck.sh

we added Makefile targets.

Now we simply execute:

make localstack-up

make localstack-bootstrap

make localstack-validate

make localstack-health

This provides a consistent interface for operating the platform.

Repository Structure
infrastructure/

└── localstack/

    ├── docker-compose.yml

    ├── config/

    ├── init/

    │   ├── 01-create-s3.sh

    │   ├── 02-create-sqs.sh

    │   ├── 03-create-dynamodb.sh

    │   ├── 04-create-secrets.sh

    │   └── bootstrap.sh

    ├── scripts/

    │   ├── validate.sh

    │   ├── healthcheck.sh

    │   └── cleanup.sh

    └── README.md
What We Learned

After completing this module, we learned:

What LocalStack is
Why LocalStack is useful
How Docker runs LocalStack
Why Docker Compose is used
How AWS CLI communicates with LocalStack
How S3 works
How SQS works
How DynamoDB works
How Secrets Manager works
Why automation is important
What idempotency means
Why Makefiles simplify operations
Interview Questions
What is LocalStack?

LocalStack is a local AWS cloud emulator that allows developers to run and test AWS services such as S3, SQS, DynamoDB, and Secrets Manager on their own machine without using a real AWS account.

Why use LocalStack?

To reduce cloud costs, enable offline development, test Infrastructure as Code locally, and safely validate cloud-native applications before deploying to AWS.

Why configure AWS CLI with LocalStack?

Because the AWS CLI normally communicates with Amazon AWS. By pointing it to LocalStack's endpoint (localhost:4566), the same commands operate against the local environment instead of the real cloud.

What is idempotency?

Idempotency means an operation can be executed multiple times and always produce the same desired result without causing duplicate resources or errors.

Why use Docker Compose?

Docker Compose defines the LocalStack configuration as code, making the environment reproducible and easy to start with a single command.

Summary

In this module, we built a complete local AWS environment using LocalStack. We configured the AWS CLI, created core AWS services, automated resource provisioning with idempotent shell scripts, added validation and health checks, and integrated everything into the Makefile. This provides a reproducible development platform that closely resembles AWS while remaining entirely local.

Next Module

Module 5 introduces Terraform.

Instead of manually creating infrastructure with shell scripts, we will define our infrastructure declaratively using Infrastructure as Code (IaC). Terraform will provision the same resources in LocalStack first and later in AWS with minimal changes, demonstrating how modern Platform Engineering teams manage cloud infrastructure consistently across environments.