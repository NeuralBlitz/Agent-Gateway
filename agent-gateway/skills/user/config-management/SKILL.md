# Config Management

## Overview

Config Management encompasses the practices, tools, and patterns for managing application configuration across different environments, deployments, and runtime contexts. It includes configuration loading, environment-specific overrides, secret management, dynamic configuration updates, and configuration versioning.

## Description

Effective configuration management separates configuration from code, enabling deployments across multiple environments without code changes. It handles environment variables, configuration files, feature flags, secrets, and dynamic configuration updates. Modern approaches treat configuration as versioned, auditable data with proper access controls and validation.

## Prerequisites

- Environment management concepts
- Secret management patterns
- File I/O operations
- Validation techniques
- Security best practices

## Core Competencies

- Multi-environment configuration
- Environment variable handling
- Secret encryption and storage
- Configuration validation
- Dynamic config updates
- Configuration versioning
- Hierarchical config merging

## Implementation

```python
import os
import json
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field
from pathlib import Path
import yaml
import logging

logger = logging.getLogger(__name__)

@dataclass
class ConfigSource:
    priority: int
    data: Dict[str, Any]

@dataclass
class ConfigEntry:
    key: str
    value: Any
    source: str
    encrypted: bool = False

class ConfigLoader:
    def __init__(self):
        self.sources: List[ConfigSource] = []
        self.cache: Dict[str, Any] = {}

    def add_file(self, path: str, priority: int = 0):
        suffix = Path(path).suffix.lower()
        data = {}
        if suffix == '.json':
            data = json.loads(Path(path).read_text())
        elif suffix in ['.yaml', '.yml']:
            data = yaml.safe_load(Path(path).read_text())
        elif suffix == '.env':
            data = self._parse_env_file(path)
        self.sources.append(ConfigSource(priority=priority, data=data))
        self._rebuild_cache()

    def _parse_env_file(self, path: str) -> Dict[str, str]:
        data = {}
        for line in Path(path).read_text().splitlines():
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                data[key.strip()] = value.strip().strip('"')
        return data

    def _rebuild_cache(self):
        sorted_sources = sorted(self.sources, key=lambda s: s.priority)
        self.cache = {}
        for source in sorted_sources:
            self.cache.update(source.data)

    def get(self, key: str, default: Any = None) -> Any:
        return self.cache.get(key, default)

    def get_required(self, key: str) -> Any:
        if key not in self.cache:
            raise ValueError(f"Required config key not found: {key}")
        return self.cache[key]

    def get_section(self, section: str) -> Dict[str, Any]:
        prefix = f"{section}."
        return {k[len(prefix):]: v for k, v in self.cache.items() if k.startswith(prefix)}

class SecretManager:
    def __init__(self, encryption_key: Optional[bytes] = None):
        self.secrets: Dict[str, str] = {}
        self.encryption_key = encryption_key

    def set_secret(self, key: str, value: str):
        if self.encryption_key:
            value = self._encrypt(value, self.encryption_key)
        self.secrets[key] = value

    def get_secret(self, key: str) -> Optional[str]:
        value = self.secrets.get(key)
        if value and self.encryption_key:
            value = self._decrypt(value, self.encryption_key)
        return value

    def _encrypt(self, value: str, key: bytes) -> str:
        import base64
        return base64.b64encode(value.encode()).decode()

    def _decrypt(self, value: str, key: bytes) -> str:
        import base64
        return base64.b64decode(value.encode()).decode()

class ConfigValidator:
    SCHEMA_TYPES = {
        'string': str,
        'integer': int,
        'float': float,
        'boolean': bool,
        'list': list,
        'dict': dict,
    }

    def __init__(self, schema: Dict[str, Any]):
        self.schema = schema

    def validate(self, config: Dict[str, Any]) -> List[str]:
        errors = []
        for key, rules in self.schema.items():
            if 'required' in rules and rules['required'] and key not in config:
                errors.append(f"Missing required config: {key}")
                continue
            if key in config:
                value = config[key]
                expected_type = rules.get('type')
                if expected_type and expected_type not in self.SCHEMA_TYPES:
                    errors.append(f"Unknown type for {key}: {expected_type}")
                elif expected_type and not isinstance(value, self.SCHEMA_TYPES[expected_type]):
                    errors.append(f"Type mismatch for {key}: expected {expected_type}, got {type(value).__name__}")
                if 'pattern' in rules and isinstance(value, str):
                    import re
                    if not re.match(rules['pattern'], value):
                        errors.append(f"Pattern mismatch for {key}")
                if 'min' in rules and isinstance(value, (int, float)) and value < rules['min']:
                    errors.append(f"Value too small for {key}")
                if 'max' in rules and isinstance(value, (int, float)) and value > rules['max']:
                    errors.append(f"Value too large for {key}")
        return errors

class ConfigManager:
    def __init__(self):
        self.loader = ConfigLoader()
        self.secrets = SecretManager()
        self.validators: List[ConfigValidator] = []
        self._callbacks: List[callable] = []

    def load(self, config_paths: List[str]):
        for path in config_paths:
            if os.path.isfile(path):
                self.loader.add_file(path)
            elif os.path.isdir(path):
                for f in Path(path).glob('*.{json,yaml,yml,env}'):
                    self.loader.add_file(str(f))
        self._notify_callbacks()

    def add_validator(self, schema: Dict[str, Any]):
        self.validators.append(ConfigValidator(schema))

    def validate_all(self) -> bool:
        all_errors = []
        for validator in self.validators:
            errors = validator.validate(self.loader.cache)
            all_errors.extend(errors)
        if all_errors:
            logger.error(f"Configuration validation errors: {all_errors}")
            return False
        return True

    def on_update(self, callback: callable):
        self._callbacks.append(callback)

    def _notify_callbacks(self):
        for callback in self._callbacks:
            try:
                callback(self.loader.cache)
            except Exception as e:
                logger.error(f"Config callback error: {e}")

    def get(self, key: str, default: Any = None) -> Any:
        value = self.loader.get(key, default)
        if key in self.secrets.secrets:
            value = self.secrets.get_secret(key)
        return value

    def section(self, name: str) -> Dict[str, Any]:
        return self.loader.get_section(name)
```

## Use Cases

- Multi-environment deployments (dev, staging, prod)
- Secret and credential management
- Feature flag configuration
- Configuration hot-reloading
- Configuration validation in CI/CD

## Artifacts

- `ConfigLoader`: Multi-source configuration loading
- `SecretManager`: Encrypted secret storage
- `ConfigValidator`: Schema-based validation
- `ConfigManager`: Unified configuration interface

## Related Skills

- Environment Management
- Secret Management
- Configuration as Code
- Secret Rotation
- Dynamic Configuration
