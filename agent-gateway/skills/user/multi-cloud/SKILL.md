---
name: multi-cloud
description: Multi-cloud architecture and management
license: MIT
compatibility: opencode
metadata:
  audience: architect, devops-engineer
  category: devops
---

## What I do

- Design multi-cloud architectures
- Manage resources across multiple cloud providers
- Implement cloud-agnostic abstractions
- Configure cross-cloud networking
- Build disaster recovery across clouds
- Optimize costs across providers

## When to use me

- When avoiding vendor lock-in
- When meeting regulatory requirements
- When building global applications
- When implementing disaster recovery
- When leveraging best-of-breed services
- When optimizing costs across providers

## Key Concepts

### Multi-Cloud Architecture

```
                    ┌──────────────────┐
                    │     Internet     │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
       ┌──────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
       │    AWS      │ │   Azure  │ │    GCP      │
       │  (Primary)  │ │(Secondary)│ │  (Backup)   │
       └──────┬──────┘ └─────┬─────┘ └──────┬──────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                    ┌────────▼─────────┐
                    │ Cross-Cloud      │
                    │ Load Balancer    │
                    └──────────────────┘
```

### Cross-Cloud Networking

```hcl
# AWS to GCP via Cloud Interconnect
resource "aws_dx_connection" "aws_to_gcp" {
  name           = "aws-gcp-interconnect"
  bandwidth      = "1Gbps"
  location       = "EqDC2"
  provider       = aws.aws_primary
}

# Azure to AWS via VPN
resource "azurerm_virtual_network_gateway" "azure_to_aws" {
  name                = "azure-vpn-gateway"
  location            = "eastus"
  resource_group_name = "rg-main"
  type                = "Vpn"
  vpn_type            = "RouteBased"
  
  ip_configuration {
    public_ip_address_id = azurerm_public_ip.vpn.id
    subnet_id           = azurerm_subnet.gateway.id
  }
}
```

### Kubernetes Multi-Cloud

```yaml
# Federation V2
apiVersion: core.kubefed.io/v1beta1
kind: KubeFedConfig
metadata:
  name: kubefed
spec:
  scope: Namespaced
  featureGates:
    - name: PushReconciler
      configuration: Enabled
    - name: SchedulerPreferences
      configuration: Enabled
---
# Federated Deployment
apiVersion: types.kubefed.io/v1beta1
kind: FederatedDeployment
metadata:
  name: myapp
spec:
  template:
    spec:
      replicas: 3
      selector:
        matchLabels:
          app: myapp
  placement:
    clusters:
      - name: aws-cluster
      - name: azure-cluster
```

### Cloud-Agnostic Tools

| Category | Tools |
|----------|-------|
| IaC | Terraform, Pulumi |
| Containers | Kubernetes, Docker |
| Orchestration | Nomad, Kubernetes |
| Monitoring | Prometheus, Grafana |
| Service Mesh | Istio, Linkerd |
| Serverless | Knative, OpenFaaS |

### Cross-Cloud Identity

```yaml
# AWS IAM Roles Anywhere
- role:
    arn: arn:aws:iam::123456789012:role/CrossCloudRole
  credential_source:
    environment:
      name: AWS_ACCESS_KEY_ID

# Azure AD with AWS
resource "azuread_application" "multi_cloud" {
  display_name = "MultiCloudApp"
}

resource "azuread_service_principal" "multi_cloud" {
  application_id = azuread_application.multi_cloud.application_id
}
```

### Disaster Recovery Strategy

```
RTO (Recovery Time Objective): 1 hour
RPO (Recovery Point Objective): 15 minutes

Active-Passive:
  Primary: AWS (eu-west-1)
  Secondary: Azure (eastus)
  Replication: Async database replication
  Failover: DNS switch

Active-Active:
  Primary: AWS (us-east-1)
  Secondary: GCP (us-central1)
  Sync: Multi-region database
  Traffic: Weighted DNS
```

### Cost Optimization

```python
# Multi-cloud cost analysis
class CloudCostAnalyzer:
    def __init__(self):
        self.aws_client = boto3.client('ce')
        self.azure_client = azure.mgmt.costmanagement.QueryClient()
        
    def get_total_cost(self):
        aws_costs = self.aws_client.get_cost_and_usage(
            TimePeriod={'Start': '2024-01-01', 'End': '2024-01-31'},
            Granularity='MONTHLY',
            Metrics=['UnblendedCost']
        )
        
        azure_costs = self.azure_client.query(
            scope=f"/subscriptions/{self.azure_sub_id}",
            parameters={
                'type': 'ActualCost',
                'timeframe': 'MonthToDate',
            }
        )
        
        return self.aggregate_costs(aws_costs, azure_costs)
```

### Best Practices

- Use abstraction layers for portability
- Implement observability across all clouds
- Standardize on common tooling
- Plan for network latency between clouds
- Implement consistent security policies
- Document cloud-specific configurations
