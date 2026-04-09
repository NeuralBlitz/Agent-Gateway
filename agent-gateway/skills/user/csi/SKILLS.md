# CSI Skill

Container Storage Interface.

## Commands

### Driver List
```
/csi drivers
```
List CSI drivers.

### Driver Info
```
/csi driver <name>
```
Driver information.

### Node Info
```
/csi node <name>
```
Node info.

### Controller Info
```
/csi controller <name>
```
Controller info.

### Capabilities
```
/csi capabilities <driver>
```
Driver capabilities.

### Get Plugin Info
```
/csi plugin-info <name>
```
Get plugin info.

### List Volumes
```
/csi volumes
```
List volumes.

### Volume Status
```
/csi volume <id>
```
Volume status.

### Validate
```
/csi validate <driver>
```
Validate driver.

### Identity
```
/csi identity <driver>
```
Driver identity.

### Health
```
/csi health <driver>
```
Check health.

### Mount
```
/csi mount <volume>
```
Get mount info.

### Unmount
```
/csi unmount <volume>
```
Get unmount info.

## Examples

```
/csi drivers
/csi driver cinder
/csi node node-1
/csi controller csi-controller
/csi capabilities cephfs.csi.ceph.com
/csi plugin-info hostpath
/csi volumes
/csi volume vol-123
/csi validate cephfs.csi.ceph.com
/csi identity cinder
/csi health cephfs.csi.ceph.com
/csi mount pvc-123
/csi unmount pvc-123
```
