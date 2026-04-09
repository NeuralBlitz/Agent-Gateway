# Datadog Skill

Infrastructure monitoring and APM.

## Commands

### Host List
```
/dd hosts
```
List monitored hosts.

### Host Tags
```
/dd host-tags <host>
```
Show host tags.

### Metrics
```
/dd metrics <metric>
```
Query metrics.

### Search Logs
```
/dd logs <query>
```
Search logs.

### Events
```
/dd events
```
List events.

### Post Event
```
/dd event <title> <text>
```
Post event.

### Service Map
```
/dd services
```
Show service map.

### Traces
```
/dd traces <service>
```
Query traces.

### Profiles
```
/dd profiles
```
Show profiles.

### Dashboards
```
/dd dashboards
```
List dashboards.

### Monitors
```
/dd monitors
```
List monitors.

### Create Monitor
```
/dd create-monitor <type> <query>
```
Create monitor.

### Downtimes
```
/dd downtimes
```
List downtimes.

### Infrastructure
```
/dd infra
```
Show infrastructure.

## Examples

```
/dd hosts
/dd host-tags web-server-1
/dd metrics system.cpu.usage
/dd logs "error"
/dd events
/dd event "Deploy" "Version 2.0 deployed"
/dd services
/dd traces api-service
/dd profiles
/dd dashboards
/dd monitors
/dd create-monitor metric "avg(last_5m):system.cpu.usage{*} > 90"
/dd downtimes
/dd infra
```
