# Prometheus Alert Manager

Alert management.

## Commands

### List Alerts
```
/alert list
```
List alerts.

### Alert Status
```
/alert status <alert>
```
Show alert status.

### Get Rule
```
/alert rule <name>
```
Get alert rule.

### Create Alert
```
/alert create <file>
```
Create alert rule.

### Delete Alert
```
/alert delete <name>
```
Delete alert.

### Silences
```
/alert silences
```
List silences.

### Create Silence
```
/alert silence <alert> <duration> <reason>
```
Create silence.

### Expire Silence
```
/alert expire <silence-id>
```
Expire silence.

### Enable
```
/alert enable <rule>
```
Enable rule.

### Disable
```
/alert disable <rule>
```
Disable rule.

### Groups
```
/alert groups
```
List rule groups.

### Reload
```
/alert reload
```
Reload configuration.

## Examples

```
/alert list
/alert status HighCPU
/alert rule CPUHigh
/alert create alert.yaml
/alert delete CPUHigh
/alert silences
/alert silence "High CPU" 1h "Maintenance"
/alert expire abc123
/alert enable CPUHigh
/alert disable CPUHigh
/alert groups
/alert reload
```
