# K3s Skill

Lightweight Kubernetes.

## Commands

### Install
```
/k3s install
```
Install K3s.

### Start
```
/k3s start
```
Start K3s.

### Stop
```
/k3s stop
```
Stop K3s.

### Status
```
/k3s status
```
Show status.

### Enable
```
/k3s enable <addon>
```
Enable addon.

### Disable
```
/k3s disable <addon>
```
Disable addon.

### kubectl
```
/k3s kubectl <args>
```
Run kubectl.

### Agent
```
/k3s agent
```
Start agent.

### Server
```
/k3s server
```
Start server.

### Token List
```
/k3s token
```
List node tokens.

### Token Create
```
/k3s token create
```
Create new token.

### Version
```
/k3s version
```
Show version.

### Uninstall
```
/k3s uninstall
```
Uninstall K3s.

### Config
```
/k3s config
```
Show config.

### Check
```
/k3s check
```
Check setup.

## Examples

```
/k3s install
/k3s start
/k3s stop
/k3s status
/k3s enable traefik
/k3s disable servicelb
/k3s kubectl get pods
/k3s agent
/k3s server
/k3s token
/k3s token create
/k3s version
/k3s uninstall
/k3s config
/k3s check
```
