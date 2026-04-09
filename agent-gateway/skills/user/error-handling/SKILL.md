---
name: error-handling
description: Error handling best practices and patterns
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: programming
---
## What I do
- Design error handling strategies
- Create meaningful error messages
- Handle exceptions properly
- Implement error boundaries
- Log errors effectively
- Return appropriate HTTP status codes
- Create custom exception hierarchies
- Handle failures gracefully

## When to use me
When implementing error handling or designing exception strategies.

## Exception Hierarchy
```python
from abc import ABC
from typing import Optional, Dict, Any
import traceback


class AppException(ABC):
    """Base exception for application errors."""
    
    def __init__(
        self,
        message: str,
        code: str,
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None,
        cause: Optional[Exception] = None,
    ) -> None:
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        self.cause = cause
        super().__init__(message)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary."""
        return {
            "error": {
                "code": self.code,
                "message": self.message,
                "details": self.details,
            }
        }


class ValidationError(AppException):
    """Raised when input validation fails."""
    
    def __init__(
        self,
        message: str,
        field: Optional[str] = None,
        value: Any = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        error_details = details or {}
        if field:
            error_details["field"] = field
        if value is not None:
            error_details["value"] = str(value)
        
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=400,
            details=error_details,
        )


class NotFoundError(AppException):
    """Raised when a resource is not found."""
    
    def __init__(
        self,
        resource_type: str,
        resource_id: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            message=f"{resource_type} with ID '{resource_id}' not found",
            code="NOT_FOUND",
            status_code=404,
            details=details or {"resource_type": resource_type, "id": resource_id},
        )


class ConflictError(AppException):
    """Raised when there's a resource conflict."""
    
    def __init__(
        self,
        message: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            message=message,
            code="CONFLICT",
            status_code=409,
            details=details,
        )


class AuthenticationError(AppException):
    """Raised when authentication fails."""
    
    def __init__(
        self,
        message: str = "Authentication required",
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            message=message,
            code="UNAUTHORIZED",
            status_code=401,
            details=details,
        )


class AuthorizationError(AppException):
    """Raised when user is not authorized."""
    
    def __init__(
        self,
        message: str = "Access denied",
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            message=message,
            code="FORBIDDEN",
            status_code=403,
            details=details,
        )


class RateLimitError(AppException):
    """Raised when rate limit is exceeded."""
    
    def __init__(
        self,
        retry_after: int = 60,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            message="Rate limit exceeded. Please retry later.",
            code="RATE_LIMIT_EXCEEDED",
            status_code=429,
            details=details or {"retry_after": retry_after},
        )


class ExternalServiceError(AppException):
    """Raised when external service call fails."""
    
    def __init__(
        self,
        service_name: str,
        message: str,
        status_code: int = 503,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            message=f"External service error: {service_name}",
            code="EXTERNAL_SERVICE_ERROR",
            status_code=status_code,
            details=details or {"service": service_name},
        )
```

## Error Handling Middleware
```python
import logging
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


logger = logging.getLogger(__name__)


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Handle exceptions and convert to HTTP responses."""
    
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        
        except AppException as e:
            logger.warning(
                f"App error: {e.code} - {e.message}",
                extra={
                    "code": e.code,
                    "status_code": e.status_code,
                    "details": e.details,
                    "path": request.url.path,
                }
            )
            
            return JSONResponse(
                status_code=e.status_code,
                content=e.to_dict(),
                headers={"X-Error-Code": e.code},
            )
        
        except HTTPException as e:
            return JSONResponse(
                status_code=e.status_code,
                content={"error": {"code": "HTTP_ERROR", "message": e.detail}},
            )
        
        except ValueError as e:
            logger.warning(f"Validation error: {e}", extra={"path": request.url.path})
            
            return JSONResponse(
                status_code=400,
                content={
                    "error": {
                        "code": "VALIDATION_ERROR",
                        "message": str(e),
                    }
                },
            )
        
        except Exception as e:
            logger.error(
                f"Unexpected error: {e}",
                extra={
                    "traceback": traceback.format_exc(),
                    "path": request.url.path,
                }
            )
            
            return JSONResponse(
                status_code=500,
                content={
                    "error": {
                        "code": "INTERNAL_ERROR",
                        "message": "An unexpected error occurred",
                    }
                },
            )
```

