---
name: cloud-security
description: Comprehensive cloud security practices including identity, network, data, and compliance controls
license: MIT
compatibility:
  - aws-security
  - azure-security
  - gcp-security
  - kubernetes-security
audience: Security engineers, DevOps engineers, cloud architects
category: cloud-computing
---

# Cloud Security

## What I Do

I provide comprehensive expertise in cloud security - protecting cloud infrastructure, applications, and data from threats through identity management, network security, encryption, and compliance controls. I cover multi-cloud security strategies, zero-trust architectures, security automation, incident response, and regulatory compliance frameworks. My approach integrates security throughout the cloud lifecycle from infrastructure design to operational monitoring.

## When to Use Me

- Designing secure cloud architectures with defense-in-depth principles
- Implementing identity and access management for cloud resources
- Configuring network security controls (firewalls, VPCs, security groups)
- Encrypting data at rest and in transit across cloud services
- Meeting compliance requirements (SOC 2, HIPAA, PCI-DSS, GDPR)
- Automating security controls in CI/CD pipelines
- Responding to security incidents in cloud environments
- Implementing cloud-native security tools and services
- Securing container and Kubernetes workloads

## Core Concepts

- **Identity and Access Management (IAM)**: Centralized identity governance with least-privilege access controls
- **Multi-Factor Authentication (MFA)**: Additional verification layers for user and service authentication
- **Zero Trust Architecture**: Never trust, always verify - continuous authentication and authorization
- **Defense in Depth**: Layered security controls across network, application, and data layers
- **Shared Responsibility Model**: Understanding cloud provider vs. customer security responsibilities
- **Encryption at Rest and in Transit**: Protecting data through encryption using KMS and TLS
- **Security Groups and NACLs**: Network-level access controls and firewall rules
- **Secrets Management**: Secure storage and rotation of credentials using vaults
- **Cloud Security Posture Management (CSPM)**: Continuous security monitoring and compliance checking
- **Cloud Workload Protection (CWP)**: Security monitoring for cloud workloads and containers
- **Network Segmentation**: Isolating workloads to limit blast radius of breaches
- **Logging and Monitoring**: Comprehensive audit trails and security event analysis
- **Infrastructure as Code Security**: Scanning IaC templates for security misconfigurations
- **Container Image Scanning**: Identifying vulnerabilities in container images before deployment
- **Threat Detection**: Real-time analysis of security events for anomaly detection

## Code Examples

### AWS IAM Policy with Least Privilege

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3ReadOnlyAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:GetBucketLocation",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::secure-bucket-prod",
        "arn:aws:s3:::secure-bucket-prod/*"
      ],
      "Condition": {
        "StringEquals": {
          "aws:sourceAccount": "123456789012"
        },
        "ArnEquals": {
          "aws:sourceArn": "arn:aws:cloudformation:us-east-1:123456789012:stack/prod-stack/*"
        }
      }
    },
    {
      "Sid": "AllowDynamoDBQueryOnly",
      "Effect": "Allow",
      "Action": [
        "dynamodb:Query",
        "dynamodb:GetItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/UserDataTable",
      "Condition": {
        "ForAllValues:StringEquals": {
          "dynamodb:Attributes": [
            "userId",
            "email",
            "createdAt"
          ]
        },
        "StringEquals": {
          "dynamodb:Select": "SPECIFIC_ATTRIBUTES"
        }
      }
    }
  ]
}
```

### Azure Conditional Access Policy

```json
{
  "displayName": "Require MFA for All Non-Admin Users",
  "state": "enabled",
  "conditions": {
    "users": {
      "includeGroups": [
        "c4c639a8-6f1d-4a8b-9a9d-1a2b3c4d5e6f"
      ],
      "excludeGroups": [
        "admin-group-id"
      ]
    },
    "applications": {
      "includeAllApps": true
    },
    "locations": {
      "includeLocations": [
        "All"
      ],
      "excludeLocations": [
        "TrustedLocations"
      ]
    },
    "signInRiskLevels": [
      "low",
      "medium",
      "high"
    ]
  },
  "grantControls": {
    "operator": "OR",
    "builtInControls": [
      "mfa"
    ]
  },
  "sessionControls": {
    "signInFrequency": {
      "value": 7,
      "type": "days"
    },
    "persistentBrowser": {
      "mode": "never"
    }
  }
}
```

### Kubernetes NetworkPolicy

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: secure-namespace-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api-service
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
          podSelector:
            matchLabels:
              app: ingress-controller
      ports:
        - protocol: TCP
          port: 8080
    - from:
        - podSelector:
            matchLabels:
              app: api-service
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
    - to:
        - ipBlock:
            cidr: 10.0.0.0/8
            except:
              - 10.0.1.0/24
      ports:
        - protocol: TCP
          port: 443
          name: https
        - protocol: TCP
          port: 80
          name: http
```

