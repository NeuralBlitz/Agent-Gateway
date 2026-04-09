---
name: Network Security
description: Network security monitoring and threat protection
license: MIT
compatibility: Cross-platform (Linux, Cloud providers)
audience: Security engineers and DevOps professionals
category: Networking
---

# Network Security

## What I Do

I provide guidance for implementing network security measures. I cover firewall configuration, intrusion detection, traffic analysis, DDoS protection, and security monitoring.

## When to Use Me

- Configuring network firewalls
- Setting up IDS/IPS
- Implementing DDoS protection
- Monitoring network traffic
- Responding to security incidents

## Core Concepts

- **Firewall Rules**: Packet filtering with iptables/nftables
- **Network Segmentation**: Zero-trust architecture
- **IDS/IPS**: Intrusion detection and prevention
- **DDoS Mitigation**: Rate limiting and traffic scrubbing
- **VPN Security**: Encrypted tunnels
- **Zero-Day Protection**: Anomaly detection
- **Traffic Analysis**: Monitoring and logging
- **Access Control Lists**: Network-level restrictions
- **Security Groups**: Cloud firewall rules
- **Network Forensics**: Incident investigation

## Code Examples

### Firewall Configuration with nftables

```bash
#!/bin/bash

# /etc/nftables.conf

#!/usr/sbin/nft -f

flush ruleset

table inet filter {
    chain input {
        type filter hook input priority 0;
        
        ct state established,related accept
        ct state invalid drop
        
        iif lo accept
        
        ip protocol icmp accept
        icmpv6 type { echo-request, echo-reply, destination-unreachable, packet-too-big, time-exceeded, parameter-problem } accept
        
        tcp dport { 22, 80, 443, 8443 } accept
        
        tcp dport 22 limit rate 3/minute burst 5 packets accept
        drop
        
        reject with icmpx type admin-prohibited
    }
    
    chain forward {
        type filter hook forward priority 0;
        
        ct state established,related accept
        ct state invalid drop
        
        iifname "eth0" oifname "wg0" accept
        iifname "wg0" oifname "eth0" accept
        
        drop
    }
    
    chain output {
        type filter hook output priority 0;
        
        ct state established,related accept
        
        oif lo accept
        
        tcp dport { 80, 443 } accept
        udp dport { 53 } accept
        
        reject with icmpx type admin-prohibited
    }
}

table ip nat {
    chain prerouting {
        type nat hook prerouting priority 0;
        
        tcp dport 80 dnat to 10.0.0.10:8080
        tcp dport 443 dnat to 10.0.0.10:8443
    }
    
    chain postrouting {
        type nat hook postrouting priority 100;
        
        oifname "eth0" masquerade
    }
}

table ip6 filter {
    chain input {
        type filter hook input priority 0;
        
        ct state established,related accept
        ct state invalid drop
        
        iif lo accept
        
        icmpv6 type { echo-request, echo-reply, nd-router-solicit, nd-router-advert, nd-neighbor-solicit, nd-neighbor-advert } accept
        
        tcp dport { 22, 80, 443 } accept
        
        drop
    }
}
```

### Network Security Monitor

