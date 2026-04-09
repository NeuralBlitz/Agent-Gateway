# SOPS Skill

Secrets management with encryption.

## Commands

### Encrypt
```
/sops encrypt <file>
```
Encrypt file.

### Decrypt
```
/sops decrypt <file>
```
Decrypt file.

### Edit
```
/sops edit <file>
```
Edit encrypted file.

### Set
```
/sops set <file> <path> <value>
```
Set value in file.

### Get
```
/sops get <file> <path>
```
Get value from file.

### Encrypt Path
```
/sops encrypt-path <file> <path>
```
Encrypt specific path.

### Decrypt Path
```
/sops decrypt-path <file> <path>
```
Decrypt specific path.

### Show
```
/sops show <file>
```
Show decrypted content.

### Rotate
```
/sops rotate <file>
```
Rotate keys.

### Keys
```
/sops keys
```
Show encryption keys.

### Add Profile
```
/sops set-profile <file> <profile>
```
Set AWS profile.

### Age Key Gen
```
/sops age-gen
```
Generate age key.

## Examples

```
/sops encrypt secrets.yaml
/sops decrypt secrets.yaml.enc
/sops edit secrets.yaml
/sops set secrets.yaml "db.password" "newpass"
/sops get secrets.yaml "db.password"
/sops encrypt-path secrets.yaml "api_keys"
/ops decrypt-path secrets.yaml "api_keys"
/sops show secrets.yaml.enc
/sops rotate secrets.yaml
/sops keys
/sops set-profile secrets.yaml production
/sops age-gen
```
