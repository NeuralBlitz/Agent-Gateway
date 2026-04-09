---
name: gitlab-ci
description: GitLab CI/CD for automated building, testing, and deploying applications
license: MIT
compatibility:
  - gitlab
  - gitlab-ee
  - gitlab-runner
audience: DevOps engineers, CI/CD specialists, software developers
category: devops
---

# GitLab CI/CD

## What I Do

I provide expertise in GitLab CI/CD - the continuous integration and deployment platform integrated directly into GitLab. I cover `.gitlab-ci.yml` configuration, pipelines for various application types, integration with Kubernetes and cloud services, security scanning, and deployment strategies. GitLab CI provides a unified platform for the entire DevOps lifecycle from code to production.

## When to Use Me

- Setting up automated testing and building pipelines in GitLab
- Implementing multi-stage deployment workflows to various environments
- Integrating security scanning and compliance checks into CI/CD
- Deploying applications to Kubernetes, cloud platforms, or traditional servers
- Managing environment-specific configurations and secrets
- Implementing merge request workflows with pipeline validations
- Building and publishing container images to registries
- Creating reusable CI/CD templates across projects
- Setting up review apps and canary deployments
- Automating infrastructure provisioning with IaC

## Core Concepts

- **Pipeline**: Collection of stages executed in sequence or parallel
- **Stage**: Group of jobs running in parallel
- **Job**: Smallest unit of execution, running in a runner
- **Runner**: Agent executing jobs, can be shared or specific
- **.gitlab-ci.yml**: Pipeline configuration file in repository root
- **Artifacts**: Files passed between stages and preserved after job
- **Cache**: Preserved files between pipeline runs for speed
- **Variables**: Environment variables for pipeline customization
- **Keywords**: Directives controlling pipeline behavior (image, services, before_script)
- **Rules**: Conditional job execution based on variables, files, or branches
- **Include**: Reusing configuration from external files or templates
- **Extends**: Inheritance-like mechanism for job configuration
- **Environment**: Deployment targets with tracking and rollbacks
- **Protected**: Restricted access for runners, variables, and environments
- **Auto DevOps**: Pre-configured pipeline with build, test, deploy, and security

## Code Examples

### Comprehensive .gitlab-ci.yml

