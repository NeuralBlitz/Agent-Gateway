# Flux Skill

Flux GitOps toolkit.

## Commands

### Check
```
/flux check
```
Check installation.

### Install
```
/flux install
```
Install Flux.

### Bootstrap
```
/flux bootstrap <provider>
```
Bootstrap Flux.

### Suspend
```
/flux suspend <resource>
```
Suspend reconciliation.

### Resume
```
/flux resume <resource>
```
Resume reconciliation.

### Get
```
/flux get <resource>
```
Get resources.

### Create Source
```
/flux create source <type> <name>
```
Create source.

### Create Image
```
/flux create image <policy>
```
Create image policy.

### Create Kustomization
```
/flux create kustomization <name>
```
Create kustomization.

### Delete
```
/flux delete <resource>
```
Delete resource.

### Logs
```
/flux logs
```
Show logs.

### Events
```
/flux events
```
Show events.

### Tree
```
/flux tree <kustomization>
```
Show resource tree.

### Reconciliation
```
/flux reconcile <resource>
```
Force reconciliation.

### Suspend All
```
/flux suspend all
```
Suspend all.

### Resume All
```
/flux resume all
```
Resume all.

## Examples

```
/flux check
/flux install
/flux bootstrap github
/flux suspend kustomization myapp
/flux resume kustomization myapp
/flux get all
/flux create source git myapp
/flux create image policy myapp
/flux create kustomization myapp
/flux delete kustomization myapp
/flux logs
/flux events
/flux tree myapp
/flux reconcile myapp
/flux suspend all
/flux resume all
```
