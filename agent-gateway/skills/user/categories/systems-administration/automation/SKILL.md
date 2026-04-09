---
name: automation
description: Infrastructure automation and configuration management
category: systems-administration
difficulty: intermediate
tags: [automation, ansible, terraform, ci-cd]
author: OpenCode Community
version: 1.0
last_updated: 2024-01-15
---

# Automation

## What I Do

I am Automation, the practice of using tools and scripts to manage infrastructure and configurations without manual intervention. I encompass configuration management (Ansible, Puppet, Chef), infrastructure as code (Terraform, Pulumi), CI/CD pipelines (Jenkins, GitLab CI, GitHub Actions), and deployment automation. I enable consistent, repeatable, and auditable infrastructure changes. I reduce human error, speed up deployments, and enable self-service infrastructure. I support both cloud and on-premises environments. I implement GitOps workflows where infrastructure changes follow the same review process as code changes.

## When to Use Me

- Infrastructure provisioning and management
- Application deployment automation
- Configuration management across servers
- Cloud infrastructure automation
- CI/CD pipeline implementation
- Database migration automation
- Security compliance automation
- Auto-scaling and self-healing infrastructure

## Code Examples

### Example 1: Ansible Playbook
```yaml
---
# Ansible Playbook for Web Server Deployment
- name: Configure Web Servers
  hosts: web_servers
  become: true
  vars:
    app_version: v2.1.0
    app_port: 8080
    nginx_max_body_size: "100M"
  
  vars_files:
    - vault_vars.yml
  
  pre_tasks:
    - name: Show inventory group
      ansible.builtin.debug:
        msg: "Configuring servers in {{ ansible_host }}"
    
    - name: Check connectivity
      ansible.builtin.ping:
      register: ping_result
    
    - name: Fail if host unreachable
      ansible.builtin.fail:
        msg: "Host {{ inventory_hostname }} is unreachable"
      when: ping_result.unreachable | default(false)

  tasks:
    - name: Install prerequisites
      ansible.builtin.apt:
        update_cache: yes
        cache_valid_time: 3600
        pkg:
          - curl
          - wget
          - git
          - nginx
          - certbot
          - python3-certbot-nginx
        state: present
      register: apt_result
    
    - name: Create application user
      ansible.builtin.user:
        name: appuser
        system: yes
        shell: /sbin/nologin
        home: /opt/appuser
        createhome: yes
    
    - name: Configure nginx
      ansible.builtin.template:
        src: templates/nginx.conf.j2
        dest: /etc/nginx/nginx.conf
        mode: '0644'
        validate: nginx -t -c %s
      notify: Restart nginx
      vars:
        server_name: "{{ inventory_hostname }}"
        app_port: "{{ app_port }}"
        ssl_enabled: "{{ ssl_enabled | default(false) }}"
    
    - name: Create nginx site configuration
      ansible.builtin.template:
        src: templates/site.conf.j2
        dest: /etc/nginx/sites-available/{{ ansible_hostname }}.conf
        mode: '0644'
      notify: Enable site
    
    - name: Create application directory
      ansible.builtin.file:
        path: /opt/app/{{ app_version }}
        state: directory
        owner: appuser
        group: appuser
        mode: '0755'
    
    - name: Download application artifact
      ansible.builtin.get_url:
        url: "https://releases.example.com/{{ app_version }}/app.tar.gz"
        dest: /tmp/app.tar.gz
        checksum: "sha256:CHECKSUM_VALUE"
        mode: '0644'
        owner: appuser
        group: appuser
    
    - name: Extract application
      ansible.builtin.unarchive:
        src: /tmp/app.tar.gz
        dest: /opt/app/{{ app_version }}
        remote_src: yes
        creates: "/opt/app/{{ app_version }}/bin/app"
    
    - name: Configure systemd service
      ansible.builtin.template:
        src: templates/app.service.j2
        dest: /etc/systemd/system/app.service
        mode: '0644'
        validate: systemd-daemon-reload
      notify: Restart app
    
    - name: Start and enable service
      ansible.builtin.service:
        name: app
        state: started
        enabled: yes
    
    - name: Setup firewall rules
      community.general.ufw:
        rule: allow
        port: "{{ item.port }}"
        proto: "{{ item.proto }}"
        comment: "{{ item.comment }}"
      loop:
        - { port: '22', proto: 'tcp', comment: 'SSH' }
        - { port: '80', proto: 'tcp', comment: 'HTTP' }
        - { port: '443', proto: 'tcp', comment: 'HTTPS' }
    
    - name: Wait for application to start
      ansible.builtin.wait_for:
        host: localhost
        port: "{{ app_port }}"
        timeout: 60
        state: started
    
    - name: Verify application health
      ansible.builtin.uri:
        url: "http://localhost:{{ app_port }}/health"
        status_code: 200
        return_content: yes
      register: health_result
    
    - name: Display health check result
      ansible.builtin.debug:
        msg: "Application health: {{ health_result.content }}"

  handlers:
    - name: Restart nginx
      ansible.builtin.service:
        name: nginx
        state: restarted
    
    - name: Enable site
      ansible.builtin.file:
        src: /etc/nginx/sites-available/{{ ansible_hostname }}.conf
        dest: /etc/nginx/sites-enabled/{{ ansible_hostname }}.conf
        state: link
    
    - name: Restart app
      ansible.builtin.service:
        name: app
        state: restarted

  post_tasks:
    - name: Gather service status
      ansible.builtin.service_facts:
    
    - name: Display running services
      ansible.builtin.debug:
        msg: "Services running on {{ inventory_hostname }}"
      loop: "{{ ansible_facts.services | selectattr('state', 'equalto', 'running') | list }}"
      when: "'services' in ansible_facts"

- name: Setup SSL Certificates
  hosts: web_servers
  become: true
  vars:
    domains:
      - "{{ inventory_hostname }}.example.com"
  
  tasks:
    - name: Obtain SSL certificate
      ansible.posix.cron:
        name: certbot-renewal
        minute: "0"
        hour: "*/12"
        job: |
          certbot renew --quiet --deploy-hook "systemctl restart nginx"
        user: root
        state: present
```