```python
#!/usr/bin/env python3

import socket
import struct
import threading
from datetime import datetime
from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, List, Optional
import json
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class Packet:
    timestamp: datetime
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    protocol: str
    payload_size: int
    flags: Optional[str]

class NetworkSecurityMonitor:
    def __init__(self, interface: str = "eth0"):
        self.interface = interface
        self.running = False
        self.packet_counts = defaultdict(int)
        self.connection_attempts: Dict[str, int] = defaultdict(int)
        self.suspicious_ips: set = set()
        self.alert_threshold = 100
        self.lock = threading.Lock()
        
        self.suspicious_patterns = {
            'port_scan': [1, 3, 5, 7, 9, 11, 13, 15, 17, 19],
            'syn_flood': [],
            'brute_force': ['22', '3389', '23', '21'],
            'dns_amplification': [],
        }
    
    def start_capture(self):
        """Start packet capture in a separate thread."""
        self.running = True
        
        try:
            sock = socket.socket(socket.AF_PACKET, socket.SOCK_RAW, socket.ntohs(0x0003))
            sock.bind((self.interface, 0))
            sock.settimeout(1.0)
        except socket.error as e:
            logger.error(f"Failed to create socket: {e}")
            return
        
        capture_thread = threading.Thread(target=self._capture_packets, args=(sock,))
        capture_thread.daemon = True
        capture_thread.start()
        
        logger.info(f"Started network monitoring on {self.interface}")
    
    def _capture_packets(self, sock: socket.socket):
        """Capture and analyze packets."""
        while self.running:
            try:
                packet, addr = sock.recvfrom(65535)
                self._analyze_packet(packet)
            except socket.timeout:
                continue
            except Exception as e:
                logger.error(f"Error capturing packet: {e}")
    
    def _analyze_packet(self, packet: bytes):
        """Analyze a single packet."""
        if len(packet) < 20:
            return
        
        ip_header = packet[14:34]
        ihl = (ip_header[0] & 0x0F) * 4
        protocol = ip_header[9]
        
        src_ip = socket.inet_ntoa(ip_header[12:16])
        dst_ip = socket.inet_ntoa(ip_header[16:20])
        
        src_port = 0
        dst_port = 0
        
        if protocol == 6:  # TCP
            tcp_header = packet[14 + ihl:14 + ihl + 20]
            src_port = struct.unpack('>H', tcp_header[0:2])[0]
            dst_port = struct.unpack('>H', tcp_header[2:4])[0]
            flags = self._parse_tcp_flags(tcp_header[13])
            
            self._check_suspicious_activity(src_ip, dst_ip, str(dst_port), flags)
        
        self.packet_counts[f"{protocol}:{src_ip}"] += 1
    
    def _parse_tcp_flags(self, flags_byte: int) -> str:
        flags = []
        if flags_byte & 0x01: flags.append('FIN')
        if flags_byte & 0x02: flags.append('SYN')
        if flags_byte & 0x04: flags.append('RST')
        if flags_byte & 0x08: flags.append('PSH')
        if flags_byte & 0x10: flags.append('ACK')
        if flags_byte & 0x20: flags.append('URG')
        return ','.join(flags)
    
    def _check_suspicious_activity(self, src_ip: str, dst_ip: str,
                                   dst_port: str, flags: str):
        """Check for suspicious connection patterns."""
        key = f"{src_ip}:{dst_port}"
        
        if flags == 'SYN':
            self.connection_attempts[key] += 1
            
            if self.connection_attempts[key] > 50:
                with self.lock:
                    self.suspicious_ips.add(src_ip)
                logger.warning(f"Possible SYN flood detected from {src_ip}")
                self._trigger_alert("SYN_FLOOD", src_ip, dst_ip, dst_port)
        
        if dst_port in self.suspicious_patterns['brute_force']:
            if self.connection_attempts[key] > 10:
                logger.warning(f"Possible brute force attempt from {src_ip}")
                self._trigger_alert("BRUTE_FORCE", src_ip, dst_ip, dst_port)
    
    def _trigger_alert(self, alert_type: str, src_ip: str, 
                      dst_ip: str, dst_port: str):
        """Generate and log security alert."""
        alert = {
            'timestamp': datetime.utcnow().isoformat(),
            'type': alert_type,
            'source_ip': src_ip,
            'destination_ip': dst_ip,
            'destination_port': dst_port,
            'severity': 'HIGH' if alert_type in ['SYN_FLOOD', 'DDoS'] else 'MEDIUM'
        }
        
        logger.warning(f"SECURITY ALERT: {json.dumps(alert)}")
        
        self._block_ip(src_ip)
    
    def _block_ip(self, ip: str):
        """Add IP to blocked list."""
        try:
            import subprocess
            subprocess.run(
                ['iptables', '-A', 'INPUT', '-s', ip, '-j', 'DROP'],
                check=False
            )
            logger.info(f"Blocked IP: {ip}")
        except Exception as e:
            logger.error(f"Failed to block IP {ip}: {e}")
    
    def get_statistics(self) -> dict:
        """Get current statistics."""
        with self.lock:
            return {
                'total_packets': sum(self.packet_counts.values()),
                'unique_sources': len(self.packet_counts),
                'suspicious_ips': list(self.suspicious_ips),
                'connection_attempts': dict(self.connection_attempts),
                'blocked_count': len(self.suspicious_ips)
            }
    
    def stop(self):
        """Stop the monitoring."""
        self.running = False
        logger.info("Network security monitoring stopped")

# IDS Signature Example
class IntrusionDetection:
    def __init__(self):
        self.signatures = {
            'CVE-2024-0001': {
                'pattern': b'GET /?shell=.* HTTP',
                'severity': 'CRITICAL',
                'action': 'block'
            },
            'SQL_Injection': {
                'pattern': b"('|(\-\-)|(/\*)|(\*/)|(UNION)|(SELECT)|(INSERT))",
                'severity': 'HIGH',
                'action': 'log'
            },
            'Directory_Traversal': {
                'pattern': b'(\.\./|\.\.\\)',
                'severity': 'MEDIUM',
                'action': 'log'
            }
        }
    
    def check_payload(self, payload: bytes) -> List[dict]:
        """Check payload against signatures."""
        alerts = []
        
        for signature, info in self.signatures.items():
            if info['pattern'] in payload:
                alerts.append({
                    'signature': signature,
                    'severity': info['severity'],
                    'action': info['action']
                })
        
        return alerts
```

