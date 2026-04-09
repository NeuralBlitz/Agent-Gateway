# Loki Skill

Log aggregation system.

## Commands

### Query Logs
```
/loki query <query>
```
Query logs.

### Labels
```
/loki labels
```
Get available labels.

### Label Values
```
/loki label <name>
```
Get values for label.

### Range Query
```
/loki range <query> <start> <end>
```
Query time range.

### Instant Query
```
/loki instant <query>
```
Instant query.

### Series
```
/loki series <match>
```
List series.

### Stats
```
/loki stats
```
Query stats.

### Volume
```
/loki volume <query>
```
Log volume.

### Patterns
```
/loki patterns
```
Extract patterns.

### Tail
```
/loki tail <query>
```
Tail logs.

### Delete
```
/loki delete <query> <start> <end>
```
Delete logs.

### Rules
```
/loki rules
```
List recording rules.

### Alerting
```
/loki alerts
```
List alerts.

## Examples

```
/loki query '{app="nginx"}'
/loki labels
/loki label app
/loki range '{app="api"}' "2024-01-01" "2024-01-02"
/loki instant '{level="error"}'
/loki series '{app=~".*"}'
/loki stats
/loki volume '{app="web"}'
/loki patterns
/loki tail '{app="api"}'
/loki delete '{app="old"} 1609459200 1609545600
/loki rules
/loki alerts
```
