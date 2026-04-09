---
name: blue-green-deployments
description: Zero-downtime deployment strategy
license: MIT
compatibility: opencode
metadata:
  audience: devops-engineer, platform-engineer
  category: devops
---

## What I do

- Implement blue-green deployment strategies for zero-downtime releases
- Manage parallel production environments (blue = active, green = standby)
- Coordinate traffic switching between environments
- Design rollback mechanisms for rapid recovery
- Automate the entire blue-green deployment workflow
- Monitor both environments during and after deployment

## When to use me

- When you need zero-downtime deployments for critical applications
- When you want to validate new releases in production-like environments
- When rapid rollback capability is a requirement
- When deploying applications that can't tolerate rolling updates
- When you need to test infrastructure changes alongside application changes
- When compliance requires production-like testing before full rollout

## Key Concepts

### Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐
│   Load Balancer │     │   Load Balancer │
│   (Active Blue) │     │   (Standby Green)│
└────────┬────────┘     └────────┬────────┘
         │                       │
    ┌────▼────┐             ┌────▼────┐
    │ Blue    │             │ Green   │
    │ v1.0    │             │ v1.1    │
    │ (Live)  │◄──Switch───►│ (Test)  │
    └─────────┘             └─────────┘
```

### Implementation with Docker Compose

```yaml
# docker-compose.blue.yml
services:
  app:
    image: myapp:blue
    ports:
      - "8080:8080"

# docker-compose.green.yml
services:
  app:
    image: myapp:green
    ports:
      - "8081:8080"
```

### Traffic Switching Script

```bash
#!/bin/bash
# Switch traffic from blue to green

# Health check green environment
if curl -sf http://green.example.com/health > /dev/null; then
    # Update load balancer to point to green
    aws elbv2 modify-listener \
        --listener-arn $LISTENER_ARN \
        --default-actions Type=forward,TargetGroupArn=$GREEN_TARGET_GROUP
    
    echo "Traffic switched to green environment"
    
    # Keep blue running for rollback
    echo "Blue environment preserved for rollback"
else
    echo "Green environment health check failed"
    exit 1
fi
```

### Key Benefits

- **Instant Rollback**: Switch back to previous version in seconds
- **Zero Downtime**: Users experience no interruption during deployment
- **Full Testing**: Validate new version in production before full rollout
- **Environment Parity**: Both environments use identical infrastructure
- **Risk Mitigation**: Isolate deployment risks from users

### Important Considerations

- Both environments must be fully provisioned and ready
- Database schema changes require careful backward compatibility planning
- Session state management must work across both environments
- Consider cost implications of running two complete environments
- Implement proper health checks before and after switching traffic
