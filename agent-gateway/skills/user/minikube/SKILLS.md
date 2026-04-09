# Minikube Skill

Local Kubernetes.

## Commands

### Start
```
/minikube start
```
Start cluster.

### Stop
```
/minikube stop
```
Stop cluster.

### Delete
```
/minikube delete
```
Delete cluster.

### Status
```
/minikube status
```
Show status.

### Dashboard
```
/minikube dashboard
```
Open dashboard.

### SSH
```
/minikube ssh
```
SSH to node.

### Service List
```
/minikube service list
```
List services.

### Service URL
```
/minikube service <name>
```
Get service URL.

### Tunnel
```
/minikube tunnel
```
Create tunnel.

### Addons List
```
/minikube addons list
```
List addons.

### Enable Addon
```
/minikube addons enable <addon>
```
Enable addon.

### Disable Addon
```
/minikube addons disable <addon>
```
Disable addon.

### Profile List
```
/minikube profile list
```
List profiles.

### Profile Use
```
/minikube profile <name>
```
Switch profile.

### Mount
```
/minikube mount <path>
```
Mount directory.

### Logs
```
/minikube logs
```
Get logs.

### IP
```
/minikube ip
```
Get IP.

## Examples

```
/minikube start
/minikube stop
/minikube delete
/minikube status
/minikube dashboard
/minikube ssh
/minikube service list
/minikube service myapp
/minikube tunnel
/minikube addons list
/minikube addons enable ingress
/minikube addons disable dashboard
/minikube profile list
/minikube profile dev
/minikube mount /data
/minikube logs
/minikube ip
```
