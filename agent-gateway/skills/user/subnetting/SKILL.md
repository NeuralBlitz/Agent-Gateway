---
name: subnetting
description: IP subnetting and network segmentation
category: networking
difficulty: intermediate
tags: [ip, subnet, network, cidr, routing]
author: OpenCode Community
version: 1.0
last_updated: 2024-01-15
---

# Subnetting

## What I Do

I am Subnetting, the practice of dividing a larger network into smaller, manageable network segments. I enable efficient IP address allocation, improve network performance through broadcast domain reduction, and enhance security through network segmentation. I use CIDR (Classless Inter-Domain Routing) notation to define network boundaries. I help network administrators optimize address space utilization, implement security boundaries, and create hierarchical routing structures. I work with IPv4 and IPv6 addressing schemes, implementing variable length subnet masks (VLSM) for flexible network designs. I enable organizations to build scalable, secure, and manageable network infrastructures.

## When to Use Me

- Designing new network infrastructures
- Expanding existing networks
- Creating isolated network segments
- Implementing security zones (DMZ, management)
- Optimizing network performance
- Reducing broadcast domains
- Planning IP address schemes
- Cloud VPC design
- VPN network architecture

## Core Concepts

**CIDR Notation**: IP address with prefix length (e.g., 192.168.1.0/24)

**Subnet Mask**: 32-bit value separating network and host portions

**Network Address**: All host bits set to 0

**Broadcast Address**: All host bits set to 1

**Usable Hosts**: 2^(host_bits) - 2 (network + broadcast)

**VLSM**: Variable Length Subnet Masking for flexible subnet sizes

**Supernetting/Route Aggregation**: Combining multiple subnets into larger networks

**Private Address Ranges**: RFC 1918 (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)

## Code Examples

