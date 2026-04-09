# GitOps Skill

GitOps workflow management.

## Commands

### Sync
```
/gitops sync <app>
```
Sync application.

### Status
```
/gitops status <app>
```
Show sync status.

### Logs
```
/gitops logs <app>
```
Show sync logs.

### Suspend
```
/gitops suspend <app>
```
Suspend sync.

### Resume
```
/gitops resume <app>
```
Resume sync.

### Get
```
/gitops get <resource>
```
Get resources.

### Add App
```
/gitops add <app> <url>
```
Add application.

### Remove App
```
/gitops remove <app>
```
Remove application.

### List Apps
```
/gitops apps
```
List applications.

### List Events
```
/gitops events
```
List events.

### Trace
```
/gitops trace <resource>
```
Trace resource.

### Diff
```
/gitops diff <app>
```
Show diff.

### Override
```
/gitops override <app> <key> <value>
```
Override parameter.

## Examples

```
/gitops sync myapp
/gitops status myapp
/gitops logs myapp
/gitops suspend myapp
/gitops resume myapp
/gitops get applications
/gitops add myapp https://github.com/org/repo
/gitops remove myapp
/gitops apps
/gitops events
/gitops trace deployment/myapp
/gitops diff myapp
/gitops override myapp image.tag v1.0.1
```
