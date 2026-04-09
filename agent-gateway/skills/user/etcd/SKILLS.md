# Etcd Skill

Etcd distributed key-value store.

## Commands

### Get Key
```
/etcd get <key>
```
Get value by key.

### Set Key
```
/etcd set <key> <value>
```
Set key-value.

### Delete
```
/etcd delete <key>
```
Delete key.

### List Keys
```
/etcd list <prefix>
```
List keys with prefix.

### Exists
```
/etcd exists <key>
```
Check if key exists.

### Watch
```
/etcd watch <key>
```
Watch key for changes.

### Get Revision
```
/etcd get-rev <key>
```
Get key with revision.

### TTL
```
/etcd set-ttl <key> <seconds>
```
Set key with TTL.

### Member List
```
/etcd members
```
List cluster members.

### Member Add
```
/etcd member add <peer-url>
```
Add member.

### Member Remove
```
/etcd member remove <id>
```
Remove member.

### Endpoint Health
```
/etcd health
```
Check endpoint health.

### Endpoint Status
```
/etcd endpoint-status
```
Show endpoint status.

### Defrag
```
/etcd defrag
```
Defragment storage.

### Snapshot Save
```
/etcd snapshot save <file>
```
Save snapshot.

## Examples

```
/etcd get /config/app
/etcd set /config/app "value"
/etcd delete /config/old
/etcd list /config/
/etcd exists /config/db
/etcd watch /config/app
/etcd set-ttl /session 3600
/etcd members
/etcd member add https://192.168.1.10:2380
/etcd health
/etcd endpoint-status
/etcd snapshot save backup.db
```
