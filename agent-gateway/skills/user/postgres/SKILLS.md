# PostgreSQL Skill

PostgreSQL database operations.

## Commands

### Connect
```
/postgres connect <database>
```
Connect to database.

### List Databases
```
/postgres databases
```
List databases.

### List Tables
```
/postgres tables
```
List tables.

### Describe Table
```
/postgres describe <table>
```
Show table schema.

### Query
```
/postgres query <sql>
```
Execute SQL query.

### Explain
```
/postgres explain <sql>
```
Explain query plan.

### Analyze
```
/postgres analyze <table>
```
Analyze table.

### Vacuum
```
/postgres vacuum <table>
```
Vacuum table.

### Indexes
```
/postgres indexes <table>
```
List indexes.

### Constraints
```
/postgres constraints <table>
```
List constraints.

### Users
```
/postgres users
```
List users/roles.

### Grants
```
/postgres grants <table>
```
Show grants.

### Backup
```
/postgres backup <database>
```
Backup database.

### Restore
```
/postgres restore <file>
```
Restore database.

### Kill Connection
```
/postgres kill <pid>
```
Kill connection.

### Slow Queries
```
/postgres slow-queries
```
Show slow queries.

## Examples

```
/postgres connect myapp
/postgres databases
/postgres tables
/postgres describe users
/postgres query "SELECT * FROM users LIMIT 10"
/postgres explain "SELECT * FROM orders WHERE user_id = 1"
/postgres analyze users
/postgres vacuum users
/postgres indexes orders
/postgres constraints users
/postgres users
/postgres grants api_data
/postgres backup myapp
/postgres restore backup.sql
/postgres kill 12345
/postgres slow-queries
```
