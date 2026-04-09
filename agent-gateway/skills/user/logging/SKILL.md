---
name: logging
description: Logging best practices and patterns
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: devops
---
## What I do
- Implement structured logging
- Choose appropriate log levels
- Log with context and correlation IDs
- Handle sensitive data
- Rotate and manage log files
- Centralize logs
- Alert on log patterns
- Debug with logs

## When to use me
When implementing logging or analyzing log data.

## Log Levels
```
DEBUG (10): Detailed information for debugging
INFO (20): General operational events
WARNING (30): Unexpected but handled issues
ERROR (40): Failures that need attention
CRITICAL (50): Severe issues requiring immediate action
```

## Structured Logging
```python
import structlog
import logging


# Configure structlog
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.dev.ConsoleRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)


log = structlog.get_logger()


# Structured log entry
log.info(
    "user_action",
    user_id="123",
    action="login",
    method="oauth2",
    ip_address="192.168.1.1",
    user_agent="Mozilla/5.0",
)


# Exception logging
try:
    result = risky_operation()
except Exception as e:
    log.error(
        "operation_failed",
        error=str(e),
        error_type=type(e).__name__,
        operation="risky_operation",
        retry_count=3,
        stack_info=True,
    )
```

## JavaScript Logging
```typescript
// Create structured logger
import winston from 'winston';


const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'my-api',
    version: process.env.npm_package_version,
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});


// Usage
logger.info('user.created', {
  userId: '123',
  email: 'user@example.com',
  method: 'registration',
});

logger.error('payment.failed', {
  userId: '123',
  orderId: '456',
  amount: 99.99,
  currency: 'USD',
  error: error.message,
});
```

## Correlation IDs
```python
import structlog
from contextvars import ContextVar
from uuid import uuid4


correlation_id: ContextVar[str] = ContextVar('correlation_id')


def get_correlation_id() -> str:
    """Get or create correlation ID."""
    cid = correlation_id.get(None)
    if cid is None:
        cid = str(uuid4())
        correlation_id.set(cid)
    return cid


class CorrelationMiddleware:
    """Add correlation ID to requests."""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        # Extract or generate correlation ID
        cid = None
        for header, value in scope.get('headers', []):
            if header == b'x-correlation-id':
                cid = value.decode()
                break
        
        if not cid:
            cid = str(uuid4())
        
        correlation_id.set(cid)
        
        async def send_wrapper(message):
            if message['type'] == 'http.response.start':
                headers = list(message.get('headers', []))
                headers.append((b'x-correlation-id', cid.encode()))
                message['headers'] = headers
            await send(message)
        
        await self.app(scope, receive, send_wrapper)


# All logs in request will have correlation_id
log.info("request_started", path="/api/users")
log.info("database_query", query="SELECT * FROM users")
log.info("request_completed", status_code=200)
```

## Sensitive Data
```python
import re


# Filter sensitive data
SENSITIVE_FIELDS = {
    'password',
    'token',
    'api_key',
    'secret',
    'credit_card',
    'ssn',
    'email',  # Maybe
}


class SensitiveDataFilter(logging.Filter):
    """Filter out sensitive data from logs."""
    
    def __init__(self) -> None:
        self.patterns = [
            re.compile(r'\b\d{16}\b'),  # Credit card
            re.compile(r'eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*'),  # JWT
        ]
    
    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            for field in SENSITIVE_FIELDS:
                if field in record.msg:
                    record.msg = self._mask_field(record.msg, field)
        
        if hasattr(record, 'args'):
            new_args = {}
            for key, value in record.args.items():
                if isinstance(value, str):
                    new_args[key] = self._mask_value(value)
                else:
                    new_args[key] = value
            record.args = new_args
        
        return True
    
    def _mask_field(self, message: str, field: str) -> str:
        # Simple mask for example patterns
        return f"[{field.upper()}_MASKED]"
    
    def _mask_value(self, value: str) -> str:
        for pattern in self.patterns:
            value = pattern.sub('[REDACTED]', value)
        return value


# Configure filter
logging.getLogger().addFilter(SensitiveDataFilter())
```

## Log Aggregation
```yaml
# Fluentd configuration for log aggregation
<source>
  @type tail
  path /var/log/myapp/*.log
  pos_file /var/log/fluentd/myapp.pos
  tag myapp.*
  <parse>
    @type json
    time_key @timestamp
    time_format %Y-%m-%dT%H:%M:%S.%LZ
  </parse>
</source>

<filter myapp.**>
  @type record_transformer
  <record>
    service my-api
    environment ${ENVIRONMENT}
    hostname ${HOSTNAME}
  </record>
</filter>

<match myapp.**>
  @type elasticsearch
  host elasticsearch.logging
  port 9200
  index_name logs
  type_name _doc
</match>
```

## Log Analysis
```python
# Common log patterns to alert on
ALERT_PATTERNS = [
    "ERROR",
    "CRITICAL",
    "Exception in thread",
    "Connection refused",
    "Timeout waiting for",
    "Authentication failed",
    "Authorization failed",
    "Database connection failed",
    "Out of memory",
    "Segmentation fault",
]


def analyze_logs(logs: list) -> dict:
    """Analyze log patterns."""
    stats = {
        'total': len(logs),
        'by_level': {},
        'by_service': {},
        'errors': [],
    }
    
    for log in logs:
        level = log.get('level', 'UNKNOWN')
        service = log.get('service', 'unknown')
        
        stats['by_level'][level] = stats['by_level'].get(level, 0) + 1
        stats['by_service'][service] = stats['by_service'].get(service, 0) + 1
        
        if level in ('ERROR', 'CRITICAL'):
            stats['errors'].append(log)
    
    # Check for alert patterns
    stats['alerts'] = []
    for pattern in ALERT_PATTERNS:
        matches = [log for log in logs if pattern in log.get('message', '')]
        if matches:
            stats['alerts'].append({
                'pattern': pattern,
                'count': len(matches),
                'examples': matches[:3],
            })
    
    return stats
```

## Best Practices
```
1. Use structured logging (JSON)
   Easier to parse and query

2. Include correlation IDs
   Trace requests through system

3. Log at appropriate levels
   Don't spam, don't miss important events

4. Include context
   Who, what, where, when

5. Handle sensitive data
   Never log passwords, tokens, PII

6. Use log aggregation
   Centralized logging is essential

7. Rotate logs
   Prevent disk exhaustion

8. Alert on patterns
   Don't just collect logs

9. Use proper formatting
   ISO timestamps, consistent fields

10. Consider volume
    Sampling for high-volume logs
```
