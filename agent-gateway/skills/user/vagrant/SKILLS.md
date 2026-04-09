# Vagrant Skill

Vagrant VM management.

## Commands

### Init
```
/vagrant init <box>
```
Initialize Vagrantfile.

### Up
```
/vagrant up
```
Create and start VM.

### Halt
```
/vagrant halt
```
Stop VM.

### Destroy
```
/vagrant destroy
```
Destroy VM.

### SSH
```
/vagrant ssh [command]
```
SSH into VM.

### Status
```
/vagrant status
```
Show VM status.

### Reload
```
/vagrant reload
```
Reload VM.

### Provision
```
/vagrant provision
```
Re-provision.

### Suspend
```
/vagrant suspend
```
Suspend VM.

### Resume
```
/vagrant resume
```
Resume VM.

### Snapshot
```
/vagrant snapshot save <name>
```
Save snapshot.

### Snapshot Restore
```
/vagrant snapshot restore <name>
```
Restore snapshot.

### List Snapshots
```
/vagrant snapshot list
```
List snapshots.

### Plugin Install
```
/vagrant plugin <name>
```
Install plugin.

### Plugin List
```
/vagrant plugins
```
List plugins.

## Examples

```
/vagrant init ubuntu/focal64
/vagrant up
/vagrant halt
/vagrant destroy -f
/vagrant ssh
/vagrant ssh "ls -la"
/vagrant status
/vagrant reload
/vagrant provision
/vagrant suspend
/vagrant resume
/vagrant snapshot save before-update
/vagrant snapshot restore before-update
/vagrant snapshot list
/vagrant plugin install vagrant-vbguest
/vagrant plugins
```
