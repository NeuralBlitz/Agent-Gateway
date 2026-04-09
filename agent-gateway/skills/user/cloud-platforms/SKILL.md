---
name: cloud-platforms
description: Multi-cloud architecture and platform strategies
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: cloud
---
## What I do
- Design multi-cloud solutions
- Choose appropriate cloud services
- Handle cloud portability
- Optimize cloud costs
- Implement cloud governance
- Manage multi-cloud operations
- Design for vendor independence
- Handle cloud-specific patterns

## When to use me
When designing cloud-agnostic or multi-cloud architectures.

## Cloud Platform Comparison
```
Compute:
AWS: EC2, ECS, Lambda
Azure: VMs, AKS, Functions
GCP: Compute Engine, GKE, Cloud Functions

Storage:
AWS: S3, EFS, EBS
Azure: Blob, Files, Disk
GCP: Cloud Storage, Filestore

Database:
AWS: RDS, DynamoDB, Aurora
Azure: SQL, Cosmos DB
GCP: Cloud SQL, Firestore, Spanner

Networking:
AWS: VPC, ALB, Route 53
Azure: VNet, Load Balancer, Traffic Manager
GCP: VPC, Cloud Load Balancing, Cloud DNS
```

## Multi-Cloud Strategy
```
Abstraction Layer:
┌─────────────────────────────────────┐
│    Cloud-Agnostic Interface          │
├─────────────────────────────────────┤
│ AWS │ Azure │ GCP │ On-Prem         │
└─────────────────────────────────────┘

Patterns:
- Anti-affinity across clouds
- Data residency compliance
- Cost optimization
- Vendor lock-in mitigation
```
