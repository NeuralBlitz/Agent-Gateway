---
name: Cloud Security
category: cybersecurity
description: Securing cloud infrastructure, services, and workloads across AWS, GCP, and Azure environments
tags: [cloud, aws, gcp, azure, iam, infrastructure-security]
version: "1.0"
---

# Cloud Security

## What I Do

I provide guidance on securing cloud-native infrastructure and workloads. This covers identity and access management (IAM), network segmentation, encryption at rest and in transit, secure configuration of cloud services, infrastructure-as-code security scanning, and compliance monitoring across major cloud providers.

## When to Use Me

- Designing IAM policies and role hierarchies for cloud accounts
- Configuring VPCs, security groups, and network ACLs
- Implementing encryption for storage, databases, and message queues
- Scanning Terraform/CloudFormation templates for misconfigurations
- Setting up cloud audit logging and monitoring
- Achieving compliance (SOC 2, HIPAA, PCI-DSS) in cloud environments

## Core Concepts

1. **Shared Responsibility Model**: Cloud providers secure the infrastructure; customers secure their configurations, data, and applications running on it.
2. **IAM Least Privilege**: Grant only the permissions required for a specific task using fine-grained policies, conditions, and permission boundaries.
3. **Network Segmentation**: Use VPCs, subnets, security groups, and NACLs to isolate workloads and restrict lateral movement.
4. **Encryption Everywhere**: Encrypt data at rest (KMS-managed keys) and in transit (TLS 1.2+) for all services.
5. **Infrastructure as Code Security**: Scan IaC templates (Terraform, CloudFormation) for misconfigurations before deployment.
6. **Cloud Audit Logging**: Enable CloudTrail (AWS), Cloud Audit Logs (GCP), or Activity Log (Azure) and ship to a centralized SIEM.
7. **Service Control Policies**: Organization-level guardrails that restrict what member accounts can do regardless of IAM permissions.
8. **Secrets Management**: Use cloud-native secrets managers (Secrets Manager, Parameter Store, Vault) instead of hardcoded credentials.
9. **Immutable Infrastructure**: Deploy new instances instead of patching running ones to reduce configuration drift.

## Code Examples

### 1. Least-Privilege IAM Policy (AWS Terraform)

```hcl
resource "aws_iam_policy" "s3_reader" {
  name        = "s3-data-reader"
  description = "Read-only access to specific S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "AllowReadSpecificBucket"
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:ListBucket"]
        Resource = [
          "arn:aws:s3:::my-data-bucket",
          "arn:aws:s3:::my-data-bucket/*"
        ]
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = "us-east-1"
          }
        }
      }
    ]
  })
}
```

### 2. Secure VPC with Private Subnets (Terraform)

```hcl
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
}

resource "aws_subnet" "private" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = false
  availability_zone       = "us-east-1a"
}

resource "aws_security_group" "app" {
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

### 3. KMS Encryption for S3 Bucket (Terraform)

```hcl
resource "aws_kms_key" "data_key" {
  description             = "KMS key for data bucket encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.data_key.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "data" {
  bucket                  = aws_s3_bucket.data.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

### 4. Cloud Audit Logging (AWS CloudTrail Terraform)

```hcl
resource "aws_cloudtrail" "main" {
  name                          = "org-audit-trail"
  s3_bucket_name                = aws_s3_bucket.trail.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.trail_key.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3"]
    }
  }
}
```

## Best Practices

1. **Enforce MFA** for all human users and require it for sensitive API operations via IAM conditions.
2. **Use service accounts and roles** instead of long-lived access keys for machine-to-machine authentication.
3. **Block public access** to storage buckets and databases by default using account-level settings.
4. **Enable key rotation** for all KMS keys and rotate access credentials on a regular schedule.
5. **Scan IaC templates** with tools like tfsec, Checkov, or cfn-nag before applying changes.
6. **Tag all resources** with owner, environment, and data-classification to support audit and cost tracking.
7. **Use VPC endpoints** for AWS service access to keep traffic off the public internet.
8. **Centralize logging** into a dedicated security account with immutable storage and alerting.
9. **Apply Service Control Policies** at the organization level to prevent disabling of security controls.
10. **Review and prune IAM permissions** quarterly using access advisor data and unused permission reports.
