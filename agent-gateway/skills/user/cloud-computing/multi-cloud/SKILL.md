---
name: multi-cloud
description: Strategy of using multiple cloud computing services from different providers to avoid vendor lock-in
category: cloud-computing
---

# Multi-Cloud Computing

## What I Do

I enable organizations to leverage multiple cloud providers simultaneously. I help avoid vendor lock-in, optimize costs, enhance resilience, and leverage best-of-breed services from different providers.

## When to Use Me

- Enterprise avoiding single-vendor dependency
- Regulatory requirements for data sovereignty
- Optimizing costs across providers
- Leveraging provider-specific services
- Geographic distribution requirements
- Disaster recovery across clouds
- Bursting capacity during peak loads

## Core Concepts

- **Vendor Abstraction**: Write code that works across providers
- **Unified Identity Management**: Single sign-on across clouds
- **Cross-Cloud Networking**: VPN, direct connect, SD-WAN
- **Container Portability**: Kubernetes for cloud-agnostic deployment
- **Infrastructure as Code**: Terraform, Pulumi for multi-provider
- **Data Gravity**: Moving data vs. moving compute
- **Service Mapping**: AWS ↔ Azure ↔ GCP service equivalents
- **Federated Governance**: Consistent policies across providers
- **Cost Optimization**: Right-sizing and spot instances per provider
- **Workload Placement**: Choose best provider per workload

## Code Examples

**Terraform Multi-Provider Configuration (HCL):**
```hcl
# AWS Provider
provider "aws" {
  alias  = "aws_east"
  region = "us-east-1"
}

# Azure Provider
provider "azurerm" {
  features {}
  alias  = "azure_west"
  region = "west europe"
}

# GCP Provider
provider "google" {
  project = "my-project"
  region  = "us-central1"
}

# Kubernetes cluster across AWS and GCP
resource "aws_eks_cluster" "primary" {
  provider = aws.aws_east
  name     = "primary-cluster"
  role_arn = aws_iam_role.eks.arn
  
  vpc_config {
    subnet_ids = aws_subnet.eks_subnets[*].id
  }
}

resource "google_container_cluster" "secondary" {
  provider = google.google
  name     = "secondary-cluster"
  location = "us-central1-a"
  
  node_pools {
    name       = "default"
    node_count = 3
  }
}
```

**Kubernetes Federation (YAML):**
```yaml
apiVersion: types.kubefed.io/v1beta1
kind: FederatedDeployment
metadata:
  name: multi-cloud-app
  namespace: default
spec:
  template:
    metadata:
      labels:
        app: multi-cloud-app
    spec:
      replicas: 6
      selector:
        matchLabels:
          app: multi-cloud-app
      template:
        spec:
          containers:
          - name: web
            image: myapp:latest
  placement:
    clusters:
    - name: aws-cluster
    - name: azure-cluster
    - name: gcp-cluster
  overrides:
  - clusterName: aws-cluster
    clusterOverrides:
    - path: "/spec/replicas"
      value: 4
  - clusterName: azure-cluster
    clusterOverrides:
    - path: "/spec/replicas"
      value: 2
```

**Cross-Cloud Networking (Terraform):**
```hcl
# AWS VPC Peering
resource "aws_vpc_peering_connection" "aws_to_azure" {
  peer_vpc_id   = aws_vpc.aws_vpc.id
  peer_owner_id = var.azure_account_id
  peer_vpc_id   = var.azure_vpc_id
  
  tags = {
    Name = "aws-azure-peering"
  }
}

# Azure Virtual WAN to AWS
resource "azurerm_virtual_wan" "multi_cloud_wan" {
  name                = "multi-cloud-wan"
  resource_group_name = azurerm_resource_group.wan.name
  location            = azurerm_resource_group.wan.location
}

resource "azurerm_virtual_hub_connection" "azure_aws" {
  name                         = "azure-aws-connection"
  virtual_hub_id               = azurerm_virtual_wan.multi_cloud_wan.id
  remote_virtual_network_id    = var.aws_vpc_id
  internet_security_enabled    = true
}
```

## Best Practices

1. **Use abstraction layers** - Kubernetes, Terraform, Pulumi
2. **Standardize naming conventions** - Consistent across all clouds
3. **Implement unified monitoring** - Single pane of glass
4. **Automate security policies** - Cloud-agnostic policy engines
5. **Plan for data residency** - Know where data lives per provider
6. **Use service mapping** - Leverage best service per provider
7. **Implement cost tagging** - Track spending per cloud
8. **Design for failover** - Automated cross-cloud disaster recovery
9. **Train teams on all platforms** - Avoid single-cloud expertise silos
10. **Document provider-specific quirks** - Knowledge sharing across teams