### Example 1: Subnet Calculator (Python)
```python
import ipaddress
from typing import List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum

class IPVersion(Enum):
    IPv4 = 4
    IPv6 = 6

@dataclass
class SubnetInfo:
    network: str
    netmask: str
    prefix_length: int
    version: IPVersion
    num_addresses: int
    usable_hosts: int
    network_address: str
    broadcast_address: str
    first_usable: str
    last_usable: str
    cidr: str
    binary_netmask: str
    classful_class: Optional[str] = None

class SubnetCalculator:
    def __init__(self):
        pass
    
    def calculate(self, cidr: str) -> SubnetInfo:
        """Calculate all subnet information from CIDR notation"""
        net = ipaddress.ip_network(cidr, strict=False)
        version = IPVersion.IPv4 if net.version == 4 else IPVersion.IPv6
        
        first_usable = net.network_address + 1 if version == IPVersion.IPv4 else net.network_address
        last_usable = net.broadcast_address - 1 if version == IPVersion.IPv4 else net.broadcast_address - 1
        
        num_addresses = net.num_addresses
        usable_hosts = max(0, num_addresses - 2) if version == IPVersion.IPv4 else num_addresses - 1
        
        return SubnetInfo(
            network=str(net.network_address),
            netmask=str(net.netmask),
            prefix_length=net.prefixlen,
            version=version,
            num_addresses=num_addresses,
            usable_hosts=usable_hosts,
            network_address=str(net.network_address),
            broadcast_address=str(net.broadcast_address),
            first_usable=str(first_usable),
            last_usable=str(last_usable),
            cidr=str(net),
            binary_netmask=self._to_binary(net.netmask),
            classful_class=self._get_classful_class(net.network_address) if version == IPVersion.IPv4 else None
        )
    
    def _to_binary(self, netmask) -> str:
        """Convert netmask to binary representation"""
        return ''.join(f'{octet:08b}.' for octet in netmask.packed).rstrip('.')
    
    def _get_classful_class(self, ip) -> Optional[str]:
        """Get classful address class"""
        first_octet = int(ip.packed[0])
        if 1 <= first_octet <= 126:
            return "A"
        elif 128 <= first_octet <= 191:
            return "B"
        elif 192 <= first_octet <= 223:
            return "C"
        elif 224 <= first_octet <= 239:
            return "D (Multicast)"
        elif 240 <= first_octet <= 255:
            return "E (Experimental)"
        return None
    
    def subnet_into(self, cidr: str, num_subnets: int = None, 
                   new_prefix: int = None) -> List[SubnetInfo]:
        """Divide a network into smaller subnets"""
        net = ipaddress.ip_network(cidr, strict=False)
        
        if new_prefix:
            prefix_length = new_prefix
        elif num_subnets:
            current_prefix = net.prefixlen
            needed_bits = (num_subnets - 1).bit_length()
            prefix_length = current_prefix + needed_bits
        else:
            raise ValueError("Must specify num_subnets or new_prefix")
        
        subnets = []
        for subnet in net.subnets(new_prefix=prefix_length):
            subnets.append(self.calculate(str(subnet)))
        
        return subnets
    
    def summarize_networks(self, networks: List[str]) -> List[SubnetInfo]:
        """Aggregate multiple networks into larger summarized networks"""
        nets = [ipaddress.ip_network(n, strict=False) for n in networks]
        summarized = list(ipaddress.collapse_addresses(nets))
        return [self.calculate(str(s)) for s in summarized]
    
    def find_supernet(self, cidr1: str, cidr2: str) -> Optional[SubnetInfo]:
        """Find the smallest supernet containing two networks"""
        net1 = ipaddress.ip_network(cidr1, strict=False)
        net2 = ipaddress.ip_network(cidr2, strict=False)
        
        combined = list(ipaddress.collapse_addresses([net1, net2]))
        if len(combined) == 1:
            return self.calculate(str(combined[0]))
        return None
    
    def is_subnet_of(self, subnet: str, parent: str) -> bool:
        """Check if subnet is contained within parent network"""
        return ipaddress.ip_network(subnet, strict=False).subnet_of(
            ipaddress.ip_network(parent, strict=False)
        )
    
    def get_supernet_for_hosts(self, num_hosts: int, 
                              prefer_largest: bool = True) -> SubnetInfo:
        """Find smallest subnet that can accommodate N hosts"""
        needed_bits = (num_hosts + 2).bit_length()
        prefix_length = 32 - needed_bits
        
        if prefer_largest:
            prefix_length = max(0, prefix_length - 1)
        
        network = ipaddress.IPv4Network(f"0.0.0.0/{prefix_length}", strict=False)
        return self.calculate(str(network))
    
    def calculate_vlsm(self, host_requirements: List[int], 
                       starting_cidr: str = "192.168.0.0/24") -> List[SubnetInfo]:
        """Variable Length Subnet Masking - assign subnets based on needs"""
        net = ipaddress.ip_network(starting_cidr, strict=False)
        
        sorted_reqs = sorted(host_requirements, reverse=True)
        subnets = []
        current_address = int(net.network_address)
        
        for req in sorted_reqs:
            needed_hosts = req + 2 if net.version == 4 else req + 1
            needed_bits = (needed_hosts - 1).bit_length()
            prefix_length = 32 - needed_bits
            
            subnet_size = 2 ** needed_bits
            subnet = ipaddress.IPv4Network(
                f"{ipaddress.IPv4Address(current_address)}/{prefix_length}", 
                strict=False
            )
            
            subnets.append(self.calculate(str(subnet)))
            current_address += subnet_size
        
        return subnets
    
    def ip_to_binary(self, ip: str) -> str:
        """Convert IP address to binary string"""
        packed = ipaddress.ip_address(ip).packed
        return ''.join(f'{byte:08b}' for byte in packed)
    
    def get_network_range(self, cidr: str) -> Tuple[str, str]:
        """Get the start and end IP addresses of a network"""
        net = ipaddress.ip_network(cidr, strict=False)
        return (str(net.network_address), str(net.broadcast_address))


# Example usage
if __name__ == "__main__":
    calc = SubnetCalculator()
    
    # Calculate single subnet
    print("=== Subnet Analysis: 192.168.1.0/24 ===")
    info = calc.calculate("192.168.1.0/24")
    print(f"Network: {info.network}")
    print(f"Netmask: {info.netmask}")
    print(f"Prefix: /{info.prefix_length}")
    print(f"Usable Hosts: {info.usable_hosts}")
    print(f"Range: {info.first_usable} - {info.last_usable}")
    print()
    
    # Subnet division
    print("=== Divide into /26 subnets ===")
    subnets = calc.subnet_into("192.168.1.0/24", new_prefix=26)
    for i, subnet in enumerate(subnets):
        print(f"Subnet {i+1}: {subnet.cidr} ({subnet.usable_hosts} hosts)")
    print()
    
    # VLSM calculation
    print("=== VLSM Allocation ===")
    requirements = [50, 25, 10, 10, 5]
    vlsm_subnets = calc.calculate_vlsm(requirements)
    for i, subnet in enumerate(vlsm_subnets):
        print(f"Requirement {requirements[i]} hosts: {subnet.cidr}")
```

