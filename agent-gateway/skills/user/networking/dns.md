---
name: DNS
description: DNS protocol and domain name resolution
license: MIT
compatibility: Cross-platform
audience: DevOps engineers and network administrators
category: Networking
---

# DNS Configuration

## What I Do

I provide guidance for configuring and troubleshooting DNS. I cover DNS records, zone files, resolvers, and strategies for high availability and performance.

## When to Use Me

- Configuring DNS records
- Setting up DNS for high availability
- Troubleshooting DNS resolution issues
- Implementing DNSSEC
- Optimizing DNS performance

## Core Concepts

- **DNS Record Types**: A, AAAA, CNAME, MX, TXT, NS, SOA
- **Authoritative Nameservers**: Serving DNS zones
- **Recursive Resolvers**: Client-facing DNS servers
- **TTL (Time to Live)**: Caching duration
- **DNS Propagation**: Time for changes to spread
- **DNSSEC**: DNS security extensions
- **Round Robin DNS**: Load distribution
- **GeoDNS**: Geographic-based routing
- **DNS Over HTTPS/TLS**: Encrypted DNS queries
- **Health Checks**: DNS-based failover

## Code Examples

### DNS Client with Python

```python
import socket
import struct
import time
from dataclasses import dataclass
from typing import Optional, List
from enum import Enum

class DNSRecordType(Enum):
    A = 1
    NS = 2
    CNAME = 5
    SOA = 6
    PTR = 12
    MX = 15
    TXT = 16
    AAAA = 28
    SRV = 33
    OPT = 41
    IXFR = 251
    AXFR = 252

class DNSOpCode(Enum):
    QUERY = 0
    IQUERY = 1
    STATUS = 2

class DNSResponseCode(Enum):
    NO_ERROR = 0
    FORMAT_ERROR = 1
    SERVER_FAILURE = 2
    NAME_ERROR = 3
    NOT_IMPLEMENTED = 4
    REFUSED = 5

@dataclass
class DNSAnswer:
    name: str
    record_type: DNSRecordType
    ttl: int
    data: str

@dataclass
class DNSQuery:
    transaction_id: int
    name: str
    record_type: DNSRecordType
    recursive: bool = True

@dataclass
class DNSResponse:
    transaction_id: int
    authoritative: bool
    response_code: DNSResponseCode
    question_count: int
    answer_count: int
    authority_count: int
    additional_count: int
    answers: List[DNSAnswer]

class DNSClient:
    def __init__(self, server: str = "8.8.8.8", port: int = 53, timeout: float = 5.0):
        self.server = server
        self.port = port
        self.timeout = timeout
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.socket.settimeout(timeout)
    
    def query(self, name: str, record_type: DNSRecordType) -> DNSResponse:
        query = self._build_query(name, record_type)
        self.socket.sendto(query, (self.server, self.port))
        
        response, _ = self.socket.recvfrom(512)
        
        return self._parse_response(response)
    
    def _build_query(self, name: str, record_type: DNSRecordType) -> bytes:
        transaction_id = int(time.time() * 1000) & 0xFFFF
        
        flags = 0x0100 if True else 0x0000
        
        header = struct.pack(
            ">HHHHHH",
            transaction_id,
            flags,
            1,
            0,
            0,
            0
        )
        
        name_parts = name.split(".")
        name_bytes = b""
        for part in name_parts:
            name_bytes += struct.pack("B", len(part)) + part.encode()
        name_bytes += b"\x00"
        
        query = header + name_bytes + struct.pack(">HH", record_type.value, 1)
        
        return query
    
    def _parse_response(self, response: bytes) -> DNSResponse:
        offset = 0
        
        transaction_id, flags, qdcount, ancount, nscount, arcount = struct.unpack(
            ">HHHHHH", response[offset:offset + 12]
        )
        offset += 12
        
        response_code = DNSResponseCode(flags & 0x000F)
        authoritative = (flags & 0x0400) != 0
        
        qname, offset = self._parse_name(response, offset)
        
        qtype, qclass = struct.unpack(">HH", response[offset:offset + 4])
        offset += 4
        
        answers = []
        for _ in range(ancount):
            answer_name, offset = self._parse_name(response, offset)
            
            atype, aclass, ttl, rdlength = struct.unpack(">HHIH", response[offset:offset + 10])
            offset += 10
            
            rdata = response[offset:offset + rdlength]
            offset += rdlength
            
            data = self._parse_rdata(atype, rdata)
            
            answers.append(DNSAnswer(
                name=answer_name,
                record_type=DNSRecordType(atype),
                ttl=ttl,
                data=data
            ))
        
        return DNSResponse(
            transaction_id=transaction_id,
            authoritative=authoritative,
            response_code=response_code,
            question_count=qdcount,
            answer_count=ancount,
            authority_count=nscount,
            additional_count=arcount,
            answers=answers
        )
    
    def _parse_name(self, response: bytes, offset: int) -> (str, int):
        name_parts = []
        original_offset = offset
        
        while True:
            length = response[offset]
            
            if length & 0xC0 == 0xC0:
                pointer = struct.unpack(">H", response[offset:offset + 2])[0] & 0x3FFF
                pointed_name, _ = self._parse_name(response, pointer)
                name_parts.append(pointed_name)
                offset += 2
                break
            
            if length == 0:
                offset += 1
                break
            
            offset += 1
            name_parts.append(response[offset:offset + length].decode())
            offset += length
        
        return ".".join(name_parts), offset
    
    def _parse_rdata(self, record_type: int, rdata: bytes) -> str:
        if record_type == DNSRecordType.A.value:
            return ".".join(str(b) for b in rdata)
        elif record_type == DNSRecordType.AAAA.value:
            return ":".join(f"{b:x}{b+16:x}" for b in rdata).replace("::", "::")
        elif record_type == DNSRecordType.CNAME.value:
            return rdata.rstrip(b"\x00").decode()
        elif record_type == DNSRecordType.MX.value:
            preference = struct.unpack(">H", rdata[:2])[0]
            exchange = rdata[2:].rstrip(b"\x00").decode()
            return f"{preference} {exchange}"
        elif record_type == DNSRecordType.TXT.value:
            return rdata[1:rdata[0] + 1].decode()
        else:
            return rdata.hex()
    
    def close(self):
        self.socket.close()

async def resolve_domain(domain: str, record_type: str = "A") -> List[str]:
    client = DNSClient()
    
    try:
        dns_type = DNSRecordType[record_type.upper()]
        response = client.query(domain, dns_type)
        
        if response.response_code != DNSResponseCode.NO_ERROR:
            return []
        
        return [answer.data for answer in response.answers]
    finally:
        client.close()
```

