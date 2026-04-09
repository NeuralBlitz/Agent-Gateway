---
name: VPN
description: Virtual Private Network implementation and configuration
license: MIT
compatibility: Cross-platform (WireGuard, OpenVPN, IPsec)
audience: Network engineers and security professionals
category: Networking
---

# VPN Configuration

## What I Do

I provide guidance for implementing and configuring VPN solutions. I cover WireGuard, OpenVPN, IPsec, site-to-site connections, and client VPN configurations.

## When to Use Me

- Setting up secure remote access
- Configuring site-to-site VPN
- Implementing zero-trust network access
- Migrating VPN infrastructure
- Optimizing VPN performance

## Core Concepts

- **Tunneling Protocols**: WireGuard, OpenVPN, IPsec
- **Encryption Algorithms**: ChaCha20, AES-GCM, Blowfish
- **Authentication Methods**: Certificates, PSK, EAP
- **Key Exchange**: Diffie-Hellman, ECDH
- **Split Tunneling**: Selective routing
- **Kill Switch**: Network-level blocking
- **DNS Leak Protection**: Preventing DNS exposure
- **Certificate Authority**: Managing VPN certificates
- **Client Configuration**: Profiles and authentication
- **Performance Optimization**: Tuning throughput

## Code Examples

### WireGuard Server Configuration

```ini
# /etc/wireguard/wg0.conf
[Interface]
PrivateKey = SERVER_PRIVATE_KEY
Address = 10.0.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT
PostUp = iptables -t nat -A POSTROUTING -s 10.0.0.0/24 -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT
PostDown = iptables -t nat -D POSTROUTING -s 10.0.0.0/24 -o eth0 -j MASQUERADE

# Persistent keepalive for NAT environments
PersistentKeepalive = 25

# DNS settings for clients
DNS = 1.1.1.1, 8.8.8.8

# MTU optimization
MTU = 1420

# Logging
Table = off

[Peer]
# Client: alice
PublicKey = ALICE_PUBLIC_KEY
AllowedIPs = 10.0.0.2/32
PersistentKeepalive = 25

[Peer]
# Client: bob
PublicKey = BOB_PUBLIC_KEY
AllowedIPs = 10.0.0.3/32
PersistentKeepalive = 25

[Peer]
# Client: mobile
PublicKey = MOBILE_PUBLIC_KEY
AllowedIPs = 10.0.0.4/32
```

### WireGuard Client Configuration

```ini
# /etc/wireguard/wg0-client.conf
[Interface]
PrivateKey = CLIENT_PRIVATE_KEY
Address = 10.0.0.2/24
DNS = 1.1.1.1
MTU = 1420

[Peer]
# Server configuration
PublicKey = SERVER_PUBLIC_KEY
Endpoint = vpn.example.com:51820
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25

# Table offloading for specific routes
# Table = 123
```

### OpenVPN Server Configuration

```bash
# /etc/openvpn/server.conf

# Protocol and port
proto udp
port 1194
dev tun

# Certificates
ca ca.crt
cert server.crt
key server.key
dh dh.pem
tls-auth ta.key 0

# Cryptographic settings
cipher AES-256-GCM
auth SHA256
ncp-ciphers AES-256-GCM:AES-128-GCM

# Network configuration
server 10.8.0.0 255.255.255.0
topology subnet

# Push configurations to clients
push "route 10.0.0.0 255.255.255.0"
push "dhcp-option DNS 1.1.1.1"
push "dhcp-option DNS 8.8.8.8"
push "redirect-gateway def1 bypass-dhcp"

# Client configuration directory
client-config-dir /etc/openvpn/ccd

# Enable client-to-client
client-to-client

# Keepalive
keepalive 10 120

# Security
user nobody
group nogroup
chroot /etc/openvpn/jail

# Logging
status /var/log/openvpn/status.log
log-append /var/log/openvpn/server.log
verb 3

# Performance
tun-mtu 1500
fragment 1300
mssfix 1400

# Authentication
plugin /usr/lib/openvpn/plugins/openvpn-plugin-auth-pam.so login
verify-client-cert none
username-as-common-name

# Compression
compress lz4-v2

# Duplicate CN
duplicate-cn

# Max clients
max-clients 100

# Log rotation
ifconfig-pool-persist /var/lib/openvpn/ipp.txt
```

### Python WireGuard Management API

