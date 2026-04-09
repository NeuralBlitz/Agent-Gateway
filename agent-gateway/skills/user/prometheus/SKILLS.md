# Prometheus Skill

Prometheus monitoring system.

## Commands

### Query Metrics
```
/prometheus query <query>
```
Run PromQL query.

### Instant Query
```
/prometheus instant <query>
```
Run instant query.

### Range Query
```
/prometheus range <query> <start> <end>
```
Run range query.

### Targets
```
/prometheus targets
```
List scrape targets.

### Targets Down
```
/prometheus targets-down
```
Show down targets.

### Rules
```
/prometheus rules
```
List recording/alerting rules.

### Alerts
```
/prometheus alerts
```
List active alerts.

### Series
```
/prometheus series <match>
```
List time series.

### Label Values
```
/prometheus label <label>
```
Get label values.

### Targets Healthy
```
/prometheus healthy
```
Show healthy targets count.

### Scrape Interval
```
/prometheus scrape-interval
```
Show scrape interval.

## Examples

```
/prometheus query up
/prometheus query rate(http_requests_total[5m])
/prometheus targets
/prometheus targets-down
/prometheus rules
/prometheus alerts
/prometheus series job
/prometheus label instance
```
