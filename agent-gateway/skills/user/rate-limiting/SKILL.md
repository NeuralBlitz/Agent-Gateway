---
name: rate-limiting
description: Rate limiting implementation and strategies
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: security
---
## What I do
- Implement rate limiting
- Choose appropriate algorithms
- Handle rate limit headers
- Design tiered limits
- Handle rate limit exceeded
- Distribute rate limits
- Monitor rate limit usage
- Implement custom providers

## When to use me
When implementing rate limiting or throttling.

## Rate Limiting Algorithms
```python
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, Optional
import asyncio


# Fixed Window
class FixedWindowRateLimiter:
    """
    Simple fixed window rate limiting.
    
    Pros: Simple, memory efficient
    Cons: Can allow bursts at window boundaries
    """
    
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.windows: Dict[str, list] = {}
    
    def is_allowed(self, key: str) -> tuple[bool, dict]:
        now = datetime.utcnow()
        window_start = self._get_window_start(now)
        
        if key not in self.windows:
            self.windows[key] = []
        
        # Remove old requests
        self.windows[key] = [
            t for t in self.windows[key]
            if t >= window_start
        ]
        
        if len(self.windows[key]) >= self.max_requests:
            return False, {
                "limit": self.max_requests,
                "remaining": 0,
                "reset": int((window_start + timedelta(seconds=self.window_seconds)).timestamp())
            }
        
        self.windows[key].append(now)
        
        return True, {
            "limit": self.max_requests,
            "remaining": self.max_requests - len(self.windows[key]),
            "reset": int((window_start + timedelta(seconds=self.window_seconds)).timestamp())
        }
    
    def _get_window_start(self, now: datetime) -> datetime:
        seconds_past_window = now.timestamp() % self.window_seconds
        return now - timedelta(seconds=seconds_past_window)


# Sliding Window
class SlidingWindowRateLimiter:
    """
    Sliding window rate limiting.
    
    Pros: More accurate than fixed window
    Cons: More complex, more memory
    """
    
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, list] = {}
    
    def is_allowed(self, key: str) -> tuple[bool, dict]:
        now = datetime.utcnow()
        window_start = now - timedelta(seconds=self.window_seconds)
        
        if key not in self.requests:
            self.requests[key] = []
        
        # Remove old requests
        self.requests[key] = [
            t for t in self.requests[key]
            if t >= window_start
        ]
        
        if len(self.requests[key]) >= self.max_requests:
            return False, {
                "limit": self.max_requests,
                "remaining": 0,
                "reset": int((now + timedelta(seconds=self.window_seconds)).timestamp())
            }
        
        self.requests[key].append(now)
        
        return True, {
            "limit": self.max_requests,
            "remaining": self.max_requests - len(self.requests[key]),
            "reset": int((now + timedelta(seconds=self.window_seconds)).timestamp())
        }


# Token Bucket
class TokenBucketRateLimiter:
    """
    Token bucket rate limiting.
    
    Pros: Allows bursts, smooth rate limiting
    Cons: More complex
    """
    
    def __init__(self, max_tokens: int, refill_rate: float):
        self.max_tokens = max_tokens
        self.refill_rate = refill_rate  # tokens per second
        self.tokens: Dict[str, float] = {}
        self.last_refill: Dict[str, datetime] = {}
    
    def _refill(self, key: str) -> float:
        now = datetime.utcnow()
        
        if key not in self.tokens:
            self.tokens[key] = self.max_tokens
            self.last_refill[key] = now
            return self.tokens[key]
        
        elapsed = (now - self.last_refill[key]).total_seconds()
        tokens_to_add = elapsed * self.refill_rate
        
        self.tokens[key] = min(
            self.max_tokens,
            self.tokens[key] + tokens_to_add
        )
        self.last_refill[key] = now
        
        return self.tokens[key]
    
    def is_allowed(self, key: str, tokens: int = 1) -> tuple[bool, dict]:
        self._refill(key)
        
        if self.tokens[key] >= tokens:
            self.tokens[key] -= tokens
            
            return True, {
                "limit": self.max_tokens,
                "remaining": int(self.tokens[key]),
            }
        
        return False, {
            "limit": self.max_tokens": 0,
,
            "remaining        }
```

