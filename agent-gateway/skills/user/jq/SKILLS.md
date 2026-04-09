# jq Skill

JSON processor.

## Commands

### Parse
```
/jq . <file>
```
Parse JSON.

### Get Key
```
/jq .<key> <file>
```
Get key value.

### Nested
```
/jq .<key>.<subkey> <file>
```
Get nested value.

### Array
```
/jq .[0] <file>
```
Get array element.

### Array All
```
/jq .[] <file>
```
Iterate array.

### Map
```
/jq map(.key) <file>
```
Map over array.

### Select
```
/jq 'select(.key == "value")' <file>
```
Filter array.

### Keys
```
/jq keys <file>
```
Get object keys.

### Values
```
/jq .[] <file>
```
Get all values.

### Length
```
/jq length <file>
```
Get length.

### Has Key
```
/jq has("key") <file>
```
Check key exists.

### Null Check
```
/jq .key? <file>
```
Safe key access.

### String
```
/jq .key + "text" <file>
```
String operations.

### Number
```
/jq .num + 1 <file>
```
Number operations.

### Group
```
/jq group_by(.key) <file>
```
Group array.

### Unique
```
/jq unique <file>
```
Unique values.

### Convert YAML
```
/jq -y <file>
```
Output YAML.

## Examples

```
/jq . config.json
/jq .name user.json
/jq .address.city user.json
/jq .users[0] data.json
/jq .users[] data.json
/jq '.users[] | .name' data.json
/jq 'select(.age > 18)' users.json
/jq keys config.json
/jq '.users | length' data.json
/jq 'has("email")' user.json
/jq '.name + " Smith"' user.json
/jq '.age + 1' user.json
/jq 'group_by(.department)' employees.json
/jq 'unique' duplicates.json
/jq -y data.json
```
