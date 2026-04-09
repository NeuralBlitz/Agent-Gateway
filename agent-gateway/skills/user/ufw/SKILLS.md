# UFW Skill

Uncomplicated Firewall management.

## Commands

### Enable
```
/ufw enable
```
Enable UFW.

### Disable
```
/ufw disable
```
Disable UFW.

### Status
```
/ufw status
```
Show UFW status.

### Allow Port
```
/ufw allow <port>
```
Allow port.

### Deny Port
```
/ufw deny <port>
```
Deny port.

### Allow Service
```
/ufw allow <service>
```
Allow service (ssh, http, https).

### Delete Rule
```
/ufw delete <rule>
```
Delete rule.

### Insert Rule
```
/ufw insert <rule>
```
Insert rule at position.

### List Rules
```
/ufw rules
```
List all rules.

### Reset
```
/ufw reset
```
Reset UFW to defaults.

### Default Policy
```
/ufw default <action> <direction>
```
Set default policy (allow/deny, incoming/outgoing).

### Logging
```
/ufw logging <level>
```
Set logging level (off, low, medium, high).

### Show
```
/ufw show <type>
```
Show added rules (added, listening, active).

## Examples

```
/ufw enable
/ufw disable
/ufw status
/ufw allow 80
/ufw allow 443
/ufw allow ssh
/ufw deny 23
/ufw delete allow 80
/ufw insert 1 allow 8080
/ufw rules
/ufw reset
/ufw default deny incoming
/ufw default allow outgoing
/ufw logging medium
/ufw show added
```
