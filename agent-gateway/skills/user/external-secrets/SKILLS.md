# External-Secrets Skill

External secrets management.

## Commands

### List SecretStore
```
/externalsecrets stores
```
List secret stores.

### List ExternalSecret
```
/externalsecrets secrets
```
List external secrets.

### Create SecretStore
```
/externalsecrets create store <name>
```
Create secret store.

### Create ExternalSecret
```
/externalsecrets create secret <name>
```
Create external secret.

### Delete
```
/externalsecrets delete <type> <name>
```
Delete resource.

### Sync
```
/externalsecrets sync <name>
```
Sync secret.

### Get
```
/externalsecrets get <name>
```
Get secret value.

### AWS
```
/externalsecrets aws <action>
```
AWS Secrets Manager.

### GCP
```
/externalsecrets gcp <action>
```
GCP Secret Manager.

### Azure
```
/externalsecrets azure <action>
```
Azure Key Vault.

### Vault
```
/externalsecrets vault <action>
```
HashiCorp Vault.

### Cluster SecretStore
```
/externalsecrets clusterstores
```
List cluster secret stores.

### Kind
```
/externalsecrets kind <name>
```
Get kind details.

## Examples

```
/externalsecrets stores
/externalsecrets secrets
/externalsecrets create store aws-store
/externalsecrets create secret my-secret
/externalsecrets delete secret my-secret
/externalsecrets sync my-secret
/externalsecrets get my-secret
/externalsecrets aws list
/externalsecrets gcp list
/externalsecrets azure list
/externalsecrets vault list
/externalsecrets clusterstores
/externalsecrets kind my-secret
```
