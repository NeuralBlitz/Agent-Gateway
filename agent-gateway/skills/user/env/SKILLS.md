# Environment Skill

Environment variable management.

## Commands

### List Env
```
/env list
```
List all environment variables.

### Get Var
```
/env get <name>
```
Get variable value.

### Set Var
```
/env set <name> <value>
```
Set environment variable.

### Unset
```
/env unset <name>
```
Remove variable.

### Export
```
/env export <name> <value>
```
Export variable to shell.

### Load File
```
/env load <file>
```
Load .env file.

### Save File
```
/env save <file>
```
Save to .env file.

### Path Add
```
/env path-add <directory>
```
Add to PATH.

### Path Remove
```
/env path-remove <directory>
```
Remove from PATH.

### Expand
```
/env expand <value>
```
Expand variables in value.

### Current Shell
```
/env shell
```
Show current shell.

### Shell Config
```
/env config
```
Show config file locations.

## Examples

```
/env list
/env get PATH
/env set DEBUG true
/env unset OLD_VAR
/env export API_KEY "xxx"
/env load .env.production
/env save .env.local
/env path-add /usr/local/bin
/env expand "$HOME/.local"
/env shell
/env config
```
