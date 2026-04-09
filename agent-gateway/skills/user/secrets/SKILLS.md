# Secrets Skill

Secrets and credentials management.

## Commands

### Store Secret
```
/secrets set <key> <value>
```
Store secret.

### Get Secret
```
/secrets get <key>
```
Retrieve secret.

### Delete Secret
```
/secrets delete <key>
```
Delete secret.

### List Secrets
```
/secrets list [path]
```
List secrets.

### Exists
```
/secrets exists <key>
```
Check if secret exists.

### Encrypt
```
/secrets encrypt <value>
```
Encrypt value.

### Decrypt
```
/secrets decrypt <value>
```
Decrypt value.

### Generate Password
```
/secrets password [length]
```
Generate secure password.

### Generate API Key
```
/secrets apikey
```
Generate API key.

### Hash
```
/secrets hash <value>
```
Hash value.

### Verify
```
/secrets verify <value> <hash>
```
Verify hash.

### Export
```
/secrets export <path>
```
Export secrets.

### Import
```
/secrets import <path>
```
Import secrets.

## Examples

```
/secrets set db_password "supersecret"
/secrets get db_password
/secrets delete old_key
/secrets list
/secrets exists api_key
/secrets encrypt "my secret"
/secrets decrypt "encrypted..."
/secrets password 20
/secrets apikey
/secrets hash "password123"
/secrets export /backup/secrets.enc
```
