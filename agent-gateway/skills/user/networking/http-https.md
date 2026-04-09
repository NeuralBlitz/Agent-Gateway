---
name: HTTP/HTTPS
description: HTTP/HTTPS protocol implementation and best practices
license: MIT
compatibility: Cross-platform (All major languages and frameworks)
audience: Backend developers and API architects
category: Networking
---

# HTTP/HTTPS Development

## What I Do

I provide guidance for implementing HTTP/HTTPS APIs and clients. I cover REST principles, HTTP methods, status codes, headers, caching, and security best practices.

## When to Use Me

- Building RESTful APIs
- Implementing HTTP clients
- Designing API endpoints
- Optimizing HTTP performance
- Implementing HTTPS and security

## Core Concepts

- **HTTP Methods**: GET, POST, PUT, PATCH, DELETE, OPTIONS
- **Status Codes**: 1xx, 2xx, 3xx, 4xx, 5xx categories
- **Request/Response Headers**: Metadata and control information
- **Body Formats**: JSON, XML, form-urlencoded
- **Content Negotiation**: Accept and Content-Type headers
- **HTTP Caching**: ETag, Last-Modified, Cache-Control
- **Compression**: gzip and Brotli encoding
- **Connection Management**: Keep-Alive, HTTP/2 multiplexing
- **Redirect Handling**: 301, 302, 307 status codes
- **HTTPS/TLS**: Certificate-based encryption

## Code Examples

### REST API with Python FastAPI

```python
from fastapi import FastAPI, HTTPException, Request, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid

app = FastAPI(
    title="User Management API",
    description="RESTful API for user management",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://example.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    MODERATOR = "moderator"

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    role: UserRole = UserRole.USER
    
    @validator("name")
    def name_must_be_valid(cls, v):
        if len(v) < 2 or len(v) > 100:
            raise ValueError("Name must be between 2 and 100 characters")
        return v.strip()

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: UserRole
    created_at: datetime
    updated_at: Optional[datetime] = None

class ErrorResponse(BaseModel):
    error: str
    code: str
    details: Optional[dict] = None

users_db: dict[str, UserResponse] = {}

def rate_limit_filter(request: Request):
    client_ip = request.client.host
    return True

@app.get("/api/v1/users", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    role: Optional[UserRole] = None,
    x_total_count: Optional[int] = Header(None)
):
    users = list(users_db.values())
    
    if role:
        users = [u for u in users if u.role == role]
    
    total = len(users)
    users = users[skip:skip + limit]
    
    return JSONResponse(
        headers={"X-Total-Count": str(total)},
        content=[user.dict() for user in users]
    )

@app.get("/api/v1/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    if user_id not in users_db:
        raise HTTPException(
            status_code=404,
            detail={"error": "User not found", "code": "USER_NOT_FOUND"}
        )
    return users_db[user_id]

@app.post("/api/v1/users", response_model=UserResponse, status_code=201)
async def create_user(user: UserCreate):
    user_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    new_user = UserResponse(
        id=user_id,
        email=user.email,
        name=user.name,
        role=user.role,
        created_at=now,
        updated_at=None
    )
    
    users_db[user_id] = new_user
    
    return new_user

@app.patch("/api/v1/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_update: UserCreate):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = users_db[user_id]
    
    updated_user = UserResponse(
        id=user.id,
        email=user_update.email or user.email,
        name=user_update.name or user.name,
        role=user_update.role or user.role,
        created_at=user.created_at,
        updated_at=datetime.utcnow()
    )
    
    users_db[user_id] = updated_user
    return updated_user

@app.delete("/api/v1/users/{user_id}", status_code=204)
async def delete_user(user_id: str):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    del users_db[user_id]

@app.options("/api/v1/users")
async def options_users():
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type",
            "Access-Control-Max-Age": "86400"
        }
    )
```

### HTTP Client with Go

