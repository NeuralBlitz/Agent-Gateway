# Blue-Green Deployment

**Category:** DevOps  
**Skill Level:** Intermediate  
**Domain:** Deployment Strategies, Release Management, Infrastructure

## Overview

Blue-Green Deployment is a release management strategy that maintains two identical production environments, only one of which is live at any time. By routing traffic between environments, teams can deploy new versions with zero downtime and enable instant rollback if issues are detected.

## Description

Blue-Green Deployment addresses one of the most challenging aspects of modern software delivery: releasing new versions without interrupting service to users. The strategy maintains two parallel production environments, conventionally called "blue" (the current live version) and "green" (the new version being deployed). At any given time, only one environment serves production traffic while the other remains ready to receive traffic after deployment.

The deployment process follows a predictable pattern. First, the new version is deployed to the inactive environment, where it receives full deployment including database migrations, configuration changes, and application updates. During this phase, the live environment continues serving all traffic with no disruption. Once deployment to the inactive environment is complete, smoke tests validate that the new version functions correctly. Finally, the load balancer or router is reconfigured to switch traffic from the active to the inactive environment, making the new version live.

The key advantage of blue-green deployment is the instant rollback capability. If problems emerge after switching traffic, reverting is simply a matter of reconfiguring the router to point back to the previous environment. This eliminates the time-consuming rollback processes that plague traditional deployment strategies and dramatically reduces the blast radius of problematic releases. The previous environment remains intact with the old version, ready to serve as a fallback.

Blue-green deployment requires careful consideration of several factors. Database schema changes must be backward-compatible or designed to support both versions during transition. Stateful applications require session management strategies to prevent users from losing context during switchover. The infrastructure costs of maintaining duplicate environments must be factored into operational budgets. Cloud providers and container orchestration platforms have made blue-green deployment more accessible through features like AWS CodeDeploy, Kubernetes deployments with services, and traffic splitting capabilities.

## Prerequisites

- Understanding of continuous integration and deployment concepts
- Knowledge of load balancing and traffic routing mechanisms
- Familiarity with infrastructure as code practices
- Experience with database migration strategies

## Core Competencies

- Designing infrastructure for parallel production environments
- Implementing automated smoke tests for deployment validation
- Configuring load balancers and reverse proxies for traffic switching
- Managing database migrations in zero-downtime scenarios
- Executing instant rollbacks when issues are detected
- Monitoring deployments to detect problems quickly

## Implementation

```python
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any

class DeploymentStatus(Enum):
    NOT_STARTED = "not_started"
    DEPLOYING = "deploying"
    VALIDATING = "validating"
    LIVE = "live"
    ROLLING_BACK = "rolling_back"
    FAILED = "failed"

@dataclass
class Environment:
    name: str
    color: str
    instances: List[str] = field(default_factory=list)
    health_status: str = "unknown"
    last_deployed: Optional[datetime] = None
    version: str = "unknown"

@dataclass
class DeploymentConfig:
    target_version: str
    blue_env: str
    green_env: str
    health_check_endpoint: str = "/health"
    validation_timeout: int = 300
    auto_rollback_on_failure: bool = True

@dataclass
class DeploymentResult:
    success: bool
    status: DeploymentStatus
    duration_seconds: float
    message: str

class TrafficRouter:
    def __init__(self):
        self.active_env = "blue"
    
    def get_active_environment(self) -> str:
        return self.active_env
    
    def switch_traffic(self, from_env: str, to_env: str, percentage: float = 100.0) -> bool:
        print(f"Switching {percentage}% traffic from {from_env} to {to_env}")
        if percentage == 100.0:
            self.active_env = to_env
        return True

class DeploymentExecutor:
    def deploy_to_environment(self, environment: str, version: str) -> DeploymentResult:
        print(f"Deploying version {version} to {environment}")
        return DeploymentResult(
            success=True,
            status=DeploymentStatus.DEPLOYING,
            duration_seconds=30.0,
            message=f"Deployed to {environment}"
        )

class HealthValidator:
    def validate_environment(self, environment: str, endpoint: str, timeout: int) -> bool:
        print(f"Validating {environment} at {endpoint}")
        return True

class BlueGreenDeploymentManager:
    def __init__(self, router: TrafficRouter, deployer: DeploymentExecutor, validator: HealthValidator):
        self.router = router
        self.deployer = deployer
        self.validator = validator
        self.environments: Dict[str, Environment] = {}
    
    def register_environment(self, env: Environment):
        self.environments[env.name] = env
    
    def deploy(self, config: DeploymentConfig) -> DeploymentResult:
        start_time = datetime.now()
        active_env = self.router.get_active_environment()
        standby_env = config.blue_env if active_env == config.green_env else config.green_env
        
        print(f"Deploying to {standby_env}...")
        
        result = self.deployer.deploy_to_environment(standby_env, config.target_version)
        
        if not result.success:
            if config.auto_rollback_on_failure:
                return self._rollback(standby_env, start_time)
            return result
        
        print(f"Validating deployment on {standby_env}...")
        if not self.validator.validate_environment(standby_env, config.health_check_endpoint, config.validation_timeout):
            return self._rollback(standby_env, start_time)
        
        print(f"Switching traffic from {active_env} to {standby_env}...")
        self.router.switch_traffic(active_env, standby_env, 100.0)
        
        duration = (datetime.now() - start_time).total_seconds()
        
        return DeploymentResult(
            success=True,
            status=DeploymentStatus.LIVE,
            duration_seconds=duration,
            message="Deployment successful"
        )
    
    def _rollback(self, failed_env: str, start_time: datetime) -> DeploymentResult:
        print(f"Rolling back {failed_env}")
        return DeploymentResult(
            success=False,
            status=DeploymentStatus.ROLLING_BACK,
            duration_seconds=(datetime.now() - start_time).total_seconds(),
            message="Rolled back due to failure"
        )

blue_env = Environment(name="blue", color="blue", version="1.0.0")
green_env = Environment(name="green", color="green", version="1.0.0")

router = TrafficRouter()
deployer = DeploymentExecutor()
validator = HealthValidator()

manager = BlueGreenDeploymentManager(router, deployer, validator)
manager.register_environment(blue_env)
manager.register_environment(green_env)

config = DeploymentConfig(target_version="1.1.0", blue_env="blue", green_env="green")
result = manager.deploy(config)
print(f"Deployment: {'Success' if result.success else 'Failed'}")
```

## Use Cases

- Releasing new versions of web applications with zero downtime
- Deploying critical backend services requiring high availability
- Performing canary releases with instant rollback capability
- Testing new releases in production-like environments before full rollout
- A/B testing different versions with real user traffic
- Recovering quickly from problematic deployments

## Artifacts

- Terraform infrastructure for blue-green environments
- Kubernetes deployment manifests with traffic splitting
- AWS CodeDeploy blue-green deployment configurations
- Deployment automation scripts and playbooks
- Smoke test suites and health check endpoints

## Related Skills

- Canary Deployment
- Rolling Deployment
- Infrastructure as Code
- Load Balancing
- Zero-Downtime Deployment
