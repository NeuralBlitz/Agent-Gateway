# Continuous Deployment

## Overview

Continuous Deployment (CD) is a software release practice that automatically deploys every code change that passes all tests directly to production. It extends Continuous Delivery by automating the final step of deploying to users. CD enables rapid feedback, reduces deployment risk, and accelerates value delivery.

## Description

Continuous Deployment builds on Continuous Integration by automating deployment to production environments. Every commit that passes automated testing is automatically deployed. This requires comprehensive test suites, feature flags, monitoring, and rollback capabilities. CD minimizes the time from code commit to production deployment, enabling rapid iteration.

## Prerequisites

- Strong CI/CD pipeline understanding
- Automated testing frameworks
- Deployment automation tools
- Environment management
- Monitoring and observability
- Rollback procedures

## Core Competencies

- Pipeline automation
- Environment configuration
- Deployment strategies
- Feature flags
- Automated testing integration
- Monitoring and alerting
- Rollback mechanisms
- Blue-green/canary deployments

## Implementation

```python
import os
import subprocess
import time
import threading
from typing import Any, Dict, List, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import json
import logging
import hashlib

logger = logging.getLogger(__name__)

class DeploymentStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"
    CANCELLED = "cancelled"

class EnvironmentType(Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"

@dataclass
class DeploymentConfig:
    environment: EnvironmentType
    artifacts: List[str] = field(default_factory=list)
    scripts: Dict[str, str] = field(default_factory=dict)
    environment_variables: Dict[str, str] = field(default_factory=dict)
    health_check_path: str = "/health"
    health_check_timeout: int = 60
    rollback_enabled: bool = True
    force_deployment: bool = False

@dataclass
class Deployment:
    id: str
    commit_sha: str
    branch: str
    status: DeploymentStatus
    environment: EnvironmentType
    start_time: datetime
    end_time: datetime = None
    logs: List[str] = field(default_factory=list)
    artifacts: Dict[str, str] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    error: str = None
    rollback_from: str = None

    def __post_init__(self):
        if not self.id:
            import uuid
            self.id = str(uuid.uuid4())

class DeploymentPipeline:
    def __init__(self, workspace: str):
        self.workspace = workspace
        self.deployments: Dict[str, Deployment] = {}
        self.current_deployment: Optional[Deployment] = None
        self.status = "idle"
        self.hooks: Dict[str, List[Callable]] = {
            "pre_deploy": [],
            "post_deploy": [],
            "pre_rollback": [],
            "post_rollback": [],
            "on_failure": [],
        }

    def register_hook(self, event: str, callback: Callable):
        if event in self.hooks:
            self.hooks[event].append(callback)

    def _run_hooks(self, event: str, deployment: Deployment):
        for callback in self.hooks.get(event, []):
            try:
                callback(deployment)
            except Exception as e:
                logger.error(f"Hook error ({event}): {e}")

    def _execute_script(self, script: str, env: Dict = None) -> bool:
        try:
            result = subprocess.run(
                script,
                shell=True,
                capture_output=True,
                text=True,
                cwd=self.workspace,
                env={**os.environ, **(env or {})},
                timeout=600
            )
            if result.returncode != 0:
                logger.error(f"Script failed: {result.stderr}")
                return False
            return True
        except subprocess.TimeoutExpired:
            logger.error("Script timed out")
            return False
        except Exception as e:
            logger.error(f"Script error: {e}")
            return False

    def _run_tests(self, test_command: str = "pytest") -> bool:
        logger.info("Running tests...")
        return self._execute_script(test_command)

    def _build_artifacts(self, build_command: str = "make build") -> List[str]:
        logger.info("Building artifacts...")
        if not self._execute_script(build_command):
            raise RuntimeError("Build failed")
        return []

    def _deploy_to_environment(self, config: DeploymentConfig, deployment: Deployment) -> bool:
        logger.info(f"Deploying to {config.environment.value}...")

        self._run_hooks("pre_deploy", deployment)

        if "pre_deploy" in config.scripts:
            if not self._execute_script(config.scripts["pre_deploy"], config.environment_variables):
                return False

        if "deploy" in config.scripts:
            if not self._execute_script(config.scripts["deploy"], config.environment_variables):
                self._handle_failure(deployment, "Deployment script failed")
                return False

        if "post_deploy" in config.scripts:
            if not self._execute_script(config.scripts["post_deploy"], config.environment_variables):
                logger.warning("Post-deploy script failed")

        self._run_hooks("post_deploy", deployment)
        return True

    def _health_check(self, config: DeploymentConfig, timeout: int = None) -> bool:
        timeout = timeout or config.health_check_timeout
        endpoint = f"http://localhost{config.health_check_path}"

        logger.info(f"Health check: {endpoint}")
        import requests
        start = time.time()

        while time.time() - start < timeout:
            try:
                response = requests.get(endpoint, timeout=5)
                if response.status_code == 200:
                    logger.info("Health check passed")
                    return True
            except requests.exceptions.RequestException:
                pass
            time.sleep(2)

        logger.error("Health check failed")
        return False

    def _handle_failure(self, deployment: Deployment, error: str):
        deployment.status = DeploymentStatus.FAILED
        deployment.error = error
        deployment.end_time = datetime.now()
        self._run_hooks("on_failure", deployment)
        logger.error(f"Deployment failed: {error}")

        if deployment.config.rollback_enabled if hasattr(deployment, 'config') else True:
            self.rollback(deployment.id)

    def deploy(
        self,
        commit_sha: str,
        branch: str,
        config: DeploymentConfig
    ) -> str:
        deployment = Deployment(
            id="",
            commit_sha=commit_sha,
            branch=branch,
            status=DeploymentStatus.PENDING,
            environment=config.environment,
            start_time=datetime.now()
        )
        deployment.id = f"deploy-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

        self.deployments[deployment.id] = deployment
        self.current_deployment = deployment

        def run_deployment():
            try:
                deployment.status = DeploymentStatus.RUNNING
                deployment.logs.append(f"[{datetime.now().isoformat()}] Starting deployment {deployment.id}")

                if not config.force_deployment:
                    deployment.logs.append("Running tests...")
                    if not self._run_tests():
                        self._handle_failure(deployment, "Tests failed")
                        return

                deployment.logs.append("Building artifacts...")
                artifacts = self._build_artifacts(config.scripts.get("build", "make build"))
                deployment.artifacts = {f"artifact_{i}": a for i, a in enumerate(artifacts)}

                deployment.logs.append(f"Deploying commit {commit_sha[:8]}...")
                if not self._deploy_to_environment(config, deployment):
                    self._handle_failure(deployment, "Deployment failed")
                    return

                deployment.logs.append("Running health checks...")
                if not self._health_check(config):
                    self._handle_failure(deployment, "Health check failed")
                    return

                deployment.status = DeploymentStatus.SUCCESS
                deployment.end_time = datetime.now()
                deployment.logs.append(f"[{deployment.end_time.isoformat()}] Deployment successful")

                logger.info(f"Deployment {deployment.id} completed successfully")

            except Exception as e:
                self._handle_failure(deployment, str(e))

        thread = threading.Thread(target=run_deployment)
        thread.start()

        return deployment.id

    def rollback(self, deployment_id: str) -> bool:
        deployment = self.deployments.get(deployment_id)
        if not deployment:
            logger.error(f"Deployment not found: {deployment_id}")
            return False

        logger.info(f"Rolling back deployment {deployment_id}")

        self._run_hooks("pre_rollback", deployment)

        rollback_script = deployment.config.scripts.get("rollback", "make rollback") if hasattr(deployment, 'config') else "make rollback"
        if not self._execute_script(rollback_script):
            logger.error("Rollback script failed")
            return False

        deployment.status = DeploymentStatus.ROLLED_BACK
        deployment.end_time = datetime.now()

        self._run_hooks("post_rollback", deployment)

        return True

    def get_status(self, deployment_id: str) -> Optional[Deployment]:
        return self.deployments.get(deployment_id)

    def get_deployment_history(self, environment: EnvironmentType = None) -> List[Deployment]:
        if environment:
            return [d for d in self.deployments.values() if d.environment == environment]
        return list(self.deployments.values())

    def cancel_deployment(self, deployment_id: str) -> bool:
        deployment = self.deployments.get(deployment_id)
        if not deployment:
            return False

        if deployment.status == DeploymentStatus.RUNNING:
            deployment.status = DeploymentStatus.CANCELLED
            deployment.end_time = datetime.now()
            return True

        return False

class FeatureFlagManager:
    def __init__(self):
        self.flags: Dict[str, Dict] = {}

    def create_flag(self, name: str, enabled: bool = False, rollout_percent: int = 0):
        self.flags[name] = {
            "enabled": enabled,
            "rollout_percent": rollout_percent,
            "users": [],
            "created_at": datetime.now().isoformat()
        }

    def enable(self, name: str):
        if name in self.flags:
            self.flags[name]["enabled"] = True

    def disable(self, name: str):
        if name in self.flags:
            self.flags[name]["enabled"] = False

    def is_enabled(self, name: str, user_id: str = None) -> bool:
        if name not in self.flags:
            return False

        flag = self.flags[name]
        if flag["enabled"]:
            return True

        if flag["rollout_percent"] > 0 and user_id:
            user_hash = int(hashlib.md5(user_id.encode()).hexdigest(), 16) % 100
            return user_hash < flag["rollout_percent"]

        return False

    def set_rollout(self, name: str, percent: int):
        if name in self.flags:
            self.flags[name]["rollout_percent"] = percent
```

## Use Cases

- Automated production deployments
- Feature flag-based releases
- Blue-green deployments
- Canary rollouts
- Rapid iteration cycles
- Zero-downtime deployments

## Artifacts

- `DeploymentPipeline`: CD orchestration
- `Deployment`: Deployment tracking
- `DeploymentConfig`: Configuration
- `FeatureFlagManager`: Feature toggles
- `DeploymentStatus`: Status enum

## Related Skills

- Continuous Integration
- Infrastructure as Code
- Deployment Strategies
- Feature Flags
- Monitoring
- Rollback Procedures
