# Istio Skill

Istio service mesh management.

## Commands

### Virtual Services
```
/istio vs <namespace>
```
List virtual services.

### Destination Rules
```
/istio dr <namespace>
```
List destination rules.

### Gateways
```
/istio gateway <namespace>
```
List gateways.

### Service Entries
```
/istio se <namespace>
```
List service entries.

### Authorization
```
/istio authz <namespace>
```
List authorization policies.

### Request Routing
```
/istio route <service>
```
Show routing config.

### Timeout
```
/istio timeout <service> <seconds>
```
Set timeout.

### Retries
```
/istio retries <service> <attempts>
```
Configure retries.

### Circuit Break
```
/istio cb <service>
```
Configure circuit breaker.

### Mirror
```
/istio mirror <service>
```
Configure traffic mirroring.

### Inject
```
/istio inject <namespace>
```
Show injection status.

### Metrics
```
/istio metrics <service>
```
Get service metrics.

### Dashboards
```
/istio dashboards
```
Show dashboard URLs.

### Generate
```
/istio generate <type>
```
Generate sample configs.

## Examples

```
/istio vs default
/istio dr default
/istio gateway default
/istio se default
/istio authz default
/istio route myservice
/istio timeout myservice 5
/istio retries myservice 3
/istio cb myservice
/istio mirror myservice
/istio inject default
/istio metrics myservice
/istio dashboards
```
