---
name: infrastructure-as-code
description: Managing and provisioning infrastructure through machine-readable definition files
license: MIT
compatibility:
  - terraform
  - pulumi
  - aws-cdk
  - azure-bicep
  - google-deployment-manager
audience: DevOps engineers, cloud architects, platform engineers
category: devops
---

# Infrastructure as Code

## What I Do

I provide expertise in Infrastructure as Code (IaC) - defining and managing infrastructure through version-controlled, declarative configuration files. I cover Terraform, Pulumi, AWS CDK, and cloud-native IaC tools for provisioning networks, compute, databases, and services. IaC enables consistent, repeatable, and auditable infrastructure management across multiple environments with full lifecycle control.

## When to Use Me

- Provisioning cloud resources across AWS, Azure, GCP, or multi-cloud environments
- Managing infrastructure versioning and change tracking
- Implementing immutable infrastructure patterns
- Creating reproducible development, staging, and production environments
- Automating infrastructure provisioning in CI/CD pipelines
- Managing complex infrastructure dependencies and modules
- Implementing policy as code for compliance enforcement
- Setting up infrastructure monitoring and alerting as code
- Managing secrets and sensitive configuration securely
- Creating self-service infrastructure platforms for development teams

## Core Concepts

- **Declarative Configuration**: Define desired state, let tools reconcile actual state
- **Immutable Infrastructure**: Replace rather than modify infrastructure for consistency
- **State Management**: Tracking infrastructure state for drift detection and updates
- **Modules**: Reusable, composable infrastructure components
- **Providers**: Plugins interfacing with APIs of cloud and service providers
- **Plan/Apply Pattern**: Preview changes before applying (terraform plan)
- **Drift Detection**: Identifying differences between desired and actual state
- **Remote State**: Shared state storage for team collaboration
- **State Locking**: Preventing concurrent modifications to infrastructure
- **Variables and Outputs**: Parameterizing and exposing infrastructure values
- **Workspaces**: Isolating state for different environments
- **Policies as Code**: Enforcing governance through automated policy checks
- **Provisioners**: Executing scripts during resource creation
- **Data Sources**: Querying existing infrastructure for use in configurations
- **Resource Graph**: Understanding dependencies between resources

## Code Examples

### Terraform Multi-Environment Architecture

```hcl
# environments/prod/main.tf
terraform {
  required_version = "~> 1.7"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.30"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.24"
       }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.12"
    }
  }

  backend "s3" {
    bucket         = "company-terraform-state"
    key            = "prod/network/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
    acl            = "bucket-owner-full-control"
  }
}

module "vpc" {
  source = "../../modules/networking/vpc"

  environment = "prod"
  cidr_block = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway     = true
  single_nat_gateway    = false
  enable_dns_hostnames  = true
  enable_dns_support    = true

  tags = {
    Environment = "prod"
    ManagedBy   = "terraform"
    Project     = "api-platform"
  }
}

module "eks" {
  source = "../../modules/compute/eks"

  cluster_name    = "api-prod-eks"
  cluster_version = "1.29"

  vpc_id            = module.vpc.vpc_id
  subnet_ids       = module.vpc.private_subnet_ids
  cluster_endpoint = "public"

  enable_irsa = true

  node_groups = {
    general = {
      instance_types = ["m6i.xlarge", "m5.xlarge"]
      min_size       = 3
      max_size       = 20
      desired_size   = 5
      capacity_type  = "ON_DEMAND"
    },
    spot = {
      instance_types = ["m6i.2xlarge", "m5.2xlarge", "m5a.2xlarge"]
      min_size       = 1
      max_size       = 10
      desired_size   = 2
      capacity_type  = "SPOT"
    }
  }

  enable_autoscaling = true
  cluster_autoscaler = {
    min_size = 1
    max_size = 20
  }

  addons = {
    vpc-cni            = { version = "v1.16.0-eksbuild.1" }
    coredns            = { version = "v1.11.1-eksbuild.3" }
    kube-proxy         = { version = "v1.29.0-eksbuild.2" }
    aws-ebs-csi-driver = { version = "v1.25.0-eksbuild.1" }
  }

  enable_monitoring = true
  enable_logging = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  tags = {
    Environment = "prod"
    Project     = "api-platform"
  }
}

module "rds_postgres" {
  source = "../../modules/data/postgres"

  identifier = "api-prod-postgres"

  engine               = "postgres"
  engine_version       = "15.5"
  instance_class       = "db.r6g.2xlarge"
  allocated_storage    = 500
  max_allocated_storage = 1000

  db_name  = "api_production"
  username = "api_admin"
  password = random_password.db_password.result

  vpc_id             = module.vpc.vpc_id
  subnet_ids        = module.vpc.private_subnet_ids
  security_group_ids = [module.vpc.security_group_id]

  backup_retention_period = 35
  deletion_protection  = true
  skip_final_snapshot  = false
  final_snapshot_identifier = "api-prod-postgres-final"

  performance_insights_enabled = true
  enable_logging = ["postgresql", "upgrade"]

  maintenance_window = "sun:02:00-sun:06:00"
  backup_window      = "08:00-12:00"

  tags = {
    Environment = "prod"
    Project     = "api-platform"
  }
}

resource "random_password" "db_password" {
  length  = 32
  special = false
}

output "cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "rds_endpoint" {
  value     = module.rds_postgres.endpoint
  sensitive = true
}
```

