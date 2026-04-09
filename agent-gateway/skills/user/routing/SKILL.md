---
name: routing
description: Network routing protocols and configuration
category: networking
difficulty: intermediate
tags: [routing, bgp, ospf, network]
author: OpenCode Community
version: 1.0
last_updated: 2024-01-15
---

# Network Routing

## What I Do

I am Network Routing, the process of directing network traffic between different networks using routing protocols and configured routes. I enable communication between networks using interior gateway protocols (OSPF, EIGRP, IS-IS) for internal routing and exterior gateway protocols (BGP) for internet-wide routing. I implement route summarization, policy-based routing, and quality of service. I ensure optimal path selection through metrics, administrative distances, and route maps. I provide redundancy through multiple paths and fast convergence. I secure routing through authentication and route filtering.

## When to Use Me

- Enterprise network design
- ISP and backbone routing
- Multi-site connectivity
- VPN tunnel routing
- SD-WAN deployment
- Traffic engineering
- Policy-based routing
- Route optimization

## Code Examples

### Example 1: OSPF Configuration (Cisco)
```bash
# OSPF Routing Configuration

! Enable OSPF process
router ospf 1
    router-id 1.1.1.1
    auto-cost reference-bandwidth 10000
    log-adjacency-changes
    passive-interface default
    no passive-interface GigabitEthernet0/0
    no passive-interface GigabitEthernet0/1
    
    ! Route summarization
    summary-address 10.1.0.0 255.255.0.0
    
    ! Default route injection
    default-information originate always
    
    ! Area configuration
    area 0 authentication message-digest
    area 1 virtual-link 2.2.2.2 message-digest-key 1 md5 CISCO
    
    ! Route redistribution
    redistribute connected metric 100 metric-type 1 subnets
    redistribute bgp 65000 metric 100 metric-type 2 subnets

! Interface configuration
interface GigabitEthernet0/0
    description Uplink to Core
    ip address 10.0.0.1 255.255.255.252
    ip ospf authentication message-digest
    ip ospf message-digest-key 1 md5 CISCO
    ip ospf cost 10
    ip ospf dead-interval 40
    ip ospf hello-interval 10
    ip ospf priority 100

interface GigabitEthernet0/1
    description LAN Interface
    ip address 10.1.1.1 255.255.255.0
    ip ospf authentication null
    ip ospf cost 1
    ip ospf dead-interval 40
    ip ospf hello-interval 10

! Loopback for router ID
interface Loopback0
    ip address 1.1.1.1 255.255.255.255

! Route map for filtering
route-map BLOCK_INTERNAL deny 10
    match ip address 100
    set local-preference 50

route-map BLOCK_INTERNAL permit 20
    match interface GigabitEthernet0/0

! Access list for filtering
access-list 100 deny   10.2.0.0 0.0.255.255
access-list 100 permit any
```

### Example 2: BGP Configuration (Juniper)
```junos
# BGP Configuration for Juniper

system {
    host-name edge-router;
    root-authentication {
        encrypted-password "HASHED_PASSWORD";
    }
    login {
        class operator {
            permissions [ network routing trace ];
        }
    }
}

routing-options {
    router-id 1.1.1.1;
    autonomous-system 65000;
    
    forwarding-table {
        export ECMP-POLICY;
    }
    
    static {
        route 0.0.0.0/0 next-hop 203.0.113.1;
    }
}

protocols {
    bgp {
        group INTERNAL-PEERS {
            type internal;
            local-address 1.1.1.1;
            neighbor 2.2.2.2 {
                description Primary-ISP;
                local-as 65000;
                peer-as 65000;
                keepalive-time 10;
                hold-time 30;
                multipath;
            }
            neighbor 3.3.3.3 {
                description Backup-ISP;
                local-as 65000;
                peer-as 65000;
            }
        }
        
        group EXTERNAL-CUSTOMERS {
            type external;
            local-address 10.0.0.1;
            neighbor 10.0.0.2 {
                description Customer-A;
                peer-as 65001;
                import [ FILTER-INCOMMING EXPORT-OUTGOING ];
                export [ SET-COMMUNITIES ADD-LOCAL-PREF ];
            }
        }
        
        log-updown;
        hold-time 45;
        graceful-restart;
    }
    
    ospf {
        area 0.0.0.0 {
            interface ge-0/0/0.0 {
                hello-interval 10;
                dead-interval 40;
                authentication-type md5;
                md5-key 1 key "$9$KEY"; # encrypted
            }
            interface lo0.0 {
                passive;
            }
        }
    }
    
    lldp {
        interface all;
    }
}

policy-options {
    policy-statement EXPORT-OUTGOING {
        from protocol bgp;
        then {
            community add CUSTOMER-COMMUNITY;
            accept;
        }
    }
    
    policy-statement FILTER-INCOMMING {
        from {
            protocol bgp;
            community [ BLOCKED-COMMUNITIES ];
        }
        then reject;
    }
    
    community CUSTOMER-COMMUNITY members 65000:100;
    community BLOCKED-COMMUNITIES members [ 65000:666 65000:999 ];
}

firewall {
    filter BGP-FILTER {
        term ALLOW-BGP {
            from {
                protocol tcp;
                port bgp;
            }
            then accept;
        }
        term DENY-ALL {
            then {
                discard;
                count blocked-packets;
            }
        }
    }
}
```

