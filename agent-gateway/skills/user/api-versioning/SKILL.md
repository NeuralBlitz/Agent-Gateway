# API Versioning

**Category:** API Design  
**Skill Level:** Intermediate  
**Domain:** API Design, Software Lifecycle, Backend Development

## Overview

API Versioning is the practice of managing changes to application programming interfaces while maintaining backward compatibility for existing consumers. It enables API providers to evolve their interfaces, add features, and deprecate old functionality without breaking existing client applications that depend on the API.

## Description

API Versioning is essential for maintaining the delicate balance between API evolution and stability. As applications grow and requirements change, APIs must adapt to support new features, improved data structures, and enhanced functionality. Without a systematic approach to versioning, any change to an API could potentially break client applications, leading to service disruptions, developer frustration, and potential business losses.

The primary strategies for API versioning include URI path versioning (e.g., /api/v1/resource, /api/v2/resource), query parameter versioning (e.g., /api/resource?version=2), header-based versioning (e.g., Accept: application/vnd.api.v2+json), and media type versioning through content negotiation. Each approach has distinct advantages: URI path versioning is highly visible and cache-friendly, header-based versioning keeps URIs clean, while query parameter versioning offers flexibility for optional version selection.

Effective API versioning requires careful planning of version lifecycle including deprecation policies, migration timelines, and sunset periods. Semantic versioning for APIs (major.minor.patch) helps communicate the nature of changes, where major versions indicate breaking changes, minor versions add functionality in a backward-compatible manner, and patch versions make backward-compatible bug fixes. Organizations typically maintain multiple active versions simultaneously, supporting older versions while encouraging migration to newer releases through documentation, client SDKs, and deprecation warnings.

## Prerequisites

- Strong understanding of RESTful API design principles
- Familiarity with HTTP protocols and content negotiation
- Knowledge of semantic versioning concepts
- Understanding of deprecation strategies and migration patterns

## Core Competencies

- Selecting appropriate versioning strategies for different API types
- Implementing URI path, header, and query parameter versioning
- Managing multiple concurrent API versions in production
- Designing deprecation policies and migration timelines
- Documenting version-specific behaviors and changes
- Implementing version selection in API gateways and client libraries

## Implementation

```python
from dataclasses import dataclass
from typing import Dict, Any, Optional
from enum import Enum
import re

class Version:
    def __init__(self, major: int, minor: int = 0, patch: int = 0):
        self.major = major
        self.minor = minor
        self.patch = patch
    
    def __str__(self) -> str:
        return f"v{self.major}.{self.minor}.{self.patch}"

@dataclass
class APIVersion:
    version: Version
    deprecation_date: Optional[str] = None
    sunset_date: Optional[str] = None
    docs_url: Optional[str] = None

class VersioningStrategy(Enum):
    URI_PATH = "uri_path"
    HEADER = "header"
    QUERY_PARAM = "query_param"
    CONTENT_NEGOTIATION = "content_negotiation"

class APIVersionManager:
    def __init__(self, default_version: Version = Version(1)):
        self.versions: Dict[str, APIVersion] = {}
        self.default_version = default_version
        self.strategy = VersioningStrategy.URI_PATH
    
    def register_version(self, version: APIVersion):
        self.versions[str(version.version)] = version
    
    def parse_version_from_uri(self, uri: str) -> tuple[Version, str]:
        match = re.match(r'/api/v(\d+)(/.*)?', uri)
        if match:
            major = int(match.group(1))
            path = match.group(2) or ""
            return Version(major), path
        return self.default_version, uri
    
    def is_version_deprecated(self, version: Version) -> bool:
        version_str = str(version)
        if version_str in self.versions:
            return self.versions[version_str].deprecation_date is not None
        return False
    
    def get_deprecation_warning(self, version: Version) -> Optional[str]:
        version_str = str(version)
        if version_str in self.versions:
            v = self.versions[version_str]
            if v.deprecation_date:
                return f"API version {version} is deprecated. See {v.docs_url}."
        return None

version_manager = APIVersionManager(Version(1))
```

## Use Cases

- Evolving APIs while maintaining backward compatibility for existing clients
- Supporting multiple client versions during gradual migration periods
- A/B testing new API features with specific version cohorts
- Maintaining legacy API support for enterprise customers
- Rolling out breaking changes with controlled rollbacks

## Artifacts

- API version migration guides
- OpenAPI specification files per version
- Version deprecation notice templates
- Client SDKs targeting specific API versions
- Version lifecycle management policies

## Related Skills

- API Design
- Semantic Versioning
- Backwards Compatibility
- API Gateway Pattern
- Deprecation Strategies