```go
package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type HTTPClient struct {
	client  *http.Client
	baseURL string
}

func NewHTTPClient(baseURL string, timeout time.Duration) *HTTPClient {
	return &HTTPClient{
		client: &http.Client{
			Timeout: timeout,
			Transport: &http.Transport{
				MaxIdleConns:        100,
				MaxIdleConnsPerHost: 10,
				IdleConnTimeout:     90 * time.Second,
				MaxConnsPerHost:     100,
			},
		},
		baseURL: baseURL,
	}
}

func (c *HTTPClient) Get(ctx context.Context, endpoint string) (*Response, error) {
	url := c.baseURL + endpoint
	
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	
	return c.executeRequest(req)
}

func (c *HTTPClient) Post(
	ctx context.Context,
	endpoint string,
	body interface{},
) (*Response, error) {
	url := c.baseURL + endpoint
	
	var bodyReader io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal body: %w", err)
		}
		bodyReader = bytes.NewReader(jsonBody)
	}
	
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bodyReader)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	
	req.Header.Set("Content-Type", "application/json")
	
	return c.executeRequest(req)
}

func (c *HTTPClient) Patch(
	ctx context.Context,
	endpoint string,
	body interface{},
) (*Response, error) {
	url := c.baseURL + endpoint
	
	jsonBody, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal body: %w", err)
	}
	
	req, err := http.NewRequestWithContext(ctx, http.MethodPatch, url, bytes.NewReader(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	
	req.Header.Set("Content-Type", "application/merge-patch+json")
	
	return c.executeRequest(req)
}

func (c *HTTPClient) Delete(ctx context.Context, endpoint string) (*Response, error) {
	url := c.baseURL + endpoint
	
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	
	return c.executeRequest(req)
}

func (c *HTTPClient) executeRequest(req *http.Request) (*Response, error) {
	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()
	
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}
	
	response := &Response{
		StatusCode: resp.StatusCode,
		Headers:    resp.Header,
		Body:       body,
	}
	
	if resp.StatusCode >= 400 {
		return response, fmt.Errorf("request failed with status %d", resp.StatusCode)
	}
	
	return response, nil
}

type Response struct {
	StatusCode int
	Headers    http.Header
	Body       []byte
}

func (r *Response) UnmarshalJSON(v interface{}) error {
	return json.Unmarshal(r.Body, v)
}

func (r *Response) UnmarshalXML(v interface{}) error {
	return xml.Unmarshal(r.Body, v)
}
```

### HTTP Middleware for Caching

```javascript
// HTTP caching middleware
const cache = new Map();

function etag(content) {
    return `"${require('crypto')
        .createHash('md5')
        .update(content)
        .digest('hex')}"`;
}

function cachingMiddleware(req, res, next) {
    const key = `${req.method}:${req.url}`;
    const cached = cache.get(key);
    
    if (cached && cached.expires > Date.now()) {
        if (cached.etag === req.headers['if-none-match']) {
            return res.status(304).send();
        }
        
        res.set('ETag', cached.etag);
        res.set('Cache-Control', `max-age=${cached.maxAge}`);
        return res.send(cached.body);
    }
    
    const originalSend = res.send;
    let responseBody;
    
    res.send = function(body) {
        responseBody = body;
        return originalSend.call(this, body);
    };
    
    res.on('finish', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            const maxAge = getMaxAgeForRoute(req.path);
            if (maxAge > 0) {
                const cachedEtag = etag(responseBody);
                
                cache.set(key, {
                    body: responseBody,
                    etag: cachedEtag,
                    maxAge: maxAge,
                    expires: Date.now() + maxAge * 1000
                });
                
                res.set('ETag', cachedEtag);
                res.set('Cache-Control', `public, max-age=${maxAge}`);
            }
        }
    });
    
    next();
}

function getMaxAgeForRoute(path) {
    const cacheConfig = {
        '/api/users': 300,
        '/api/products': 600,
        '/api/static': 86400,
        '/api/health': 0
    };
    
    for (const [route, maxAge] of Object.entries(cacheConfig)) {
        if (path.startsWith(route)) {
            return maxAge;
        }
    }
    
    return 60;
}

module.exports = { cachingMiddleware, etag };
```

## Best Practices

1. **Use Proper HTTP Methods**: POST for create, PUT for replace, PATCH for update
2. **Return Correct Status Codes**: 201 for created, 204 for no content, 400 for bad request
3. **Implement Versioning**: /api/v1/ for breaking changes
4. **Use Pagination**: Limit and offset for list endpoints
5. **Support Content Negotiation**: JSON as default, support others
6. **Implement Rate Limiting**: Prevent abuse
7. **Use Compression**: gzip for large responses
8. **Implement Proper Caching**: ETag and Cache-Control headers
9. **Use HTTPS Only**: Redirect HTTP to HTTPS
10. **Document APIs**: OpenAPI/Swagger documentation
