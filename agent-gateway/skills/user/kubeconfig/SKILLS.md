# Kubeconfig Skill

Kubernetes configuration management.

## Commands

### Show Config
```
/kubeconfig show
```
Show current kubeconfig.

### Contexts
```
/kubeconfig contexts
```
List all contexts.

### Current Context
```
/kubeconfig current
```
Show current context.

### Switch Context
```
/kubeconfig use <context>
```
Switch to context.

### Create Context
```
/kubeconfig create <name> <cluster> <user>
```
Create new context.

### Delete Context
```
/kubeconfig delete <context>
```
Delete context.

### Rename Context
```
/kubeconfig rename <old> <new>
```
Rename context.

### Merge
```
/kubeconfig merge <file>
```
Merge kubeconfig files.

### View
```
/kubeconfig view
```
View full kubeconfig.

### Clusters
```
/kubeconfig clusters
```
List clusters.

### Users
```
/kubeconfig users
```
List users.

### Credentials
```
/kubeconfig get-credentials <cluster>
```
Get cluster credentials.

## Examples

```
/kubeconfig show
/kubeconfig contexts
/kubeconfig current
/kubeconfig use prod
/kubeconfig create dev dev-cluster admin-user
/kubeconfig delete old-context
/kubeconfig rename dev dev-old
/kubeconfig merge ~/.kube/config2
/kubeconfig clusters
/kubeconfig users
/kubeconfig get-credentials production
```
