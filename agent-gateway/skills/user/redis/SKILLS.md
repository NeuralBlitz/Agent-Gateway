# Redis Skill

Redis in-memory data store.

## Commands

### Connect
```
/redis connect <host>
```
Connect to Redis.

### Get Value
```
/redis get <key>
```
Get value by key.

### Set Value
```
/redis set <key> <value>
```
Set key-value pair.

### Delete
```
/redis delete <key>
```
Delete key.

### Keys
```
/redis keys <pattern>
```
Find keys matching pattern.

### Exists
```
/redis exists <key>
```
Check if key exists.

### Expire
```
/redis expire <key> <seconds>
```
Set expiration.

### TTL
```
/redis ttl <key>
```
Get time to live.

### List
```
/redis lpush <key> <value>
```
Push to list.

### Set Add
```
/redis sadd <key> <member>
```
Add to set.

### Hash Get
```
/redis hget <key> <field>
```
Get hash field.

### Hash Set
```
/redis hset <key> <field> <value>
```
Set hash field.

### Flush DB
```
/redis flushdb
```
Clear current database.

### Info
```
/redis info
```
Show server info.

### Slowlog
```
/redis slowlog
```
Show slow queries.

## Examples

```
/redis get mykey
/redis set mykey "value"
/redis keys "user:*"
/redis exists session
/redis expire session 3600
/redis lpush mylist item
/redis hget user:1 name
/redis info
/redis slowlog
```
