---
name: infrastructure-as-aas
description: Managing and provisioning infrastructure through machine-readable definition files rather than physical hardware configuration
category: cloud-computing
---

# Infrastructure as Code

## What I Do

I enable teams to manage and provision infrastructure through machine-readable configuration files. Instead of manually configuring servers, networks, and databases, I use code to define, version, and automate infrastructure deployment.

## When to Use Me

- Creating reproducible environments across stages
- Infrastructure requiring frequent updates
- Multi-environment deployments (dev, staging, prod)
- Disaster recovery automation
- Compliance and auditing requirements
- Large-scale infrastructure management
- Infrastructure versioning and review processes

## Core Concepts

- **Declarative vs Imperative**: Declare desired state vs. step-by-step commands
- **Idempotency**: Running same configuration multiple times produces same result
- **Drift Detection**: Identifying changes between desired and actual state
- **State Management**: Tracking current infrastructure state
- **Modules/Reusable Components**: Shareable infrastructure patterns
- **Providers**: Plugins for different cloud/technology targets
- **Plan/Apply Workflow**: Preview changes before execution
- **Workspaces**: Separate state for different environments
- **Secrets Management**: Secure handling of credentials
- **Backend Configuration**: Remote state storage and locking

## Code Examples

**Terraform Module (HCL):**
```hcl
# modules/networking/vpc/main.tf
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cidr_block" {
  description = "VPC CIDR block"
  type        = string
}

variable "availability_zones" {
  description = "AZs for subnets"
  type        = list(string)
}

resource "aws_vpc" "main" {
  cidr_block           = var.cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name        = "${var.environment}-vpc"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_subnet" "public" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.cidr_block, 8, count.index)
  availability_zone = var.availability_zones[count.index]
  
  tags = {
    Name = "${var.environment}-public-${count.index}"
  }
}
```

**Pulumi Infrastructure (Python):**
```python
import pulumi
import pulumi_aws as aws

config = pulumi.Config()
env = config.require("environment")

vpc = aws.ec2.Vpc(
    f"{env}-vpc",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={"Name": f"{env}-vpc"}
)

subnets = []
for i, az in enumerate(["us-east-1a", "us-east-1b"]):
    subnet = aws.ec2.Subnet(
        f"{env}-subnet-{i}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i}.0/24",
        availability_zone=az,
        tags={"Name": f"{env}-subnet-{i}"}
    )
    subnets.append(subnet)

# Export outputs
pulumi.export("vpc_id", vpc.id)
pulumi.export("subnet_ids", [s.id for s in subnets])
```

**AWS CDK (TypeScript):**
```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';

export class EcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'EcsVpc', {
      maxAzs: 2,
      natGateways: 1,
    });

    const cluster = new ecs.Cluster(this, 'EcsCluster', {
      vpc: vpc,
    });

    new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      'EcsService',
      {
        cluster: cluster,
        cpu: 512,
        desiredCount: 2,
        taskImageOptions: {
          image: ecs.ContainerImage.fromRegistry('nginx'),
        },
        memoryLimitMiB: 2048,
      }
    );
  }
}
```

## Best Practices

1. **Use version control for all IaC** - Track changes, enable review
2. **Implement state locking** - Prevent concurrent modifications
3. **Use remote state storage** - S3, GCS, Azure Storage with locking
4. **Modularize your code** - Reusable, composable components
5. **Plan before apply** - Always review execution plans
6. **Use workspaces for environments** - Separate state per environment
7. **Implement policy as code** - OPA, Sentinel for governance
8. **Secure sensitive data** - Vault, AWS Secrets Manager, encrypted vars
9. **Test infrastructure changes** - Terratest, policy tests
10. **Document modules comprehensively** - README, examples, inputs/outputs