### Example 2: Network Scanner (Python)
```python
import socket
import subprocess
import concurrent.futures
from typing import List, Dict
from dataclasses import dataclass
from datetime import datetime
from subnetting import SubnetCalculator

@dataclass
class HostInfo:
    ip: str
    hostname: str
    mac_address: str = "Unknown"
    status: str = "unknown"
    response_time_ms: float = 0.0
    open_ports: List[int] = None
    last_seen: datetime = None

class NetworkScanner:
    def __init__(self, timeout: float = 1.0, max_workers: int = 100):
        self.timeout = timeout
        self.max_workers = max_workers
        self.calculator = SubnetCalculator()
    
    def ping_host(self, ip: str) -> bool:
        """Check if host is reachable via ICMP"""
        try:
            subprocess.run(
                ['ping', '-c', '1', '-W', '1', ip],
                capture_output=True,
                timeout=2
            )
            return True
        except:
            return False
    
    def scan_port(self, ip: str, port: int, timeout: float = None) -> bool:
        """Check if a specific port is open"""
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout or self.timeout)
        result = sock.connect_ex((ip, port))
        sock.close()
        return result == 0
    
    def get_hostname(self, ip: str) -> str:
        """Reverse DNS lookup"""
        try:
            hostname = socket.gethostbyaddr(ip)[0]
            return hostname
        except:
            return "Unknown"
    
    def scan_network(self, cidr: str, ports: List[int] = None) -> List[HostInfo]:
        """Scan entire network for hosts"""
        info = self.calculator.calculate(cidr)
        hosts = []
        
        for i in range(1, info.num_addresses - 1):
            ip = str(info.network_address + i)
            
            if self.ping_host(ip):
                host_info = HostInfo(
                    ip=ip,
                    hostname=self.get_hostname(ip),
                    status="online",
                    last_seen=datetime.now()
                )
                
                if ports:
                    host_info.open_ports = self.scan_ports(ip, ports)
                
                hosts.append(host_info)
        
        return hosts
    
    def scan_ports(self, ip: str, ports: List[int]) -> List[int]:
        """Scan multiple ports on a host"""
        open_ports = []
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
            futures = {
                executor.submit(self.scan_port, ip, port): port 
                for port in ports
            }
            
            for future in concurrent.futures.as_completed(futures):
                port = futures[future]
                try:
                    if future.result():
                        open_ports.append(port)
                except:
                    pass
        
        return sorted(open_ports)
    
    def scan_common_ports(self, ip: str) -> Dict[int, str]:
        """Scan common service ports"""
        common_ports = {
            21: "FTP",
            22: "SSH",
            23: "Telnet",
            25: "SMTP",
            53: "DNS",
            80: "HTTP",
            110: "POP3",
            143: "IMAP",
            443: "HTTPS",
            445: "SMB",
            3389: "RDP",
            8080: "HTTP-Alt"
        }
        
        open_ports = self.scan_ports(ip, list(common_ports.keys()))
        
        return {port: common_ports[port] for port in open_ports}
    
    def generate_report(self, hosts: List[HostInfo]) -> str:
        """Generate network scan report"""
        report = []
        report.append("=" * 60)
        report.append("NETWORK SCAN REPORT")
        report.append("=" * 60)
        report.append(f"Scan Date: {datetime.now().isoformat()}")
        report.append(f"Hosts Found: {len(hosts)}")
        report.append("")
        
        online_hosts = [h for h in hosts if h.status == "online"]
        report.append(f"Online Hosts: {len(online_hosts)}")
        
        for host in sorted(online_hosts, key=lambda x: socket.inet_aton(x.ip)):
            report.append("-" * 40)
            report.append(f"IP: {host.ip}")
            report.append(f"Hostname: {host.hostname}")
            report.append(f"Status: {host.status}")
            
            if host.open_ports:
                report.append("Open Ports:")
                for port in host.open_ports:
                    report.append(f"  - {port}")
        
        return '\n'.join(report)


if __name__ == "__main__":
    scanner = NetworkScanner()
    
    print("Scanning network...")
    hosts = scanner.scan_network("192.168.1.0/24", [22, 80, 443, 8080])
    
    report = scanner.generate_report(hosts)
    print(report)
```

