# Helm Skill

Kubernetes package manager.

## Commands

### List Releases
```
/helm list
```
List releases.

### Install Chart
```
/helm install <name> <chart>
```
Install Helm chart.

### Upgrade
```
/helm upgrade <release> <chart>
```
Upgrade release.

### Uninstall
```
/helm uninstall <release>
```
Uninstall release.

### Rollback
```
/helm rollback <release> [revision]
```
Rollback release.

### Status
```
/helm status <release>
```
Show release status.

### Get Values
```
/helm values <release>
```
Get release values.

### Set Values
```
/helm set <release> <key>=<value>
```
Set values.

### Template
```
/helm template <chart>
```
Template chart.

### Repo Add
```
/helm repo add <name> <url>
```
Add chart repository.

### Repo Update
```
/helm repo update
```
Update repositories.

### Repo List
```
/helm repo list
```
List repositories.

### Search
```
/helm search <query>
```
Search charts.

### History
```
/helm history <release>
```
Show release history.

### Dependency Build
```
/helm dependency build
```
Build dependencies.

## Examples

```
/helm list
/helm install myapp ./chart
/helm upgrade myapp ./chart
/helm uninstall myapp
/helm rollback myapp 1
/helm status myapp
/helm values myapp
/helm set myapp image.tag latest
/helm template ./chart
/helm repo add stable https://charts.helm.sh/stable
/helm repo update
/helm search nginx
/helm history myapp
/helm dependency build
```
