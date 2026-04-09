# Vault Skill

HashiCorp Vault secrets management.

## Commands

### Write Secret
```
/vault write <path> <key>=<value>
```
Write secret.

### Read Secret
```
/vault read <path>
```
Read secret.

### Delete Secret
```
/vault delete <path>
```
Delete secret.

### List Secrets
```
/vault list <path>
```
List secrets at path.

### Get Policy
```
/vault policy <name>
```
Show policy.

### Write Policy
```
/vault write-policy <name> <policy>
```
Write policy.

### Enable Auth
```
/vault enable-auth <method>
```
Enable auth method (github, ldap, userpass).

### Enable Secrets
```
/vault enable-secrets <engine>
```
Enable secrets engine (kv, aws, gcp, database).

### Token
```
/vault token
```
Show current token.

### Unseal
```
/vault unseal <key>
```
Unseal vault.

### Seal
```
/vault seal
```
Seal vault.

### Status
```
/vault status
```
Show vault status.

### Health
```
/vault health
```
Check vault health.

## Examples

```
/vault write secret/myapp API_KEY=xxx
/vault read secret/myapp
/vault delete secret/old
/vault list secret/
/vault policy my-policy
/vault write-policy developer "@policy.hcl"
/vault enable-auth github
/vault enable-secrets kv
/vault token
/vault unseal key1
/vault seal
/vault status
```
