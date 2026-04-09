# External-DNS Skill

External DNS management.

## Commands

### List Sources
```
/external-dns sources
```
List DNS sources.

### List Zones
```
/external-dns zones
```
List hosted zones.

### Sync
```
/external-dns sync
```
Force sync.

### Dry Run
```
/external-dns dry-run
```
Show changes without applying.

### Status
```
/external-dns status
```
Current status.

### Logs
```
/external-dns logs
```
Show logs.

### Endpoints
```
/external-dns endpoints
```
List endpoints.

### Metrics
```
/external-dns metrics
```
Show metrics.

### Test
```
/external-dns test <domain>
```
Test DNS lookup.

### Create Record
```
/external-dns create <domain> <type> <value>
```
Create record.

### Delete Record
```
/external-dns delete <domain>
```
Delete record.

### Update Record
```
/external-dns update <domain> <value>
```
Update record.

## Examples

```
/external-dns sources
/external-dns zones
/external-dns sync
/external-dns dry-run
/external-dns status
/external-dns logs
/external-dns endpoints
/external-dns metrics
/external-dns test api.example.com
/external-dns create api.example.com A 1.2.3.4
/external-dns delete old.example.com
/external-dns update api.example.com 5.6.7.8
```