### AWS Security Hub Integration

```python
import boto3
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import List, Dict
import json

@dataclass
class SecurityFinding:
    id: str
    title: str
    severity: str
    resource: str
    status: str
    remediation: str

class SecurityHubReporter:
    def __init__(self, region: str = 'us-east-1'):
        self.securityhub = boto3.client('securityhub', region_name=region)
        self.inspector2 = boto3.client('inspector2', region_name=region)
        self.config = boto3.client('config', region_name=region)
        
    def get_critical_findings(self, days: int = 7) -> List[SecurityFinding]:
        findings = []
        start_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
        
        response = self.securityhub.get_findings(
            Filters={
                'RecordState': [{'Value': 'ACTIVE', 'Comparison': 'EQUALS'}],
                'SeverityLabel': [{'Value': 'CRITICAL', 'Comparison': 'EQUALS'}],
                'UpdatedAt': [{'Start': start_date, 'Comparison': 'GREATER_THAN_OR_EQUAL'}]
            },
            SortCriteria=[{'Field': 'UpdatedAt', 'SortOrder': 'DESC'}],
            MaxResults=100
        )
        
        for finding in response.get('Findings', []):
            findings.append(SecurityFinding(
                id=finding.get('Id'),
                title=finding.get('Title'),
                severity=finding.get('Severity', {}).get('Label'),
                resource=self._get_primary_resource(finding),
                status=finding.get('RecordState'),
                remediation=finding.get('Remediation', {}).get('Recommendation', {}).get('Text')
            ))
        
        return findings
    
    def get_vulnerability_findings(self) -> Dict:
        vulnerabilities = {}
        
        response = self.inspector2.list_finding_aggregations(
            findingAggregation={
                'groupByAttribute': 'SEVERITY'
            },
            filterCriteria={
                'findingType': [{'comparison': 'EQUALS', 'value': 'PACKAGE_VULNERABILITY'}],
                'sortBy': ['SEVERITY_DESC']
            }
        )
        
        return response.get('aggregations', [])
    
    def get_config_compliance(self) -> Dict:
        rules = {}
        
        response = self.config.describe_compliance_by_config_rules(
            ComplianceTypes=['AWS::Config::Compliance'],
            Limit=100
        )
        
        for result in response.get('ComplianceByConfigRules', []):
            rule = result.get('ConfigRuleName')
            status = result.get('Compliance().get('ComplianceType')
            count = result.get('Compliance().get('ComplianceContributorCount', {}).get('CappedCount')
            rules[rule] = {'status': status, 'non_compliant_count': count}
        
        return rules
    
    def generate_security_report(self) -> Dict:
        return {
            'generated_at': datetime.utcnow().isoformat(),
            'critical_findings': len(self.get_critical_findings()),
            'vulnerabilities': self.get_vulnerability_findings(),
            'compliance': self.get_config_compliance(),
            'recommendations': self._generate_recommendations()
        }
    
    def _get_primary_resource(self, finding: Dict) -> str:
        resources = finding.get('Resources', [])
        if resources:
            return f"{resources[0].get('Type')}: {resources[0].get('Id')}"
        return 'Unknown'
```

### Terraform Security Scanning Pipeline

