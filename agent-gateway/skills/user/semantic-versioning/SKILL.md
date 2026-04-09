---
name: semantic-versioning
description: Semantic versioning and changelog management
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: development
---
## What I do
- Apply semantic versioning rules
- Create changelog entries
- Manage version branches
- Handle breaking changes
- Automate releases
- Generate release notes
- Handle pre-release versions
- Communicate changes

## When to use me
When managing versions, creating releases, or writing changelogs.

## Semantic Versioning
```
MAJOR.MINOR.PATCH

MAJOR - Breaking changes (incompatible API changes)
MINOR - New features (backward-compatible)
PATCH - Bug fixes (backward-compatible)

Examples:
1.0.0 - Initial release
1.0.1 - Bug fix
1.1.0 - New feature (backward compatible)
2.0.0 - Breaking change

Pre-release:
1.0.0-alpha      - Alpha version
1.0.0-beta       - Beta version
1.0.0-rc.1       - Release candidate

Build metadata:
1.0.0+build.123  - Build number
```

## Version Rules
```
Breaking Changes (MAJOR bump):
- Remove endpoint
- Change field type
- Remove required parameter
- Change authentication
- Change response format

New Features (MINOR bump):
- Add endpoint
- Add optional parameter
- Add new field (optional)
- Deprecate old feature

Bug Fixes (PATCH bump):
- Fix incorrect behavior
- Fix security vulnerability
- Improve performance
- Add missing validation
```

## Changelog Format
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [2.0.0] - 2024-01-15

