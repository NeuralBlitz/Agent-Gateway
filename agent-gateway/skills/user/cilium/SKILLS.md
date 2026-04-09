# Cilium Skill

Cilium CNI and networking.

## Commands

### Status
```
/cilium status
```
Show Cilium status.

### Config
```
/cilium config
```
Show configuration.

### Endpoint List
```
/cilium endpoint list
```
List endpoints.

### Endpoint Show
```
/cilium endpoint <id>
```
Show endpoint details.

### Policy
```
/cilium policy <action>
```
Manage network policy.

### Policy Trace
```
/cilium policy trace <from> <to>
```
Trace policy decision.

### Connectivity Test
```
/cilium connectivity test
```
Run connectivity tests.

### Hubble
```
/cilium hubble
```
Hubble observability.

### Hubble Status
```
/cilium hubble status
```
Hubble status.

### Hubble Flows
```
/cilium hubble flows
```
Observe flows.

### Node
```
/cilium node
```
List nodes.

### Service
```
/cilium service
```
List services.

### BGP
```
/cilium bgp
```
BGP configuration.

### Ingress
```
/cilium ingress
```
List ingress resources.

### Egress
```
/cilium egress
```
List egress resources.

## Examples

```
/cilium status
/cilium config
/cilium endpoint list
/cilium endpoint 1234
/cilium policy list
/cilium policy trace default:world default:health
/cilium connectivity test
/cilium hubble ui
/cilium hubble status
/cilium hubble flows
/cilium node
/cilium service
/cilium bgp peer
/cilium ingress
/cilium egress
```
