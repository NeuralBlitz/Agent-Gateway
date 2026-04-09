# Analytics Skill

Data analytics and visualization.

## Commands

### Query Data
```
/analytics query <query>
```
Run analytics query.

### Show Metrics
```
/analytics metrics <dashboard>
```
Show dashboard metrics.

### Generate Report
```
/analytics report <type>
```
Generate report (daily, weekly, monthly).

### Export Data
```
/analytics export <query> <format>
```
Export data (csv, json, xlsx).

### Trends
```
/analytics trends <metric> [days]
```
Show trend analysis.

### Anomalies
```
/analytics anomalies <metric>
```
Detect anomalies in data.

### Compare
```
/analytics compare <a> <b>
```
Compare two time periods.

### Top Users
```
/analytics top-users [metric]
```
Show top users by metric.

### Funnel
```
/analytics funnel <steps>
```
Analyze conversion funnel.

## Examples

```
/analytics query "SELECT COUNT(*) FROM events"
/analytics metrics dashboard
/analytics report daily
/analytics export "SELECT * FROM users" csv
/analytics trends sessions 30
/analytics anomalies error_rate
/analytics compare last_week this_week
/analytics top-users purchases
/analytics funnel "view->add->checkout->buy"
```
