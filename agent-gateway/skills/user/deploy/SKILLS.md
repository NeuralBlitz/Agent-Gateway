# Deploy Skill

Deployment automation and orchestration.

## Commands

### Deploy
```
/deploy <environment>
```
Deploy to environment (dev, staging, prod).

### Deploy Rollback
```
/deploy rollback <environment>
```
Rollback to previous version.

### Deploy Status
```
/deploy status
```
Show deployment status.

### Deploy History
```
/deploy history [environment]
```
Show deployment history.

### Health Check
```
/deploy health
```
Check deployed service health.

### Migrate DB
```
/deploy migrate [version]
```
Run database migrations.

### Seed Data
```
/deploy seed
```
Seed database with test data.

### Pre Deploy
```
/deploy precheck
```
Run pre-deployment checks.

### Post Deploy
```
/deploy post
```
Run post-deployment tasks.

## Examples

```
/deploy staging
/deploy production
/deploy rollback production
/deploy status
/deploy history
/deploy health
/deploy migrate
/deploy precheck
```