### Example 2: Terraform Infrastructure
```hcl
# Terraform Configuration for Multi-Tier Infrastructure
terraform {
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
    bucket         = "terraform-state-bucket"
    key            = "production/network/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
  
  required_version = ">= 1.5"
}

# Variables
variable "environment" {
  type    = string
  default = "production"
}

variable "cidr_blocks" {
  type = object({
    vpc_cidr     = string
    public_subnets  = list(string)
    private_subnets = list(string)
  })
}

# Provider configuration
provider "aws" {
  region = "us-east-1"
  
  default_tags {
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = var.cidr_blocks.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name        = "${var.environment}-vpc"
    Environment = var.environment
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = {
    Name = "${var.environment}-igw"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = length(var.cidr_blocks.public_subnets)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.cidr_blocks.public_subnets[count.index]
  availability_zone       = element(["us-east-1a", "us-east-1b", "us-east-1c"], count.index)
  map_public_ip_on_launch = true
  
  tags = {
    Name = "${var.environment}-public-${count.index + 1}"
    Type = "public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count                   = length(var.cidr_blocks.private_subnets)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.cidr_blocks.private_subnets[count.index]
  availability_zone       = element(["us-east-1a", "us-east-1b", "us-east-1c"], count.index)
  
  tags = {
    Name = "${var.environment}-private-${count.index + 1}"
    Type = "private"
  }
}

# NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id    = aws_subnet.public[0].id
  
  tags = {
    Name = "${var.environment}-nat"
  }
  
  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = {
    Name = "${var.environment}-public-rt"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }
  
  tags = {
    Name = "${var.environment}-private-rt"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(var.cidr_blocks.public_subnets)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(var.cidr_blocks.private_subnets)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# Security Groups
resource "aws_security_group" "alb" {
  name        = "${var.environment}-alb-sg"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.main.id
  
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
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "web" {
  name        = "${var.environment}-web-sg"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
  
  enable_deletion_protection = true
  
  tags = {
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "web" {
  name        = "${var.environment}-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 5
    timeout             = 30
    interval            = 60
  }
}

# Auto Scaling Group
resource "aws_launch_template" "web" {
  name_prefix   = "${var.environment}-lt-"
  image_id      = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.medium"
  
  key_name = "production-key"
  
  vpc_security_group_ids = [aws_security_group.web.id]
  
  user_data = base64encode(<<-EOT
#!/bin/bash
yum update -y
yum install -y nginx
systemctl enable nginx
systemctl start nginx
echo "App server configured" > /var/www/html/index.html
  EOT
  )
  
  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.environment}-web"
      Environment = var.environment
    }
  }
}

resource "aws_autoscaling_group" "web" {
  name                = "${var.environment}-asg"
  launch_template {
    id      = aws_launch_template.web.id
    version = "$Latest"
  }
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.web.arn]
  
  min_size = 2
  max_size = 10
  
  desired_capacity = 4
  
  health_check_type = "ELB"
  health_check_grace_period = 300
  
  scheduled_actions {
    name = "scale-down-at-night"
    cron_time_zone = "UTC"
    desired_capacity = 2
    min_size = 1
    max_size = 5
    recurrence = "0 0 * * *"
  }
  
  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
}

# Outputs
output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "vpc_id" {
  value = aws_vpc.main.id
}
```

### Example 3: CI/CD Pipeline (GitHub Actions)
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run unit tests
        run: npm test -- --coverage
        env:
          CI: true
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    outputs:
      image: ${{ steps.build.outputs.image }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha
            type=ref,event=branch
            type=raw,value=latest,enable={{is_default_branch}}
      
      - name: Build and push Docker image
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Deploy to Staging
        run: |
          kubectl config use-context staging
          kubectl set image deployment/web \
            web=${{ needs.build.outputs.image }} \
            -n staging
        env:
          KUBECONFIG: ${{ secrets.STAGING_KUBECONFIG }}

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Deploy to Production
        run: |
          kubectl config use-context production
          kubectl set image deployment/web \
            web=${{ needs.build.outputs.image }} \
            -n production
        env:
          KUBECONFIG: ${{ secrets.PRODUCTION_KUBECONFIG }}
      
      - name: Wait for deployment
        run: |
          kubectl rollout status deployment/web -n production --timeout=600s
      
      - name: Health check
        run: |
          curl -f https://api.example.com/health
```

## Best Practices

- Use infrastructure as code for all environments
- Implement GitOps workflows for changes
- Test automation thoroughly before deployment
- Use immutable infrastructure patterns
- Implement blue-green or canary deployments
- Use secrets management (Vault, AWS Secrets Manager)
- Monitor deployment success/failure
- Implement rollback capabilities
- Use configuration management consistently
- Document automation procedures

## Core Competencies

- Ansible playbooks and roles
- Terraform infrastructure as code
- CI/CD pipeline design
- GitOps implementation
- Container orchestration (Kubernetes)
- Cloud automation (AWS, Azure, GCP)
- Configuration management
- Secret management
- Blue-green deployments
- Canary releases
- Automated testing
- Monitoring and alerting