## Result Pattern
```python
from typing import Generic, TypeVar, Union, Optional


T = TypeVar('T')


class Result(Generic[T]):
    """
    Result type for operations that can fail.
    Provides safe error handling without exceptions.
    """
    
    def __init__(
        self,
        value: Optional[T] = None,
        error: Optional[Exception] = None,
    ) -> None:
        self._value = value
        self._error = error
    
    @classmethod
    def success(cls, value: T) -> 'Result[T]':
        """Create a successful result."""
        return cls(value=value)
    
    @classmethod
    def failure(cls, error: Exception) -> 'Result[T]':
        """Create a failed result."""
        return cls(error=error)
    
    @property
    def is_success(self) -> bool:
        """Check if result is successful."""
        return self._error is None
    
    @property
    def is_failure(self) -> bool:
        """Check if result is a failure."""
        return self._error is not None
    
    def get_value(self, default: T = None) -> T:
        """Get value or default."""
        return self._value if self.is_success else default
    
    def get_error(self) -> Optional[Exception]:
        """Get error."""
        return self._error
    
    def map(self, func) -> 'Result':
        """Map success value."""
        if self.is_success:
            try:
                return Result.success(func(self._value))
            except Exception as e:
                return Result.failure(e)
        return self
    
    def flat_map(self, func) -> 'Result':
        """Flat map success value."""
        if self.is_success:
            return func(self._value)
        return self
    
    def or_else(self, default: T) -> T:
        """Get value or default."""
        return self._value if self.is_success else default
    
    def __repr__(self) -> str:
        if self.is_success:
            return f"Result({self._value})"
        return f"Result(error={self._error})"


# Usage
def get_user(user_id: str) -> Result[User]:
    try:
        user = database.get_user(user_id)
        if not user:
            return Result.failure(NotFoundError("User", user_id))
        return Result.success(user)
    except DatabaseError as e:
        return Result.failure(e)


result = get_user("123")

if result.is_success:
    user = result.get_value()
    print(f"Found user: {user.name}")
else:
    error = result.get_error()
    print(f"Error: {error}")
```

## Retry Logic
```python
import asyncio
from functools import wraps
from typing import Callable, TypeVar, List
import time


T = TypeVar('T')


class RetryConfig:
    """Configuration for retry behavior."""
    
    def __init__(
        self,
        max_retries: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        exponential_base: float = 2.0,
        jitter: float = 0.1,
        retryable_exceptions: tuple = (Exception,),
    ) -> None:
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.jitter = jitter
        self.retryable_exceptions = retryable_exceptions
    
    def calculate_delay(self, attempt: int) -> float:
        """Calculate delay for attempt number."""
        delay = self.base_delay * (self.exponential_base ** attempt)
        delay = min(delay, self.max_delay)
        
        # Add jitter
        jitter_amount = delay * self.jitter
        delay += time.uniform(-jitter_amount, jitter_amount)
        
        return max(0, delay)


def retry(
    config: RetryConfig = None,
):
    """Decorator for retrying failed functions."""
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def async_wrapper(*args, **kwargs) -> T:
            config = config or RetryConfig()
            last_exception = None
            
            for attempt in range(config.max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except config.retryable_exceptions as e:
                    last_exception = e
                    
                    if attempt >= config.max_retries:
                        raise
                    
                    delay = config.calculate_delay(attempt)
                    print(f"Retry {attempt + 1}/{config.max_retries} "
                          f"after {delay:.2f}s: {e}")
                    
                    await asyncio.sleep(delay)
            
            raise last_exception
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs) -> T:
            config = config or RetryConfig()
            last_exception = None
            
            for attempt in range(config.max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except config.retryable_exceptions as e:
                    last_exception = e
                    
                    if attempt >= config.max_retries:
                        raise
                    
                    delay = config.calculate_delay(attempt)
                    print(f"Retry {attempt + 1}/{config.max_retries} "
                          f"after {delay:.2f}s: {e}")
                    
                    time.sleep(delay)
            
            raise last_exception
        
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    
    return decorator


# Usage
@retry(RetryConfig(max_retries=3, base_delay=0.5))
async def fetch_from_api(url: str) -> dict:
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            response.raise_for_status()
            return await response.json()
```

## Error Codes Reference
```
HTTP Status Codes:
400 - Bad Request (validation, malformed)
401 - Unauthorized (authentication required)
403 - Forbidden (not authorized)
404 - Not Found (resource doesn't exist)
409 - Conflict (state conflict)
422 - Unprocessable Entity (validation errors)
429 - Too Many Requests (rate limit)
500 - Internal Server Error
502 - Bad Gateway
503 - Service Unavailable
504 - Gateway Timeout

Application Error Codes:
VALIDATION_ERROR - Input validation failed
NOT_FOUND - Resource not found
CONFLICT - State conflict
UNAUTHORIZED - Authentication required
FORBIDDEN - Not authorized
RATE_LIMIT_EXCEEDED - Rate limit hit
EXTERNAL_SERVICE_ERROR - External service failed
TIMEOUT - Operation timed out
PERMISSION_DENIED - Insufficient permissions
DUPLICATE_ENTRY - Resource already exists
```

## Best Practices
```
1. Use specific exception types
   Don't catch generic Exception

2. Include context in errors
   What happened? Where? What caused it?

3. Log exceptions appropriately
   DEBUG for expected, ERROR for unexpected

4. Don't expose internals
   Don't leak stack traces to users

5. Handle failures gracefully
   Provide helpful error messages

6. Use result types for recoverable errors
   Exceptions for exceptional situations

7. Retry transient failures
   Network issues, timeouts

8. Document error codes
   For API consumers

9. Use proper HTTP status codes
   Match semantics to status

10. Clean up resources in finally
    Use context managers
```
