# Envoy Skill

Envoy proxy management.

## Commands

### Config
```
/envoy config <endpoint>
```
Get config from endpoint.

### Stats
```
/envoy stats [endpoint]
```
Get stats.

### Server Info
```
/envoy server-info
```
Get server info.

### Listeners
```
/envoy listeners
```
List listeners.

### Clusters
```
/envoy clusters
```
List clusters.

### Routes
```
/envoy routes
```
List routes.

### Endpoints
```
/envoy endpoints <cluster>
```
List endpoints.

### Secrets
```
/envoy secrets
```
List secrets.

### Log Level
```
/envoy log-level <level>
```
Set log level.

### Drain
```
/envoy drain
```
Drain connections.

### Quic
```
/envoy quic-stats
```
Show QUIC stats.

### Health Check
```
/envoy health <endpoint>
```
Health check endpoint.

### Clusters Detailed
```
/envoy clusters-detail
```
Detailed cluster info.

### Maintenance
```
/envoy maintenance <mode>
```
Set maintenance mode.

## Examples

```
/envoy config localhost:8001/config_dump
/envoy stats
/envoy stats cluster_name
/envoy server-info
/envoy listeners
/envoy clusters
/envoy routes
/envoy endpoints mycluster
/envoy secrets
/envoy log-level debug
/envoy drain
/envoy quic-stats
/envoy health http://localhost:8001
/envoy clusters-detail
/envoy maintenance enable
```
