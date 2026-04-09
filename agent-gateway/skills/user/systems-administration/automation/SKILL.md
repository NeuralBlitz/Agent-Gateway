---
name: automation
description: Infrastructure automation and configuration management using Ansible, Terraform, and CI/CD pipelines
license: MIT
compatibility: opencode
metadata:
  audience: devops-engineers
  category: systems-administration
---

## What I do
- Write Ansible playbooks and roles
- Create Terraform infrastructure code
- Design CI/CD pipelines
- Implement GitOps workflows
- Automate deployment processes
- Manage configuration drift
- Create self-service infrastructure
- Implement policy as code
- Automate testing and validation
- Orchestrate multi-cloud deployments

## When to use me
When automating infrastructure provisioning, configuring systems, or building CI/CD pipelines for deployments.

## Core Concepts
- Infrastructure as Code (IaC)
- Configuration management
- CI/CD pipeline design
- GitOps workflows
- Terraform and Ansible fundamentals
- Secret management
- Pipeline parallelization
- Blue-green and canary deployments
- Feature flags
- Infrastructure testing

## Code Examples

### Ansible Playbooks
```yaml
# site.yml - Main playbook
---
- name: Common system configuration
  hosts: all
  become: true
  gather_facts: true
  vars:
    common_packages:
      - vim
      - curl
      - wget
      - htop
      - net-tools
      - git
      - unzip
    ntp_servers:
      - 0.pool.ntp.org
      - 1.pool.ntp.org
  pre_tasks:
    - name: Check connection
      ping:
    - name: Display facts
      debug:
        msg: "Host {{ ansible_fqdn }} has {{ ansible_memory_mb.real.total }}MB RAM"
  roles:
    - role: common
    - role: users
    - role: security
  handlers:
    - name: Restart rsyslog
      service:
        name: rsyslog
        state: restarted
```

```yaml
# roles/common/tasks/main.yml
---
- name: Install common packages
  apt:
    name: "{{ common_packages }}"
    state: present
    update_cache: yes
    cache_valid_time: 3600
  notify: Check services

- name: Configure NTP
  template:
    src: ntp.conf.j2
    dest: /etc/ntp.conf
    mode: 0644
    validate: ntpq -p -c config %s
  notify: Restart NTP

- name: Configure timezone
  community.general.timezone:
    name: "{{ timezone | default('UTC') }}"

- name: Setup sysctl parameters
  sysctl:
    name: "{{ item.name }}"
    value: "{{ item.value }}"
    state: present
    reload: yes
  loop:
    - name: net.ipv4.ip_forward
      value: '1'
    - name: vm.swappiness
      value: '10'
    - name: fs.file-max
      value: '2097152'

- name: Ensure log directory exists
  file:
    path: /var/log/audit
    state: directory
    mode: '0750'
```

```yaml
# roles/security/tasks/main.yml
---
- name: Configure firewall
  ufw:
    state: enabled
    policy: deny

- name: Allow SSH
  ufw:
    rule: allow
    to_port: "{{ ssh_port | default('22') }}"
    proto: tcp

- name: Allow HTTP/HTTPS
  ufw:
    rule: allow
    name: www-full

- name: Install fail2ban
  apt:
    name: fail2ban
    state: present

- name: Configure fail2ban
  template:
    src: fail2ban.local.j2
    dest: /etc/fail2ban/jail.local
    mode: 0644
  notify: Restart fail2ban

- name: Disable root SSH login
  lineinfile:
    dest: /etc/ssh/sshd_config
    regexp: "^PermitRootLogin"
    line: "PermitRootLogin no"
    state: present
  notify: Restart SSH

- name: Set SSH password authentication
  lineinfile:
    dest: /etc/ssh/sshd_config
    regexp: "^PasswordAuthentication"
    line: "PasswordAuthentication yes"
    state: present
```

