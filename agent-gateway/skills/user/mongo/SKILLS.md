# MongoDB Skill

MongoDB database operations.

## Commands

### Connect
```
/mongo connect <database>
```
Connect to database.

### List Databases
```
/mongo databases
```
List databases.

### List Collections
```
/mongo collections
```
List collections.

### Find
```
/mongo find <collection> <query>
```
Find documents.

### Find One
```
/mongo find-one <collection> <query>
```
Find single document.

### Insert One
```
/mongo insert <collection> <json>
```
Insert document.

### Insert Many
```
/mongo insert-many <collection> <json-array>
```
Insert multiple documents.

### Update One
```
/mongo update <collection> <query> <update>
```
Update document.

### Update Many
```
/mongo update-many <collection> <query> <update>
```
Update multiple documents.

### Delete One
```
/mongo delete <collection> <query>
```
Delete document.

### Delete Many
```
/mongo delete-many <collection> <query>
```
Delete multiple documents.

### Count
```
/mongo count <collection>
```
Count documents.

### Aggregate
```
/mongo aggregate <collection> <pipeline>
```
Run aggregation.

### Indexes
```
/mongo indexes <collection>
```
List indexes.

### Stats
```
/mongo stats [collection]
```
Show statistics.

### Users
```
/mongo users
```
List users.

### Roles
```
/mongo roles
```
List roles.

## Examples

```
/mongo connect myapp
/mongo databases
/mongo collections
/mongo find users '{"age": {"$gt": 18}}'
/mongo find-one users '{"_id": ObjectId("...")}'
/mongo insert users '{"name": "John", "age": 30}'
/mongo update users '{"name": "John"}' '{"$set": {"age": 31}}'
/mongo delete users '{"active": false}'
/mongo count users
/mongo aggregate orders '[{"$group": {"_id": "$status", "total": {"$sum": "$amount"}}}]'
/mongo indexes users
/mongo stats
/mongo users
```
