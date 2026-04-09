---
name: cloud-security
description: Comprehensive security practices and controls for protecting cloud infrastructure, applications, and data
category: cloud-computing
---

# Cloud Security

## What I Do

I provide comprehensive protection for cloud environments through identity management, network security, data protection, compliance controls, and threat detection. I help organizations implement defense-in-depth strategies across their cloud infrastructure.

## When to Use Me

- Securing multi-cloud or hybrid environments
- Meeting compliance requirements (SOC2, HIPAA, PCI-DSS)
- Implementing zero-trust security models
- Protecting sensitive data in the cloud
- Detecting and responding to threats
- Managing cloud access at scale
- Automating security compliance

## Core Concepts

- **Identity and Access Management (IAM)**: User roles, policies, permissions
- **Network Security Groups/Firewalls**: Traffic filtering at multiple layers
- **Encryption at Rest/Transit**: Protecting data in all states
- **Secret Management**: Secure storage for credentials, API keys
- **Shared Responsibility Model**: Understanding provider vs. customer responsibilities
- **Cloud Security Posture Management (CSPM)**: Continuous compliance monitoring
- **Cloud Workload Protection (CWP)**: Runtime security for workloads
- **Zero Trust Architecture**: Never trust, always verify
- **Data Classification**: Labeling and protecting based on sensitivity
- **Audit Logging**: Comprehensive activity tracking

## Code Examples

**AWS IAM Policy (JSON):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3ReadOnly",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:GetObjectVersion"
      ],
      "Resource": "arn:aws:s3:::secure-bucket/*"
    },
    {
      "Sid": "AllowEC2Management",
      "Effect": "Allow",
      "Action": [
        "ec2:Describe*",
        "ec2:GetConsole*"
      ],
      "Resource": "*",
      "Condition": {
        "IpAddress": {
          "aws:SourceIp": "10.0.0.0/8"
        }
      }
    },
    {
      "Sid": "DenyPublicRead",
      "Effect": "Deny",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::public-bucket/*",
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
```

**Azure Security Policy (YAML):**
```yaml
apiVersion: policy.azure.com/v1
kind: PolicyAssignment
metadata:
  name: require-encryption
  displayName: Require encryption for storage
spec:
  parameters:
    effect: deny
  policyDefinitionReferenceId: storageRequireEncryption
  displayName: Require encryption for storage accounts
  description: This policy denies storage accounts that don't enable encryption
---
apiVersion: policy.azure.com/v1
kind: PolicyDefinition
metadata:
  name: storageRequireEncryption
spec:
  mode: All
  parameters:
    effect:
      type: String
      defaultValue: Audit
  policyRule:
    if:
      field: type
      equals: Microsoft.Storage/storageAccounts
      not:
        field: Microsoft.Storage/storageAccounts/enableHttpsTrafficOnly
        equals: "true"
    then:
      effect: "[[parameters.effect]]"
```

**Kubernetes NetworkPolicy (YAML):**
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend
      tier: api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: database
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - namespaceSelector: {}
      podSelector:
        matchLabels:
          k8s-app: kube-dns
    ports:
    - protocol: UDP
      port: 53
```

**Terraform Sentinel Policy (Pseudo-code):**
```hcl
import "tfplan/v2" as tfplan

# Restrict resource types
allowed_resources = [
  "aws_instance",
  "aws_s3_bucket",
  "aws_db_instance",
  "aws_security_group"
]

deny_invalid_resources = rule tfplan.resource_changes {
  all resource_changes as _, rc {
    all rc.change.actions as action {
      action is "create" implies
        rc.type in allowed_resources
    }
  }
}

# Require tags
require_tags = rule tfplan.resource_changes {
  all resource_changes as _, rc {
    rc.type contains "aws_" and
    rc.type not contains "iam_" implies
      keys(rc.change.after) contains "Environment" and
      keys(rc.change.after) contains "ManagedBy"
  }
}

main = rule {
  (deny_invalid_resources and require_tags) else false
}
```

## Best Practices

1. **Implement least privilege** - Grant minimum permissions required
2. **Use MFA everywhere** - Enforce multi-factor authentication
3. **Enable comprehensive logging** - CloudTrail, Activity Log, Audit Logs
4. **Encrypt all data** - At rest and in transit, managed keys preferred
5. **Segment networks** - VPCs, security groups, private subnets
6. **Automate security scanning** - CI/CD pipeline security checks
7. **Regularly audit permissions** - Remove unused access rights
8. **Use secrets management services** - Never hardcode credentials
9. **Implement WAF and DDoS protection** - Edge security services
10. **Conduct regular penetration tests** - Identify vulnerabilities proactively
