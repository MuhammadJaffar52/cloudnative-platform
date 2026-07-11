# =====================================
# CloudNative Platform Makefile
# =====================================

CLUSTER_NAME := cloudnative
REGISTRY_NAME := local-registry
REGISTRY_PORT := 5001

.PHONY: help cluster-create cluster-delete cluster-info \
        registry-start registry-stop \
        deploy-demo remove-demo

help:
	@echo "Available targets:"
	@echo "  make cluster-create"
	@echo "  make cluster-delete"
	@echo "  make cluster-info"
	@echo "  make registry-start"
	@echo "  make registry-stop"
	@echo "  make deploy-demo"
	@echo "  make remove-demo"

cluster-create:
	kind create cluster --name $(CLUSTER_NAME) --config infrastructure/kind/kind-config.yaml

cluster-delete:
	kind delete cluster --name $(CLUSTER_NAME)

cluster-info:
	kubectl cluster-info
	kubectl get nodes

registry-start:
	docker start $(REGISTRY_NAME)

registry-stop:
	docker stop $(REGISTRY_NAME)

deploy-demo:
	kubectl apply -k kubernetes/base/demo-nginx

remove-demo:
	kubectl delete -k kubernetes/base/demo-nginx