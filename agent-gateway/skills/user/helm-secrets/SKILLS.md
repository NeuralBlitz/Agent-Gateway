# Helm Secrets Skill

Helm secrets management.

## Commands

### View
```
/helm-secrets view <file>
```
View decrypted file.

### Edit
```
/helm-secrets edit <file>
```
Edit encrypted file.

### Decrypt
```
/helm-secrets decrypt <file>
```
Decrypt file.

### Encrypt
```
/helm-secrets encrypt <file>
```
Encrypt file.

### Clean
```
/helm-secrets clean <dir>
```
Clean temp files.

### Template
```
/helm-secrets template <chart>
```
Template with secrets.

### Upgrade
```
/helm-secrets upgrade <release> <chart>
```
Upgrade with secrets.

### Install
```
/helm-secrets install <release> <chart>
```
Install with secrets.

### Diff
```
/helm-secrets diff <release> <chart>
```
Show secrets diff.

### Reveal
```
/helm-secrets reveal <file>
```
Reveal secrets.

### Hide
```
/helm-secrets hide <file>
```
Hide secrets.

## Examples

```
/helm-secrets view secrets.yaml
/helm-secrets edit secrets.yaml
/helm-secrets decrypt secrets.yaml
/helm-secrets encrypt secrets.yaml
/helm-secrets clean ./tmp
/helm-secrets template ./chart
/helm-secrets upgrade myapp ./chart
/helm-secrets install myapp ./chart
/helm-secrets diff myapp ./chart
/helm-secrets reveal secrets.yaml
/helm-secrets hide secrets.yaml
```
