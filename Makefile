# =====================================
# CloudNative Platform Makefile
# =====================================

# =====================================
# Variables
# =====================================

CLUSTER_NAME := cloudnative

REGISTRY_NAME := local-registry
REGISTRY_PORT := 5001

LOCALSTACK_DIR := infrastructure/localstack
TF_DIR := infrastructure/terraform/environments/local

# =====================================
# PHONY Targets
# =====================================

.PHONY: \
	help \
	cluster-create cluster-delete cluster-info \
	registry-start registry-stop \
	deploy-demo remove-demo \
	localstack-up localstack-down localstack-restart \
	localstack-logs localstack-bootstrap \
	localstack-health localstack-validate \
	terraform-init terraform-fmt terraform-validate \
	terraform-plan terraform-apply terraform-output \
	terraform-destroy terraform-all \
	terraform-verify-s3 terraform-verify-sqs \
	terraform-verify-dynamodb terraform-verify-secrets

# =====================================
# Help
# =====================================

help:
	@echo ""
	@echo "========================================"
	@echo "   CloudNative Platform Commands"
	@echo "========================================"
	@echo ""
	@echo "Cluster"
	@echo "  make cluster-create"
	@echo "  make cluster-delete"
	@echo "  make cluster-info"
	@echo ""
	@echo "Registry"
	@echo "  make registry-start"
	@echo "  make registry-stop"
	@echo ""
	@echo "Applications"
	@echo "  make deploy-demo"
	@echo "  make remove-demo"
	@echo ""
	@echo "LocalStack"
	@echo "  make localstack-up"
	@echo "  make localstack-down"
	@echo "  make localstack-restart"
	@echo "  make localstack-bootstrap"
	@echo "  make localstack-health"
	@echo "  make localstack-validate"
	@echo "  make localstack-logs"
	@echo ""
	@echo "Terraform"
	@echo "  make terraform-init"
	@echo "  make terraform-fmt"
	@echo "  make terraform-validate"
	@echo "  make terraform-plan"
	@echo "  make terraform-apply"
	@echo "  make terraform-output"
	@echo "  make terraform-destroy"
	@echo "  make terraform-all"
	@echo ""
	@echo "Terraform Verification"
	@echo "  make terraform-verify-s3"
	@echo "  make terraform-verify-sqs"
	@echo "  make terraform-verify-dynamodb"
	@echo "  make terraform-verify-secrets"
	@echo ""

# =====================================
# Kind Cluster
# =====================================

cluster-create:
	kind create cluster \
		--name $(CLUSTER_NAME) \
		--config infrastructure/kind/kind-config.yaml

cluster-delete:
	kind delete cluster --name $(CLUSTER_NAME)

cluster-info:
	kubectl cluster-info
	kubectl get nodes

# =====================================
# Local Docker Registry
# =====================================

registry-start:
	docker start $(REGISTRY_NAME)

registry-stop:
	docker stop $(REGISTRY_NAME)

# =====================================
# Demo Application
# =====================================

deploy-demo:
	kubectl apply -k kubernetes/base/demo-nginx

remove-demo:
	kubectl delete -k kubernetes/base/demo-nginx

# =====================================
# LocalStack
# =====================================

localstack-up:
	cd $(LOCALSTACK_DIR) && docker compose up -d

localstack-down:
	cd $(LOCALSTACK_DIR) && docker compose down

localstack-restart:
	cd $(LOCALSTACK_DIR) && docker compose down
	cd $(LOCALSTACK_DIR) && docker compose up -d

localstack-logs:
	docker logs -f localstack

localstack-bootstrap:
	cd $(LOCALSTACK_DIR)/init && ./bootstrap.sh

localstack-health:
	cd $(LOCALSTACK_DIR)/scripts && ./healthcheck.sh

localstack-validate:
	cd $(LOCALSTACK_DIR)/scripts && ./validate.sh

# =====================================
# Terraform
# =====================================

terraform-init:
	terraform -chdir=$(TF_DIR) init

terraform-fmt:
	terraform -chdir=$(TF_DIR) fmt -recursive

terraform-validate:
	terraform -chdir=$(TF_DIR) validate

terraform-plan:
	terraform -chdir=$(TF_DIR) plan

terraform-apply:
	terraform -chdir=$(TF_DIR) apply

terraform-output:
	terraform -chdir=$(TF_DIR) output

terraform-destroy:
	terraform -chdir=$(TF_DIR) destroy

terraform-all:
	$(MAKE) terraform-fmt
	$(MAKE) terraform-validate
	$(MAKE) terraform-plan

# =====================================
# Terraform Verification
# =====================================

terraform-verify-s3:
	aws --endpoint-url=http://localhost:4566 s3 ls

terraform-verify-sqs:
	aws --endpoint-url=http://localhost:4566 sqs list-queues

terraform-verify-dynamodb:
	aws --endpoint-url=http://localhost:4566 dynamodb list-tables

terraform-verify-secrets:
	aws --endpoint-url=http://localhost:4566 secretsmanager list-secrets