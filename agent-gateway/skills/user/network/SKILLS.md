# Network Skill

Network diagnostics, monitoring, and configuration.

## Commands

### Ping Host
```
/network ping <host> [count]
```
Ping a host. Default: 4 packets.

### Check Port
```
/network port <host> <port>
```
Check if a port is open on a host.

### DNS Lookup
```
/network dns <domain>
```
Perform DNS lookup for a domain.

### Trace Route
```
/network trace <host>
```
Trace route to a host.

### Local IP
```
/network localip
```
Show local IP address.

### External IP
```
/network externalip
```
Show external/public IP address.

### Bandwidth
```
/network bandwidth [interface]
```
Show network bandwidth. Default: all interfaces.

### Connections
```
/network connections
```
Show active network connections.

### HTTP Headers
```
/network headers <url>
```
Show HTTP headers for a URL.

### Download
```
/network download <url> [filename]
```
Download a file from URL.

## Examples

```
/network ping google.com
/network port example.com 443
/network dns myapp.io
/network trace 8.8.8.8
/network localip
/network externalip
/network connections
```
