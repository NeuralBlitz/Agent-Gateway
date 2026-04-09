---
name: automation
description: DevOps automation and workflow optimization
license: MIT
compatibility: opencode
metadata:
  audience: developer, devops-engineer
  category: devops
---

## What I do

- Design and implement CI/CD pipelines for automated software delivery
- Create infrastructure automation scripts using tools like Ansible, Terraform, and Chef
- Build workflow automation to reduce manual, repetitive tasks
- Implement configuration management and policy-as-code solutions
- Automate testing, deployment, and monitoring processes
- Develop custom automation frameworks and reusable components

## When to use me

- When you need to set up or optimize CI/CD pipelines
- When manual deployment processes are error-prone or time-consuming
- When you want to implement infrastructure as code practices
- When building self-service automation for development teams
- When integrating multiple tools and services into cohesive workflows
- When standardizing deployment processes across environments

## Key Concepts

### CI/CD Pipeline Design

```yaml
# Example GitHub Actions workflow
name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: npm test
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          echo "Deploying to production..."
```

### Infrastructure as Code

```terraform
# Example Terraform configuration
resource "aws_ec2_instance" "web_server" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
  
  tags = {
    Name        = "WebServer"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}
```

### Configuration Management

```ansible
# Example Ansible playbook
- name: Configure web servers
  hosts: webservers
  become: yes
  tasks:
    - name: Install nginx
      apt:
        name: nginx
        state: present

    - name: Start nginx service
      service:
        name: nginx
        state: started
        enabled: yes
```

### Key Principles

- **Idempotency**: Automation scripts should produce the same result regardless of how many times they're run
- **Immutable Infrastructure**: Prefer replacing resources over modifying them
- **GitOps**: Use Git as the single source of truth for infrastructure and deployments
- **Policy as Code**: Define compliance and security policies as version-controlled code
- **Self-Service**: Enable teams to provision resources without manual intervention
