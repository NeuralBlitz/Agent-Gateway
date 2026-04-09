# Sysadmin Skill

System administration and server management commands.

## Commands

### Check System Info
```
/sysadmin info
```
Show system info (hostname, OS, kernel, uptime, load).

### Memory Usage
```
/sysadmin memory
```
Show memory usage (free, used, available).

### Disk Usage
```
/sysadmin disk [path]
```
Show disk usage. Default: current directory.

### Process List
```
/sysadmin ps [count]
```
List top processes. Default: 10 processes.

### Kill Process
```
/sysadmin kill <pid>
```
Kill a process by PID.

### Service Status
```
/sysadmin service <name>
```
Check if a service is running (systemd).

### Port Usage
```
/sysadmin ports
```
Show listening ports and associated processes.

### Log View
```
/sysadmin logs <service> [lines]
```
View recent logs. Default: 50 lines.

### User List
```
/sysadmin users
```
List all users on the system.

### Disk IO
```
/sysadmin iostat
```
Show disk I/O statistics.

### Clear Temp
```
/sysadmin cleartemp
```
Clear temporary files from /tmp.

## Examples

```
/sysadmin info
/sysadmin disk /home
/sysadmin ps 20
/sysadmin ports
/sysadmin logs nginx 100
```
