# Kubernetes Skill

Kubernetes cluster management.

## Commands

### Get Pods
```
/k8s pods [namespace]
```
List pods. Default: default namespace.

### Get Services
```
/k8s svc [namespace]
```
List services.

### Get Deployments
```
/k8s deploy [namespace]
```
List deployments.

### Get Nodes
```
/k8s nodes
```
List cluster nodes.

### Pod Logs
```
/k8s logs <pod> [container]
```
Get pod logs.

### Pod Describe
```
/k8s describe <pod>
```
Describe pod details.

### Pod Exec
```
/k8s exec <pod> <command>
```
Execute command in pod.

### Scale Deployment
```
/k8s scale <deployment> <replicas>
```
Scale deployment.

### Apply Config
```
/k8s apply <file>
```
Apply Kubernetes YAML.

### Delete Resource
```
/k8s delete <type> <name>
```
Delete resource.

### Port Forward
```
/k8s port-forward <pod> <port>
```
Forward local port to pod.

### Get Events
```
/k8s events [namespace]
```
List cluster events.

## Examples

```
/k8s pods
/k8s pods production
/k8s svc
/k8s deploy
/k8s nodes
/k8s logs myapp-abc123
/k8s describe myapp-abc123
/k8s exec myapp-abc123 bash
/k8s scale myapp 5
/k8s apply deployment.yaml
/k8s delete pod myapp
/k8s port-forward myapp 8080
```
