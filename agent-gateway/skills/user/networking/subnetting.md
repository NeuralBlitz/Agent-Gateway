---
name: Subnetting
description: IP subnetting and network segmentation
license: MIT
compatibility: Cross-platform (Network tools and CLI)
audience: Network engineers and system administrators
category: Networking
---

# Subnetting

## What I Do

I provide guidance for IP subnetting and network segmentation. I cover CIDR notation, subnet masks, VLAN configuration, and network design principles.

## When to Use Me

- Designing network architecture
- Configuring subnets for services
- Implementing network segmentation
- Planning IP address allocation
- Troubleshooting IP conflicts

## Core Concepts

- **CIDR Notation**: IP address with prefix length
- **Subnet Masks**: Binary representation of network/host bits
- **Private IP Ranges**: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
- **VLANs**: Layer 2 network segmentation
- **Supernetting**: Combining smaller networks
- **Variable Length Subnet Masks**: Different sizes for different needs
- **NAT**: Network address translation
- **IP Address Management**: Allocation and tracking
- **Network Address Planning**: Hierarchical design
- **Broadcast Domains**: Layer 2 boundaries

## Code Examples

### Subnet Calculator with Python

```python
import ipaddress
from dataclasses import dataclass
from typing import List, Optional
from enum import Enum

class IPVersion(Enum):
    IPv4 = 4
    IPv6 = 6

@dataclass
class SubnetInfo:
    network: str
    cidr: int
    netmask: str
    first_ip: str
    last_ip: str
    num_hosts: int
    usable_hosts: int
    broadcast: str
    version: IPVersion
    is_private: bool

class SubnetCalculator:
    @staticmethod
    def calculate(network: str) -> SubnetInfo:
        net = ipaddress.ip_network(network, strict=False)
        
        num_hosts = net.num_addresses
        usable_hosts = max(0, num_hosts - 2 if net.version == 4 else num_hosts)
        
        first_ip = str(net[0])
        last_ip = str(net[-2] if net.version == 4 else net[-1])
        broadcast = str(net.broadcast_address)
        
        return SubnetInfo(
            network=str(net),
            cidr=net.prefixlen,
            netmask=str(net.netmask),
            first_ip=first_ip,
            last_ip=last_ip,
            num_hosts=num_hosts,
            usable_hosts=usable_hosts,
            broadcast=broadcast,
            version=IPVersion(net.version),
            is_private=net.is_private
        )
    
    @staticmethod
    def subnet(network: str, new_prefix: int) -> List[SubnetInfo]:
        net = ipaddress.ip_network(network)
        subnets = list(net.subnets(new_prefix=new_prefix))
        
        return [SubnetCalculator.calculate(str(s)) for s in subnets]
    
    @staticmethod
    def summarize(networks: List[str]) -> List[SubnetInfo]:
        nets = [ipaddress.ip_network(n, strict=False) for n in networks]
        summaries = list(ipaddress.collapse_addresses(nets))
        
        return [SubnetCalculator.calculate(str(s)) for s in summaries]
    
    @staticmethod
    def find_supernet(networks: List[str]) -> Optional[SubnetInfo]:
        try:
            nets = [ipaddress.ip_network(n, strict=False) for n in networks]
            supernet = ipaddress summarization.networks(nets)
            
            if supernet:
                return SubnetCalculator.calculate(str(list(supernet)[0]))
        except ValueError:
            pass
        
        return None
    
    @staticmethod
    def is_in_subnet(ip: str, network: str) -> bool:
        return ipaddress.ip_address(ip) in ipaddress.ip_network(network)

@dataclass
class IPAMEntry:
    ip: str
    subnet: str
    hostname: str
    description: str
    allocated_at: str
    expires_at: Optional[str]

class IPAM:
    def __init__(self):
        self.ip_pools: dict[str, list[IPAMEntry]] = {}
        self.reserved_ips: set[str] = set()
    
    def add_pool(self, network: str, description: str = "") -> None:
        info = SubnetCalculator.calculate(network)
        self.ip_pools[network] = []
    
    def reserve_ip(self, ip: str, reason: str = "") -> None:
        self.reserved_ips.add(ip)
    
    def allocate(self, network: str, hostname: str, description: str = "") -> Optional[IPAMEntry]:
        if network not in self.ip_pools:
            return None
        
        pool = self.ip_pools[network]
        info = SubnetCalculator.calculate(network)
        
        for i in range(info.num_hosts):
            ip_addr = str(info.first_ip + i)
            
            if ip_addr in self.reserved_ips:
                continue
            
            if any(entry.ip == ip_addr for entry in pool):
                continue
            
            if ip_addr == info.broadcast or ip_addr == str(info.first_ip):
                continue
            
            entry = IPAMEntry(
                ip=ip_addr,
                subnet=network,
                hostname=hostname,
                description=description,
                allocated_at="2024-01-01",
                expires_at=None
            )
            
            pool.append(entry)
            return entry
        
        return None
    
    def release(self, ip: str) -> bool:
        for network, pool in self.ip_pools.items():
            for i, entry in enumerate(pool):
                if entry.ip == ip:
                    pool.pop(i)
                    self.reserved_ips.discard(ip)
                    return True
        
        return False
    
    def get_available_ips(self, network: str) -> List[str]:
        info = SubnetCalculator.calculate(network)
        allocated = {entry.ip for entry in self.ip_pools.get(network, [])}
        
        available = []
        for i in range(info.usable_hosts):
            ip_addr = str(info.first_ip + i)
            if ip_addr not in allocated and ip_addr not in self.reserved_ips:
                available.append(ip_addr)
        
        return available

def design_network(num_hosts: int, num_subnets: int = 1) -> dict:
    """Design optimal network architecture."""
    
    import math
    
    required_hosts = num_hosts + 2
    prefix = 32
    
    while required_hosts > (1 << (32 - prefix)) - 2:
        prefix -= 1
    
    network = f"10.0.0.0/{prefix}"
    info = SubnetCalculator.calculate(network)
    
    subnets = []
    if num_subnets > 1:
        sub_prefix = prefix
        while (1 << (32 - sub_prefix)) < math.ceil(num_hosts / num_subnets) + 2:
            sub_prefix += 1
        
        subnets = SubnetCalculator.subnet(network, sub_prefix)
    
    return {
        "primary_network": network,
        "subnets": [s.network for s in subnets],
        "info": info
    }
```

