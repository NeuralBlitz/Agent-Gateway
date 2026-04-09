# Linkerd Skill

Linkerd service mesh.

## Commands

### Check
```
/linkerd check
```
Check installation.

### Install
```
/linkerd install
```
Install Linkerd.

### Dashboard
```
/linkerd dashboard
```
Open dashboard.

### Get
```
/linkerd get <resource>
```
Get resources.

### Stat
```
/linkerd stat <resource>
```
Get resource stats.

### Top
```
/linkerd top <resource>
```
Top resources.

### Routes
```
/linkerd routes <service>
```
List routes.

### Edges
```
/linkerd edges <service>
```
List edges.

### Tap
```
/linkerd tap <resource>
```
Tap resource.

### Profile
```
/linkerd profile <service>
```
Get service profile.

### Authz
```
/linkerd authz
```
List authorizations.

### Log
```
/linkerd logs <component>
```
Get component logs.

### Version
```
/linkerd version
```
Show version.

### Inject
```
/linkerd inject <file>
```
Inject proxy.

### Uninject
```
/linkerd uninject <file>
```
Remove proxy injection.

## Examples

```
/linkerd check
/linkerd install
/linkerd dashboard
/linkerd get pods
/linkerd stat deploy
/linkerd top deploy
/linkerd routes api
/linkerd edges api
/linkerd tap deploy/api
/linkerd profile api
/linkerd authz
/linkerd logs controller
/linkerd version
/linkerd inject deployment.yaml
/linkerd uninject deployment.yaml
```
