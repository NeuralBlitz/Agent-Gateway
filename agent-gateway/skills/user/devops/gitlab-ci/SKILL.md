---
name: gitlab-ci
description: GitLab's built-in CI/CD platform using YAML configuration for pipeline automation
category: devops
---

# GitLab CI/CD

## What I Do

I am GitLab's integrated CI/CD platform that automates building, testing, and deploying your code. I use YAML configuration files to define pipelines, with tight integration into GitLab's repository, issue tracking, and deployment features.

## When to Use Me

- Projects hosted on GitLab
- Requiring native container registry integration
- Using GitLab for both source control and CI/CD
- Implementing Auto DevOps
- Kubernetes-native deployments
- Security scanning in the pipeline
- Multi-project pipeline dependencies

## Core Concepts

- **.gitlab-ci.yml**: Pipeline configuration file
- **Jobs**: Smallest units of execution
- **Pipelines**: Collection of jobs grouped into stages
- **Stages**: Groups of jobs that run in parallel
- **Runners**: Executors that run jobs
- **Artifacts**: Files passed between stages
- **Cache**: Preserved files between runs
- **Variables**: Environment variables for jobs
- **Rules**: Conditional job execution
- **Include**: External YAML configuration
- **Templates**: Reusable job definitions

## Code Examples

**Basic .gitlab-ci.yml:**
```yaml
stages:
  - build
  - test
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: ""
  MAVEN_OPTS: "-Dmaven.repo.local=$CI_PROJECT_DIR/.m2/repository"

build:
  stage: build
  image: maven:3.8.6-openjdk-17
  script:
    - mvn clean compile -DskipTests
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - .m2/repository
  artifacts:
    paths:
      - target/
    expire_in: 1 hour

test:
  stage: test
  image: maven:3.8.6-openjdk-17
  script:
    - mvn test
  coverage: '/Total.*?([0-9]{1,3})%/'
  artifacts:
    reports:
      junit: target/surefire-reports/*.xml
      coverage_report:
        coverage_format: cobertura
        path: target/site/jacoco/jacoco.xml

integration-test:
  stage: test
  image: maven:3.8.6-openjdk-17
  services:
    - postgres:14
  variables:
    POSTGRES_DB: testdb
    POSTGRES_USER: testuser
    POSTGRES_PASSWORD: testpass
  script:
    - mvn verify -Pintegration-tests
  artifacts:
    reports:
      junit: target/failsafe-reports/*.xml

deploy_staging:
  stage: deploy
  environment:
    name: staging
    url: https://staging.example.com
  script:
    - helm upgrade --install myapp ./chart --namespace staging --values ./values-staging.yaml
  only:
    - develop

deploy_production:
  stage: deploy
  environment:
    name: production
    url: https://example.com
  script:
    - helm upgrade --install myapp ./chart --namespace production --values ./values-prod.yaml
  when: manual
  only:
    - main
```

**Advanced Matrix Builds:**
```yaml
stages:
  - build
  - test
  - deploy

variables:
  DOCKER_REGISTRY: registry.example.com

build:
  stage: build
  image: docker:20.10
  services:
    - docker:20.10-dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  only:
    changes:
      - Dockerfile
      - src/**/*

.test_template: &test_template
  stage: test
  script:
    - npm ci
    - npm test
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      junit: junit.xml

test:linux:
  <<: *test_template
  image: node:18-alpine
  tags:
    - linux

test:macos:
  <<: *test_template
  tags:
    - macos
  before_script:
    - brew install node@18

test:windows:
  <<: *test_template
  tags:
    - windows
  only:
    changes:
      - "**/*.ts"
      - "package.json"
```

**Auto DevOps with Customization:**
```yaml
include:
  - template: Auto-DevOps.gitlab-ci.yml

variables:
  AUTO_DEVOPS_BUILD_IMAGE: Dockerfile
  AUTO_DEVOPS_BUILD_STRATEGY: docker
  DOCKER_DRIVER: overlay2
  KUBERNETES_VERSION: "1.25"
  HELM_VERSION: "3.10"

stages:
  - build
  - test
  - deploy

test:unit:
  extends: .test:unit
  allow_failure: false

test:integration:
  extends: .test:integration
  services:
    - postgres:14
    - redis:7
  variables:
    POSTGRES_DB: test
    DATABASE_URL: "postgresql://test:test@postgres:5432/test"
    REDIS_URL: "redis://redis:6379"
  after_script:
    - echo "Running additional cleanup"

review:
  environment:
    name: review/$CI_COMMIT_REF_NAME
    url: https://$CI_ENVIRONMENT_SLUG.example.com
    on_stop: stop_review
  script:
    - helm upgrade --install myapp ./chart
      --namespace $CI_ENVIRONMENT_SLUG
      --set image.tag=$CI_COMMIT_SHA
      --set replicaCount=1
  when: manual

stop_review:
  stage: deploy
  variables:
    GIT_STRATEGY: none
  script:
    - helm uninstall myapp --namespace $CI_ENVIRONMENT_SLUG || true
  environment:
    name: review/$CI_COMMIT_REF_NAME
    action: stop
  when: manual
```

**Pipeline with Dependencies:**
```yaml
stages:
  - build
  - test
  - package
  - deploy

build:library:
  stage: build
  script:
    - make build-library
  artifacts:
    paths:
      - dist/
      - package.json
  rules:
    - if: $CI_COMMIT_TAG
    - if: $CI_MERGE_REQUEST_IID
      changes:
        - library/**/*

build:service:
  stage: build
  script:
    - make build-service
  dependencies:
    - build:library
  artifacts:
    paths:
      - bin/
  rules:
    - if: $CI_COMMIT_TAG
    - if: $CI_MERGE_REQUEST_IID
      changes:
        - service/**/*

package:docker:
  stage: package
  image: docker:20.10
  services:
    - docker:20.10-dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA ./service
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  dependencies:
    - build:service

deploy:prod:
  stage: deploy
  environment: production
  script:
    - kubectl set image deployment/myapp myapp=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  only:
    - main
```

## Best Practices

1. **Use extends for DRY configs** - Avoid duplication with YAML anchors
2. **Implement proper caching** - Speed up build times significantly
3. **Use rules for conditional execution** - Only run necessary jobs
4. **Include external templates** - Share configurations across projects
5. **Set appropriate timeouts** - Prevent stuck jobs
6. **Use artifacts for outputs** - Pass files between stages
7. **Implement security scanning** - SAST, DAST, dependency scanning
8. **Use environments for deployments** - Track deployments visually
9. **Keep pipelines fast** - Parallelize, cache, optimize scripts
10. **Document pipeline structure** - Comments for complex logic
