# Configuration as Code

## Overview

Configuration as Code (CaC) is a practice where infrastructure, platform, and application configurations are managed through version-controlled code files rather than manual processes or graphical interfaces. This approach enables version control, code review, automated testing, and CI/CD pipelines for configuration changes.

## Description

Configuration as Code treats configuration files as first-class code artifacts. All configuration changes go through the same processes as code: version control, peer review, testing, and automated deployment. This includes infrastructure definitions (Terraform, CloudFormation), application configs, deployment manifests, and platform settings.

## Prerequisites

- Version control systems (Git)
- Infrastructure as Code concepts
- CI/CD pipeline knowledge
- Testing principles
- YAML/JSON/HCL syntax

## Core Competencies

- Infrastructure definition (Terraform, CloudFormation)
- Kubernetes manifests
- GitOps workflows
- Config templating
- Environment promotion
- Drift detection
- Config validation pipelines

## Implementation

```python
import os
import hashlib
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field
from pathlib import Path
import json
import yaml
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

@dataclass
class ConfigChange:
    file: str
    change_type: str
    old_value: Any = None
    new_value: Any = None
    author: str = ""
    timestamp: str = ""
    commit_sha: str = ""

@dataclass
class ConfigVersion:
    sha: str
    timestamp: datetime
    author: str
    changes: List[ConfigChange]
    message: str

class ConfigVersionControl:
    def __init__(self, repo_path: str):
        self.repo_path = Path(repo_path)
        self.versions: List[ConfigVersion] = []
        self.current_sha: Optional[str] = None

    def init_repo(self):
        os.system(f"git init {self.repo_path}")
        os.system(f"cd {self.repo_path} && git config user.name 'Config Manager'")

    def stage(self, files: List[str]):
        for f in files:
            os.system(f"cd {self.repo_path} && git add {f}")

    def commit(self, message: str, author: str = "system") -> str:
        os.system(f"cd {self.repo_path} && git config user.name '{author}'")
        os.system(f"cd {self.repo_path} && git commit -m '{message}'")
        sha = self._get_current_sha()
        self.current_sha = sha
        return sha

    def _get_current_sha(self) -> str:
        result = os.popen(f"cd {self.repo_path} && git rev-parse HEAD").read().strip()
        return result

    def diff(self, sha1: str, sha2: str = None) -> Dict[str, Any]:
        sha2 = sha2 or self.current_sha
        os.system(f"cd {self.repo_path} && git diff {sha1} {sha2} > /tmp/diff.txt")
        diff_content = Path("/tmp/diff.txt").read_text()
        return {"diff": diff_content}

    def rollback(self, target_sha: str):
        os.system(f"cd {self.repo_path} && git revert --no-commit {target_sha}")
        os.system(f"cd {self.repo_path} && git commit -m 'Rollback to {target_sha}'")

class ConfigTemplateEngine:
    def __init__(self):
        self.templates: Dict[str, str] = {}
        self.variables: Dict[str, Any] = {}

    def add_template(self, name: str, template: str):
        self.templates[name] = template

    def set_variables(self, variables: Dict[str, Any]):
        self.variables.update(variables)

    def render(self, template_name: str) -> str:
        template = self.templates.get(template_name, "")
        result = template
        for key, value in self.variables.items():
            result = result.replace(f"${{{key}}}", str(value))
            result = result.replace(f"${key}", str(value))
        return result

    def render_file(self, template_path: str, output_path: str):
        template = Path(template_path).read_text()
        rendered = self._render_template(template)
        Path(output_path).write_text(rendered)

    def _render_template(self, template: str) -> str:
        result = template
        import re
        for match in re.finditer(r"\$\{(\w+)(?:\|(\w+))?\}", template):
            key = match.group(1)
            default = match.group(2) if match.group(2) else ""
            value = str(self.variables.get(key, default))
            result = result.replace(match.group(0), value)
        return result

class EnvironmentPromoter:
    def __init__(self, config_dir: str):
        self.environments = ["dev", "staging", "production"]
        self.config_dir = Path(config_dir)
        self.promotion_history: List[Dict] = []

    def promote(self, config_name: str, from_env: str, to_env: str):
        source = self.config_dir / from_env / config_name
        dest = self.config_dir / to_env / config_name

        if not source.exists():
            raise FileNotFoundError(f"Config not found: {source}")

        config = self._load_config(source)
        modified_config = self._apply_env_overrides(config, to_env)
        dest.parent.mkdir(parents=True, exist_ok=True)
        self._save_config(dest, modified_config)

        self.promotion_history.append({
            "config": config_name,
            "from": from_env,
            "to": to_env,
            "timestamp": datetime.now().isoformat()
        })

    def _load_config(self, path: Path) -> Dict:
        if path.suffix == '.json':
            return json.loads(path.read_text())
        elif path.suffix in ['.yaml', '.yml']:
            return yaml.safe_load(path.read_text())
        return {}

    def _save_config(self, path: Path, config: Dict):
        if path.suffix == '.json':
            path.write_text(json.dumps(config, indent=2))
        else:
            path.write_text(yaml.dump(config))

    def _apply_env_overrides(self, config: Dict, env: str) -> Dict:
        override_file = self.config_dir / f"{env}_overrides.{config.get('format', 'yaml')}"
        if override_file.exists():
            overrides = self._load_config(override_file)
            config.update(overrides)
        return config

class ConfigValidator:
    def __init__(self):
        self.errors: List[str] = []
        self.warnings: List[str] = []

    def validate_syntax(self, config: Dict, format: str = "yaml") -> bool:
        self.errors = []
        if format == "json":
            try:
                json.dumps(config)
            except json.JSONDecodeError as e:
                self.errors.append(f"Invalid JSON: {e}")
        elif format == "yaml":
            try:
                yaml.safe_load(yaml.dump(config))
            except yaml.YAMLError as e:
                self.errors.append(f"Invalid YAML: {e}")
        return len(self.errors) == 0

    def validate_schema(self, config: Dict, schema: Dict) -> bool:
        self.errors = []
        required = schema.get("required", [])
        properties = schema.get("properties", {})

        for field in required:
            if field not in config:
                self.errors.append(f"Missing required field: {field}")

        for field, expected_type in properties.items():
            if field in config:
                actual_type = type(config[field]).__name__
                if expected_type == "array" and not isinstance(config[field], list):
                    self.errors.append(f"Field {field} should be array")
                elif expected_type == "object" and not isinstance(config[field], dict):
                    self.errors.append(f"Field {field} should be object")

        return len(self.errors) == 0

    def validate_constraints(self, config: Dict, constraints: Dict) -> bool:
        self.errors = []
        for field, rules in constraints.items():
            if field in config:
                value = config[field]
                if "min" in rules and value < rules["min"]:
                    self.errors.append(f"{field} value {value} below minimum {rules['min']}")
                if "max" in rules and value > rules["max"]:
                    self.errors.append(f"{field} value {value} above maximum {rules['max']}")
                if "pattern" in rules:
                    import re
                    if not re.match(rules["pattern"], str(value)):
                        self.errors.append(f"{field} value does not match pattern")
        return len(self.errors) == 0

class ConfigChangeDetector:
    def __init__(self, baseline_dir: str):
        self.baseline_dir = Path(baseline_dir)
        self.baseline_configs: Dict[str, Dict] = {}

    def capture_baseline(self):
        for config_file in self.baseline_dir.rglob("*.{json,yaml,yml}"):
            relative_path = str(config_file.relative_to(self.baseline_dir))
            self.baseline_configs[relative_path] = self._load_config(config_file)

    def _load_config(self, path: Path) -> Dict:
        if path.suffix == '.json':
            return json.loads(path.read_text())
        return yaml.safe_load(path.read_text())

    def detect_drift(self, current_dir: str) -> List[Dict]:
        drifts = []
        current_path = Path(current_dir)

        for relative_path, baseline in self.baseline_configs.items():
            current_file = current_path / relative_path
            if not current_file.exists():
                drifts.append({
                    "file": relative_path,
                    "type": "deleted",
                    "baseline": baseline
                })
                continue

            current = self._load_config(current_file)
            if baseline != current:
                drifts.append({
                    "file": relative_path,
                    "type": "modified",
                    "baseline": baseline,
                    "current": current
                })

        return drifts
```

## Use Cases

- Infrastructure automation with Terraform
- Kubernetes manifest management
- GitOps workflows
- Multi-environment config promotion
- Configuration drift detection
- Audit trail for config changes

## Artifacts

- `ConfigVersionControl`: Git-based config versioning
- `ConfigTemplateEngine`: Template rendering
- `EnvironmentPromoter`: Multi-env config promotion
- `ConfigValidator`: Syntax and schema validation
- `ConfigChangeDetector`: Drift detection

## Related Skills

- Infrastructure as Code
- GitOps
- CI/CD Integration
- Environment Management
- Terraform
- Kubernetes
