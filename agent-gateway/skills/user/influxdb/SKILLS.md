# InfluxDB Skill

InfluxDB time-series database.

## Commands

### Query
```
/influx query <query>
```
Run InfluxQL query.

### Write
```
/influx write <measurement> <tags> <fields>
```
Write data point.

### Bucket List
```
/influx buckets
```
List buckets.

### Create Bucket
```
/influx bucket create <name>
```
Create bucket.

### Delete Bucket
```
/influx bucket delete <name>
```
Delete bucket.

### Org List
```
/influx orgs
```
List organizations.

### Create Org
```
/influx org create <name>
```
Create org.

### Auth List
```
/influx auths
```
List authorizations.

### Token List
```
/influx tokens
```
List API tokens.

### Create Token
```
/influx token create <name>
```
Create token.

### Backup
```
/influx backup <path>
```
Backup database.

### Restore
```
/influx restore <path>
```
Restore from backup.

### Task List
```
/influx tasks
```
List tasks.

### Task Create
```
/influx task create <flux>
```
Create task.

### Telegraf
```
/influx telegrafs
```
List telegraf configs.

## Examples

```
/influx query "SELECT * FROM cpu LIMIT 10"
/influx write cpu,host=server1 value=50
/influx buckets
/influx bucket create mybucket
/influx orgs
/influx org create myorg
/influx auths
/influx tokens
/influx token create "Read API Token"
/influx backup /backup/influxdb
/influx restore /backup/influxdb
/influx tasks
/influx telegrafs
```
