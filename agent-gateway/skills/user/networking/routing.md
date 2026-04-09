---
name: Routing
description: Network routing protocols and configuration
license: MIT
compatibility: Cross-platform (BIRD, Quagga, Cisco, Linux)
audience: Network engineers and DevOps professionals
category: Networking
---

# Routing Configuration

## What I Do

I provide guidance for implementing and managing network routing. I cover BGP, OSPF, routing policies, route optimization, and routing daemon configuration.

## When to Use Me

- Configuring routing protocols
- Setting up BGP peering
- Implementing route policies
- Troubleshooting routing issues
- Optimizing routing tables

## Core Concepts

- **BGP (Border Gateway Protocol)**: Inter-domain routing
- **OSPF (Open Shortest Path First)**: Interior gateway protocol
- **RIP (Routing Information Protocol)**: Distance-vector protocol
- **Route Maps**: Policy-based routing
- **Routing Tables**: Forwarding information base
- **Next Hop Resolution**: Path determination
- **Route Aggregation**: CIDR summarization
- **Route Flap Damping**: BGP stability
- **Anycast**: Multiple endpoints, single IP
- **ECMP**: Equal-cost multi-path

## Code Examples

### BGP Configuration with BIRD

```bird
# /etc/bird/bird.conf

# Router ID
router id 203.0.113.10;

# Protocol definitions
protocol kernel {
    learn;
    export all;
    persist;
}

protocol device {
    scan time 10;
}

# Static routes
protocol static {
    route 10.0.0.0/16 via 203.0.113.1;
    route 10.1.0.0/16 via 203.0.113.2;
}

# OSPF protocol
protocol ospf "ospf_main" {
    rfc1583compat yes;
    tick 2;
    
    area 0.0.0.0 {
        stub no;
        networks {
            203.0.113.0/24;
            10.0.0.0/16;
        };
        interface "eth0" {
            hello 10;
            retransmit 5;
            transmit 1;
            dead count 4;
            authentication none;
        };
        interface "eth1" {
            hello 10;
            retransmit 5;
            transmit 1;
            dead count 4;
            authentication none;
        };
    };
}

# BGP peers
template bgp "bgp_template" {
    local as 65001;
    multihop 2;
    hold time 90;
    connect retry time 120;
    source address 203.0.113.10;
    
    import all;
    export all;
}

# Customer peer 1
protocol bgp "customer1" from bgp_template {
    neighbor 203.0.113.100 as 65002;
    
    import where {
        if net = 10.10.0.0/16 then accept;
        else reject;
    };
    
    export where {
        if net = 203.0.113.0/24 then accept;
        else reject;
    };
}

# Upstream provider
protocol bgp "upstream1" from bgp_template {
    neighbor 203.0.113.1 as 64512;
    
    import where {
        if net ~ 0.0.0.0/0 then reject;
        if net ~ 10.0.0.0/8 then reject;
        if net ~ 172.16.0.0/12 then reject;
        if net ~ 192.168.0.0/16 then reject;
        accept;
    };
    
    export where {
        if net ~ 10.10.0.0/16 then accept;
        reject;
    };
}

# Route filtering with prefix lists
function is_local_network()
{
    return net ~ [
        10.0.0.0/8{16,24},
        172.16.0.0/12{16,24},
        192.168.0.0/16{16,24}
    ];
}

function is_valid_bgp_route()
{
    if (bgp_path.len > 15) then return false;
    if (bgp_path.last ~ [64512, 64513, 64514]) then return false;
    return true;
}
```

### Route Management with Python