### Example 3: Route Table Manager (Go)
```go
package main

import (
    "fmt"
    "os/exec"
    "strings"
    "net"
    "bytes"
    "encoding/csv"
)

type Route struct {
    Destination string
    Gateway     string
    Genmask     string
    Flags       string
    Metric      int
    Ref         int
    Use         int
    Interface   string
}

type RoutingTable struct {
    routes []Route
}

func (rt *RoutingTable) Parse() error {
    output, err := exec.Command("route", "-n").Output()
    if err != nil {
        return fmt.Errorf("failed to get routing table: %w", err)
    }
    
    lines := strings.Split(string(output), "\n")
    rt.routes = make([]Route, 0)
    
    for _, line := range lines[1:] {
        if strings.TrimSpace(line) == "" || strings.HasPrefix(line, "Kernel") {
            continue
        }
        
        fields := strings.Fields(line)
        if len(fields) < 8 {
            continue
        }
        
        route := Route{
            Destination: fields[0],
            Gateway:     fields[1],
            Genmask:     fields[2],
            Flags:       fields[3],
        }
        
        fmt.Sscanf(fields[4], "%d", &route.Metric)
        fmt.Sscanf(fields[5], "%d", &route.Ref)
        fmt.Sscanf(fields[6], "%d", &route.Use)
        route.Interface = fields[7]
        
        rt.routes = append(rt.routes, route)
    }
    
    return nil
}

func (rt *RoutingTable) GetRouteForDestination(destination string) *Route {
    destIP := net.ParseIP(destination)
    
    var bestMatch *Route
    var bestPrefixLen int
    
    for i := range rt.routes {
        route := &rt.routes[i]
        routeNet := net.ParseIP(route.Destination)
        routeMask := net.ParseIP(route.Genmask)
        
        prefixLen := 0
        for j := range routeIP := range routeIP {
            maskByte := routeMask[j]
            for k := 0; k < 8; k++ {
                if maskByte&(1<<uint(7-k)) != 0 {
                    prefixLen++
                }
            }
        }
        
        // Check if destination is in this route's network
        match := true
        for i := range destIP {
            if (destIP[i] & routeMask[i]) != (routeNet[i] & routeMask[i]) {
                match = false
                break
            }
        }
        
        if match && prefixLen > bestPrefixLen {
            bestPrefixLen = prefixLen
            bestMatch = route
        }
    }
    
    return bestMatch
}

func (rt *RoutingTable) AddRoute(destination, gateway, netmask, interface string, metric int) error {
    cmd := exec.Command("route", "add", "-net", destination, "netmask", netmask, "gw", gateway, "metric", fmt.Sprintf("%d", metric), interface)
    return cmd.Run()
}

func (rt *RoutingTable) DeleteRoute(destination, netmask string) error {
    cmd := exec.Command("route", "del", "-net", destination, "netmask", netmask)
    return cmd.Run()
}

func (rt *RoutingTable) ExportToCSV(filename string) error {
    file, err := os.Create(filename)
    if err != nil {
        return err
    }
    defer file.Close()
    
    writer := csv.NewWriter(file)
    defer writer.Flush()
    
    headers := []string{"Destination", "Gateway", "Genmask", "Flags", "Metric", "Ref", "Use", "Interface"}
    writer.Write(headers)
    
    for _, route := range rt.routes {
        row := []string{
            route.Destination,
            route.Gateway,
            route.Genmask,
            route.Flags,
            fmt.Sprintf("%d", route.Metric),
            fmt.Sprintf("%d", route.Ref),
            fmt.Sprintf("%d", route.Use),
            route.Interface,
        }
        writer.Write(row)
    }
    
    return nil
}

func CalculateSubnet(cidr string) (string, string, error) {
    _, ipNet, err := net.ParseCIDR(cidr)
    if err != nil {
        return "", "", err
    }
    
    networkAddress := ipNet.IP.String()
    broadcast := make(net.IP, len(ipNet.IP))
    for i := range ipNet.IP {
        broadcast[i] = ipNet.IP[i] | ^ipNet.Mask[i]
    }
    broadcastAddress := broadcast.String()
    
    return networkAddress, broadcastAddress, nil
}

func main() {
    rt := &RoutingTable{}
    
    if err := rt.Parse(); err != nil {
        fmt.Printf("Error parsing routing table: %v\n", err)
        return
    }
    
    fmt.Println("Current Routing Table:")
    fmt.Println("----------------------")
    for _, route := range rt.routes {
        fmt.Printf("%-15s %-15s %-15s %s\n", 
            route.Destination, route.Gateway, route.Genmask, route.Interface)
    }
    
    route := rt.GetRouteForDestination("8.8.8.8")
    if route != nil {
        fmt.Printf("\nRoute to 8.8.8.8: Gateway=%s Interface=%s\n", 
            route.Gateway, route.Interface)
    }
}
```

## Best Practices

- Use RFC 1918 private address ranges for internal networks
- Implement proper subnet sizing based on current and future needs
- Use consistent CIDR notation across documentation
- Document all subnets and their purposes
- Plan for growth when allocating address space
- Implement hierarchical addressing for efficient routing
- Use VLSM to optimize address utilization
- Separate management networks from production
- Create DMZ networks for public-facing services
- Monitor and reclaim unused IP addresses

## Core Competencies

- CIDR notation and subnet mask calculations
- IPv4 and IPv6 addressing schemes
- VLSM implementation
- Supernetting and route aggregation
- Private vs public IP addresses
- Network scanning and discovery
- Route table management
- Security zone design
- Broadcast domain segmentation
- IP address management (IPAM)
- DNS integration with subnets
- DHCP scope planning
