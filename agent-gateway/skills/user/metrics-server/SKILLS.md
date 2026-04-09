# Metrics-Server Skill

Kubernetes Metrics API.

## Commands

### Node Metrics
```
/metrics-server nodes
```
Show node metrics.

### Pod Metrics
```
/metrics-server pods
```
Show pod metrics.

### Deployment Metrics
```
/metrics-server deploy <name>
```
Deployment metrics.

### StatefulSet Metrics
```
/metrics-server sts <name>
```
StatefulSet metrics.

### Custom Resource
```
/metrics-server custom <resource>
```
Custom resource metrics.

### Top Nodes
```
/metrics-server top nodes
```
Top nodes by usage.

### Top Pods
```
/metrics-server top pods
```
Top pods by usage.

### CPU Usage
```
/metrics-server cpu <resource>
```
CPU usage.

### Memory Usage
```
/metrics-server memory <resource>
```
Memory usage.

### Historical
```
/metrics-server history <resource>
```
Historical metrics.

### Recommendations
```
/metrics-server recommend <resource>
```
Resource recommendations.

### Export
```
/metrics-server export
```
Export metrics.

## Examples

```
/metrics-server nodes
/metrics-server pods
/metrics-server deploy api
/metrics-server sts database
/metrics-server custom myresource
/metrics-server top nodes
/metrics-server top pods
/metrics-server cpu myapp
/metrics-server memory myapp
/metrics-server history myapp
/metrics-server recommend myapp
/metrics-server export
```
