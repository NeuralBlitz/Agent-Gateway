# Runc Skill

OCI container runtime.

## Commands

### List
```
/runc list
```
List containers.

### Create
```
/runc create <container>
```
Create container.

### Start
```
/runc start <container>
```
Start container.

### Run
```
/runc run <container>
```
Create and start.

### Delete
```
/runc delete <container>
```
Delete container.

### State
```
/runc state <container>
```
Container state.

### Kill
```
/runc kill <container> <signal>
```
Kill container.

### Pause
```
/runc pause <container>
```
Pause container.

### Resume
```
/runc resume <container>
```
Resume container.

### Checkpoint
```
/runc checkpoint <container>
```
Checkpoint container.

### Restore
```
/runc restore <container>
```
Restore container.

### Exec
```
/runc exec <container> <command>
```
Exec in container.

### Events
```
/runc events <container>
```
Container events.

### Spec
```
/runc spec
```
Generate spec.

## Examples

```
/runc list
/runc create mycontainer
/runc start mycontainer
/runc run mycontainer
/runc delete mycontainer
/runc state mycontainer
/runc kill mycontainer SIGTERM
/runc pause mycontainer
/runc resume mycontainer
/runc checkpoint mycontainer
/runc restore mycontainer
/runc exec mycontainer /bin/sh
/runc events mycontainer
/runc spec
```
