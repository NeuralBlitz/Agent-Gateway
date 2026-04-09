---
name: Penetration Testing
description: Ethical hacking, exploit development, security assessment techniques, and vulnerability exploitation
license: MIT
compatibility:
  - Python 3.8+
  - Linux
  - Bash
audience: Security professionals, penetration testers, red teamers
category: Cybersecurity
---

# Penetration Testing

## What I do

I enable ethical security testing by providing methodologies for reconnaissance, vulnerability scanning, exploitation, post-exploitation, and reporting. I help identify security weaknesses through controlled testing approaches.

## When to use me

- Conducting authorized security assessments
- Testing application security (web, mobile, API)
- Assessing network infrastructure security
- Performing social engineering assessments
- Validating findings from automated scanners
- Developing custom exploitation tools
- Red team exercises and adversary simulation
- Security training and education

## Core Concepts

- **Reconnaissance**: Passive and active information gathering
- **Enumeration**: Service discovery, version identification
- **Vulnerability Assessment**: Identifying and prioritizing weaknesses
- **Exploitation**: Leveraging vulnerabilities to gain access
- **Privilege Escalation**: Gaining higher access levels
- **Persistence**: Maintaining access after reboot/reconnection
- **Lateral Movement**: Moving through the network
- **Data Exfiltration**: Safely demonstrating data access
- **Cleanup**: Removing indicators of compromise
- **Reporting**: Documenting findings and remediation

## Code Examples

### Network Reconnaissance Scanner

```python
import socket
import concurrent.futures
import subprocess
import nmap
from typing import Dict, List, Set
from dataclasses import dataclass
from datetime import datetime

@dataclass
class PortService:
    port: int
    protocol: str
    service: str
    version: str
    state: str

@dataclass
class HostInfo:
    ip: str
    hostname: str
    os_guess: str
    ports: List[PortService]
    scan_timestamp: datetime

COMMON_PORTS = {
    20: "FTP-Data", 21: "FTP", 22: "SSH", 23: "Telnet",
    25: "SMTP", 53: "DNS", 80: "HTTP", 110: "POP3",
    143: "IMAP", 443: "HTTPS", 445: "SMB", 3306: "MySQL",
    3389: "RDP", 5432: "PostgreSQL", 8080: "HTTP-Alt", 8443: "HTTPS-Alt"
}

class ReconScanner:
    def __init__(self, timeout: float = 2.0, max_workers: int = 100):
        self.timeout = timeout
        self.max_workers = max_workers
        self.nm = nmap.PortScanner()
    
    def resolve_hostname(self, hostname: str) -> List[str]:
        try:
            ips = socket.gethostbyname_ex(hostname)[2]
            return ips
        except socket.gaierror:
            return []
    
    def get_reverse_dns(self, ip: str) -> str:
        try:
            return socket.gethostbyaddr(ip)[0]
        except socket.herror:
            return ""
    
    def scan_port(self, target: str, port: int) -> PortService:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(self.timeout)
        
        result = socket.getservbyport(port) if port < 1024 else ""
        
        try:
            sock.connect((target, port))
            return PortService(
                port=port, protocol="tcp",
                service=COMMON_PORTS.get(port, "unknown"),
                version="", state="open"
            )
        except (socket.timeout, ConnectionRefusedError):
            return PortService(
                port=port, protocol="tcp",
                service=COMMON_PORTS.get(port, "unknown"),
                version="", state="closed"
            )
        finally:
            sock.close()
    
    def quick_port_scan(self, target: str, ports: List[int] = None) -> List[PortService]:
        if ports is None:
            ports = list(COMMON_PORTS.keys())
        
        open_ports = []
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = {executor.submit(self.scan_port, target, p): p for p in ports}
            
            for future in concurrent.futures.as_completed(futures):
                result = future.result()
                if result.state == "open":
                    open_ports.append(result)
        
        return sorted(open_ports, key=lambda x: x.port)
    
    def detailed_nmap_scan(self, target: str, ports: str = "-") -> HostInfo:
        try:
            self.nm.scan(hosts=target, ports=ports, arguments="-sV -sC --script=vuln")
            
            host_data = self.nm.all_hosts()[0] if self.nm.all_hosts() else None
            
            if not host_data:
                return HostInfo(
                    ip=target, hostname="", os_guess="",
                    ports=[], scan_timestamp=datetime.now()
                )
            
            os_guess = self.nm[host_data].get("osmatch", [{}])[0].get("name", "")
            
            ports_found = []
            for port in self.nm[host_data].get("tcp", {}).values():
                ports_found.append(PortService(
                    port=port["portid"],
                    protocol="tcp",
                    service=port.get("name", "unknown"),
                    version=port.get("version", ""),
                    state=port["state"]
                ))
            
            return HostInfo(
                ip=host_data,
                hostname=self.nm[host_data].hostname(),
                os_guess=os_guess,
                ports=ports_found,
                scan_timestamp=datetime.now()
            )
        except Exception as e:
            return HostInfo(
                ip=target, hostname="", os_guess="",
                ports=[], scan_timestamp=datetime.now()
            )
```

