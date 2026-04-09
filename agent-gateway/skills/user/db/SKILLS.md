# DB Skill

Database operations and queries.

## Commands

### Connect
```
/db connect <database>
```
Connect to database.

### List Tables
```
/db tables
```
List all tables.

### Describe Table
```
/db describe <table>
```
Show table schema.

### Query
```
/db query <sql>
```
Execute SQL query.

### Insert
```
/db insert <table> <data>
```
Insert record into table.

### Update
```
/db update <table> <set> <where>
```
Update records.

### Delete
```
/db delete <table> <where>
```
Delete records.

### Backup
```
/db backup [table]
```
Backup database/table.

### Restore
```
/db restore <file>
```
Restore from backup.

### Show Indexes
```
/db indexes <table>
```
Show table indexes.

### Table Size
```
/db size [table]
```
Show table sizes.

## Examples

```
/db connect myapp_dev
/db tables
/db describe users
/db query "SELECT * FROM users LIMIT 10"
/db insert users '{"name": "John"}'
/db backup users
/db size
```