### DNS Zone Configuration (BIND)

```zone
; /etc/bind/db.example.com
;
; Primary DNS zone file for example.com
;

$TTL 86400      ; Default TTL of 1 day
@       IN      SOA     ns1.example.com. admin.example.com. (
                        2024010101      ; Serial number (YYYYMMDDNN)
                        3600            ; Refresh (1 hour)
                        1800            ; Retry (30 minutes)
                        604800          ; Expire (1 week)
                        86400           ; Minimum TTL (1 day)
                        )

; Name Servers
@       IN      NS      ns1.example.com.
@       IN      NS      ns2.example.com.
@       IN      NS      ns3.example.com.

; A Records
@       IN      A       203.0.113.10
@       IN      A       203.0.113.11
@       IN      AAAA    2001:db8::1

; CNAME Records
www     IN      CNAME   @
api     IN      CNAME   api-us-east-1.example.com.
cdn     IN      CNAME   d1234567890.cloudfront.net.

; MX Records
@       IN      MX      10 mail1.example.com.
@       IN      MX      20 mail2.example.com.

; TXT Records
@       IN      TXT     "v=spf1 include:_spf.example.com ~all"
@       IN      TXT     "google-site-verification=abc123xyz"

; DMARC
_dmarc  IN      TXT     "v=DMARC1; p=none; rua=mailto:dmarc-reports@example.com"

; SRV Records
_sip    IN      SRV     10 60 5060 sip.example.com.
_xmpp   IN      SRV     10 60 5222 xmpp.example.com.

; Geographic A Records (using Lat/Long with LOC records)
; LOC records for geographic DNS
@       IN      LOC     40 44 55.000 N 73 59 11.000 W 10m

; NS Sub-zone delegation
subdomain.example.com.  IN      NS      ns1.subdomain.example.com.
subdomain.example.com.  IN      NS      ns2.subdomain.example.com.

; Glue records for delegation
ns1.subdomain.example.com.  IN  A       203.0.113.100
ns2.subdomain.example.com.  IN  A       203.0.113.101
```

