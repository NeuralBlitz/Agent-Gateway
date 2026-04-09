# Consul Skill

Consul service mesh and configuration.

## Commands

### Members
```
/consul members
```
List cluster members.

### Info
```
/consul info
```
Show cluster info.

### Catalog Services
```
/consul services
```
List registered services.

### Register Service
```
/consul register <service-file>
```
Register service.

### Deregister
```
/consul deregister <service>
```
Deregister service.

### Health Check
```
/consul health <service>
```
Show service health.

### KV Get
```
/consul kv get <key>
```
Get KV value.

### KV Put
```
/consul kv put <key> <value>
```
Put KV value.

### KV Delete
```
/consul kv delete <key>
```
Delete KV key.

### KV List
```
/consul kv list <prefix>
```
List keys.

### Connect
```
/consul connect
```
Show Connect intentions.

### Intent
```
/consul intent <source> <dest> <action>
```
Create intention.

### Snapshot Save
```
/consul snapshot save <file>
```
Save cluster snapshot.

### Snapshot Restore
```
/consul snapshot restore <file>
```
Restore snapshot.

## Examples

```
/consul members
/consul info
/consul services
/consul register service.json
/consul deregister web
/consul health api
/consul kv get config/app
/consul kv put config/app '{"debug": true}'
/consul kv delete config/old
/consul kv list config/
/consul connect
/consul intent api web allow
/consul snapshot save backup.snap
```