### Terraform Module for Kubernetes Namespace

```hcl
# modules/kubernetes/namespace/main.tf
variable "name" {
  description = "Namespace name"
  type        = string
}

variable "labels" {
  description = "Additional labels"
  type        = map(string)
  default     = {}
}

variable "annotations" {
  description = "Additional annotations"
  type        = map(string)
  default     = {}
}

variable "quota" {
  description = "Resource quota configuration"
  type = object({
    limits_cpu    = string
    limits_memory = string
    requests_cpu  = string
    requests_memory = string
    pods          = number
    services      = number
  })
  default = null
}

variable "network_policy" {
  description = "Network policy configuration"
  type = object({
    default_deny_ingress = bool
    default_deny_egress  = bool
    ingress_cidrs        = list(string)
    egress_cidrs        = list(string)
  })
  default = null
}

resource "kubernetes_namespace" "this" {
  metadata {
    name        = var.name
    labels      = var.labels
    annotations = var.annotations
  }
}

resource "kubernetes_resource_quota" "this" {
  count = var.quota != null ? 1 : 0

  metadata {
    name      = "${var.name}-quota"
    namespace = kubernetes_namespace.this.metadata[0].name
  }

  spec {
    hard = {
      cpu    = var.quota.limits_cpu
      memory = var.quota.limits_memory
      pods   = var.quota.pods
    }
  }
}

resource "kubernetes_network_policy" "this" {
  count = var.network_policy != null ? 1 : 0

  metadata {
    name      = "${var.name}-network-policy"
    namespace = kubernetes_namespace.this.metadata[0].name
  }

  spec {
    pod_selector {
      match_labels = {
        "kubernetes.io/metadata.name" = kubernetes_namespace.this.metadata[0].name
      }
    }

    dynamic "ingress" {
      for_each = var.network_policy.default_deny_ingress ? [] : [1]
      content {
        from {
          ip_block {
            cidr = var.network_policy.ingress_cidrs[count.index]
          }
        }
      }
    }

    dynamic "egress" {
      for_each = var.network_policy.default_deny_egress ? [] : [1]
      content {
        to {
          ip_block {
            cidr = var.network_policy.egress_cidrs[count.index]
          }
        }
      }
    }

    policy_types = ["Ingress", "Egress"]
  }
}

output "namespace_name" {
  value = kubernetes_namespace.this.metadata[0].name
}

output "namespace_uid" {
  value = kubernetes_namespace.this.metadata[0].uid
}
```

### Pulumi Infrastructure Program

