# Containerd Skill

Container runtime.

## Commands

### Containers
```
/containerd containers
```
List containers.

### Images
```
/containerd images
```
List images.

### Pull Image
```
/containerd pull <image>
```
Pull image.

### Remove Image
```
/containerd rmi <image>
```
Remove image.

### Tasks
```
/containerd tasks
```
List tasks.

### Run Task
```
/containerd run <image>
```
Run task.

### Delete Task
```
/containerd task delete <id>
```
Delete task.

### Snapshots
```
/containerd snapshots
```
List snapshots.

### Mounts
```
/containerd mounts
```
List mounts.

### Namespaces
```
/containerd namespaces
```
List namespaces.

### Create Namespace
```
/containerd namespace create <name>
```
Create namespace.

### Info
```
/containerd info
```
Show info.

### Version
```
/containerd version
```
Show version.

## Examples

```
/containerd containers
/containerd images
/containerd pull docker.io/library/nginx:latest
/containerd rmi nginx:latest
/containerd tasks
/containerd run docker.io/library/nginx:latest
/containerd task delete abc123
/containerd snapshots
/containerd mounts
/containerd namespaces
/containerd namespace create mynamespace
/containerd info
/containerd version
```
