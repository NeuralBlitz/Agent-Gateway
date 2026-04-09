---
name: software-defined-networking
description: Software-defined networking concepts
license: MIT
compatibility: opencode
metadata:
  audience: network-engineers
  category: networking
---

## What I do

- Implement SDN principles and architectures
- Deploy network programmability
- Configure SDN controllers
- Design overlay networks
- Implement network virtualization
- Manage network policies through software

## When to use me

Use me when:
- Modernizing network infrastructure
- Implementing network automation
- Building private cloud networks
- Creating multi-tenant environments
- Requiring dynamic network configuration

## Key Concepts

### SDN Benefits
- **Centralized Control**: Single view of network
- **Programmability**: API-driven configuration
- **Agility**: Rapid service deployment
- **Cost**: Reduced hardware dependency
- **Automation**: Reduced manual tasks

### Overlay vs Underlay
- **Underlay**: Physical network (switches, routers)
- **Overlay**: Virtual network on top (VXLAN, NVGRE)

```
Physical Network (Underlay)
   │
   │  +──────────────────────┐
   │  │    VXLAN Tunnel      │
   │  │  (Overlay Network)   │
   │  │   Tenant A │ Tenant B│
   │  └──────────────────────┘
   ▼
VM A ──────────────── VM B
```

### Network Virtualization
- VXLAN: MAC in UDP encapsulation
- NVGRE: GRE encapsulation
- Geneve: Flexible encapsulation
- STT: Stateless tunnel transport