### Web Vulnerability Scanner

```python
import requests
from typing import Dict, List, Set
from dataclasses import dataclass
from urllib.parse import urljoin, urlparse
import re

@dataclass
class Vulnerability:
    name: str
    severity: str
    description: str
    url: str
    evidence: str
    remediation: str

class WebVulnScanner:
    VULN_CHECKS = []
    
    def __init__(self, base_url: str, session: requests.Session = None):
        self.base_url = base_url.rstrip('/')
        self.session = session or requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Security Scanner)'
        })
        self.vulnerabilities: List[Vulnerability] = []
        self.forms_found: List[Dict] = []
        self.endpoints_found: Set[str] = set()
    
    def check_sql_injection(self, url: str) -> List[Vulnerability]:
        vulns = []
        test_payloads = [
            "'", "' OR '1'='1", "' OR 1=1--",
            "1; DROP TABLE users", "' UNION SELECT--"
        ]
        
        for payload in test_payloads:
            try:
                response = self.session.get(url, params={'id': payload})
                
                if any(err in response.text.lower() for err in 
                       ['sql syntax', 'mysql', 'postgresql', 'ORA-', 
                        'sqlstate', 'unclosed quotation']):
                    vulns.append(Vulnerability(
                        name="Potential SQL Injection",
                        severity="HIGH",
                        description="Input appears vulnerable to SQL injection",
                        url=url,
                        evidence=f"Payload: {payload}",
                        remediation="Use parameterized queries or ORM"
                    ))
            except Exception:
                continue
        
        return vulns
    
    def check_xss(self, url: str) -> List[Vulnerability]:
        vulns = []
        test_payloads = [
            "<script>alert(1)</script>",
            "<img src=x onerror=alert(1)>",
            "javascript:alert(1)"
        ]
        
        for payload in test_payloads:
            try:
                response = self.session.get(url, params={'q': payload})
                
                if payload in response.text:
                    vulns.append(Vulnerability(
                        name="Reflected Cross-Site Scripting",
                        severity="MEDIUM",
                        description="Input is reflected back without encoding",
                        url=url,
                        evidence=f"Payload reflected: {payload}",
                        remediation="Implement output encoding and CSP"
                    ))
            except Exception:
                continue
        
        return vulns
    
    def check_open_redirect(self, url: str) -> List[Vulnerability]:
        vulns = []
        test_urls = [
            "https://evil.com",
            "//evil.com",
            "https://evil.com/path"
        ]
        
        for redirect_url in test_urls:
            try:
                response = self.session.get(url, params={'redirect': redirect_url}, 
                                           allow_redirects=False)
                
                if response.status_code in [301, 302, 303, 307, 308]:
                    location = response.headers.get('Location', '')
                    if redirect_url in location or 'evil.com' in location:
                        vulns.append(Vulnerability(
                            name="Open Redirect",
                            severity="LOW",
                            description="Application allows redirection to arbitrary URLs",
                            url=url,
                            evidence=f"Redirects to: {location}",
                            remediation="Validate and whitelist redirect URLs"
                        ))
            except Exception:
                continue
        
        return vulns
    
    def crawl_and_scan(self, max_pages: int = 50) -> List[Vulnerability]:
        to_visit = {self.base_url}
        visited = set()
        page_count = 0
        
        while to_visit and page_count < max_pages:
            current = to_visit.pop()
            visited.add(current)
            page_count += 1
            
            try:
                response = self.session.get(current)
                self.vulnerabilities.extend(self.check_sql_injection(current))
                self.vulnerabilities.extend(self.check_xss(current))
                
                for link in re.findall(r'href=["\'](.*?)["\']', response.text):
                    if link.startswith('/'):
                        full_url = urljoin(self.base_url, link)
                        if full_url not in visited:
                            to_visit.add(full_url)
                    elif link.startswith(self.base_url) and link not in visited:
                        to_visit.add(link)
                        
            except Exception:
                continue
        
        return self.vulnerabilities
```