### Terraform Configuration
```hcl
# main.tf - Infrastructure provisioning
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
  
  backend "s3" {
    bucket = "terraform-state-bucket"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
    dynamodb_table = "terraform-lock"
  }
}

# Variables
variable "environment" {
  type    = string
  default = "production"
}

variable "instance_type" {
  type    = string
  default = "t3.medium"
}

variable "desired_capacity" {
  type    = number
  default = 3
}

# Provider
provider "aws" {
  region = var.region
  default_tags {
    Environment = var.environment
    ManagedBy   = "Terraform"
    Project     = "web-application"
  }
}

# Data sources
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

data "aws_vpc" "default" {
  default = true
}

# Resources
resource "aws_security_group" "web" {
  name        = "${var.environment}-web-sg"
  description = "Security group for web servers"
  vpc_id      = data.aws_vpc.default.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_launch_template" "web" {
  name_prefix   = "${var.environment}-web-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type
  
  vpc_security_group_ids = [aws_security_group.web.id]
  
  iam_instance_profile {
    name = aws_iam_instance_profile.web.name
  }
  
  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.environment}-web"
      Environment = var.environment
    }
  }
  
  tag_specifications {
    resource_type = "volume"
    tags = {
      Environment = var.environment
    }
  }
}

resource "aws_autoscaling_group" "web" {
  name                = "${var.environment}-web-asg"
  vpc_zone_identifier = ["subnet-abc123", "subnet-def456"]
  target_group_arns   = [aws_lb_target_group.web.arn]
  
  launch_template {
    id      = aws_launch_template.web.id
    version = "$Latest"
  }
  
  min_size         = var.desired_capacity
  max_size         = var.desired_capacity * 3
  desired_capacity = var.desired_capacity
  
  health_check_type         = "ELB"
  health_check_grace_period = 300
  
  lifecycle {
    create_before_destroy = true
    ignore_changes        = [desired_capacity]
  }
  
  tag {
    key                 = "Name"
    value                = "${var.environment}-web"
    propagate_at_launch = true
  }
}

# Outputs
output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.web.dns_name
}
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: app-repository
  ECS_SERVICE: app-service
  ECS_CLUSTER: app-cluster

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
      
      - name: Run linters
        run: |
          pip install ruff flake8
          ruff check .
          flake8 .
      
      - name: Run tests
        run: |
          pip install pytest pytest-cov
          pytest --cov=app --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml

  build:
    needs: test
    runs-on: ubuntu-latest
    outputs:
      image: ${{ steps.build-image.outputs.image }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
      
      - name: Build, tag, and push image to Amazon ECR
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Update ECS service
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: task-definition-staging.json
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Update ECS service (Blue-Green)
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: task-definition-production.json
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true
          codedeploy-appspec: appspec.yml
          codedeploy-application: my-ecs-application
          codedeploy-deployment-group: my-dg
```

### Ansible Vault for Secrets
```bash
#!/bin/bash
# vault_management.sh

# Create encrypted vault file
ansible-vault create group_vars/all/vault.yml

# View vault contents
ansible-vault view group_vars/all/vault.yml

# Edit vault
ansible-vault edit group_vars/all/vault.yml

# Decrypt for editing
ansible-vault decrypt group_vars/all/vault.yml --output=vault-decrypted.yml

# Encrypt after editing
ansible-vault encrypt vault-decrypted.yml --output=group_vars/all/vault.yml
rm vault-decrypted.yml

# Run playbook with vault
ansible-playbook site.yml --ask-vault-pass

# Using vault password file
echo "my_secure_password" > ~/.vault_pass
chmod 600 ~/.vault_pass
ansible-playbook site.yml --vault-password-file ~/.vault_pass
```

## Best Practices
- Use version control for all infrastructure code
- Implement state management for Terraform
- Use modules to promote reuse
- Implement proper secret management (Vault, SSM)
- Design pipelines with proper approval gates
- Use immutable infrastructure patterns
- Implement proper testing (unit, integration, e2e)
- Use feature flags for controlled rollouts
- Maintain documentation alongside code
- Implement proper rollback mechanisms