```yaml
variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"
  KUBECONFIG: "${KUBECONFIG_SECRET}"
  
  # App Configuration
  APP_NAME: "api-service"
  APP_VERSION: "${CI_COMMIT_TAG:-${CI_COMMIT_SHA}}"
  DOCKER_REGISTRY: "registry.gitlab.com"
  HELM_RELEASE_NAME: "api-service"
  
  # Cache Configuration
  MAVEN_OPTS: "-Dmaven.repo.local=$CI_PROJECT_DIR/.m2/repository"

stages:
  - prepare
  - build
  - test
  - security
  - package
  - deploy
  - cleanup

include:
  - template: Security/SAST.gitlab-ci.yml
  - template: Security/DAST.gitlab-ci.yml
  - template: Security/Dependency-Scanning.gitlab-ci.yml
  - template: Security/Container-Scanning.gitlab-ci.yml
  - template: Security/Secret-Detection.gitlab-ci.yml
  - template: Auto-DevOps.gitlab-ci.yml@$AUTO_DEVOPS_TEMPLATE_REF

.default:
  image: maven:3.9-eclipse-temurin-17
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - .m2/repository/
      - target/
  interruptible: true
  retry:
    max: 2
    when:
      - runner_system_failure
      - stuck_or_timeout_failure

prepare:dependencies:
  stage: prepare
  image: node:20-alpine
  script:
    - npm ci --only=production
  artifacts:
    paths:
      - node_modules/
    expire_in: 1 hour
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

build:java:
  stage: build
  script:
    - mvn clean compile -DskipTests
  artifacts:
    paths:
      - target/
    expire_in: 1 week
  coverage: '/Total.*?([0-9]{1,3})%/'

test:unit:
  stage: test
  image: maven:3.9-eclipse-temurin-17
  script:
    - mvn test
  artifacts:
    reports:
      junit: target/surefire-reports/*.xml
      coverage_report:
        coverage_format: cobertura
        path: target/site/jacoco/jacoco.xml
  coverage: '/Total.*?([0-9]{1,3})%/'
  rules:
    - if: $CI_MERGE_REQUEST_IID
    - if: $CI_COMMIT_BRANCH == "main"
    - if: $CI_COMMIT_TAG

test:integration:
  stage: test
  services:
    - postgres:15-alpine
    - redis:7-alpine
  variables:
    POSTGRES_DB: testdb
    POSTGRES_USER: testuser
    POSTGRES_PASSWORD: testpass
    DATABASE_URL: "jdbc:postgresql://postgres:5432/testdb"
    REDIS_URL: "redis://redis:6379"
  script:
    - mvn verify -Pintegration
  artifacts:
    reports:
      junit: target/failsafe-reports/*.xml

test:contract:
  stage: test
  image: node:20-alpine
  script:
    - npm ci
    - npm run test:contract
  artifacts:
    reports:
      contract: contract-tests/pacts/*.json

lint:
  stage: test
  image: hadolint/hadolint:latest-alpine
  script:
    - hadolint Dockerfile
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      changes:
        - Dockerfile
    - if: $CI_COMMIT_BRANCH == "main"

build:container:
  stage: package
  image: docker:24-dind
  services:
    - docker:24-dind
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - |
      if [[ -f Dockerfile ]]; then
        docker build
          --build-arg VERSION=${APP_VERSION}
          --build-arg COMMIT_SHA=${CI_COMMIT_SHA}
          --build-arg CI_COMMIT_TAG=${CI_COMMIT_TAG}
          --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
          -t ${CI_REGISTRY_IMAGE}:${APP_VERSION}
          -t ${CI_REGISTRY_IMAGE}:latest
          .
        docker push ${CI_REGISTRY_IMAGE}:${APP_VERSION}
        docker push ${CI_REGISTRY_IMAGE}:latest
      fi
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
    - if: $CI_COMMIT_TAG

deploy:staging:
  stage: deploy
  image: alpine/helm:3.12.0
  environment:
    name: staging
    url: https://staging.example.com
    on_stop: cleanup:staging
  script:
    - helm upgrade --install ${HELM_RELEASE_NAME} ./chart/
      --namespace staging
      --values ./chart/values-staging.yaml
      --set image.repository=${CI_REGISTRY_IMAGE}
      --set image.tag=${APP_VERSION}
      --wait
      --timeout 5m
      --atomic
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

deploy:production:
  stage: deploy
  image: alpine/helm:3.12.0
  environment:
    name: production
    url: https://api.example.com
  script:
    - |
      helm upgrade --install ${HELM_RELEASE_NAME} ./chart/
        --namespace production
        --values ./chart/values-production.yaml
        --set image.repository=${CI_REGISTRY_IMAGE}
        --set image.tag=${APP_VERSION}
        --wait
        --timeout 10m
        --atomic
        --cleanup-on-fail
  when: manual
  rules:
    - if: $CI_COMMIT_TAG
      allow_failure: false

review:app:
  stage: deploy
  image: bitnami/kubectl:latest
  environment:
    name: review/$CI_MERGE_REQUEST_IID
    url: https://review-$CI_MERGE_REQUEST_IID.example.com
    on_stop: cleanup:review
  script:
    - |
      kubectl apply -f ./k8s/review/
        -n review-ns
        --record
    - |
      kubectl set image deployment/review-app
        app=${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHA}
        -n review-ns
    - |
      kubectl rollout status
        deployment/review-app
        -n review-ns
        --timeout=5m
  rules:
    - if: $CI_MERGE_REQUEST_IID

deploy:canary:
  stage: deploy
  image: bitnami/kubectl:latest
  environment:
    name: production
  script:
    - |
      kubectl set image
        deployment/${HELM_RELEASE_NAME}
        app=${CI_REGISTRY_IMAGE}:${CANARY_TAG}
        -n production
    - |
      kubectl patch deployment ${HELM_RELEASE_NAME}
        -p '{"spec":{"strategy":{"rollingUpdate":{"maxSurge":"25%","maxUnavailable":0}}}}'
        -n production
  when: manual
  rules:
    - if: $CI_COMMIT_TAG
      variables:
        - $CANARY_TAG

cleanup:staging:
  stage: cleanup
  image: alpine/helm:3.12.0
  environment:
    name: staging
    action: stop
  script:
    - helm uninstall ${HELM_RELEASE_NAME} --namespace staging || true
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      when: manual

cleanup:review:
  stage: cleanup
  image: bitnami/kubectl:latest
  environment:
    name: review/$CI_MERGE_REQUEST_IID
    action: stop
  script:
    - kubectl delete namespace review-ns --wait || true
  rules:
    - if: $CI_MERGE_REQUEST_IID
      when: manual

pages:
  stage: deploy
  script:
    - mv public public-pages
    - mv target/site target-pages
  artifacts:
    paths:
      - public-pages
      - target-pages
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

### GitLab CI Template for Microservices

```yaml
# .gitlab/ci-templates/microservice.yml
# Template for microservices with common patterns

.microservice_defaults: &microservice_defaults
  image: ${DOCKER_REGISTRY}/base-images/${LANGUAGE}:${LANGUAGE_VERSION}
  variables:
    PIP_CACHE_DIR: "$CI_PROJECT_DIR/.pip-cache"
    MAVEN_OPTS: "-Dmaven.repo.local=$CI_PROJECT_DIR/.m2/repository"
  cache:
    key: ${CI_PROJECT_NAME}-${CI_COMMIT_REF_SLUG}
    paths:
      - .m2/
      - .pip-cache/
      - node_modules/
  before_script:
    - echo "Building ${CI_PROJECT_NAME} v${CI_COMMIT_SHA}"

.microservice_test: &microservice_test
  stage: test
  artifacts:
    reports:
      junit: ${JUNIT_REPORT_PATH:-**/test-reports/*.xml}
      coverage_report:
        coverage_format: cobertura
        path: ${COVERAGE_REPORT_PATH:-**/site/jacoco/jacoco.xml}