## API Rate Limiting Middleware
```python
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware for FastAPI."""
    
    def __init__(
        self,
        app,
        rate_limiter,
        exempt_paths: list = None
    ):
        super().__init__(app)
        self.rate_limiter = rate_limiter
        self.exempt_paths = exempt_paths or []
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for exempt paths
        if request.url.path in self.exempt_paths:
            return await call_next(request)
        
        # Get client identifier
        key = self._get_client_key(request)
        
        # Check rate limit
        allowed, headers = self.rate_limiter.is_allowed(key)
        
        if not allowed:
            return JSONResponse(
                status_code=429,
                headers={
                    **headers,
                    "Retry-After": str(headers.get("reset", 60)),
                },
                content={
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": "Too many requests. Please retry later."
                    }
                }
            )
        
        response = await call_next(request)
        
        # Add rate limit headers
        for key, value in headers.items():
            response.headers[key] = str(value)
        
        return response
    
    def _get_client_key(self, request: Request) -> str:
        """Get unique key for client."""
        # Check for API key
        api_key = request.headers.get("X-API-Key")
        if api_key:
            return f"apikey:{api_key}"
        
        # Use user ID if authenticated
        if hasattr(request.state, "user_id"):
            return f"user:{request.state.user_id}"
        
        # Fall back to IP
        client_ip = request.client.host
        return f"ip:{client_ip}"
```

## Distributed Rate Limiting with Redis
```python
import redis
from typing import Dict, Any


class RedisRateLimiter:
    """Distributed rate limiter using Redis."""
    
    def __init__(
        self,
        redis_url: str,
        max_requests: int = 100,
        window_seconds: int = 60
    ):
        self.redis = redis.from_url(redis_url)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
    
    def is_allowed(self, key: str) -> tuple[bool, dict]:
        now = datetime.utcnow()
        window_key = f"ratelimit:{key}:{int(now.timestamp() // self.window_seconds)}"
        
        pipe = self.redis.pipeline()
        
        # Increment counter
        pipe.incr(window_key)
        # Set expiry
        pipe.expire(window_key, self.window_seconds * 2)
        # Get current count
        results = pipe.execute()
        
        current_count = results[0]
        
        headers = {
            "X-RateLimit-Limit": str(self.max_requests),
            "X-RateLimit-Remaining": str(max(0, self.max_requests - current_count)),
            "X-RateLimit-Reset": str(
                int(now.timestamp()) + self.window_seconds
            ),
        }
        
        if current_count > self.max_requests:
            return False, headers
        
        return True, headers
    
    def sliding_window(self, key: str) -> tuple[bool, dict]:
        """More accurate sliding window using sorted sets."""
        now = datetime.utcnow()
        window_start = now - timedelta(seconds=self.window_seconds)
        
        pipe = self.redis.pipeline()
        
        # Remove old entries
        pipe.zremrangebyscore(
            f"ratelimit:sliding:{key}",
            0,
            window_start.timestamp() - 1
        )
        
        # Add current request
        pipe.zadd(
            f"ratelimit:sliding:{key}",
            {f"{now.timestamp()}:{uuid.uuid4()}": now.timestamp()}
        )
        
        # Count requests in window
        pipe.zcard(f"ratelimit:sliding:{key}")
        
        # Set expiry
        pipe.expire(
            f"ratelimit:sliding:{key}",
            self.window_seconds * 2
        )
        
        results = pipe.execute()
        current_count = results[2]
        
        allowed = current_count <= self.max_requests
        
        return allowed, {
            "X-RateLimit-Limit": str(self.max_requests),
            "X-RateLimit-Remaining": str(
                max(0, self.max_requests - current_count)
            ),
            "X-RateLimit-Reset": str(
                int(now.timestamp()) + self.window_seconds
            ),
        }
```

## Best Practices
```
Rate Limiting Best Practices:

1. Choose appropriate algorithm
   - Fixed window: simple, forgiving
   - Sliding window: more accurate
   - Token bucket: burst handling

2. Use tiered limits
   - Different limits for different users
   - Public vs authenticated

3. Return proper headers
   - X-RateLimit-Limit
   - X-RateLimit-Remaining
   - X-RateLimit-Reset
   - Retry-After

4. Handle exceeded gracefully
   - Clear error messages
   - Appropriate retry headers

5. Monitor and alert
   - Track rate limit hits
   - Alert on unusual patterns

6. Distribute across instances
   - Use shared storage (Redis)
   - Consistent hashing

7. Consider endpoint-specific
   - Different limits per endpoint
   - Expensive operations get lower limits

8. Allow some burst
   - Users expect occasional bursts
   - Token bucket handles this well

9. Test rate limiting
   - Verify limits are enforced
   - Test header values

10. Document limits
    - API documentation
    - Developer portal
```