### Credential Testing Framework

```python
import requests
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

@dataclass
class CredentialTest:
    username: str
    password: str
    service: str
    url: str
    success: bool
    error_message: str
    timestamp: datetime

class CredentialTester:
    def __init__(self, delay: float = 0.5, max_workers: int = 5):
        self.delay = delay
        self.max_workers = max_workers
        self.session = requests.Session()
    
    def test_basic_auth(self, url: str, username: str, password: str) -> CredentialTest:
        try:
            response = self.session.get(
                url, auth=(username, password), timeout=10
            )
            
            return CredentialTest(
                username=username,
                password=password,
                service="Basic Auth",
                url=url,
                success=response.status_code == 200,
                error_message="" if response.status_code == 200 else f"Status: {response.status_code}",
                timestamp=datetime.now()
            )
        except Exception as e:
            return CredentialTest(
                username=username, password=password,
                service="Basic Auth", url=url,
                success=False, error_message=str(e),
                timestamp=datetime.now()
            )
    
    def test_form_auth(self, login_url: str, username: str, password: str,
                       username_field: str = "username",
                       password_field: str = "password") -> CredentialTest:
        try:
            response = self.session.post(
                login_url,
                data={username_field: username, password_field: password},
                timeout=10,
                allow_redirects=False
            )
            
            if response.status_code in [200, 302]:
                is_success = False
                
                if response.status_code == 302:
                    if 'location' in response.headers:
                        if 'login' not in response.headers['location'].lower():
                            is_success = True
                
                if not is_success and 'dashboard' in response.text.lower():
                    is_success = True
                
                return CredentialTest(
                    username=username, password=password,
                    service="Form Auth", url=login_url,
                    success=is_success,
                    error_message="Login successful" if is_success else "Login failed",
                    timestamp=datetime.now()
                )
            else:
                return CredentialTest(
                    username=username, password=password,
                    service="Form Auth", url=login_url,
                    success=False, error_message=f"Status: {response.status_code}",
                    timestamp=datetime.now()
                )
        except Exception as e:
            return CredentialTest(
                username=username, password=password,
                service="Form Auth", url=login_url,
                success=False, error_message=str(e),
                timestamp=datetime.now()
            )
    
    def test_credential_list(self, url: str, credentials: List[Tuple[str, str]],
                            method: str = "basic") -> List[CredentialTest]:
        results = []
        
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = []
            
            for username, password in credentials:
                if method == "basic":
                    future = executor.submit(
                        self.test_basic_auth, url, username, password
                    )
                else:
                    future = executor.submit(
                        self.test_form_auth, url, username, password
                    )
                futures.append(future)
            
            for future in as_completed(futures):
                result = future.result()
                results.append(result)
                
                if self.delay > 0:
                    import time
                    time.sleep(self.delay)
        
        return results
```