### Health Check DNS Failover

```go
package main

import (
	"context"
	"fmt"
	"net"
	"sync"
	"time"
)

type DNSSFailover struct {
	domains    []string
	healthIPs  map[string][]string
	checkInterval time.Duration
	mu         sync.RWMutex
	currentIP  string
}

func NewDNSFailover(domains []string, checkInterval time.Duration) *DNSSFailover {
	return &DNSSFailover{
		domains:       domains,
		healthIPs:     make(map[string][]string),
		checkInterval: checkInterval,
	}
}

func (f *DNSSFailover) Start(ctx context.Context) {
	f.checkAllDomains()
	
	ticker := time.NewTicker(f.checkInterval)
	defer ticker.Stop()
	
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			f.checkAllDomains()
		}
	}
}

func (f *DNSSFailover) checkAllDomains() {
	f.mu.Lock()
	defer f.mu.Unlock()
	
	for _, domain := range f.domains {
		ips := f.resolveAndCheck(domain)
		f.healthIPs[domain] = ips
		
		if len(ips) > 0 && f.currentIP == "" {
			f.currentIP = ips[0]
		}
	}
}

func (f *DNSSFailover) resolveAndCheck(domain string) []string {
	resolver := net.Resolver{}
	
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	ips, err := resolver.LookupIP(ctx, "ip", domain)
	if err != nil {
		return nil
	}
	
	var healthy []string
	for _, ip := range ips {
		if f.healthCheck(ip.String(), domain) {
			healthy = append(healthy, ip.String())
		}
	}
	
	return healthy
}

func (f *DNSSFailover) healthCheck(ip string, domain string) bool {
	conn, err := net.DialTimeout("tcp", ip+":80", 2*time.Second)
	if err != nil {
		return false
	}
	defer conn.Close()
	
	_, err = conn.Write([]byte(fmt.Sprintf("GET /health HTTP/1.1\r\nHost: %s\r\n\r\n", domain)))
	if err != nil {
		return false
	}
	
	buf := make([]byte, 1024)
	n, _ := conn.Read(buf)
	
	return string(buf[:n])[:15] == "HTTP/1.1 200 OK"
}

func (f *DNSSFailover) GetCurrentIP() string {
	f.mu.RLock()
	defer f.mu.RUnlock()
	return f.currentIP
}
```

## Best Practices

1. **Set Appropriate TTLs**: Balance between caching and flexibility
2. **Use Multiple Nameservers**: Ensure redundancy
3. **Implement DNSSEC**: Protect against DNS spoofing
4. **Monitor DNS Health**: Track resolution times and failures
5. **Use Geographic Redundancy**: Deploy DNS servers in multiple regions
6. **Avoid CNAME Chains**: Limit to improve performance
7. **Configure SPF Records**: Prevent email spoofing
8. **Use DNSSEC**: Sign your zones
9. **Implement Monitoring**: Track DNS propagation
10. **Test Regularly**: Verify DNS resolution from multiple locations