```typescript
// infrastructure/index.ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as kubernetes from "@pulumi/kubernetes";

const config = new pulumi.Config();
const env = pulumi.getStack();

const project = "api-platform";

// VPC Configuration
const vpc = new aws.ec2.Vpc(`${project}-vpc-${env}`, {
    cidrBlock: config.require("vpcCidr"),
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
        Name: `${project}-vpc-${env}`,
        Environment: env,
        ManagedBy: "pulumi",
    },
});

const publicSubnets: aws.ec2.Subnet[] = [];
const privateSubnets: aws.ec2.Subnet[] = [];

const availabilityZones = aws.getAvailabilityZones({ state: "available" });

(availabilityZones.then(azs => azs.names.slice(0, 2).forEach((az, index) => {
    const publicSubnet = new aws.ec2.Subnet(`${project}-public-${index}`, {
        vpcId: vpc.id,
        cidrBlock: config.require(`publicSubnetCidr${index}`),
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
            Name: `${project}-public-${index}`,
            Type: "public",
            Environment: env,
        },
    });
    publicSubnets.push(publicSubnet);

    const privateSubnet = new aws.ec2.Subnet(`${project}-private-${index}`, {
        vpcId: vpc.id,
        cidrBlock: config.require(`privateSubnetCidr${index}`),
        availabilityZone: az,
        tags: {
            Name: `${project}-private-${index}`,
            Type: "private",
            Environment: env,
        },
    });
    privateSubnets.push(privateSubnet);
})));

// EKS Cluster
const eksRole = new aws.iam.Role(`${project}-eks-role-${env}`, {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({ Service: "eks.amazonaws.com" }),
});

new aws.iam.RolePolicyAttachment(`${project}-eks-cni-${env}`, {
    policyArn: "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
    role: eksRole.name,
});

new aws.iam.RolePolicyAttachment(`${project}-eks-ebs-${env}`, {
    policyArn: "arn:aws:iam::aws:policy/AmazonEBSCSIDriverPolicy",
    role: eksRole.name,
});

const cluster = new aws.eks.Cluster(`${project}-eks-${env}`, {
    roleArn: eksRole.arn,
    vpcConfig: {
        subnetIds: privateSubnets.map(s => s.id),
        endpointPrivateAccess: true,
        endpointPublicAccess: true,
        publicAccessCidrs: ["0.0.0.0/0"],
    },
    kubernetesNetworkConfig: {
        serviceIpv4Cidr: "10.100.0.0/16",
    },
    enabledClusterLogTypes: ["api", "audit", "authenticator"],
    tags: {
        Environment: env,
        ManagedBy: "pulumi",
    },
});

// Kubernetes Provider
const k8sProvider = new kubernetes.Provider(`${project}-k8s-${env}`, {
    kubeconfig: cluster.eksCluster.apply(c => 
        `apiVersion: v1\nkind: Config\nclusters:\n- cluster:\n    certificate-authority-data: ${c.encodedCertificateAuthority?.apply(b => Buffer.from(b, "base64").toString())}\n    server: ${c.endpoint}\n  name: ${c.name}\ncontexts:\n- context:\n    cluster: ${c.name}\n    user: ${c.name}\n  name: ${c.name}\ncurrent-context: ${c.name}\nusers:\n- name: ${c.name}\n  user:\n    exec:\n      apiVersion: client.authentication.k8s.io/v1beta1\n      command: aws-iam-authenticator\n      args:\n        - token\n        - -i\n        - ${c.name}`
    ),
}, { dependsOn: cluster });

// Namespace
const namespace = new kubernetes.core.v1.Namespace(`${project}-ns-${env}`, {
    metadata: {
        name: `${project}-${env}`,
        labels: {
            environment: env,
        },
    },
}, { provider: k8sProvider });

// Export outputs
export const vpcId = vpc.id;
export const clusterName = cluster.name;
export const kubeconfig = cluster.eksCluster.apply(c => 
    Buffer.from(c.encodedCertificateAuthority!.data, "base64").toString()
);
export const namespaceName = namespace.metadata.name;
```

### AWS CDK Infrastructure