### Example 3: Dynamic Routing with Quagga/FRR (Linux)
```bash
# FRR (Free Range Routing) Configuration
# /etc/frr/frr.conf

frr version 8.0
frr defaults traditional
hostname router1
password zebra
enable password zebra

! OSPF Configuration
router ospf
    ospf router-id 1.1.1.1
    redistribute connected
    redistribute bgp
    network 10.0.0.0/24 area 0
    network 10.1.0.0/24 area 0
    network 10.2.0.0/24 area 1
    area 1 stub no-summary
    area 1 range 10.2.0.0/24
    timers spf delay 50 holdtime 200
    max-metric router-lsa on-startup 300
    auto-cost reference-bandwidth 10000

! OSPF6 Configuration for IPv6
ipv6 router ospf6
    router-id 1.1.1.1
    redistribute connected
    interface eth0 area 0.0.0.0
    interface eth1 area 0.0.0.0

! BGP Configuration
router bgp 65000
    bgp router-id 1.1.1.1
    neighbor 10.0.0.2 remote-as 65001
    neighbor 10.0.0.2 description Primary-Upstream
    neighbor 10.0.0.2 ebgp-multihop 5
    neighbor 10.0.0.2 soft-reconfiguration inbound
    neighbor 10.0.0.2 prefix-list PL-IN in
    neighbor 10.0.0.2 prefix-list PL-OUT out
    
    address-family ipv4 unicast
        network 10.0.0.0/24
        network 10.1.0.0/24
        neighbor 10.0.0.2 activate
        neighbor 10.0.0.2 default-originate
        aggregate-address 10.0.0.0/22 summary-only
    exit-address-family
    
    address-family ipv6 unicast
        network 2001:db8::/32
        neighbor 2001:db8::2 activate
    exit-address-family

! IS-IS Configuration
router isis
    net 49.0001.0011.0000.0001.00
    metric-style wide
    log-adjacency-changes
    area-password CISCO
    domain-password SECRET
    interface eth0
        ip pointopoint-address 10.0.0.1
        isis circuit-type level-2
        isis metric 10
    interface lo
        passive
```

