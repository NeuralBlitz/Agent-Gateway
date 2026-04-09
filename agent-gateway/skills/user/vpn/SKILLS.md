# VPN Skill

VPN connection management.

## Commands

### Connect
```
/vpn connect <profile>
```
Connect to VPN.

### Disconnect
```
/vpn disconnect
```
Disconnect VPN.

### Status
```
/vpn status
```
Show VPN status.

### List Profiles
```
/vpn list
```
List VPN profiles.

### Add Profile
```
/vpn add <name> <config>
```
Add VPN profile.

### Remove Profile
```
/vpn remove <name>
```
Remove profile.

### Show Config
```
/vpn config <profile>
```
Show profile config.

### Test Connection
```
/vpn test
```
Test VPN connection.

### Traffic
```
/vpn traffic
```
Show VPN traffic stats.

## Examples

```
/vpn connect work
/vpn disconnect
/vpn status
/vpn list
/vpn add office /path/to/config.ovpn
/vpn remove old-profile
/vpn config work
/vpn test
```
