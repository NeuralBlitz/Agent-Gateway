---
name: blue-green
description: Blue-green deployment patterns
license: MIT
compatibility: opencode
metadata:
  audience: devops-engineer, platform-engineer
  category: devops
---

## What I do

- Design and implement blue-green deployment architectures
- Manage environment switching and traffic routing
- Create automated rollback procedures
- Build deployment automation pipelines
- Monitor environment health during transitions
- Coordinate database and state changes across environments

## When to use me

- When deploying applications requiring zero downtime
- When you need quick rollback capabilities
- When testing in production-equivalent environments
- When managing stateful applications with complex data requirements
- When implementing disaster recovery strategies
- When performing infrastructure migrations

## Key Concepts

### Environment Setup

```yaml
# Terraform example for blue-green infrastructure
resource "aws_lb" "main" {
  name               = "main-lb"
  load_balancer_type = "application"
  subnets            = aws_subnet.public[*].id
}

resource "aws_lb_target_group" "blue" {
  name     = "blue-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
}

resource "aws_lb_target_group" "green" {
  name     = "green-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
}
```

### Deployment Workflow

1. **Deploy** new version to inactive environment (green)
2. **Verify** green environment passes health checks
3. **Route** traffic from blue to green
4. **Monitor** green environment under production load
5. **Keep** blue environment running for rollback
6. **Decommission** old environment after verification

### Key Patterns

- **Immutable Infrastructure**: Recreate environments from scratch each deployment
- **Feature Flags**: Toggle features independently of deployments
- **Database Migrations**: Use backward-compatible schemas
- **Connection Draining**: Gracefully move connections during switch
- **Canary Analysis**: Start with small traffic percentage before full switch
