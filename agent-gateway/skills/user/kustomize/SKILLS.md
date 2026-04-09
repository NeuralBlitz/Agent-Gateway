# Kustomize Skill

Kubernetes configuration management.

## Commands

### Build
```
/kustomize build <dir>
```
Build kustomization.

### Build Remote
```
/kustomize build <repo>/<path>
```
Build remote base.

### Edit Add
```
/kustomize edit add <resource>
```
Add resource.

### Edit Remove
```
/kustomize edit remove <resource>
```
Remove resource.

### Edit Patch
```
/kustomize edit patch <patch>
```
Add patch.

### Edit Image
```
/kustomize edit image <image>=<tag>
```
Update image.

### Edit Label
```
/kustomize edit label <key>=<value>
```
Add label.

### Edit Annotation
```
/kustomize edit annotation <key>=<value>
```
Add annotation.

### Edit Namespace
```
/kustomize edit namespace <ns>
```
Set namespace.

### Edit Replica
```
/kustomize edit replica <count> <deploy>
```
Scale replicas.

### Create
```
/kustomize create
```
Create new kustomization.

### Config
```
/kustomize cfg fmt <dir>
```
Format configuration.

### Sorter
```
/kustomize cfg sort <dir>
```
Sort resources.

### Constrain
```
/kustomize cfg constrain <dir>
```
Validate resources.

## Examples

```
/kustomize build ./overlays/prod
/kustomize build github.com/example/repo//base
/kustomize edit add deployment.yaml
/kustomize edit remove deployment.yaml
/kustomize edit patch -p patch.yaml
/kustomize edit image nginx=nginx:1.21
/kustomize edit label app.kubernetes.io\/name:test
/kustomize edit annotation description:"test app"
/kustomize edit namespace production
/kustomize edit replica 3 deployment
/kustomize create
/kustomize cfg fmt .
/kustomize cfg sort .
/kustomize cfg constrain .
```