```yaml
# .github/workflows/security-scan.yml
name: Infrastructure Security Scan

on:
  push:
    paths:
      - '**.tf'
      - 'terraform/**/*'
  pull_request:
    paths:
      - '**.tf'
      - 'terraform/**/*'
  schedule:
    - cron: '0 0 * * 0'

jobs:
  tfsec:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run tfsec
        uses: aquasecurity/tfsec-action@v1.2.0
        with:
          soft_fail: true
          format: sarif
          output_path: tfsec.sarif
      
      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: tfsec.sarif
          category: '/tfsec'

  checkov:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Checkov
        uses: bridgecrewio/checkov-action@master
        with:
          directory: terraform/
          framework: terraform
          output_format: sarif
          output_file_path: checkov.sarif
      
      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: checkov.sarif
          category: '/checkov'

  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITLEAKS_CONFIG_PATH: .gitleaks.toml
      
      - name: Run TruffleHog
        uses: trufflesecurity/trufflehog-action@main
        with:
          extra_args: --filesystem terraform/

  secrets_scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Scan for secrets
        uses: marvinpinto/action-automatic-releases@latest
        with:
          repo: Yelp/detect-secrets
          automatic_release_tag: latest
          files: detect-secrets baseline
```

### GCP Organization Policy

```yaml
# org-policies/iam.yaml
constraints:
  # Disable service account key creation
  constraints/iam.disableServiceAccountKeyCreation: {}
  
  # Restrict allowed service account scopes
  constraints/iam.allowedPolicyMemberDomains:
    - allowedList:
        values:
          - "domain:company.com"
  
  # Require OS Login for VM access
  constraints/compute.requireOsLogin: {}

---
# org-policies/onetwork-security.yaml
constraints:
  # Disable external IP on VMs
  constraints/compute.disableExternalIPCreation:
    deny:
      all: true
  
  # Require VPC flow logs
  constraints/compute.enableVpcFlowLogs:
    enforce: true
  
  # Restrict subnet creation
  constraints/compute.restrictSubnetworkCreation:
    allowedList:
      values:
        - "projects/*/regions/*/subnetworks/prod-*"

---
# org-policies/data-protection.yaml  
constraints:
  # Require CMEK for BigQuery
  constraints/bigquery.restrictPublicVisibility: {}
  
  # Enable VPC Service Controls
  constraints/ storage.uniformBucketLevelAccess:
    enforce: true
  
  # Require labels on resources
  constraints/resourcemanager.requiredLabels:
    requiredList:
      values:
        - key: "environment"
          value: "production"
        - key: "team"
          value: "*"
```

## Best Practices

- Implement zero-trust architecture with continuous verification of all access requests
- Use infrastructure as code with security scanning integrated into CI/CD pipelines
- Enforce least-privilege access with regular reviews and automated access certification
- Enable MFA for all human users and service accounts where possible
- Encrypt all data at rest using customer-managed keys (CMK/CMEK)
- Use TLS 1.2+ for all data in transit with modern cipher suites
- Implement comprehensive logging with SIEM integration for threat detection
- Regular security assessments including penetration testing and red team exercises
- Use cloud-native security services (Security Hub, Defender, Security Command Center)
- Implement network segmentation with strict firewall rules between environments
- Use secrets management services (AWS Secrets Manager, Azure Key Vault, GCP Secret Manager)
- Automate incident response with playbooks and runbooks
- Regular backup and disaster recovery testing with security considerations
- Use container image scanning and signed images with admission controllers
- Implement pod security standards and runtime protection in Kubernetes
- Regular training and security awareness for teams with cloud access

## Common Patterns

- **Shared Responsibility Model**: Clearly define and document security boundaries between provider and customer
- **Defense in Depth**: Layer multiple security controls across network, application, and data layers
- **Assume Breach**: Design systems to minimize impact when breaches occur
- **Just-in-Time Access**: Grant elevated access for limited time periods
- **Policy as Code**: Define and enforce security policies through code
- **Continuous Compliance**: Automate compliance monitoring and reporting
- **Micro-segmentation**: Fine-grained network isolation between workloads
- **Immutable Infrastructure**: Replace rather than modify infrastructure for consistency
- **Secrets Rotation**: Automated rotation of credentials and certificates
- **Security Observability**: Comprehensive logging, metrics, and tracing for security context
