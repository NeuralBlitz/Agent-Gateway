# Longhorn Skill

Longhorn cloud-native storage.

## Commands

### Nodes
```
/longhorn nodes
```
List nodes.

### Node Disks
```
/longhorn node-disks <node>
```
List node disks.

### Volumes
```
/longhorn volumes
```
List volumes.

### Volume Info
```
/longhorn volume <name>
```
Volume details.

### Volume Attach
```
/longhorn attach <volume>
```
Attach volume.

### Volume Detach
```
/longhorn detach <volume>
```
Detach volume.

### Volume Salvage
```
/longhorn salvage <volume>
```
Salvage volume.

### Engine Upgrade
```
/longhorn engine-upgrade <volume>
```
Upgrade engine.

### Backups
```
/longhorn backups
```
List backups.

### Restore
```
/longhorn restore <backup>
```
Restore from backup.

### Snapshots
```
/longhorn snapshots <volume>
```
List snapshots.

### Create Snapshot
```
/longhorn snapshot create <volume> <name>
```
Create snapshot.

### Delete Snapshot
```
/longhorn snapshot delete <name>
```
Delete snapshot.

### Settings
```
/longhorn settings
```
List settings.

### Recurring Jobs
```
/longhorn recurring
```
List recurring jobs.

## Examples

```
/longhorn nodes
/longhorn node-disks worker-1
/longhorn volumes
/longhorn volume pvc-123
/longhorn attach pvc-123
/longhorn detach pvc-123
/longhorn salvage pvc-123
/longhorn engine-upgrade pvc-123
/longhorn backups
/longhorn restore backup-123
/longhorn snapshots pvc-123
/longhorn snapshot create pvc-123 snap-1
/longhorn snapshot delete snap-1
/longhorn settings
/longhorn recurring
```
