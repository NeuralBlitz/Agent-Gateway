---
name: platform
description: Cloud platform architecture and services
license: MIT
compatibility: opencode
metadata:
  audience: architect, devops-engineer
  category: devops
---

## What I do

- Design cloud platform architectures
- Select appropriate cloud services
- Implement multi-tenant platforms
- Configure cloud networking
- Manage cloud identities and access
- Optimize cloud resource utilization

## When to use me

- When building cloud platforms
- When selecting cloud services
- When designing multi-tenant systems
- When implementing shared services
- When creating cloud center of excellence
- When governing cloud usage

## Key Concepts

### Cloud Platform Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Shared Services                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │  DNS    │  │  CDN    │  │  Email  │  │  Auth   │    │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  Network Platform                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │  VPC    │  │  VPN    │  │ Firewall│  │  DNS    │    │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  Compute Platform                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │  VMs    │  │Containers│ │Functions│ │ K8s     │    │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   Data Platform                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │Object   │  │   DB    │  │  Cache  │  │  Data   │    │
│  │Storage  │  │         │  │         │  │ Lake    │    │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Service Selection Criteria

| Requirement | AWS | Azure | GCP |
|-------------|-----|-------|-----|
| Compute | EC2, Lambda | VM, Functions | Compute Engine, Cloud Functions |
| Containers | ECS, EKS | Container Instances, AKS | Cloud Run, GKE |
| Serverless | Lambda | Functions | Cloud Functions, Cloud Run |
| Database | RDS, DynamoDB | SQL, Cosmos DB | Cloud SQL, Firestore |
| Analytics | Athena, Redshift | Synapse, Data Lake | BigQuery |
| AI/ML | SageMaker | Azure ML | Vertex AI |

### Multi-Account Setup

```hcl
# AWS Organizations
resource "aws_organizations_organization" "main" {
  feature_set: "ALL"
}

resource "aws_organizations_organizational_unit" "production" {
  name      = "Production"
  parent_id = aws_organizations_organization.main.roots[0].id
}

resource "aws_organizations_account" "prod-network" {
  name  = "prod-network"
  email = "network@company.com"
  parent_id = aws_organizations_organizational_unit.production.id
}

resource "aws_organizations_account" "prod workloads" {
  name  = "prod-workloads"
  email = "workloads@company.com"
  parent_id = aws_organizations_organizational_unit.production.id
}
```

### Landing Zone

```hcl
# Control Tower Landing Zone
module "landing_zone" {
  source  = "aws-quickstart/qs-cfn-labs"
  version = "1.0.0"
  
  # Shared Account
  master_account_email = "master@company.com"
  master_account_name = "OrganizationMaster"
  
  # Log Archive
  log_archive_account_email = "logs@company.com"
  
  # Audit
  audit_account_email = "audit@company.com"
  
  # Organizations
  organizational_units = ["Production", "Development", "Sandbox"]
  
  #SSO
  sso_enabled = true
  sso_email = "sso-admin@company.com"
}
```

### Well-Architected Framework

1. **Operational Excellence**
   - Automate changes
   - Respond to events
   - Define baselines

2. **Security**
   - Identity foundation
   - Protect data
   - Respond to threats

3. **Reliability**
   - Handle scale
   - Recover from failure
   - Test resilience

4. **Performance Efficiency**
   - Select architectures
   - Review continuously
   - Monitor tradeoffs

5. **Cost Optimization**
   - Adopt consumption model
   - Analyze and attribute
   - Use managed services

6. **Sustainability**
   - Understand impact
   - Maximize utilization
   - Reduce downstream impact