### DDoS Protection Configuration

```nginx
# /etc/nginx/ddos-protection.conf

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=per_ip:10m rate=10r/s;
limit_req_zone $http_x_forwarded_for zone=per_subnet:10m rate=50r/s;
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

# DDOS protection
geo $limited {
    default 1;
    
    10.0.0.0/8 0;
    192.168.0.0/16 0;
    172.16.0.0/12 0;
}

map $limited $limit {
    0 "";
    1 $binary_remote_addr;
}

server {
    listen 80;
    server_name example.com;
    
    # Connection limiting
    limit_conn conn_limit 50;
    
    # Request limiting
    limit_req zone=per_ip burst=20 nodelay;
    
    # Slowloris protection
    client_body_timeout 10s;
    client_header_timeout 10s;
    keepalive_timeout 10s 10;
    
    # Request size limits
    client_max_body_size 1M;
    client_body_buffer_size 128k;
    client_header_buffer_size 1k;
    
    # Timeout settings
    proxy_connect_timeout 5s;
    proxy_read_timeout 30s;
    proxy_send_timeout 30s;
    
    location / {
        # DDoS mode - stricter limits
        if ($limited = 1) {
            limit_req zone=per_ip burst=5 nodelay;
        }
        
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # DDoS response
        if ($http_x_forwarded_for ~ "^(\d+\.\d+\.\d+)\.\d+") {
            set $allowed 0;
        }
        
        if ($http_user_agent ~* "(curl|wget|bot|spider|crawler)") {
            set $block_request 1;
        }
        
        if ($block_request = 1) {
            return 403;
        }
    }
    
    # CAPTCHA challenge
    location /captcha {
        if ($http_cookie !~* "captcha_solved") {
            add_header Set-Cookie "captcha_challenge=$request_id";
            return 200 '<html><body><form action="/verify">Enter CAPTCHA: <input name="ans"><button>Submit</button></form></body></html>';
        }
    }
}
```

## Best Practices

1. **Implement Defense in Depth**: Multiple security layers
2. **Use Least Privilege**: Restrict access by default
3. **Enable Comprehensive Logging**: Track all network activity
4. **Deploy IDS/IPS**: Detect and prevent attacks
5. **Implement Rate Limiting**: Protect against DDoS and brute force
6. **Segment Networks**: Isolate critical systems
7. **Monitor Traffic Patterns**: Baseline and anomaly detection
8. **Regular Security Audits**: Penetration testing and reviews
9. **Automate Response**: SIEM integration for alerts
10. **Keep Systems Updated**: Patch vulnerabilities promptly
