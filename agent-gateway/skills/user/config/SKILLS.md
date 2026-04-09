# Config Skill

Configuration file management.

## Commands

### View Config
```
/config view <file>
```
View configuration file.

### Edit Config
```
/config edit <file>
```
Edit configuration file.

### Validate
```
/config validate <file>
```
Validate configuration syntax.

### Diff
```
/config diff <file1> <file2>
```
Compare configurations.

### Backup
```
/config backup <file>
```
Backup configuration.

### Restore
```
/config restore <file>
```
Restore from backup.

### Find Config
```
/config find <service>
```
Find config files for service.

### List Configs
```
/config list
```
List config directories.

### Template
```
/config template <name>
```
Generate config from template.

### Merge
```
/config merge <base> <override>
```
Merge configurations.

### Convert
```
/config convert <file> <format>
```
Convert config format (yaml, json, toml).

### Generate
```
/config generate <type>
```
Generate typical config.

## Examples

```
/config view /etc/nginx/nginx.conf
/config edit /etc/app/config.json
/config validate config.yaml
/config diff prod.yaml stage.yaml
/config backup nginx.conf
/config restore nginx.conf.bak
/config find nginx
/config list
/config template nginx
/config merge base.yaml override.yaml
/config convert config.json yaml
/config generate redis
```
