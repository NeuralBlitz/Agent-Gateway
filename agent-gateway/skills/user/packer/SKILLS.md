# Packer Skill

Machine image building.

## Commands

### Init
```
/packer init <template>
```
Initialize template.

### Validate
```
/packer validate <template>
```
Validate template.

### Build
```
/packer build <template>
```
Build image.

### Build Debug
```
/packer build-debug <template>
```
Build in debug mode.

### Inspect
```
/packer inspect <template>
```
Inspect template.

### Fix
```
/packer fix <template>
```
Fix template.

### HCL2 Upgrade
```
/packer hcl2_upgrade <template>
```
Upgrade to HCL2.

### Post-Processor
```
/packer pp list
```
List post-processors.

### Plugins
```
/packer plugins
```
List installed plugins.

### Version
```
/packer version
```
Show version.

### Stoplb
```
/packer log
```
View logs.

## Examples

```
/packer init aws-ubuntu.pkr.hcl
/packer validate aws-ubuntu.pkr.hcl
/packer build aws-ubuntu.pkr.hcl
/packer build-debug aws-ubuntu.pkr.hcl
/packer inspect template.pkr.hcl
/packer fix old-template.json
/packer hcl2_upgrade old-template.json
/packer plugins
/packer version
```
