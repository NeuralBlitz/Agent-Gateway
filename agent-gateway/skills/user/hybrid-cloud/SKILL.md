---
name: hybrid-cloud
description: Hybrid cloud architecture and integration
license: MIT
compatibility: opencode
metadata:
  audience: architect, devops-engineer
  category: devops
---

## What I do

- Design hybrid cloud architectures combining on-prem and cloud
- Implement workload migration strategies
- Configure hybrid networking (VPN, Direct Connect, ExpressRoute)
- Manage unified identity across environments
- Build disaster recovery across clouds
- Optimize workload placement

## When to use me

- When migrating workloads to cloud gradually
- When regulatory requirements mandate on-premises data
- When building disaster recovery solutions
- When running sensitive workloads on-prem with cloud burst
- When implementing multi-cloud strategies
- When extending data center capacity elastically

## Key Concepts

### Architecture Patterns

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                        │
└─────────────────────┬───────────────────────────────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
         ▼            ▼            ▼
    ┌─────────┐  ┌─────────┐  ┌─────────┐
    │ On-Prem │  │   AWS   │  │  Azure  │
    │ K8s     │  │ EKS     │  │ AKS     │
    │ Cluster │  │ Cluster │  │ Cluster │
    └────┬────┘  └────┬────┘  └────┬────┘
         │            │            │
         └────────────┼────────────┘
                      │
               ┌──────▼──────┐
               │  Database   │
               │ (RDS/Cloud) │
               └─────────────┘
```

### AWS Outposts

```hcl
# Outposts configuration
resource "aws_outposts_instance" "app" {
  instance_type          = "m5.large"
  outpost_arn            = aws_outposts_outpost.example.arn
  placement_group_strategy = "cluster"
  
  root_volume {
    size = 100
    type = "gp2"
  }
  
  network_interface {
    network_interface_id = aws_network_interface.example.id
    device_index          = 0
  }
}
```

### Azure Arc

```bash
# Connect on-prem cluster to Azure Arc
az connectedk8s connect \
    --name my-cluster \
    --resource-group my-rg \
    --location eastus

# Enable Azure Arc services
az k8s-extension create \
    --cluster-name my-cluster \
    --resource-group my-rg \
    --extension-type "Microsoft.AzureDataBox" \
    --name "azure-arc-data-services"
```

### Hybrid Networking

```hcl
# AWS VPN connection
resource "aws_vpn_connection" "onprem" {
  vpn_gateway_id      = aws_vpn_gateway.main.id
  customer_gateway_id = aws_customer_gateway.onprem.id
  type                = "ipsec.1"
  static_routes_only  = true
  
  tunnel1_preshared_key = "secret1"
  tunnel2_preshared_key = "secret2"
  
  static_routes {
    destination_cidr_block = "10.0.0.0/16"
  }
}

# GCP Cloud Interconnect
resource "google_compute_interconnect_attachment" "onprem" {
  name         = "hybrid-interconnect"
  region       = "us-central1"
  router       = google_compute_router.main.name
  interconnect = "volcareno interc 1"
}
```

### Unified Identity

```yaml
# AWS IAM Roles Anywhere for on-prem
- role:
    arn: arn:aws:iam::123456789012:role/CrossCloudRole
  credential_source:
    environment:
      name: AWS_ACCESS_KEY_ID
    certificate:
      name: AWS_CERTIFICATE_FILE
```

### Workload Migration

1. **Assess**: Inventory workloads, dependencies
2. **Plan**: Design target architecture
3. **Migrate**: Lift-and-shift or re-architect
4. **Validate**: Test functionality and performance
5. **Cutover**: Switch production traffic
6. **Optimize**: Right-size and optimize

### Data Synchronization

```python
class HybridDataSync:
    def sync_to_cloud(self, data):
        # Local processing
        processed = self.process(data)
        
        # Batch upload
        self.cloud_client.upload_batch(processed)
        
        # Maintain local copy
        self.local_store.store(processed)
        
    def resolve_conflicts(self, local, cloud):
        # Last-write-wins or custom logic
        if local.timestamp > cloud.timestamp:
            return local
        return cloud
```

### Benefits and Challenges

| Benefits | Challenges |
|----------|------------|
| Flexibility | Network complexity |
| Gradual migration | Security management |
| Regulatory compliance | Data sovereignty |
| Burst capacity | Latency considerations |
| Disaster recovery | Unified monitoring |
| Best-of-breed services | Skill requirements |
