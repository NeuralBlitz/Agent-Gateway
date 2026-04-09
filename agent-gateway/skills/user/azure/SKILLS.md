# Azure Skill

Microsoft Azure cloud management.

## Commands

### List VMs
```
/azure vm list
```
List virtual machines.

### VM Status
```
/azure vm status <name>
```
Get VM status.

### Start VM
```
/azure vm start <name>
```
Start virtual machine.

### Stop VM
```
/azure vm stop <name>
```
Stop virtual machine.

### List Storage
```
/azure storage list
```
List storage accounts.

### Blob Upload
```
/azure storage upload <container> <file>
```
Upload blob.

### List Functions
```
/azure function list
```
List Azure Functions.

### Invoke Function
```
/azure function invoke <name>
```
Invoke function.

### App Service List
```
/azure appservice list
```
List app services.

### List Containers
```
/azure container list
```
List containers.

### Cosmos DB
```
/azure cosmos list
```
List Cosmos DB databases.

### Key Vault
```
/azure keyvault list
```
List key vaults.

## Examples

```
/azure vm list
/azure vm status myvm
/azure vm start myvm
/azure vm stop myvm
/azure storage list
/azure storage upload mycontainer data.csv
/azure function list
/azure appservice list
/azure keyvault list
```
