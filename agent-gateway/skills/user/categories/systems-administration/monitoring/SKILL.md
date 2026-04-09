---
name: monitoring
description: Application monitoring and observability best practices
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: devops
---
## What I do
- Implement structured logging
- Create metrics for monitoring (counters, gauges, histograms)
- Set up health checks and readiness probes
- Configure alerting thresholds
- Use distributed tracing
- Implement logging best practices
- Design dashboards for visibility
- Handle error tracking and reporting

## When to use me
When implementing monitoring, logging, or observability features.

## Structured Logging
```python
import structlog
from contextvars import ContextVar
import logging


# Configure structlog
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.dev.ConsoleRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)


# Use structured logging
log = structlog.get_logger()


def process_user(user_id: str, action: str, **kwargs):
    log.info(
        "user_action",
        user_id=user_id,
        action=action,
        extra_data=kwargs,
    )


def handle_error(error: Exception, context: dict):
    log.error(
        "operation_failed",
        error=str(error),
        error_type=type(error).__name__,
        **context,
    )


# Request logging middleware
import time


class LoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()

        response = self.get_response(request)

        duration_ms = (time.time() - start_time) * 1000

        log.info(
            "http_request",
            method=request.method,
            path=request.path,
            status_code=response.status_code,
            duration_ms=duration_ms,
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        return response
```

## Metrics with Prometheus
```python
from prometheus_client import Counter, Histogram, Gauge, Summary
from functools import wraps


# Define metrics
HTTP_REQUESTS_TOTAL = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code']
)

HTTP_REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint'],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

ACTIVE_USERS = Gauge(
    'active_users',
    'Number of active users',
    ['service']
)

TASKS_PROCESSED = Counter(
    'tasks_processed_total',
    'Total tasks processed',
    ['task_type', 'status']
)


# Track metrics
def track_metrics(endpoint: str):
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            start_time = time.time()

            try:
                response = func(request, *args, **kwargs)
                status = response.status_code
            except Exception as e:
                status = 500
                raise
            finally:
                duration = time.time() - start_time

                HTTP_REQUESTS_TOTAL.labels(
                    method=request.method,
                    endpoint=endpoint,
                    status_code=status
                ).inc()

                HTTP_REQUEST_DURATION.labels(
                    method=request.method,
                    endpoint=endpoint
                ).observe(duration)

            return response
        return wrapper
    return decorator


# Custom metrics
def track_business_metrics(user_id: str, action: str):
    ACTIVE_USERS.labels(service='api').inc()
    TASKS_PROCESSED.labels(task_type=action, status='success').inc()
```

## Health Checks
```python
from healthcheck import HealthCheck


def check_database():
    try:
        db.execute("SELECT 1")
        return True, "Database OK"
    except Exception as e:
        return False, f"Database error: {e}"


def check_cache():
    try:
        cache.get("health_check")
        return True, "Cache OK"
    except Exception as e:
        return False, f"Cache error: {e}"


def check_external_service(service_name: str):
    try:
        response = requests.get(f"https://{service_name}/health", timeout=5)
        return response.status_code == 200, f"{service_name} OK"
    except Exception as e:
        return False, f"{service_name} error: {e}"


health = HealthCheck()
health.add_check(check_database)
health.add_check(check_cache)


# Kubernetes health endpoints
@app.route('/health/live')
def liveness():
    return {'status': 'healthy'}, 200


@app.route('/health/ready')
def readiness():
    checks = {
        'database': check_database(),
        'cache': check_cache(),
    }

    if all(status for status, _ in checks.values()):
        return {'status': 'ready', 'checks': checks}, 200
    else:
        return {'status': 'not_ready', 'checks': checks}, 503
```

## Distributed Tracing
```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import (
    BatchSpanProcessor,
    ConsoleSpanExporter
)
from opentelemetry.trace import Status, StatusCode


# Configure tracing
provider = TracerProvider()
provider.add_span_processor(
    BatchSpanProcessor(ConsoleSpanExporter())
)
trace.set_tracer_provider(provider)

tracer = trace.get_tracer(__name__)


def process_with_trace(operation_name: str):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            with tracer.start_as_current_span(operation_name) as span:
                # Add attributes
                span.set_attribute("operation", operation_name)

                try:
                    result = func(*args, **kwargs)
                    span.set_status(Status(StatusCode.OK))
                    return result
                except Exception as e:
                    span.set_status(Status(StatusCode.ERROR, str(e)))
                    span.record_exception(e)
                    raise
        return wrapper
    return decorator


@process_with_trace("process_order")
def process_order(order_id: str):
    with tracer.start_as_current_span("fetch_order") as span:
        span.set_attribute("order_id", order_id)
        order = fetch_order(order_id)

    with tracer.start_as_current_span("validate_order") as span:
        validate_order(order)

    with tracer.start_as_current_span("update_inventory") as span:
        update_inventory(order)

    return order
```
