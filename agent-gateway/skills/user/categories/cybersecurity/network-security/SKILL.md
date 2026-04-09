---
name: Network Security
description: Protect network infrastructure and data transmission from unauthorized access, attacks, and breaches
license: MIT
compatibility:
  - Python 3.8+
  - Linux
  - Windows
  - macOS
audience: Security engineers, network administrators, DevOps engineers
category: Cybersecurity
---

# Network Security

## What I do

I provide comprehensive network security capabilities including firewall configuration, intrusion detection, network monitoring, traffic analysis, secure communication protocols, and defense-in-depth strategies to protect network infrastructure from threats.

## When to use me

- Implementing network segmentation and zero-trust architecture
- Configuring firewalls, VPNs, and network access controls
- Detecting and preventing intrusions and network attacks
- Monitoring network traffic for anomalies
- Securing wireless networks and remote access
- Implementing DNSSEC and secure DNS practices
- Configuring network-based authentication

## Core Concepts

- **Firewall Configuration**: State packet inspection, application-layer gateways, next-gen firewalls
- **Network Segmentation**: VLANs, subnets, micro-segmentation, DMZ design
- **Intrusion Detection/Prevention**: Signature-based and anomaly-based detection systems
- **VPN Technologies**: IPSec, SSL/TLS VPNs, wireguard, zero-trust network access
- **Zero Trust Architecture**: Never trust, always verify principles, identity-based access
- **Network Monitoring**: SIEM integration, NetFlow analysis, packet capture
- **Secure Protocols**: HTTPS, SSH, SFTP, secure DNS (DoT/DoH)
- **Access Control**: RBAC, network access control lists, 802.1X authentication
- **DDoS Mitigation**: Rate limiting, anycast, scrubbing centers
- **Network Forensics**: Traffic capture analysis, log correlation,溯源

## Code Examples

### Firewall Rule Validation

```python
import re
from dataclasses import dataclass
from typing import List, Optional
from enum import Enum

class Protocol(Enum):
    TCP = "tcp"
    UDP = "udp"
    ICMP = "icmp"
    ANY = "any"

class Action(Enum):
    ALLOW = "ACCEPT"
    DENY = "DROP"

@dataclass
class FirewallRule:
    source_ip: str
    dest_ip: str
    port: int
    protocol: Protocol
    action: Action
    interface: str

def validate_cidr(cidr: str) -> bool:
    """Validate CIDR notation for IP range."""
    pattern = r'^(\d{1,3}\.){3}\d{1,3}(/\d{1,2})?$'
    if not re.match(pattern, cidr):
        return False
    octets = cidr.split('/')[0].split('.')
    return all(0 <= int(o) <= 255 for o in octets)

def validate_firewall_rule(rule: FirewallRule) -> List[str]:
    """Validate firewall rule for security issues."""
    issues = []
    
    if not validate_cidr(rule.source_ip):
        issues.append(f"Invalid source IP CIDR: {rule.source_ip}")
    
    if not validate_cidr(rule.dest_ip):
        issues.append(f"Invalid destination IP CIDR: {rule.dest_ip}")
    
    if rule.port < 1 or rule.port > 65535:
        issues.append(f"Invalid port number: {rule.port}")
    
    if rule.source_ip == "0.0.0.0/0" and rule.action == Action.ALLOW:
        issues.append("CRITICAL: Rule allows all source IPs - restrict if possible")
    
    if rule.dest_ip == "0.0.0.0/0" and rule.port < 1024:
        issues.append(f"WARNING: Exposing privileged port {rule.port} to all destinations")
    
    return issues

def analyze_firewall_policy(rules: List[FirewallRule]) -> dict:
    """Analyze firewall policy for security weaknesses."""
    analysis = {
        "total_rules": len(rules),
        "critical_issues": [],
        "warnings": [],
        "recommendations": []
    }
    
    for rule in rules:
        issues = validate_firewall_rule(rule)
        for issue in issues:
            if "CRITICAL" in issue:
                analysis["critical_issues"].append(issue)
            else:
                analysis["warnings"].append(issue)
    
    wide_open_count = sum(1 for r in rules 
                          if r.source_ip == "0.0.0.0/0" and r.action == Action.ALLOW)
    if wide_open_count > 0:
        analysis["recommendations"].append(
            f"Consider restricting {wide_open_count} rules with broad source ranges"
        )
    
    return analysis
```

### Network Traffic Monitor

