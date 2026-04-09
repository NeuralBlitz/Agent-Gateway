# Elasticsearch Skill

Elasticsearch operations and queries.

## Commands

### Cluster Health
```
/es health
```
Show cluster health.

### Cluster Stats
```
/es stats
```
Show cluster statistics.

### List Indices
```
/es indices
```
List all indices.

### Create Index
```
/es create <index> [mapping]
```
Create index with mapping.

### Delete Index
```
/es delete <index>
```
Delete index.

### Index Info
```
/es info <index>
```
Show index details.

### Search
```
/es search <index> <query>
```
Search index.

### Count
```
/es count <index>
```
Count documents.

### Index Document
```
/es index <index> <document>
```
Index single document.

### Bulk Index
```
/es bulk <index> <file>
```
Bulk index documents.

### Delete Doc
```
/es delete <index> <id>
```
Delete document.

### Update Doc
```
/es update <index> <id> <data>
```
Update document.

### Aggregations
```
/es aggs <index> <aggregation>
```
Run aggregations.

### Mapping
```
/es mapping <index>
```
Show index mapping.

### Reindex
```
/es reindex <source> <dest>
```
Reindex data.

### Alias
```
/es alias <action> <index> <alias>
```
Add/remove alias.

## Examples

```
/es health
/es stats
/es indices
/es create users '{"mappings": {"properties": {"name": {"type": "keyword"}}}}'
/es delete old-index
/es search logs '*'
/es count events
/es index users '{"name": "John", "age": 30}'
/es bulk users data.json
/es mapping logs
/es reindex old-index new-index
/es alias add my-index latest
```
