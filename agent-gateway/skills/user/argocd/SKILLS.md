# ArgoCD Skill

ArgoCD application management.

## Commands

### List Apps
```
/argocd apps
```
List applications.

### Get App
```
/argocd app <name>
```
Get application details.

### Create App
```
/argocd app create <name> <repo>
```
Create application.

### Sync App
```
/argocd app sync <name>
```
Sync application.

### Delete App
```
/argocd app delete <name>
```
Delete application.

### Rollback
```
/argocd app rollback <name> <revision>
```
Rollback application.

### Actions
```
/argocd app actions <name>
```
List available actions.

### Run Action
```
/argocd app action <name> <action>
```
Run action.

### Logs
```
/argocd app logs <name>
```
Get application logs.

### Diff
```
/argocd app diff <name>
```
Show diff.

### Patch
```
/argocd app patch <name> <patch>
```
Patch application.

### Resources
```
/argocd app resources <name>
```
List managed resources.

### History
```
/argocd app history <name>
```
Show revision history.

### Terminal
```
/argocd app terminal <name>
```
Open terminal.

## Examples

```
/argocd apps
/argocd app myocd app createapp
/arg myapp https://github.com/org/repo
/argocd app sync myapp
/argocd app delete myapp
/argocd app rollback myapp 12345
/argocd app actions myapp
/argocd app action myapp restart
/argocd app logs myapp
/argocd app diff myapp
/argocd app resources myapp
/argocd app history myapp
```
