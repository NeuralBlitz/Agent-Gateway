---
name: code-quality
description: Code quality metrics and improvement strategies
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: code-quality
---
## What I do
- Measure code quality
- Identify code smells
- Implement quality gates
- Use static analysis
- Track technical debt
- Improve code maintainability
- Set quality standards
- Automate quality checks

## When to use me
When improving code quality or establishing standards.

## Quality Metrics
```
Cyclomatic Complexity:
- McCabe complexity measurement
- Target: < 10 per function
- Alert: > 20

Code Coverage:
- Unit test coverage
- Target: 80%+
- Critical paths: 100%

Technical Debt:
- SonarQube or CodeClimate
- Track and prioritize
- Allocate refactoring time

Code Review:
- PR size limits
- Required reviewers
- Automated checks
```

## Quality Gates
```yaml
# quality-gates.yml
checks:
  complexity:
    max_complexity: 10
    paths:
      - src/**/*.py
  
  coverage:
    min_coverage: 80
    paths:
      - src/**/*.py
  
  duplication:
    max_duplication: 3
    min_lines: 10
  
  security:
    enabled: true
    tools:
      - bandit
      - safety
      - semgrep
```