```python
import subprocess
import json
import re
from dataclasses import dataclass
from typing import List, Optional, Dict
from enum import Enum
import time

class RouteProtocol(Enum):
    CONNECTED = 2
    STATIC = 3
    OSPF = 12
    BGP = 14
    KERNEL = 24

@dataclass
class Route:
    destination: str
    gateway: str
    genmask: str
    flags: str
    metric: int
    ref: int
    use: int
    interface: str
    protocol: RouteProtocol

class RouteManager:
    def __init__(self):
        self.routes: List[Route] = []
    
    def get_routes(self) -> List[Route]:
        """Get current routing table."""
        output = subprocess.check_output(["route", "-n"], text=True)
        
        routes = []
        for line in output.split("\n"):
            if line.startswith("Kernel") or line.startswith("Destination"):
                continue
            
            parts = line.split()
            if len(parts) < 8:
                continue
            
            try:
                route = Route(
                    destination=parts[0],
                    gateway=parts[1],
                    genmask=parts[2],
                    flags=parts[3],
                    metric=int(parts[4]),
                    ref=int(parts[5]),
                    use=int(parts[6]),
                    interface=parts[7],
                    protocol=RouteProtocol.KERNEL
                )
                routes.append(route)
            except (ValueError, IndexError):
                continue
        
        self.routes = routes
        return routes
    
    def add_route(self, destination: str, gateway: str, 
                   netmask: str = "255.255.255.0",
                   interface: Optional[str] = None,
                   metric: int = 1) -> bool:
        """Add a static route."""
        cmd = ["route", "add", "-net", destination, "netmask", netmask, 
               "gw", gateway, "metric", str(metric)]
        
        if interface:
            cmd.extend(["dev", interface])
        
        try:
            subprocess.run(cmd, check=True)
            return True
        except subprocess.CalledProcessError:
            return False
    
    def delete_route(self, destination: str, 
                      netmask: str = "255.255.255.0",
                      gateway: Optional[str] = None) -> bool:
        """Delete a static route."""
        cmd = ["route", "del", "-net", destination, "netmask", netmask]
        
        if gateway:
            cmd.extend(["gw", gateway])
        
        try:
            subprocess.run(cmd, check=True)
            return True
        except subprocess.CalledProcessError:
            return False
    
    def add_route_via_interface(self, destination: str, interface: str,
                                 source: Optional[str] = None) -> bool:
        """Add a route directly via interface (no gateway)."""
        cmd = ["ip", "route", "add", destination, "dev", interface]
        
        if source:
            cmd.extend(["src", source])
        
        try:
            subprocess.run(cmd, check=True)
            return True
        except subprocess.CalledProcessError:
            return False
    
    def get_route_to(self, destination: str) -> Optional[Route]:
        """Get the route used to reach a destination."""
        output = subprocess.check_output(
            ["ip", "route", "get", destination],
            text=True
        )
        
        match = re.search(r"(\S+)\s+via\s+(\S+)", output)
        if match:
            return Route(
                destination=destination,
                gateway=match.group(2),
                genmask="",
                flags="",
                metric=0,
                ref=0,
                use=0,
                interface="",
                protocol=RouteProtocol.KERNEL
            )
        
        return None
    
    def enable_ip_forwarding(self) -> bool:
        """Enable IP forwarding."""
        try:
            subprocess.run(["sysctl", "-w", "net.ipv4.ip_forward=1"], check=True)
            return True
        except subprocess.CalledProcessError:
            return False
    
    def configure_policy_routing(self, table: int = 100) -> bool:
        """Configure policy routing."""
        try:
            subprocess.run(["ip", "rule", "add", "from", "10.0.0.0/8", 
                          "table", str(table)], check=True)
            subprocess.run(["ip", "route", "add", "default", "via", "gateway_ip",
                          "table", str(table)], check=True)
            return True
        except subprocess.CalledProcessError:
            return False

class BGPNeighborManager:
    def __init__(self, neighbor_ip: str, asn: int):
        self.neighbor_ip = neighbor_ip
        self.asn = asn
        self.state = "idle"
        self.routes_received = 0
        self.routes_sent = 0
        self.last_update = None
    
    def get_bgp_state(self) -> Dict:
        """Get BGP peer state."""
        output = subprocess.check_output(
            ["vtysh", "-c", f"show ip bgp neighbor {self.neighbor_ip}"],
            text=True,
            stderr=subprocess.DEVNULL
        )
        
        state_info = {}
        
        patterns = {
            "BGP state": r"BGP state = (\w+)",
            "Local AS": r"Local AS number (\d+)",
            "Remote AS": r"Remote AS number (\d+)",
            "Routes received": r"(\d+) network entries",
            "Messages sent": r"(\d+) total messages sent",
            "Messages received": r"(\d+) total messages received",
        }
        
        for key, pattern in patterns.items():
            match = re.search(pattern, output)
            if match:
                if key in ["Routes received", "Messages sent", "Messages received"]:
                    state_info[key.lower().replace(" ", "_")] = int(match.group(1))
                else:
                    state_info[key.lower().replace(" ", "_")] = match.group(1)
        
        return state_info
    
    def clear_bgp_routes(self) -> bool:
        """Clear BGP routes from a neighbor."""
        try:
            subprocess.run(
                ["vtysh", "-c", f"clear ip bgp {self.neighbor_ip}"],
                check=True
            )
            return True
        except subprocess.CalledProcessError:
            return False
    
    def soft_reset(self) -> bool:
        """Perform a soft reset of the BGP session."""
        try:
            subprocess.run(
                ["vtysh", "-c", 
                 f"clear ip bgp {self.neighbor_ip} soft in/out"],
                check=True
            )
            return True
        except subprocess.CalledProcessError:
            return False
```

## Best Practices

1. **Use Route Aggregation**: Reduce routing table size
2. **Implement Route Filtering**: Prevent route leaks
3. **Monitor Routing Stability**: Track BGP updates
4. **Use Route Maps**: Fine-grained policy control
5. **Implement RPKI**: Prevent route hijacking
6. **Configure Route Reflectors**: Scale BGP deployments
7. **Use BFD**: Fast failure detection
8. **Document Routing Policies**: Maintain runbooks
9. **Test Changes**: Use routing protocol testbeds
10. **Monitor Performance**: Track convergence times