### VLAN Configuration Script

```bash
#!/bin/bash

# VLAN Management Script

VLAN_CONFIG_FILE="/etc/vlan/config"

create_vlan() {
    local interface="$1"
    local vlan_id="$2"
    local vlan_name="${interface}.${vlan_id}"
    
    if ip link show "$vlan_name" &>/dev/null; then
        echo "VLAN $vlan_id already exists on $interface"
        return 1
    fi
    
    sudo ip link add link "$interface" name "$vlan_name" type vlan id "$vlan_id"
    sudo ip link set "$vlan_name" up
    
    echo "Created VLAN $vlan_id on $interface"
}

delete_vlan() {
    local vlan_name="$1"
    
    if ! ip link show "$vlan_name" &>/dev/null; then
        echo "VLAN $vlan_name does not exist"
        return 1
    fi
    
    sudo ip link set "$vlan_name" down
    sudo ip link delete "$vlan_name"
    
    echo "Deleted VLAN $vlan_name"
}

configure_vlan_interface() {
    local vlan_name="$1"
    local ip_address="$2"
    local gateway="$3"
    
    sudo ip addr add "$ip_address" dev "$vlan_name"
    
    if [ -n "$gateway" ]; then
        sudo ip route add default via "$gateway" dev "$vlan_name"
    fi
    
    echo "Configured $vlan_name with $ip_address"
}

configure_vlan_switch() {
    local switch_ip="$1"
    local switch_user="$2"
    local vlan_name="$3"
    local vlan_id="$4"
    local tagged_ports="$5"
    local untagged_ports="$6"
    
    ssh "$switch_user@$switch_ip" << EOF
    enable
    configure terminal
    vlan $vlan_id
    name $vlan_name
    exit
    
    $(for port in $tagged_ports; do
        echo "interface $port"
        echo "  switchport mode trunk"
        echo "  switchport trunk allowed vlan add $vlan_id"
        echo "  exit"
    done)
    
    $(for port in $untagged_ports; do
        echo "interface $port"
        echo "  switchport mode access"
        echo "  switchport access vlan $vlan_id"
        echo "  exit"
    done)
    
    exit
    write memory
EOF
    
    echo "Configured VLAN $vlan_id on switch $switch_ip"
}

check_vlan_connectivity() {
    local vlan_interface="$1"
    local target_ip="$2"
    
    if ! ip link show "$vlan_interface" &>/dev/null; then
        echo "VLAN interface $vlan_interface not found"
        return 1
    fi
    
    ping -I "$vlan_interface" -c 4 "$target_ip" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "Connectivity to $target_ip via $vlan_interface: OK"
        return 0
    else
        echo "Connectivity to $target_ip via $vlan_interface: FAILED"
        return 1
    fi
}

case "$1" in
    create)
        create_vlan "$2" "$3"
        ;;
    delete)
        delete_vlan "$2"
        ;;
    configure)
        configure_vlan_interface "$2" "$3" "$4"
        ;;
    switch-config)
        configure_vlan_switch "$2" "$3" "$4" "$5" "$6" "$7"
        ;;
    check)
        check_vlan_connectivity "$2" "$3"
        ;;
    *)
        echo "Usage: $0 {create|delete|configure|switch-config|check}"
        exit 1
        ;;
esac
```

## Best Practices

1. **Use Private Address Ranges**: 10.0.0.0/8 for large networks
2. **Plan for Growth**: Allocate more addresses than currently needed
3. **Use Hierarchical Design**: Aggregate routes efficiently
4. **Implement VLAN Segmentation**: Separate traffic types
5. **Reserve Special Addresses**: Gateways, broadcast, infrastructure
6. **Document IP Assignments**: Maintain IPAM database
7. **Use DHCP Wisely**: Automate allocation for dynamic clients
8. **Avoid Overlapping Subnets**: Prevent routing conflicts
9. **Monitor Address Utilization**: Track usage trends
10. **Use IPv6 Planning**: Dual-stack for future-proofing
