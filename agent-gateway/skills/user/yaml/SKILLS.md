# YAML Skill

YAML processing.

## Commands

### Validate
```
/yaml validate <file>
```
Validate YAML syntax.

### Parse
```
/yaml parse <file>
```
Parse YAML.

### To JSON
```
/yaml to-json <file>
```
Convert to JSON.

### From JSON
```
/yaml from-json <json>
```
Convert from JSON.

### To TOML
```
/yaml to-toml <file>
```
Convert to TOML.

### To XML
```
/yaml to-xml <file>
```
Convert to XML.

### Get Value
```
/yaml get <key> <file>
```
Get value by key.

### Set Value
```
/yaml set <key> <value> <file>
```
Set value.

### Merge
```
/yaml merge <file1> <file2>
```
Merge YAML files.

### Extract Key
```
/yaml extract <key> <file>
```
Extract key.

### Format
```
/yaml format <file>
```
Format YAML.

### Sort Keys
```
/yaml sort <file>
```
Sort keys alphabetically.

### Compact
```
/yaml compact <file>
```
Remove whitespace.

### Anchor List
```
/yaml anchors <file>
```
List anchors.

## Examples

```
/yaml validate config.yaml
/yaml parse config.yaml
/yaml to-json config.yaml
/yaml from-json '{"name": "test"}'
/yaml to-toml config.yaml
/yaml to-xml config.yaml
/yaml get database.host config.yaml
/yaml set database.port 5432 config.yaml
/yaml merge base.yaml override.yaml
/yaml extract services config.yaml
/yaml format messy.yaml
/yaml sort config.yaml
/yaml compact config.yaml
/yaml anchors config.yaml
```
