# CoreDNS Skill

DNS server for Kubernetes.

## Commands

### Zones
```
/coredns zones
```
List zones.

### Records
```
/coredns records <zone>
```
List records.

### Add Record
```
/coredns add <domain> <type> <value>
```
Add DNS record.

### Delete Record
```
/coredns delete <domain>
```
Delete record.

### Update
```
/coredns update <domain> <value>
```
Update record.

### Query
```
/coredns query <domain>
```
Query DNS.

### Health
```
/coredns health
```
Check health.

### Metrics
```
/coredns metrics
```
Show metrics.

### Reload
```
/coredns reload
```
Reload configuration.

### Config
```
/coredns config
```
Show config.

### Plugin List
```
/coredns plugins
```
List plugins.

### Cache
```
/coredns cache
```
Show cache stats.

### Errors
```
/coredns errors
```
Show error stats.

## Examples

```
/coredns zones
/coredns records example.com
/coredns add api.example.com A 1.2.3.4
/coredns delete old.example.com
/coredns update api.example.com 5.6.7.8
/coredns query api.example.com
/coredns health
/coredns metrics reload
/cored
/corednsns config
/coredns plugins
/coredns cache
/coredns errors
```
