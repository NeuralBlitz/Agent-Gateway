---
name: cloud-security
description: Cloud security best practices and implementation
license: MIT
compatibility: opencode
metadata:
  audience: security-engineer, devops-engineer
  category: security
---

## What I do

- Design and implement cloud security architectures
- Configure identity and access management policies
- Implement network security controls
- Protect data at rest and in transit
- Automate security compliance scanning
- Respond to security incidents in cloud environments

## When to use me

- When securing cloud infrastructure
- When implementing zero-trust architecture
- When conducting security assessments
- When responding to cloud security incidents
- When configuring compliance frameworks (SOC2, HIPAA, PCI)
- When implementing security automation

## Key Concepts

### IAM Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-bucket",
        "arn:aws:s3:::my-bucket/*"
      ],
      "Condition": {
        "IpAddress": {
          "aws:SourceIp": "10.0.0.0/8"
        }
      }
    },
    {
      "Effect": "Deny",
      "Action": "s3:*",
      "NotResource": "arn:aws:s3:::my-bucket/*"
    }
  ]
}
```

### Network Security Groups

```hcl
# AWS Security Group
resource "aws_security_group" "web" {
  name        = "web-sg"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

### Encryption Configuration

```yaml
# Kubernetes secrets encryption
apiVersion: v1
kind: Secret
metadata:
  name: encrypted-secret
type: Opaque
data:  # Already base64 encoded
  username: dmFsdWU=
encryption:
  - providers:
      - aescbc:
          keys:
            - name: key1
              secret: <base64-32-byte-key>
    resources:
      - secrets
```

### Security Best Practices

- **Identity**: Use IAM roles, not access keys; enable MFA
- **Network**: Use VPCs, private subnets, security groups
- **Data**: Encrypt at rest and in transit; use KMS
- **Logging**: Enable CloudTrail, audit all access
- **Compliance**: Use Config Rules, Security Hub
- **Incident Response**: Have playbook for breaches

### Vulnerability Scanning

```yaml
# Trivy in CI/CD
trivy fs --severity HIGH,CRITICAL .
trivy image --severity HIGH,CRITICAL myimage:latest
trivy db --update
trivy kubernetes cluster --report summary
```

### Zero Trust Architecture

```
┌─────────────────────────────────────────┐
│                 User                     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│           Identity Provider              │
│     (OAuth2/OIDC + MFA)                 │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Policy Enforcement Point       │
│    (API Gateway / Service Mesh)         │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Workloads (Services)           │
│     (Verify identity, encrypt, log)      │
└─────────────────────────────────────────┘
```

### Key Security Tools

- **CSPM**: Prisma Cloud, AWS Config, Azure Security Center
- **CWPP**: Container security, vulnerability scanning
- **CASB**: Cloud Access Security Brokers
- **SIEM**: Cloud-native logging and analysis
- **Secrets Management**: Vault, AWS Secrets Manager
