# Helmfile Skill

Helm release management.

## Commands

### List Releases
```
/helmfile list
```
List releases.

### Sync
```
/helmfile sync
```
Sync all releases.

### Apply
```
/helmfile apply
```
Apply changes.

### Diff
```
/helmfile diff
```
Show differences.

### Delete
```
/helmfile delete
```
Delete releases.

### Template
```
/helmfile template
```
Render templates.

### Fetch
```
/helmfile fetch
```
Fetch charts.

### Sync Release
```
/helmfile sync <release>
```
Sync specific release.

### Delete Release
```
/helmfile delete <release>
```
Delete specific release.

### GC
```
/helmfile gc
```
Clean up released.

### List Repos
```
/helmfile repos
```
List repositories.

### Add Repo
```
/helmfile repo add <name> <url>
```
Add repository.

### Update Repos
```
/helmfile repos update
```
Update repositories.

## Examples

```
/helmfile list
/helmfile sync
/helmfile apply
/helmfile diff
/helmfile delete
/helmfile template
/helmfile fetch
/helmfile sync myrelease
/helmfile delete myrelease
/helmfile gc
/helmfile repos
/helmfile repo add stable https://charts.helm.sh/stable
/helmfile repos update
```
