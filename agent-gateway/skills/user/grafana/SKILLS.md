# Grafana Skill

Grafana dashboard management.

## Commands

### List Dashboards
```
/grafana dashboards
```
List all dashboards.

### Dashboard Info
```
/grafana info <dashboard>
```
Get dashboard details.

### Panels
```
/grafana panels <dashboard>
```
List panels in dashboard.

### Query Metric
```
/grafana query <metric>
```
Query a metric.

### Alert Rules
```
/grafana alerts
```
List alert rules.

### Alert Status
```
/grafana alert-status
```
Show alert statuses.

### Create Dashboard
```
/grafana create <name>
```
Create new dashboard.

### Add Panel
```
/grafana add-panel <dashboard> <type>
```
Add panel to dashboard.

### Annotations
```
/grafana annotations <dashboard>
```
List annotations.

### Add Annotation
```
/grafana annotate <dashboard> <text>
```
Add annotation.

### Export
```
/grafana export <dashboard>
```
Export dashboard JSON.

### Import
```
/grafana import <json>
```
Import dashboard.

## Examples

```
/grafana dashboards
/grafana info cpu-overview
/grafana panels main-dashboard
/grafana query node_cpu_seconds_total
/grafana alerts
/grafana alert-status
/grafana create my-dashboard
/grafana export main-dashboard
```
