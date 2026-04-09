---
name: platform-engineering
description: Internal platform development and management
license: MIT
compatibility: opencode
metadata:
  audience: platform-engineer, devops-engineer
  category: devops
---

## What I do

- Build internal developer platforms
- Create self-service infrastructure
- Implement golden paths for developers
- Design platform APIs and interfaces
- Build internal tooling and automation
- Measure platform effectiveness

## When to use me

- When improving developer experience
- When standardizing deployments
- When building self-service capabilities
- When reducing cognitive load on developers
- When implementing platform engineering
- When creating internal developer portals

## Key Concepts

### Internal Developer Platform

```
┌─────────────────────────────────────────────────────────┐
│              Internal Developer Portal                  │
│  (Backstage, Port, Cortex)                              │
└──────────────────────┬──────────────────────────────────┘
                       │
    ┌──────────────────┼──────────────────┐
    │                  │                  │
┌───▼────┐        ┌────▼────┐       ┌────▼────┐
│ CI/CD  │        │Runtime  │       │ Data    │
│ Platform│        │ Platform│       │ Platform│
└────┬───┘        └────┬────┘       └────┬────┘
     │                  │                  │
     │      ┌───────────┼───────────┐      │
     └──────►    Infrastructure     ◄──────┘
```

### Backstage Catalog

```yaml
# catalog-info.yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  description: User management service
  tags:
    - java
    - spring-boot
    - postgres
  links:
    - url: https://github.com/company/my-service
      title: GitHub
    - url: https://my-service.dev.company.com
      title: Dashboard
spec:
  type: service
  lifecycle: production
  owner: team-backend
  providesApis:
    - user-api

---
apiVersion: backstage.io/v1alpha1
kind: API
metadata:
  name: user-api
  description: User management API
spec:
  type: openapi
  lifecycle: production
  owner: team-backend
  definition:
    $ref: https://raw.githubusercontent.com/company/apis/main/user-api.yaml

---
apiVersion: backstage.io/v1alpha1
kind: Resource
metadata:
  name: user-db
  description: Production database
spec:
  type: database
  owner: team-backend
  system: user-management
```

### Golden Path Template

```yaml
# Template for new services
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: service-template
  title: New Microservice
  description: Create a new microservice
spec:
  owner: platform-team
  type: service
  
  parameters:
    - title: Service Details
      required:
        - service_name
        - description
      properties:
        service_name:
          title: Service Name
          type: string
        description:
          title: Description
          type: string
        owner:
          title: Owner Team
          type: string
          default: team-backend
          
  steps:
    - id: fetch-template
      name: Fetch Template
      action: fetch:template
      input:
        url: ./templates/java-service
        values:
          service_name: ${{ parameters.service_name }}
          description: ${{ parameters.description }}
          owner: ${{ parameters.owner }}
          
    - id: publish
      name: Publish to Git
      action: publish:github
      input:
        repoUrl: github.com?owner=${{ parameters.owner }}&repo=${{ parameters.service_name }}
        
    - id: register
      name: Register in Catalog
      action: catalog:register
      input:
        repoContentsUrl: ${{ steps.publish.output.repoContentsUrl }}
        catalogInfoPath: catalog-info.yaml
```

### Platform API Design

```typescript
// Platform SDK
export interface PlatformService {
  // Deployment
  deploy(service: ServiceConfig): Promise<Deployment>;
  rollback(serviceName: string, version: string): Promise<void>;
  getStatus(serviceName: string): Promise<ServiceStatus>;
  
  // Infrastructure
  provisionDatabase(config: DatabaseConfig): Promise<Database>;
  provisionCache(config: CacheConfig): Promise<Cache>;
  
  // Monitoring
  getMetrics(serviceName: string, timeRange: TimeRange): Promise<Metrics>;
  getLogs(serviceName: string, query: LogQuery): Promise<Logs>;
}

// Usage
const platform = new PlatformClient({
  token: process.env.PLATFORM_TOKEN
});

await platform.deploy({
  name: 'user-service',
  image: 'user-service:latest',
  replicas: 3,
  env: { DATABASE_URL: 'postgres://...' }
});
```

### Self-Service Workflows

1. **Service Creation**: Developer creates service from template
2. **Infrastructure Provisioning**: Platform provisions DB, cache, etc.
3. **CI/CD Setup**: Pipeline automatically configured
4. **Monitoring**: Dashboards and alerts auto-created
5. **Documentation**: Catalog entry created
6. **Access Control**: Team permissions configured

### Platform Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| Deployment Frequency | How often code is deployed | Daily+ |
| Lead Time | Time from commit to production | < 1 day |
| MTTR | Mean time to recovery | < 1 hour |
| Self-Service Rate | % of actions done by developers | > 80% |
| Platform Uptime | Platform availability | 99.9% |
| Developer Satisfaction | NPS score | > 50 |

### Golden Paths

- **Build**: Standardized project templates
- **Deploy**: Single command deployment
- **Configure**: Declarative configuration
- **Monitor**: Built-in observability
- **Secure**: Integrated security scanning
- **Test**: Standardized test patterns