```python
import socket
import struct
from typing import Callable, Optional
from datetime import datetime
from dataclasses import dataclass

ETH_TYPE_IPV4 = 0x0800
IP_PROTO_ICMP = 1
IP_PROTO_TCP = 6
IP_PROTO_UDP = 17

@dataclass
class PacketInfo:
    timestamp: datetime
    src_mac: str
    dst_mac: str
    src_ip: str
    dst_ip: str
    protocol: int
    src_port: int
    dst_port: int
    payload_size: int

def mac_to_str(mac_bytes: bytes) -> str:
    return ':'.join(f'{b:02x}' for b in mac_bytes)

def ip_to_str(ip_bytes: bytes) -> str:
    return '.'.join(str(b) for b in ip_bytes)

class NetworkMonitor:
    def __init__(self, interface: str = "eth0"):
        self.interface = interface
        self.socket_obj = None
        self.callbacks: List[Callable[[PacketInfo], None]] = []
        self.running = False
    
    def register_callback(self, callback: Callable[[PacketInfo], None]):
        self.callbacks.append(callback)
    
    def start(self):
        self.socket_obj = socket.socket(socket.AF_PACKET, socket.SOCK_RAW, 
                                         socket.ntohs(ETH_TYPE_IPV4))
        self.socket_obj.bind((self.interface, 0))
        self.running = True
        
        while self.running:
            packet, addr = self.socket_obj.recvfrom(65535)
            packet_info = self._parse_packet(packet)
            if packet_info:
                for callback in self.callbacks:
                    callback(packet_info)
    
    def stop(self):
        self.running = False
        if self.socket_obj:
            self.socket_obj.close()
    
    def _parse_packet(self, packet: bytes) -> Optional[PacketInfo]:
        eth_length = 14
        ip_header = packet[eth_length:eth_length + 20]
        
        if len(ip_header) < 20:
            return None
        
        ihl = (ip_header[0] & 0x0F) * 4
        total_length = struct.unpack('!H', ip_header[2:4])[0]
        protocol = ip_header[9]
        src_ip = ip_to_str(ip_header[12:16])
        dst_ip = ip_to_str(ip_header[16:20])
        
        src_port = dst_port = 0
        transport_start = eth_length + ihl
        
        if protocol in [IP_PROTO_TCP, IP_PROTO_UDP] and len(packet) > transport_start + 4:
            port_bytes = packet[transport_start:transport_start + 4]
            src_port = struct.unpack('!H', port_bytes[0:2])[0]
            dst_port = struct.unpack('!H', port_bytes[2:4])[0]
        
        return PacketInfo(
            timestamp=datetime.now(),
            src_mac=mac_to_str(packet[6:12]),
            dst_mac=mac_to_str(packet[0:6]),
            src_ip=src_ip,
            dst_ip=dst_ip,
            protocol=protocol,
            src_port=src_port,
            dst_port=dst_port,
            payload_size=len(packet) - eth_length - ihl
        )
```

### SSL/TLS Certificate Validator

```python
import socket
import ssl
import json
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List

@dataclass
class CertificateInfo:
    subject: str
    issuer: str
    not_before: datetime
    not_after: datetime
    days_remaining: int
    signature_algorithm: str
    public_key_size: int
    is_valid: bool
    issues: List[str]

def get_certificate_info(hostname: str, port: int = 443) -> Optional[CertificateInfo]:
    """Retrieve and analyze SSL/TLS certificate."""
    issues = []
    
    context = ssl.create_default_context()
    
    try:
        with socket.create_connection((hostname, port), timeout=10) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                not_before = datetime.strptime(cert['notBefore'], '%b %d %H:%M:%S %Y %Z')
                not_after = datetime.strptime(cert['notAfter'], '%b %d %H:%M:%S %Y %Z')
                
                days_remaining = (not_after - datetime.now()).days
                
                if days_remaining < 0:
                    issues.append("Certificate has expired")
                    is_valid = False
                elif days_remaining < 30:
                    issues.append(f"Certificate expires in {days_remaining} days")
                    is_valid = True
                else:
                    is_valid = True
                
                subject = dict(x[0] for x in cert['subject'])
                issuer = dict(x[0] for x in cert['issuer'])
                
                signature_alg = cert.get('signatureAlgorithm', 'unknown')
                pub_key = ssock.getpeercert(binary_form=True)
                key_size = len(pub_key) * 8
                
                if 'subjectAltName' not in cert:
                    issues.append("No Subject Alternative Name extension")
                
                if is_valid:
                    issues.clear()
                
                return CertificateInfo(
                    subject=str(subject),
                    issuer=str(issuer),
                    not_before=not_before,
                    not_after=not_after,
                    days_remaining=days_remaining,
                    signature_algorithm=signature_alg,
                    public_key_size=key_size,
                    is_valid=is_valid,
                    issues=issues
                )
    except ssl.SSLError as e:
        return CertificateInfo(
            subject="", issuer="", not_before=datetime.now(),
            not_after=datetime.now(), days_remaining=0,
            signature_algorithm="", public_key_size=0,
            is_valid=False, issues=[f"SSL Error: {str(e)}"]
        )
    except Exception as e:
        return CertificateInfo(
            subject="", issuer="", not_before=datetime.now(),
            not_after=datetime.now(), days_remaining=0,
            signature_algorithm="", public_key_size=0,
            is_valid=False, issues=[f"Connection error: {str(e)}"]
        )
```

