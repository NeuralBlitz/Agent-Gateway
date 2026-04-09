---
name: switching
description: Network switching fundamentals
license: MIT
compatibility: opencode
metadata:
  audience: network-engineers
  category: networking
---

## What I do

- Configure and manage network switches
- Implement VLANs and trunking
- Configure spanning tree protocols
- Set up switch stacking and stacking
- Manage VLAN routing (SVI)
- Implement port security
- Configure switch monitoring

## When to use me

Use me when:
- Designing local area networks
- Configuring access/aggregation switches
- Implementing network segmentation
- Troubleshooting connectivity issues
- Setting up switch infrastructure

## Key Concepts

### Layer 2 Switching
Switches operate at Layer 2, forwarding based on MAC addresses:

```
┌─────────────────────────────────────┐
│         Switch Forwarding           │
├─────────────────────────────────────┤
│ MAC Address Table (CAM Table)       │
│ Port 1: aa:bb:cc:dd:ee:ff          │
│ Port 2: 11:22:33:44:55:66          │
│ Port 3: aa:bb:cc:dd:ee:11          │
└─────────────────────────────────────┘

Frames forwarded based on:
- Destination MAC known → Forward to port
- Unknown → Flood to all ports
- Broadcast → Flood to all ports
```

### VLAN Configuration
```cisco
! Create VLANs
vlan 10
  name Data
vlan 20
  name Voice
vlan 99
  name Management

! Assign ports to VLANs
interface GigabitEthernet0/1
  switchport mode access
  switchport access vlan 10
  spanning-tree portfast

! Trunk port
interface GigabitEthernet0/24
  switchport trunk encapsulation dot1q
  switchport mode trunk
  switchport trunk allowed vlan 10,20,99
```

### Spanning Tree Protocol
- **STP**: 802.1D, 50-second convergence
- **RSTP**: 802.1w, rapid convergence
- **MSTP**: 802.1s, multiple spanning trees
- **PVST+**: Per-VLAN STP (Cisco)

### Switch Features
- Port Security: Limit MAC addresses
- DHCP Snooping: Prevent rogue servers
- ARP Inspection: Prevent ARP spoofing
- Storm Control: Broadcast suppression
- QoS: Traffic prioritization