```python
# infrastructure/app.py
from aws_cdk import (
    App, Stack, Duration,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_ecr as ecr,
    aws_rds as rds,
    aws_secretsmanager as secrets,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_iam as iam,
)
from constructs import Construct

class ApiPlatformStack(Stack):
    def __init__(self, scope: Construct, id: str, *, environment: str = "prod", **kwargs):
        super().__init__(scope, id, **kwargs)
        
        self.environment = environment
        self.project = "api-platform"
        
        # VPC
        self.vpc = ec2.Vpc(
            self, "Vpc",
            cidr="10.0.0.0/16",
            max_azs=2,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_NAT,
                    cidr_mask=24,
                ),
            ],
        )
        
        # ECR Repository
        self.repository = ecr.Repository(
            self, "EcrRepo",
            repository_name=f"{self.project}-{environment}",
            lifecycle_rules=[
                ecr.LifecycleRule(
                    description="Keep last 10 images",
                    max_image_count=10,
                ),
            ],
        )
        
        # ECS Cluster
        self.cluster = ecs.Cluster(
            self, "EcsCluster",
            cluster_name=f"{self.project}-{environment}",
            container_insights=True,
        )
        
        # Database
        self.database = rds.DatabaseInstance(
            self, "Database",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_5
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.M6I, ec2.InstanceSize.XLARGE2
            ),
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE
            ),
            deletion_protection=(environment == "prod"),
            backup_retention=Duration.days(35),
        )
        
        # ALB
        self.load_balancer = elbv2.ApplicationLoadBalancer(
            self, "ALB",
            vpc=self.vpc,
            internet_facing=(environment == "prod"),
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
                if environment == "prod" else ec2.SubnetType.PRIVATE
            ),
        )
        
        self.create_ecs_service()
    
    def create_ecs_service(self):
        task_definition = ecs.FargateTaskDefinition(
            self, "TaskDef",
            cpu=512,
            memory_mib=1024,
            runtime_platform={
                "operatingSystemFamily": ecs.OperatingSystemFamily.LINUX,
                "cpuArchitecture": ecs.CpuArchitecture.X86_64,
            },
        )
        
        container = task_definition.add_container(
            "ApiContainer",
            image=ecs.ContainerImage.from_ecr_repository(
                self.repository, "latest"
            ),
            port_mappings=[ecs.PortMapping(container_port=8080)],
            environment={
                "ENVIRONMENT": self.environment,
                "DB_HOST": self.database.db_instance_endpoint_address,
            },
            secrets={
                "DB_PASSWORD": ecs.Secret.from_secrets_manager(
                    self.database.secret
                ),
            },
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix="api"
            ),
        )
        
        ecs.FargateService(
            self, "FargateService",
            cluster=self.cluster,
            task_definition=task_definition,
            desired_count=2,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE
            ),
            load_balancer=self.load_balancer,
            target_group=elbv2.ApplicationTargetGroup(
                self, "TargetGroup",
                port=8080,
                vpc=self.vpc,
                health_check=elbv2.HealthCheck(
                    path="/health",
                    interval=Duration.seconds(30),
                    healthy_threshold_count=2,
                    unhealthy_threshold_count=3,
                ),
            ),
        )

app = App()
ApiPlatformStack(app, "api-platform-prod", environment="prod")
app.synth()
```

## Best Practices

- Use version control for all IaC files with meaningful commit messages
- Implement a consistent directory structure separating environments and modules
- Use remote state storage with state locking for team collaboration
- Never commit state files or secrets to version control
- Use variable files (.tfvars) for environment-specific configuration
- Implement drift detection and regular state synchronization
- Use modules to standardize infrastructure patterns across projects
- Enable versioning on state backends for state recovery
- Use `terraform plan` output to review changes before applying
- Implement policy as code with OPA or Sentinel for compliance
- Use `terraform destroy` or `terraform plan -destroy` for safe cleanup
- Structure pipelines with plan, validate, apply stages with approvals
- Use workspaces or separate state files for environment isolation
- Implement proper naming conventions for resources across providers
- Use data sources to reference existing infrastructure rather than duplicating
- Regular dependency updates for providers and modules
- Use output values to share information between configurations
- Implement cost estimation in CI/CD pipelines for budget control

## Common Patterns

- **Module Library Pattern**: Create reusable, versioned infrastructure modules
- **Environment Parity**: Ensure dev, staging, prod use same infrastructure patterns
- **Immutable Infrastructure**: Replace rather than modify resources for consistency
- **GitOps for IaC**: Pull-based deployment of infrastructure changes
- **Policy as Code**: Automated compliance checking in deployment pipelines
- **Drift Detection**: Regular reconciliation of desired and actual state
- **State Isolation**: Separate state per environment or service
- **Blue-Green Infrastructure**: Parallel environments with cutover
- **Feature Flags in IaC**: Toggle infrastructure features without code changes
- **Self-Service Infrastructure**: Catalog of approved infrastructure templates
