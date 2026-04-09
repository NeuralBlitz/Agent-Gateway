# Service Mesh Skill

Service mesh operations.

## Commands

### List Services
```
/servicemesh services
```
List services in mesh.

### Traffic
```
/servicemesh traffic <service>
```
Show traffic.

### Edges
```
/servicemesh edges
```
Show service edges.

### Metrics
```
/servicemesh metrics <service>
```
Get metrics.

### Routes
```
/servicemesh routes
```
List routes.

### Virtual Services
```
/servicemesh vs
```
List virtual services.

### Destination Rules
```
/servicemesh dr
```
List destination rules.

### Gateways
```
/servicemesh gateways
```
List gateways.

### Authorizations
```
/servicemesh authz
```
List authorizations.

### Inject
```
/servicemesh inject
```
Show injection status.

### Sidecars
```
/servicemesh sidecars
```
List sidecars.

### Telemetry
```
/servicemesh telemetry
```
List telemetry.

### Generate
```
/servicemesh generate <service>
```
Generate mesh config.

## Examples

```
/servicemesh services
/servicemesh traffic api
/servicemesh edges
/servicemesh metrics myservice
/servicemesh routes
/servicemesh vs
/servicemesh dr
/servicemesh gateways
/servicemesh authz
/servicemesh inject
/servicemesh sidecars
/servicemesh telemetry
/servicemesh generate myservice
```