### VPN Connection Security Checker

```python
import subprocess
import json
from dataclasses import dataclass
from typing import List, Dict

@dataclass
class VPNSecurityReport:
    tunnel_status: str
    encryption_algorithm: str
    authentication_method: str
    dns_leak_detected: bool
    kill_switch_status: str
    recommendations: List[str]

def check_wireguard_status(interface: str = "wg0") -> Dict:
    """Check WireGuard VPN status and configuration."""
    try:
        result = subprocess.run(
            ["wg", "show", interface],
            capture_output=True, text=True, timeout=5
        )
        
        if result.returncode != 0:
            return {"status": "down", "interface": interface}
        
        lines = result.stdout.strip().split('\n')
        config = {"status": "up", "interface": interface}
        
        for line in lines:
            if line.startswith("peer:"):
                config["peer"] = line.split(":")[1].strip()
            elif "latest handshake" in line:
                config["last_handshake"] = line.split(":")[1].strip()
            elif "transfer" in line:
                config["transfer"] = line.split(":")[1].strip()
        
        return config
    except subprocess.TimeoutExpired:
        return {"status": "error", "message": "Timeout checking interface"}
    except FileNotFoundError:
        return {"status": "error", "message": "WireGuard tools not installed"}

def check_dns_leak() -> Dict:
    """Check for potential DNS leaks."""
    dns_servers = []
    
    with open('/etc/resolv.conf', 'r') as f:
        for line in f:
            if line.startswith('nameserver'):
                dns_servers.append(line.split()[1])
    
    return {
        "dns_servers": dns_servers,
        "potential_leak": len(set(dns_servers)) > 1,
        "recommendation": "Use VPN-provided DNS servers only" if len(set(dns_servers)) > 1 else "DNS configuration OK"
    }
```

### Network Scan Port Scanner

```python
import socket
import concurrent.futures
from dataclasses import dataclass
from typing import List, Set
from datetime import datetime

COMMON_PORTS = {
    21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP",
    53: "DNS", 80: "HTTP", 110: "POP3", 143: "IMAP",
    443: "HTTPS", 445: "SMB", 3306: "MySQL", 3389: "RDP",
    5432: "PostgreSQL", 8080: "HTTP-Alt", 8443: "HTTPS-Alt"
}

@dataclass
class PortScanResult:
    host: str
    port: int
    service: str
    is_open: bool
    response_time_ms: float

def scan_port(host: str, port: int, timeout: float = 1.0) -> PortScanResult:
    """Scan a single port on a host."""
    start_time = datetime.now()
    
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    
    try:
        result = sock.connect_ex((host, port))
        response_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return PortScanResult(
            host=host,
            port=port,
            service=COMMON_PORTS.get(port, "unknown"),
            is_open=(result == 0),
            response_time_ms=response_time
        )
    except socket.error:
        return PortScanResult(
            host=host, port=port,
            service=COMMON_PORTS.get(port, "unknown"),
            is_open=False, response_time_ms=0
        )
    finally:
        sock.close()

def scan_common_ports(host: str, max_workers: int = 50) -> List[PortScanResult]:
    """Scan common ports on a host."""
    results = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(scan_port, host, port) for port in COMMON_PORTS.keys()]
        
        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())
    
    open_ports = [r for r in results if r.is_open]
    return sorted(results, key=lambda x: x.port)
```

## Best Practices

- Implement defense-in-depth with multiple security layers
- Use least-privilege principles for network access
- Encrypt all sensitive data in transit with TLS 1.3+
- Deploy network segmentation to limit lateral movement
- Monitor network traffic continuously with IDS/IPS
- Keep firmware and security devices updated
- Use strong authentication for network access (802.1X)
- Implement zero-trust architecture for internal networks
- Regular penetration testing and vulnerability assessments
- Document and review firewall rules quarterly
- Use rate limiting to mitigate DDoS attacks
- Implement DNS filtering and DNSSEC

## Common Patterns

- **Edge Security**: Deploy WAF, DDoS protection, and secure gateways at network perimeter
- **Internal Segmentation**: Use VLANs and micro-segmentation to isolate critical systems
- **Zero Trust**: Verify every request regardless of source; use SDP for network access
- **Hybrid Cloud**: Extend on-prem security controls to cloud workloads
- **Remote Access**: VPN with MFA, or zero-trust network access solutions