### Subdomain Enumeration

```python
import dns.resolver
import requests
from typing import List, Set
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor, as_completed

@dataclass
class SubdomainResult:
    subdomain: str
    ip_address: str
    has_https: bool
    status_code: int
    title: str

class SubdomainEnumerator:
    def __init__(self, timeout: float = 2.0, max_workers: int = 20):
        self.timeout = timeout
        self.max_workers = max_workers
        self.resolver = dns.resolver.Resolver()
        self.resolver.timeout = timeout
        self.resolver.lifetime = timeout
    
    def check_dns(self, subdomain: str, domain: str) -> Optional[str]:
        try:
            fqdn = f"{subdomain}.{domain}"
            answers = self.resolver.resolve(fqdn, 'A')
            return str(answers[0])
        except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer,
                dns.resolver.Timeout, dns.resolver.NoNameservers):
            return None
    
    def check_crtsh(self, domain: str) -> Set[str]:
        try:
            url = f"https://crt.sh/?q={domain}&output=json"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                subdomains = set()
                for entry in data:
                    name = entry.get('common_name', '')
                    if name and name != domain and name.endswith(domain):
                        subdomains.add(name.split('.')[0])
                return subdomains
        except Exception:
            pass
        return set()
    
    def check_sublist3r(self, domain: str) -> Set[str]:
        try:
            url = f"https://api.sublist3r.com/search.php?domain={domain}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                return set(response.json())
        except Exception:
            pass
        return set()
    
    def enumerate_subdomains(self, domain: str, wordlist: List[str] = None) -> List[SubdomainResult]:
        if wordlist is None:
            wordlist = ['www', 'mail', 'api', 'dev', 'test', 'staging',
                       'admin', 'portal', 'cdn', 'shop', 'blog', 'static']
        
        found = []
        
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = {
                executor.submit(self.check_dns, sub, domain): sub 
                for sub in wordlist
            }
            
            for future in as_completed(futures):
                subdomain = futures[future]
                ip = future.result()
                
                if ip:
                    fqdn = f"{subdomain}.{domain}"
                    result = SubdomainResult(
                        subdomain=fqdn,
                        ip_address=ip,
                        has_https=False,
                        status_code=0,
                        title=""
                    )
                    
                    try:
                        https_response = requests.head(
                            f"https://{fqdn}", timeout=self.timeout,
                            allow_redirects=True
                        )
                        result.has_https = True
                        result.status_code = https_response.status_code
                    except Exception:
                        try:
                            http_response = requests.head(
                                f"http://{fqdn}", timeout=self.timeout,
                                allow_redirects=True
                            )
                            result.status_code = http_response.status_code
                        except Exception:
                            pass
                    
                    found.append(result)
        
        return sorted(found, key=lambda x: x.subdomain)
```

## Best Practices

- Always obtain written authorization before testing
- Define clear scope and rules of engagement
- Use isolated testing environments when possible
- Document all findings with evidence (screenshots, logs)
- Follow responsible disclosure for vulnerabilities found
- Avoid causing denial-of-service during testing
- Use least destructive testing methods first
- Maintain strict confidentiality of findings
- Validate findings with multiple techniques before reporting
- Consider business impact when prioritizing vulnerabilities
- Use professional reporting templates

## Common Patterns

- **OSINT Gathering**: Passive reconnaissance using public sources
- **Vulnerability Chains**: Combining multiple vulnerabilities for impact
- **PrivEsc Paths**: Identifying privilege escalation vectors
- **Exfiltration Simulation**: Safely demonstrating data access risk
- **Persistence Mechanisms**: Testing detection of persistence techniques
- **Red Team Operations**: Full adversary simulation with objectives
