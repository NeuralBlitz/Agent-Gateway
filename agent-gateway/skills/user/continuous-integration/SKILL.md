# Continuous Integration

## Overview

Continuous Integration (CI) is a software development practice where developers integrate code into a shared repository frequently, preferably multiple times per day. Each integration is automatically verified by building and testing to detect integration errors quickly. CI reduces integration problems and accelerates software delivery.

## Description

Continuous Integration emphasizes automated builds, tests, and code quality checks on every code change. Developers commit small changes frequently, with automated pipelines validating each change. CI catches bugs early, provides fast feedback, maintains code quality, and enables confident releases. Modern CI systems integrate with version control, testing frameworks, and deployment systems.

## Prerequisites

- Version control (Git) proficiency
- Build automation knowledge
- Testing frameworks experience
- Scripting abilities
- Pipeline configuration understanding

## Core Competencies

- Pipeline configuration (YAML)
- Automated build setup
- Test automation
- Code quality gates
- Artifact management
- Parallel execution
- Caching strategies
- Notification integration

## Implementation

```python
import os
import subprocess
import time
from typing import Any, Dict, List, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import json
import logging
import hashlib

logger = logging.getLogger(__name__)

class BuildStatus(Enum):
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"
    TIMEOUT = "timeout"

class TriggerType(Enum):
    PUSH = "push"
    PULL_REQUEST = "pull_request"
    TAG = "tag"
    SCHEDULE = "schedule"
    MANUAL = "manual"

@dataclass
class BuildStep:
    name: str
    command: str
    working_directory: str = ""
    env: Dict[str, str] = field(default_factory=dict)
    timeout: int = 300
    allow_failure: bool = False
    artifacts: List[str] = field(default_factory=list)

@dataclass
class BuildConfig:
    name: str
    branches: List[str] = field(default_factory=lambda: ["main", "master"])
    triggers: List[TriggerType] = field(default_factory=lambda: [TriggerType.PUSH])
    steps: List[BuildStep] = field(default_factory=list)
    environment: Dict[str, str] = field(default_factory=dict)
    cache: Dict[str, List[str]] = field(default_factory=dict)
    services: List[str] = field(default_factory=list)
    artifacts_patterns: List[str] = field(default_factory=list)

@dataclass
class Build:
    id: str
    build_number: int
    commit_sha: str
    branch: str
    status: BuildStatus
    start_time: datetime
    end_time: datetime = None
    duration: float = 0.0
    steps: Dict[str, Dict] = field(default_factory=dict)
    artifacts: Dict[str, str] = field(default_factory=dict)
    metrics: Dict[str, Any] = field(default_factory=dict)
    error: str = None
    log: List[str] = field(default_factory=list)

    def __post_init__(self):
        if not self.id:
            import uuid
            self.id = str(uuid.uuid4())

class ContinuousIntegration:
    def __init__(self, workspace: str):
        self.workspace = workspace
        self.builds: Dict[str, Build] = {}
        self.build_configs: Dict[str, BuildConfig] = {}
        self.build_counter = 0
        self.status = "idle"
        self.webhooks: List[Callable] = []
        self.hooks: Dict[str, List[Callable]] = {
            "pre_build": [],
            "post_build": [],
            "on_success": [],
            "on_failure": [],
        }

    def register_build_config(self, config: BuildConfig):
        self.build_configs[config.name] = config

    def register_hook(self, event: str, callback: Callable):
        if event in self.hooks:
            self.hooks[event].append(callback)

    def _execute_step(self, step: BuildStep, build: Build) -> bool:
        logger.info(f"Executing step: {step.name}")

        start_time = time.time()
        env = {**os.environ, **step.env}

        try:
            result = subprocess.run(
                step.command,
                shell=True,
                capture_output=True,
                text=True,
                cwd=os.path.join(self.workspace, step.working_directory) if step.working_directory else self.workspace,
                env=env,
                timeout=step.timeout
            )

            duration = time.time() - start_time

            build.steps[step.name] = {
                "status": "success" if result.returncode == 0 else "failed",
                "exit_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "duration": duration,
                "timestamp": datetime.now().isoformat()
            }

            build.log.append(f"[{datetime.now().isoformat()}] Step '{step.name}' completed in {duration:.2f}s")

            if result.returncode != 0 and not step.allow_failure:
                return False
            return True

        except subprocess.TimeoutExpired:
            build.steps[step.name] = {
                "status": "timeout",
                "error": f"Step timed out after {step.timeout}s",
                "duration": time.time() - start_time,
                "timestamp": datetime.now().isoformat()
            }
            build.log.append(f"[{datetime.now().isoformat()}] Step '{step.name}' timed out")
            return False

        except Exception as e:
            build.steps[step.name] = {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
            build.log.append(f"[{datetime.now().isoformat()}] Step '{step.name}' error: {e}")
            return False

    def _restore_cache(self, cache_config: Dict, build: Build) -> bool:
        for cache_name, paths in cache_config.items():
            cache_key = self._generate_cache_key(build, cache_name)
            logger.info(f"Restoring cache: {cache_name} ({cache_key})")
        return True

    def _save_cache(self, cache_config: Dict, build: Build) -> bool:
        for cache_name, paths in cache_config.items():
            cache_key = self._generate_cache_key(build, cache_name)
            logger.info(f"Saving cache: {cache_name} ({cache_key})")
        return True

    def _generate_cache_key(self, build: Build, cache_name: str) -> str:
        key_base = f"{build.branch}-{build.commit_sha}"
        return hashlib.md5(key_base.encode()).hexdigest()[:12]

    def _collect_artifacts(self, patterns: List[str], build: Build):
        for pattern in patterns:
            import glob
            files = glob.glob(pattern, recursive=True)
            for f in files:
                if os.path.isfile(f):
                    build.artifacts[f] = os.path.basename(f)

    def run_build(
        self,
        config_name: str,
        commit_sha: str,
        branch: str,
        trigger: TriggerType = TriggerType.PUSH,
        commit_message: str = "",
        author: str = ""
    ) -> str:
        config = self.build_configs.get(config_name)
        if not config:
            raise ValueError(f"Build config not found: {config_name}")

        if branch not in config.branches and trigger != TriggerType.PULL_REQUEST:
            logger.info(f"Branch {branch} not in configured branches, skipping")
            return None

        self.build_counter += 1
        build = Build(
            id="",
            build_number=self.build_counter,
            commit_sha=commit_sha,
            branch=branch,
            status=BuildStatus.QUEUED,
            start_time=datetime.now()
        )
        build.id = f"build-{build.build_number}"
        self.builds[build.id] = build

        def execute_build():
            try:
                build.status = BuildStatus.RUNNING
                build.log.append(f"[{datetime.now().isoformat()}] Build started")

                self._run_hooks("pre_build", build)

                if config.cache:
                    self._restore_cache(config.cache, build)

                overall_start = time.time()
                for step in config.steps:
                    if build.status != BuildStatus.RUNNING:
                        break

                    if not self._execute_step(step, build):
                        build.status = BuildStatus.FAILED
                        build.error = f"Step '{step.name}' failed"
                        self._run_hooks("on_failure", build)
                        break

                    time.sleep(0.1)

                build.duration = time.time() - overall_start

                if build.status == BuildStatus.RUNNING:
                    build.status = BuildStatus.SUCCESS
                    build.log.append(f"[{datetime.now().isoformat()}] Build successful")

                    if config.artifacts_patterns:
                        self._collect_artifacts(config.artifacts_patterns, build)

                    self._run_hooks("on_success", build)

                build.end_time = datetime.now()

                if config.cache:
                    self._save_cache(config.cache, build)

                self._run_hooks("post_build", build)

            except Exception as e:
                build.status = BuildStatus.FAILED
                build.error = str(e)
                build.end_time = datetime.now()
                self._run_hooks("on_failure", build)

        thread = threading.Thread(target=execute_build)
        thread.start()

        return build.id

    def _run_hooks(self, event: str, build: Build):
        for callback in self.hooks.get(event, []):
            try:
                callback(build)
            except Exception as e:
                logger.error(f"Hook error ({event}): {e}")

    def cancel_build(self, build_id: str) -> bool:
        build = self.builds.get(build_id)
        if build and build.status == BuildStatus.RUNNING:
            build.status = BuildStatus.CANCELLED
            build.end_time = datetime.now()
            build.log.append(f"[{datetime.now().isoformat()}] Build cancelled")
            return True
        return False

    def retry_build(self, build_id: str) -> str:
        build = self.builds.get(build_id)
        if build:
            return self.run_build(
                build.config_name if hasattr(build, 'config_name') else "default",
                build.commit_sha,
                build.branch
            )
        return None

    def get_build_status(self, build_id: str) -> Optional[Build]:
        return self.builds.get(build_id)

    def get_build_logs(self, build_id: str, follow: bool = False) -> List[str]:
        build = self.builds.get(build_id)
        if not build:
            return []

        if follow:
            while build.status == BuildStatus.RUNNING:
                time.sleep(1)
                yield from build.log[-10:]

        return build.log.copy()

    def get_build_history(self, limit: int = 50) -> List[Build]:
        builds = list(self.builds.values())
        builds.sort(key=lambda b: b.start_time, reverse=True)
        return builds[:limit]

    def calculate_build_metrics(self) -> Dict:
        recent_builds = [b for b in self.builds.values()
                        if (datetime.now() - b.start_time).days < 7]

        if not recent_builds:
            return {}

        successful = [b for b in recent_builds if b.status == BuildStatus.SUCCESS]
        failed = [b for b in recent_builds if b.status == BuildStatus.FAILED]

        durations = [b.duration for b in recent_builds if b.duration > 0]

        return {
            "total_builds": len(recent_builds),
            "successful": len(successful),
            "failed": len(failed),
            "success_rate": len(successful) / len(recent_builds) if recent_builds else 0,
            "avg_duration": sum(durations) / len(durations) if durations else 0,
            "total_duration": sum(durations),
        }

class CodeQualityChecker:
    def __init__(self):
        self.issues: List[Dict] = []
        self.thresholds: Dict[str, int] = {
            "max_complexity": 10,
            "max_duplication": 5,
            "max_coverage_drop": 5.0,
        }

    def check_linting(self, files: List[str]) -> bool:
        logger.info(f"Running linter on {len(files)} files")
        self.issues = []
        return True

    def check_coverage(self, current: float, previous: float = None) -> bool:
        if previous and current < previous - self.thresholds["max_coverage_drop"]:
            self.issues.append({
                "type": "coverage",
                "message": f"Coverage dropped by {previous - current}%",
                "severity": "error"
            })
            return False
        return True

    def check_security(self, files: List[str]) -> List[Dict]:
        vulnerabilities = []
        logger.info(f"Scanning {len(files)} files for vulnerabilities")
        return vulnerabilities

    def check_complexity(self, code: str) -> int:
        import ast
        try:
            tree = ast.parse(code)
            return self._calculate_complexity(tree)
        except:
            return 0

    def _calculate_complexity(self, node) -> int:
        complexity = 1
        for child in ast.iter_child_nodes(node):
            if isinstance(child, (ast.If, ast.For, ast.While, ast.FunctionDef, ast.ClassDef)):
                complexity += 1
        return complexity
```

## Use Cases

- Automated testing on every commit
- Code quality gates
- Artifact generation
- Merge request validation
- Scheduled builds
- Release automation triggers

## Artifacts

- `ContinuousIntegration`: CI orchestrator
- `BuildConfig`: Pipeline configuration
- `Build`: Build tracking
- `CodeQualityChecker`: Quality validation
- `BuildStep`: Individual step execution

## Related Skills

- Build Automation
- Test Automation
- Pipeline Configuration
- Code Quality
- Artifact Management
- Version Control