### Example 4: Route Policy Script (Python)
```python
#!/usr/bin/env python3
"""
Route Policy Manager - BGP and OSPF route manipulation
"""
import ipaddress
from typing import Dict, List, Set
from dataclasses import dataclass
from enum import Enum

class RouteAction(Enum):
    PERMIT = "permit"
    DENY = "deny"
    SET_COMMUNITY = "set_community"
    SET_LOCAL_PREF = "set_local_pref"
    SET_MED = "set_med"
    SET_NEXTHOP = "set_nexthop"

@dataclass
class Route:
    prefix: str
    next_hop: str
    metric: int = 100
    local_pref: int = 100
    community: Set[str] = None
    as_path: List[str] = None
    
    def __post_init__(self):
        if self.community is None:
            self.community = set()
        if self.as_path is None:
            self.as_path = []

class RoutePolicyEngine:
    def __init__(self):
        self.access_lists: Dict[str, List] = {}
        self.prefix_lists: Dict[str, List] = {}
        self.route_maps: Dict[str, List] = {}
        self.community_lists: Dict[str, Set] = {}
    
    def add_access_list(self, name: str, rules: List[Dict]):
        """Add an access list for route matching"""
        self.access_lists[name] = rules
    
    def add_prefix_list(self, name: str, prefixes: List[Dict]):
        """Add a prefix list for matching"""
        self.prefix_lists[name] = prefixes
    
    def match_access_list(self, route: Route, list_name: str) -> bool:
        """Check if route matches access list"""
        if list_name not in self.access_lists:
            return False
        
        for rule in self.access_lists[list_name]:
            action = rule.get('action', 'permit')
            if self._check_match(route, rule):
                return action == 'permit'
        
        return False
    
    def match_prefix_list(self, route: Route, list_name: str) -> bool:
        """Check if route prefix matches prefix list"""
        if list_name not in self.prefix_lists:
            return False
        
        route_net = ipaddress.IPv4Network(route.prefix, strict=False)
        
        for pl in self.prefix_lists[list_name]:
            prefix = ipaddress.IPv4Network(pl['prefix'], strict=False)
            match_type = pl.get('match', 'exact')
            
            if match_type == 'exact':
                if route_net == prefix:
                    return True
            elif match_type == 'longer':
                if prefix.subnet_of(route_net):
                    return True
            elif match_type == 'orlonger':
                if prefix.subnet_of(route_net):
                    return True
            elif match_type == 'prefix':
                if route_net.subnet_of(prefix):
                    return True
        
        return False
    
    def apply_route_map(self, route: Route, map_name: str) -> Route:
        """Apply route map to modify route"""
        if map_name not in self.route_maps:
            return route
        
        modified_route = route
        
        for sequence, rule in enumerate(self.route_maps[map_name], 1):
            if self._check_match(modified_route, rule.get('match', {})):
                for action in rule.get('actions', []):
                    modified_route = self._apply_action(modified_route, action)
                
                if rule.get('continue'):
                    continue
                break
        
        return modified_route
    
    def _check_match(self, route: Route, match_criteria: Dict) -> bool:
        """Check if route matches criteria"""
        # Match by prefix list
        if 'prefix_list' in match_criteria:
            if not self.match_prefix_list(route, match_criteria['prefix_list']):
                return False
        
        # Match by access list
        if 'access_list' in match_criteria:
            if not self.match_access_list(route, match_criteria['access_list']):
                return False
        
        # Match by community
        if 'community' in match_criteria:
            required = set(match_criteria['community'])
            if not required.issubset(route.community):
                return False
        
        # Match by AS path
        if 'as_path' in match_criteria:
            if not any(match in route.as_path for match in match_criteria['as_path']):
                return False
        
        # Match by next hop
        if 'next_hop' in match_criteria:
            if route.next_hop != match_criteria['next_hop']:
                return False
        
        return True
    
    def _apply_action(self, route: Route, action: Dict) -> Route:
        """Apply action to route"""
        action_type = action.get('type')
        
        if action_type == RouteAction.SET_LOCAL_PREF.value:
            route.local_pref = action['value']
        
        elif action_type == RouteAction.SET_MED.value:
            route.metric = action['value']
        
        elif action_type == RouteAction.SET_COMMUNITY.value:
            for comm in action.get('communities', []):
                if action.get('add'):
                    route.community.add(comm)
                else:
                    route.community.discard(comm)
        
        elif action_type == RouteAction.SET_NEXTHOP.value:
            route.next_hop = action['value']
        
        return route

# BGP Community Values
COMMUNITIES = {
    'NO_EXPORT': '65535:0',
    'NO_ADVERTISE': '65535:1',
    'BLACKHOLE': '65535:666',
    'PRECEDENCE_CRITICAL': '100:100',
    'PRECEDENCE_HIGH': '100:200',
}

def main():
    engine = RoutePolicyEngine()
    
    # Configure prefix list
    engine.add_prefix_list('CUSTOMER-NETWORKS', [
        {'prefix': '10.0.0.0/16', 'match': 'exact'},
        {'prefix': '10.1.0.0/24', 'match': 'orlonger'},
    ])
    
    # Configure route map
    engine.route_maps['INBOUND-POLICY'] = [
        {
            'match': {'prefix_list': 'CUSTOMER-NETWORKS'},
            'actions': [
                {'type': 'set_local_pref', 'value': 200},
                {'type': 'set_community', 'communities': ['100:100'], 'add': True}
            ]
        }
    ]
    
    # Test route
    test_route = Route(
        prefix='10.0.0.0/24',
        next_hop='192.168.1.1',
        local_pref=100
    )
    
    # Apply policy
    result = engine.apply_route_map(test_route, 'INBOUND-POLICY')
    
    print(f"Original: {test_route.prefix}, Local Pref: {test_route.local_pref}")
    print(f"Modified: {result.prefix}, Local Pref: {result.local_pref}")
    print(f"Communities: {result.community}")

if __name__ == '__main__':
    main()
```

## Best Practices

- Use route summarization to reduce routing table size
- Implement route filtering for security
- Use authentication for routing protocols
- Monitor routing protocol adjacencies
- Plan BGP communities for traffic engineering
- Use route reflectors for iBGP scaling
- Implement route flap damping
- Test configurations in lab before production
- Document all routing policies
- Monitor for route leaks and hijacks

## Core Competencies

- OSPF configuration and optimization
- BGP peering and policies
- Route summarization
- Route filtering and manipulation
- MPLS and segment routing
- Policy-based routing
- VRF and VRF-lite
- Multicast routing
- Route monitoring and troubleshooting
- Traffic engineering