### Added
- User profile API endpoints (#123)
- Multi-factor authentication support (#456)
- Rate limiting for API (#789)

### Changed
- Updated authentication flow to require email verification (#234)
- Changed default pagination to 20 items per page (#567)

### Deprecated
- `GET /api/v1/legacy` will be removed in v3.0.0

### Removed
- Removed deprecated `/api/v1/old-login` endpoint
- Removed XML response format support

### Fixed
- Fixed memory leak in connection pool (#890)
- Fixed race condition in user creation (#901)

### Security
- Upgraded dependencies to patch CVE-2024-1234
- Added rate limiting to prevent brute force attacks

## [1.1.0] - 2023-12-01

### Added
- Search functionality for products (#111)
- Export data to CSV format (#222)

## [1.0.0] - 2023-11-01

### Initial Release
- Core API functionality
- User authentication
- Basic CRUD operations
```

## Automated Versioning
```python
import subprocess
from dataclasses import dataclass
from typing import Optional
from datetime import datetime


@dataclass
class Version:
    major: int
    minor: int
    patch: int
    prerelease: Optional[str] = None
    build: Optional[str] = None
    
    def __str__(self) -> str:
        v = f"{self.major}.{self.minor}.{self.patch}"
        if self.prerelease:
            v += f"-{self.prerelease}"
        if self.build:
            v += f"+{self.build}"
        return v
    
    def bump_major(self) -> 'Version':
        return Version(
            major=self.major + 1,
            minor=0,
            patch=0,
        )
    
    def bump_minor(self) -> 'Version':
        return Version(
            major=self.major,
            minor=self.minor + 1,
            patch=0,
        )
    
    def bump_patch(self) -> 'Version':
        return Version(
            major=self.major,
            minor=self.minor,
            patch=self.patch + 1,
        )


def get_current_version() -> Version:
    """Get current version from git tags."""
    try:
        result = subprocess.run(
            ['git', 'describe', '--tags', '--abbrev=0'],
            capture_output=True,
            text=True,
            check=True,
        )
        tag = result.stdout.strip()
        return parse_version(tag)
    except subprocess.CalledProcessError:
        return Version(0, 1, 0)


def parse_version(version_str: str) -> Version:
    """Parse version string to Version object."""
    version_str = version_str.strip()
    
    # Handle build metadata
    if '+' in version_str:
        version_str, build = version_str.split('+')
    else:
        build = None
    
    # Handle pre-release
    prerelease = None
    if '-' in version_str:
        version_str, prerelease = version_str.split('-')
    
    # Parse version numbers
    parts = version_str.split('.')
    major = int(parts[0])
    minor = int(parts[1]) if len(parts) > 1 else 0
    patch = int(parts[2]) if len(parts) > 2 else 0
    
    return Version(major, minor, patch, prerelease, build)


def determine_next_version(
    current_version: Version,
    change_types: list[str]
) -> Version:
    """Determine next version based on changes."""
    if 'breaking' in change_types:
        return current_version.bump_major()
    elif 'feature' in change_types:
        return current_version.bump_minor()
    elif 'fix' in change_types:
        return current_version.bump_patch()
    else:
        return current_version
```

## Git Commits Convention
```
feat: New feature
fix: Bug fix
docs: Documentation only
style: Formatting, no code change
refactor: Code refactoring
test: Adding tests
chore: Maintenance

BREAKING CHANGE: in footer or body

Examples:
feat(auth): add OAuth2 login support

fix(database): resolve connection leak
→ closes #123

docs: update installation guide

feat!: remove deprecated API
BREAKING CHANGE: The old API has been removed.
Use the new /api/v2/ endpoints instead.
```

## Release Workflow
```bash
#!/bin/bash
# release.sh

set -e

VERSION=$1

# Verify version format
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Invalid version: $VERSION"
    echo "Use format: MAJOR.MINOR.PATCH"
    exit 1
fi

echo "Releasing version $VERSION"

# Update version in files
sed -i "s/version =.*/version = \"$VERSION\"/" pyproject.toml
sed -i "s/VERSION =.*/VERSION = \"$VERSION\"/" src/package/__init__.py

# Generate changelog
git-changelog --version $VERSION > CHANGELOG.md

# Commit changes
git add -A
git commit -m "Release version $VERSION"

# Create tag
git tag -a v$VERSION -m "Release v$VERSION"

# Push
git push origin main --tags

echo "Release v$VERSION complete!"
```

## Version Compatibility
```python
from typing import Dict, List, Optional


class APIVersion:
    """API version with compatibility."""
    
    def __init__(
        self,
        version: str,
        status: str,  # experimental, beta, stable, deprecated
        deprecation_date: Optional[str] = None,
        breaking_changes: List[str] = None,
    ) -> None:
        self.version = version
        self.status = status
        self.deprecation_date = deprecation_date
        self.breaking_changes = breaking_changes or []
    
    def is_compatible_with(self, other: 'APIVersion') -> bool:
        """Check if version is compatible."""
        if self.major != other.major:
            return False
        return True
    
    @property
    def major(self) -> int:
        return int(self.version.split('.')[0])


class VersionManager:
    """Manage API versions."""
    
    def __init__(self) -> None:
        self.versions: Dict[str, APIVersion] = {}
    
    def add_version(
        self,
        version: str,
        status: str,
        deprecation_date: Optional[str] = None,
    ) -> None:
        """Add API version."""
        self.versions[version] = APIVersion(
            version=version,
            status=status,
            deprecation_date=deprecation_date,
        )
    
    def is_supported(self, version: str) -> bool:
        """Check if version is still supported."""
        if version not in self.versions:
            return False
        
        v = self.versions[version]
        return v.status not in ['deprecated', 'sunset']
    
    def get_latest(self) -> str:
        """Get latest stable version."""
        stable = [
            v for v in self.versions.values()
            if v.status == 'stable'
        ]
        return max(stable, key=lambda v: v.major).version
    
    def should_upgrade(self, current: str, latest: str) -> bool:
        """Recommend upgrade if current is too old."""
        current_v = self.versions.get(current)
        latest_v = self.versions.get(latest)
        
        if not current_v or not latest_v:
            return False
        
        return (
            latest_v.major > current_v.major or
            (latest_v.major == current_v.major and
             latest_v.minor - current_v.minor > 2)
        )
```

## Best Practices
```
1. Use semantic versioning
   - Clear rules for when to bump version
   - Communicates change impact

2. Document all changes
   - Changelog is essential
   - Be specific about changes

3. Use conventional commits
   - Automated changelog generation
   - Clear commit messages

4. Tag releases
   - Git tags for every release
   - Tag format: v1.0.0

5. Support multiple versions
   - Backward compatibility when possible
   - Clear deprecation timeline

6. Automate releases
   - Reduce human error
   - Consistent process

7. Communicate changes
   - Release notes for users
   - Migration guides for breaking changes

8. Review before release
   - Change review process
   - Security scan
   - Performance regression test
```
