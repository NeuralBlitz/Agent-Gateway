---
name: github-actions
description: GitHub Actions CI/CD best practices and patterns
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: devops
---
## What I do
- Create efficient GitHub Actions workflows
- Use appropriate triggers and conditions
- Implement caching for faster builds
- Write matrix strategies for multi-platform testing
- Handle secrets securely
- Use concurrency groups to cancel outdated runs
- Follow security best practices

## When to use me
When creating or modifying GitHub Actions workflows.

## CI Workflow
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  PYTHON_VERSION: '3.11'
  POETRY_VERSION: '1.5.1'

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          cache: 'pip'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install black isort mypy

      - name: Check formatting
        run: |
          black --check .
          isort --check-only .

      - name: Type checking
        run: mypy src/

  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.10', '3.11', '3.12']
        os: [ubuntu-latest, macos-latest]
        exclude:
          - python-version: '3.12'
            os: 'macos-latest'
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python ${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
          cache: 'pip'

      - name: Install dependencies
        run: |
          pip install -e ".[test]"

      - name: Run tests
        run: pytest --cov=src --cov-report=xml

      - name: Upload coverage
        if: matrix.os == 'ubuntu-latest' && matrix.python-version == '3.11'
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t ghcr.io/${{ github.repository }}:${{ github.sha }} .

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Push Docker image
        run: |
          docker push ghcr.io/${{ github.repository }}:${{ github.sha }}
          docker tag ghcr.io/${{ github.repository }}:${{ github.sha }} ghcr.io/${{ github.repository }}:latest
          docker push ghcr.io/${{ github.repository }}:latest
```

## Security Best Practices
- Use OpenID Connect for cloud authentication
- Store secrets in GitHub Secrets, never in code
- Pin action versions to commit SHAs
- Use least-privilege for permissions
- Audit dependencies with Dependabot
- Scan for vulnerabilities with CodeQL

## Reusable Workflows
```yaml
# .github/workflows/reusable-test.yml
on:
  workflow_call:
    inputs:
      python-version:
        required: true
        type: string
      codecov-token:
        required: false
        type: string
    secrets:
      PYPI_TOKEN:
        required: false

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python ${{ inputs.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: ${{ inputs.python-version }}
      - name: Run tests
        run: pytest
      - name: Upload to Codecov
        if: inputs.codecov-token
        uses: codecov/codecov-action@v3
        with:
          token: ${{ inputs.codecov-token }}
```
