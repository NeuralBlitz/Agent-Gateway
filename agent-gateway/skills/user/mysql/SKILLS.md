# MySQL Skill

MySQL database operations.

## Commands

### Connect
```
/mysql connect <database>
```
Connect to database.

### List Databases
```
/mysql databases
```
List databases.

### List Tables
```
/mysql tables
```
List tables.

### Describe Table
```
/mysql describe <table>
```
Show table schema.

### Query
```
/mysql query <sql>
```
Execute SQL query.

### Explain
```
/mysql explain <sql>
```
Explain query.

### Show Processlist
```
/mysql processlist
```
Show processes.

### Kill Query
```
/mysql kill <query-id>
```
Kill query.

### Variables
```
/mysql variables
```
Show variables.

### Status
```
/mysql status
```
Show status.

### Users
```
/mysql users
```
List users.

### Grants
```
/mysql grants <user>
```
Show user grants.

### Backup
```
/mysql backup <database>
```
Backup database.

### Restore
```
/mysql restore <file>
```
Restore database.

### Binlog
```
/mysql binlog
```
Show binlog status.

### Slow Query Log
```
/mysql slow-log
```
Show slow queries.

## Examples

```
/mysql connect myapp
/mysql databases
/mysql tables
/mysql describe users
/mysql query "SELECT * FROM users LIMIT 10"
/mysql explain "SELECT * FROM orders WHERE user_id = 1"
/mysql processlist
/mysql kill 12345
/mysql variables
/mysql status
/mysql users
/mysql grants root
/mysql backup myapp
/mysql restore backup.sql
/mysql slow-log
```
