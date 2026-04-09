---
name: Zero Trust Architecture
category: cybersecurity
description: Implementing zero trust security models that verify every request regardless of network location
tags: [zero-trust, microsegmentation, identity-verification, least-privilege, continuous-auth]
version: "1.0"
---

# Zero Trust Architecture

## What I Do

I provide guidance on implementing zero trust security architectures where no user, device, or network segment is implicitly trusted. This includes continuous verification of identity, device health, and context for every access request, microsegmentation of networks, and policy-based access control.

## When to Use Me

- Designing a zero trust architecture for an organization or application
- Implementing continuous authentication and authorization checks
- Configuring microsegmentation between services
- Setting up device trust and health verification
- Migrating from perimeter-based security to zero trust
- Implementing policy engines for access decisions

## Core Concepts

1. **Never Trust, Always Verify**: Authenticate and authorize every request regardless of source network, previous authentication, or device.
2. **Least Privilege Access**: Grant minimum required permissions for the specific task, resource, and time window.
3. **Microsegmentation**: Divide networks into granular zones with individual access policies for each segment.
4. **Continuous Verification**: Re-evaluate trust continuously based on user behavior, device state, and context changes.
5. **Device Trust**: Verify device identity, health, patch level, and compliance before granting access.
6. **Context-Aware Policies**: Make access decisions based on user identity, device, location, time, and risk score.
7. **Assume Breach**: Design systems assuming adversaries are already inside the network and limit blast radius.

## Code Examples

### 1. Policy Decision Point (Python)

```python
from dataclasses import dataclass
from enum import Enum
from typing import List

class Decision(Enum):
    ALLOW = "allow"
    DENY = "deny"
    MFA_REQUIRED = "mfa_required"

@dataclass
class AccessContext:
    user_id: str
    device_id: str
    device_compliant: bool
    ip_address: str
    resource: str
    action: str
    risk_score: float
    mfa_verified: bool

def evaluate_access(ctx: AccessContext) -> Decision:
    if not ctx.device_compliant:
        return Decision.DENY
    if ctx.risk_score > 0.8:
        return Decision.DENY
    if ctx.risk_score > 0.5 and not ctx.mfa_verified:
        return Decision.MFA_REQUIRED
    if ctx.action in ("delete", "admin") and not ctx.mfa_verified:
        return Decision.MFA_REQUIRED
    return Decision.ALLOW
```

### 2. Service-to-Service mTLS Verification (Go)

```go
package main

import (
	"crypto/tls"
	"crypto/x509"
	"log"
	"net/http"
	"os"
)

func createMTLSClient(certFile, keyFile, caFile string) (*http.Client, error) {
	cert, err := tls.LoadX509KeyPair(certFile, keyFile)
	if err != nil {
		return nil, err
	}
	caCert, err := os.ReadFile(caFile)
	if err != nil {
		return nil, err
	}
	caPool := x509.NewCertPool()
	caPool.AppendCertsFromPEM(caCert)

	tlsConfig := &tls.Config{
		Certificates: []tls.Certificate{cert},
		RootCAs:      caPool,
		MinVersion:   tls.VersionTLS13,
	}
	return &http.Client{
		Transport: &http.Transport{TLSClientConfig: tlsConfig},
	}, nil
}
```

### 3. Request Context Enrichment Middleware (Python/FastAPI)

```python
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Optional
import ipaddress

TRUSTED_NETWORKS = [ipaddress.ip_network("10.0.0.0/8")]

class ZeroTrustMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        context = {
            "user": getattr(request.state, "user", None),
            "device_id": request.headers.get("X-Device-ID"),
            "client_ip": request.client.host,
            "user_agent": request.headers.get("User-Agent", ""),
            "request_id": request.headers.get("X-Request-ID"),
        }
        ip = ipaddress.ip_address(request.client.host)
        context["is_internal"] = any(ip in net for net in TRUSTED_NETWORKS)
        request.state.security_context = context
        response = await call_next(request)
        return response
```

## Best Practices

1. **Authenticate every request** with strong identity verification regardless of network location.
2. **Use mTLS for service-to-service communication** to ensure mutual identity verification.
3. **Implement microsegmentation** so each service can only communicate with explicitly allowed peers.
4. **Evaluate device trust** including patch level, encryption status, and endpoint protection before granting access.
5. **Apply time-limited access** with just-in-time provisioning and automatic expiration of elevated privileges.
6. **Log all access decisions** with full context (who, what, when, where, why) for audit and anomaly detection.
7. **Encrypt all traffic** including east-west traffic between internal services.
8. **Use a centralized policy engine** to evaluate access decisions consistently across all services.
9. **Implement step-up authentication** that requires stronger verification for sensitive operations.
10. **Continuously monitor and adapt** policies based on threat intelligence and behavioral analytics.
