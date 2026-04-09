---
name: API Security
category: cybersecurity
description: Securing REST, GraphQL, and gRPC APIs against abuse, injection, broken authentication, and data exposure
tags: [api, rest, graphql, grpc, owasp-api, authentication, authorization]
version: "1.0"
---

# API Security

## What I Do

I provide guidance on securing APIs against the OWASP API Security Top 10 risks. This includes authentication and authorization enforcement, rate limiting, input validation, response filtering, and protection against broken object-level authorization, mass assignment, and excessive data exposure.

## When to Use Me

- Designing authentication and authorization for new API endpoints
- Implementing rate limiting and throttling strategies
- Protecting against BOLA (Broken Object Level Authorization) vulnerabilities
- Validating request payloads and filtering response data
- Securing GraphQL endpoints against introspection abuse and query complexity attacks
- Adding API gateway security policies

## Core Concepts

1. **OWASP API Security Top 10**: BOLA, broken authentication, broken object property level authorization, unrestricted resource consumption, broken function level authorization, unrestricted access to sensitive business flows, server-side request forgery, security misconfiguration, improper inventory management, unsafe consumption of APIs.
2. **Object-Level Authorization**: Verify the requesting user has access to the specific resource instance, not just the resource type.
3. **Rate Limiting**: Enforce request quotas per user, IP, or API key to prevent abuse and denial of service.
4. **Input Schema Validation**: Validate request bodies against strict schemas rejecting unexpected fields.
5. **Response Filtering**: Return only the fields the client needs rather than entire database objects.
6. **API Key Management**: Rotate keys, scope them to specific endpoints, and never expose them in client-side code.
7. **Mass Assignment Protection**: Explicitly define which fields are writable to prevent clients from modifying unintended properties.

## Code Examples

### 1. Object-Level Authorization Check (Python/FastAPI)

```python
from fastapi import HTTPException, Depends
from typing import Any

async def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Not found")
    if document.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Forbidden")
    return document
```

### 2. Rate Limiting Middleware (Python/FastAPI)

```python
import time
from collections import defaultdict
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window = window_seconds
        self.requests: dict = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        now = time.time()
        self.requests[client_ip] = [
            t for t in self.requests[client_ip] if now - t < self.window
        ]
        if len(self.requests[client_ip]) >= self.max_requests:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        self.requests[client_ip].append(now)
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(
            self.max_requests - len(self.requests[client_ip])
        )
        return response
```

### 3. Mass Assignment Protection (Python/Pydantic)

```python
from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserUpdate(BaseModel):
    email: Optional[str] = None
    display_name: Optional[str] = None

class UserInternal(BaseModel):
    id: int
    username: str
    email: str
    is_admin: bool
    password_hash: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    display_name: Optional[str] = None
```

### 4. GraphQL Query Depth Limiting (Node.js)

```javascript
const depthLimit = require('graphql-depth-limit');
const { createComplexityLimitRule } = require('graphql-validation-complexity');

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [
    depthLimit(5),
    createComplexityLimitRule(1000, {
      onCost: (cost) => console.log('Query cost:', cost),
    }),
  ],
  introspection: process.env.NODE_ENV !== 'production',
});
```

## Best Practices

1. **Check object-level authorization** on every endpoint that accesses a specific resource by ID.
2. **Use explicit allowlists** for writable fields to prevent mass assignment attacks.
3. **Validate all request payloads** against strict schemas and reject unexpected fields.
4. **Return minimal response data** using dedicated response models rather than raw database objects.
5. **Implement rate limiting** per user, API key, and IP with appropriate windows and limits.
6. **Disable GraphQL introspection** in production and enforce query depth and complexity limits.
7. **Use short-lived tokens** (JWT with 15-minute expiry) with refresh token rotation.
8. **Log all authentication failures** and authorization denials with request context.
9. **Version your APIs** and deprecate old versions with clear timelines.
10. **Require TLS 1.2+** for all API communication and reject plaintext requests.
