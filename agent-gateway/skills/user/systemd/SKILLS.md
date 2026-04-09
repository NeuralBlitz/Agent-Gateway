# Systemd Skill

Systemd service management.

## Commands

### Start Service
```
/systemd start <service>
```
Start service.

### Stop Service
```
/systemd stop <service>
```
Stop service.

### Restart Service
```
/systemd restart <service>
```
Restart service.

### Status
```
/systemd status <service>
```
Show service status.

### Enable
```
/systemd enable <service>
```
Enable service at boot.

### Disable
```
/systemd disable <service>
```
Disable service.

### List Units
```
/systemd list [type]
```
List units. Types: service, socket, target, timer.

### Failed Units
```
/systemd failed
```
List failed units.

### View Logs
```
/systemd logs <service> [lines]
```
View service logs.

### Reload Daemon
```
/systemd daemon-reload
```
Reload systemd configuration.

### Create Service
```
/systemd create <name> <command>
```
Create new service.

### Stop All
```
/systemd stop-all <type>
```
Stop all units of type.

### Health Check
```
/systemd health <service>
```
Check service health.

## Examples

```
/systemd start nginx
/systemd stop nginx
/systemd restart nginx
/systemd status nginx
/systemd enable nginx
/systemd disable nginx
/systemd list service
/systemd failed
/systemd logs nginx 50
/systemd daemon-reload
/systemd create myapp "/usr/bin/myapp"
```
