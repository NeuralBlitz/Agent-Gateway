# Firewall Skill

Firewall management (iptables, nft).

## Commands

### List Rules
```
/firewall list [chain]
```
List firewall rules.

### Add Rule
```
/firewall add <rule>
```
Add firewall rule.

### Delete Rule
```
/firewall delete <rule>
```
Delete rule.

### Allow Port
```
/firewall allow <port>
```
Allow port.

### Deny Port
```
/firewall deny <port>
```
Deny port.

### Allow IP
```
/firewall allow-ip <ip>
```
Allow IP address.

### Block IP
```
/firewall block <ip>
```
Block IP address.

### Allow Service
```
/firewall allow-service <service>
```
Allow service (http, https, ssh).

### NAT
```
/firewall nat <internal> <external>
```
Configure NAT.

### Redirect
```
/firewall redirect <from> <to>
```
Port redirect.

### Save
```
/firewall save
```
Save rules.

### Restore
```
/firewall restore
```
Restore rules.

### Status
```
/firewall status
```
Show firewall status.

### Flush
```
/firewall flush [chain]
```
Flush rules.

## Examples

```
/firewall list
/firewall add "iptables -A INPUT -p tcp --dport 80 -j ACCEPT"
/firewall allow 8080
/firewall deny 23
/firewall allow-ip 192.168.1.100
/firewall block 10.0.0.5
/firewall allow-service https
/firewall nat 192.168.1.10 203.0.113.5
/firewall redirect 8080 80
/firewall save
/firewall restore
/firewall status
/firewall flush
```