build_microservice:
  <<: *microservice_defaults
  stage: build
  script:
    - ${BUILD_COMMAND}
  artifacts:
    paths:
      - ${ARTIFACT_PATH:-**/target/*.jar}
    expire_in: 1 week

test_microservice:
  <<: *microservice_test
  <<: *microservice_defaults
  script:
    - ${TEST_COMMAND}

package_microservice:
  <<: *microservice_defaults
  stage: package
  services:
    - docker:24-dind
  script:
    - ${PACKAGE_COMMAND}
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

### Kubernetes Deployment Template

```yaml
# .gitlab/ci-templates/kubernetes.yml

.deploy_kubernetes: &deploy_kubernetes
  image: bitnami/kubectl:latest
  before_script:
    - kubectl config current-context
    - kubectl config view --minify
    - echo "Deploying to ${KUBERNETES_NAMESPACE} cluster"
  script:
    - |
      if [[ "$KUBERNETES_MANIFEST" == *"deployment"* ]]; then
        kubectl apply
          --filename=${KUBERNETES_MANIFEST}
          --namespace=${KUBERNETES_NAMESPACE}
          --record
        kubectl rollout status
          --filename=${KUBERNETES_MANIFEST}
          --namespace=${KUBERNETES_NAMESPACE}
          --timeout=${KUBERNETES_ROLLOUT_TIMEOUT:-5m}
      else
        kubectl apply
          --filename=${KUBERNETES_MANIFEST}
          --namespace=${KUBERNETES_NAMESPACE}
      fi
  environment:
    name: ${KUBERNETES_ENVIRONMENT}
    kubernetes:
      namespace: ${KUBERNETES_NAMESPACE}

deploy_kubernetes_staging:
  <<: *deploy_kubernetes
  environment:
    name: staging
    kubernetes:
      namespace: staging-ns
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      when: manual

deploy_kubernetes_production:
  <<: *deploy_kubernetes
  environment:
    name: production
    kubernetes:
      namespace: production-ns
  when: manual
  rules:
    - if: $CI_COMMIT_TAG
```

### GitOps Pipeline with ArgoCD

```yaml
variables:
  ARGOCD_APP: "api-service"
  ARGOCD_NAMESPACE: "argocd"

stages:
  - sync
  - verify

sync:argocd:
  stage: sync
  image: argocd:latest
  script:
    - |
      argocd app sync ${ARGOCD_APP}
        --label app.kubernetes.io/version=${CI_COMMIT_TAG}
        --server argocd.example.com
        --auth-token ${ARGOCD_TOKEN}
        --grpc-web
    - |
      argocd app wait ${ARGOCD_APP}
        --health
        --server argocd.example.com
        --auth-token ${ARGOCD_TOKEN}
        --grpc-web
  rules:
    - if: $CI_COMMIT_TAG

verify:smoke:
  stage: verify
  image: curlimages/curl:latest
  script:
    - |
      for i in {1..30}; do
        HTTP_CODE=$(curl
          --silent
          --output /dev/null
          --write-out "%{http_code}"
          --max-time 5
          https://api.example.com/health)
        if [[ "$HTTP_CODE" == "200" ]]; then
          echo "Service is healthy"
          exit 0
        fi
        echo "Attempt $i/30: Service returned $HTTP_CODE"
        sleep 10
      done
      echo "Service health check failed"
      exit 1
  rules:
    - if: $CI_COMMIT_TAG
      when: manual
```

## Best Practices

- Use `rules:` instead of `only/except` for more flexible job conditions
- Leverage `include:` templates to share configuration across projects
- Use `extends:` for job inheritance instead of YAML anchors
- Implement proper artifact retention policies to manage storage costs
- Use cache wisely - cache build dependencies but not secrets
- Structure pipelines with clear stages: build, test, security, deploy
- Use environment declarations for tracking deployments and enabling rollbacks
- Implement manual approval gates for production deployments
- Use protected runners and variables for sensitive operations
- Keep .gitlab-ci.yml files maintainable with modular components
- Use parallel jobs to reduce overall pipeline execution time
- Implement proper error handling and retry mechanisms
- Use workflow:rules to control when entire pipeline runs
- Integrate security scanning early in the pipeline
- Use review apps for interactive testing of merge requests
- Implement merge request pipelines for faster feedback
- Use Kubernetes executor for dynamic build agents
- Regular cleanup of old branches, tags, and pipeline artifacts

## Common Patterns

- **Merge Request Pipeline**: Run validation on MR changes before merge
- **Multi-Stage Pipeline**: Build-Test-Security-Deploy sequential workflow
- **Parallel Jobs**: Run tests in parallel by technology or test type
- **Template Pattern**: Share common job configurations via includes
- **Environment Tracking**: Track deployments with rollback capabilities
- **Review Apps**: Dynamic environments for merge request testing
- **Canary Deployment**: Gradual traffic shifting to new versions
- **GitOps Pipeline**: Sync declarative configs to cluster state
- **Matrix Build**: Test against multiple configurations
- **Promote Pipeline**: Promote artifacts through environments