```python
import subprocess
import ipaddress
from dataclasses import dataclass
from typing import Optional, List
from enum import Enum
import json
import time

class VPNStatus(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"

@dataclass
class WireGuardPeer:
    public_key: str
    preshared_key: Optional[str]
    allowed_ips: List[str]
    endpoint: Optional[str]
    persistent_keepalive: int
    latest_handshake: Optional[int]
    transfer_rx: int
    transfer_tx: int

@dataclass
class VPNServer:
    interface: str
    listen_port: int
    addresses: List[str]
    peers: List[WireGuardPeer]

class WireGuardManager:
    def __init__(self, interface: str = "wg0"):
        self.interface = interface
    
    def generate_keys(self) -> dict:
        """Generate WireGuard key pair."""
        private_key = subprocess.check_output(
            ["wg-genkey"],
            text=True
        ).strip()
        
        public_key = subprocess.check_output(
            ["wg-pubkey"],
            input=private_key,
            text=True
        ).strip()
        
        preshared_key = subprocess.check_output(
            ["wg-genpsk"],
            text=True
        ).strip()
        
        return {
            "private_key": private_key,
            "public_key": public_key,
            "preshared_key": preshared_key
        }
    
    def get_status(self) -> VPNServer:
        """Get current VPN status."""
        output = subprocess.check_output(
            ["wg", "show", self.interface],
            text=True
        )
        
        server = VPNServer(
            interface=self.interface,
            listen_port=0,
            addresses=[],
            peers=[]
        )
        
        current_peer = None
        for line in output.split("\n"):
            if ":" in line:
                key, value = line.split(":", 1)
                value = value.strip()
                
                if key == "interface":
                    server.interface = value
                elif key == "listen port":
                    server.listen_port = int(value)
                elif key == "public key":
                    current_peer = WireGearPeer(
                        public_key=value,
                        preshared_key=None,
                        allowed_ips=[],
                        endpoint=None,
                        persistent_keepalive=0,
                        latest_handshake=None,
                        transfer_rx=0,
                        transfer_tx=0
                    )
                    server.peers.append(current_peer)
                elif key == "preshared key" and current_peer:
                    current_peer.preshared_key = value if value != "(none)" else None
                elif key == "allowed ips" and current_peer:
                    current_peer.allowed_ips = value.split(", ")
                elif key == "endpoint" and current_peer:
                    current_peer.endpoint = value
                elif key == "persistent keepalive" and current_peer:
                    current_peer.persistent_keepalive = int(value.split()[0])
                elif key == "latest handshake" and current_peer:
                    seconds = int(value.split()[0]) if value.split()[0].isdigit() else 0
                    current_peer.latest_handshake = seconds
                elif key == "transfer" and current_peer:
                    parts = value.split()
                    if len(parts) >= 4:
                        rx_bytes = int(parts[0])
                        tx_bytes = int(parts[2])
                        current_peer.transfer_rx = rx_bytes
                        current_peer.transfer_tx = tx_bytes
        
        return server
    
    def add_peer(self, public_key: str, allowed_ips: List[str],
                 preshared_key: Optional[str] = None) -> None:
        """Add a new peer to the VPN."""
        cmd = ["wg", "set", self.interface, "peer", public_key]
        
        if preshared_key:
            cmd.extend(["preshared-key", preshared_key])
        
        cmd.append("allowed-ips")
        cmd.append(",".join(allowed_ips))
        
        subprocess.run(cmd, check=True)
    
    def remove_peer(self, public_key: str) -> None:
        """Remove a peer from the VPN."""
        subprocess.run(
            ["wg", "set", self.interface, "peer", public_key, "remove"],
            check=True
        )
    
    def set_firewall_rules(self, action: str = "add") -> None:
        """Configure firewall for VPN."""
        rules = [
            f"iptables -C FORWARD -i {self.interface} -j ACCEPT" if action == "check"
            else f"iptables -{action} FORWARD -i {self.interface} -j ACCEPT",
            f"iptables -t nat -C POSTROUTING -s 10.0.0.0/24 -o eth0 -j MASQUERADE" if action == "check"
            else f"iptables -t nat -{action} POSTROUTING -s 10.0.0.0/24 -o eth0 -j MASQUERADE"
        ]
        
        for rule in rules:
            try:
                subprocess.run(rule.split(), check=False)
            except subprocess.CalledProcessError:
                pass
    
    def start(self) -> None:
        """Start the WireGuard interface."""
        subprocess.run(["wg-quick", "up", self.interface], check=True)
    
    def stop(self) -> None:
        """Stop the WireGuard interface."""
        subprocess.run(["wg-quick", "down", self.interface], check=True)
    
    def restart(self) -> None:
        """Restart the WireGuard interface."""
        self.stop()
        time.sleep(2)
        self.start()
```

### IPsec Configuration with strongSwan

```bash
# /etc/ipsec.conf

config setup
    charondebug="ike 2, knl 2, cfg 2"
    uniqueids=yes
    strictcrlpolicy=no

conn %default
    ikelifetime=60m
    keylife=20m
    rekeymargin=3m
    keyingtries=1
    authby=secret
    ike=aes256-sha256-modp2048
    esp=aes256-sha256-modp2048

conn site-to-site
    left=203.0.113.10
    leftsubnet=10.0.0.0/24
    leftid=@vpn-server.example.com
    
    right=203.0.113.20
    rightsubnet=10.0.1.0/24
    rightid=@vpn-client.example.com
    
    auto=start

conn roadwarrior
    left=%any
    leftsubnet=10.0.0.0/24
    leftid=@vpn-server.example.com
    
    right=%any
    rightrsakey=0sAQO...
    
    auto=add
```

```bash
# /etc/ipsec.secrets

@server.example.com @client.example.com : PSK "your_preshared_key_here"

# RSA key for roadwarriors
: RSA server-private-key.pem

username : EAP "password_here"
```

## Best Practices

1. **Use WireGuard**: Modern, efficient VPN protocol
2. **Implement Perfect Forward Secrecy**: Regular key rotation
3. **Configure Kill Switch**: Block traffic when VPN disconnects
4. **Use Strong Cryptography**: AES-256-GCM or ChaCha20
5. **Manage Certificates Properly**: Automate certificate lifecycle
6. **Monitor VPN Usage**: Track connections and bandwidth
7. **Implement Split Tunneling**: Only route necessary traffic
8. **Enable DNS Leak Protection**: Prevent DNS exposure
9. **Regular Security Audits**: Review VPN configuration
10. **Document Emergency Procedures**: Recovery steps for failures
