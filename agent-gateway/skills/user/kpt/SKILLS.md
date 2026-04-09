# Kpt Skill

Kubernetes packaging.

## Commands

### Init
```
/kpt init <dir>
```
Initialize package.

### Get
```
/kpt get <repo> <dir>
```
Get package.

### Sync
```
/kpt sync <dir>
```
Sync dependencies.

### Package Info
```
/kpt pkg get <dir>
```
Get package info.

### Set
```
/kpt fn run <dir>
```
Run functions.

### Render
```
/kpt fn render <dir>
```
Render functions.

### Subpackages
```
/kpt pkg tree <dir>
```
Show package tree.

### Fix
```
/kpt pkg fix <dir>
```
Fix package.

### Update
```
/kpt pkg update <dir>
```
Update package.

### Diff
```
/kpt pkg diff <dir>
```
Show diff.

### Init Subpackage
```
/kpt pkg init <subdir>
```
Init subpackage.

### Set Image
```
/kpt set image <dir> <image>
```
Set image.

### Set Label
```
/kpt set label <dir> <label>
```
Set label.

### Set Annotation
```
/kpt set annotation <dir> <annotation>
```
Set annotation.

### Live Apply
```
/kpt live apply <dir>
```
Apply to cluster.

### Live Destroy
```
/kpt live destroy <dir>
```
Destroy resources.

### Live Init
```
/kpt live init <dir>
```
Init inventory.

## Examples

```
/kpt init ./myapp
/kpt get github.com/GoogleCloudPlatform/manifests//README.md ./manifests
/kpt sync ./manifests
/kpt pkg get ./manifests
/kpt fn run ./manifests
/kpt fn render ./manifests
/kpt pkg tree ./manifests
/kpt pkg fix ./manifests
/kpt pkg update ./manifests
/kpt pkg diff ./manifests
/kpt pkg init ./subpackage
/kpt set image ./manifests nginx=nginx:1.21
/kpt set label ./manifests env=prod
/kpt set annotation ./manifests description="production"
/kpt live apply ./manifests
/kpt live destroy ./manifests
```
