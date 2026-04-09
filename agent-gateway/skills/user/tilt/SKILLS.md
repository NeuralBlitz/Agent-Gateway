# Tilt Skill

Kubernetes development environment.

## Commands

### Up
```
/tilt up
```
Start Tilt.

### Down
```
/tilt down
```
Stop Tilt.

### Debug
```
/tilt debug
```
Start in debug mode.

### Get Config
```
/tilt get <resource>
```
Get resource status.

### Logs
```
/tilt logs [resource]
```
Stream logs.

### Stream
```
/tilt stream
```
Stream all resources.

### UI
```
/tilt ui
```
Open Tilt UI.

### Apply
```
/tilt apply <file>
```
Apply YAML.

### Delete
```
/tilt delete <resource>
```
Delete resource.

### Init
```
/tilt init
```
Initialize Tiltfile.

### Live Update
```
/tilt live-update <resource>
```
Trigger live update.

### Save
```
/tilt save <image>
```
Save image snapshot.

### Restore
```
/tilt restore
```
Restore last snapshot.

### Exit
```
/tilt exit
```
Exit and stop.

## Examples

```
/tilt up
/tilt down
/tilt debug
/tilt get deployment
/tilt logs myapp
/tilt stream
/tilt ui
/tilt apply deployment.yaml
/tilt delete deployment
/tilt init
/tilt live-update myapp
/tilt save myimage
/tilt restore
/tilt exit
```
