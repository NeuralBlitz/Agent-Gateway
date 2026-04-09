---
name: tracing
description: Distributed tracing implementation
license: MIT
compatibility: opencode
metadata:
  audience: developer, devops-engineer, sre
  category: devops
---

## What I do

- Implement distributed tracing in applications
- Configure tracing collectors and exporters
- Analyze request flows across services
- Debug performance issues using traces
- Correlate traces with logs and metrics
- Optimize system performance using trace data

## When to use me

- When debugging distributed systems
- When understanding request flows
- When identifying bottlenecks
- When debugging latency issues
- When building observable systems
- When optimizing performance

## Key Concepts

### Trace Structure

```
Trace
├── Span (Root)
│   ├── Span (Database)
│   │   └── Span (Connection Pool)
│   ├── Span (HTTP Call 1)
│   ├── Span (HTTP Call 2)
│   │   └── Span (Retry 1)
│   └── Span (Cache)
│
└── Context
    ├── Trace ID: abc123
    └── Span ID: xyz789
```

### OpenTelemetry Python

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor

# Initialize tracing
provider = TracerProvider()
processor = BatchSpanProcessor(
    JaegerExporter(
        agent_host_name="jaeger",
        agent_port=6831,
    )
)
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)

# Instrument Flask
FlaskInstrumentor().instrument_app(app)
RequestsInstrumentor().instrument()

# Create custom spans
tracer = trace.get_tracer(__name__)

def process_order(order_id):
    with tracer.start_as_current_span("process_order") as span:
        span.set_attribute("order.id", order_id)
        
        # Database call
        with tracer.start_as_current_span("db.save") as span:
            span.set_attribute("db.system", "postgresql")
            save_order(order_id)
            
        # External API call
        with tracer.start_as_current_span("http.payment") as span:
            span.set_attribute("http.method", "POST")
            span.set_attribute("http.url", "https://api.payment.com/charge")
            call_payment_api(order_id)
```

### Jaeger Configuration

```yaml
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: jaeger
spec:
  strategy: all-in-one
  collector:
    maxTraces: 100000
    resources:
      limits:
        cpu: 500m
        memory: 512Mi
  query:
    options:
      basePath: /jaeger
  storage:
    type: elasticsearch
    elasticsearch:
      nodeCount: 3
      redundancyPolicy: SingleRedundancy
```

### Zipkin

```java
// Spring Boot with Zipkin
@SpringBootApplication
@EnableZipkinTracer
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}

// Service discovery with Eureka
@Bean
public Brave brave() {
    return Brave.Builder("my-service")
        .spanReporter(zipkin)
        .build();
}

@Bean
public Tracer tracer(Brave brave) {
    return brave;
}
```

### Trace Query

```logql
# Jaeger query
service = user-api
operation = /api/users
limit = 20

# Filter by tags
http.method = GET
http.status_code = 200
error = true

# Time range
start = 2024-01-15T10:00:00Z
end = 2024-01-15T10:30:00Z
```

### Distributed Context Propagation

```python
# Manual context propagation
from opentelemetry import trace

def call_downstream_service(url, headers):
    # Extract context from incoming request
    ctx = trace.get_current_span().get_context()
    
    # Inject context into headers
    tracer = trace.get_tracer(__name__)
    with tracer.start_as_current_span("call_downstream") as span:
        # Add downstream span to trace
        carrier = {}
        trace.propagation.inject(span.get_context(), carrier)
        
        # Make HTTP call with propagated context
        response = requests.get(
            url,
            headers={**headers, **carrier}
        )
        return response
```

### Performance Analysis

```python
# Analyze traces for performance
class TraceAnalyzer:
    def __init__(self, jaeger_client):
        self.client = jaeger_client
        
    def find_slow_traces(self, threshold_ms=1000):
        return self.client.query(
            service='api',
            lookback='1h',
            min_duration=threshold_ms * 1000  # microseconds
        )
        
    def analyze_bottlenecks(self, service):
        spans = self.client.get_service_spans(service)
        
        # Group by operation
        by_operation = defaultdict(list)
        for span in spans:
            by_operation[span.operation_name].append(span)
            
        # Calculate average duration per operation
        results = {}
        for op, spans in by_operation.items():
            avg_duration = sum(s.duration for s in spans) / len(spans)
            results[op] = avg_duration
            
        return sorted(results.items(), key=lambda x: x[1], reverse=True)
        
    def find_error_patterns(self):
        return self.client.query(
            service='api',
            tag={'error': 'true'}
        )
```

### Trace-Based Optimization

1. **Identify Slow Operations**: Find spans with high duration
2. **Find Serial Dependencies**: Look for sequential spans
3. **Detect Unnecessary Calls**: Find duplicate or retry spans
4. **Analyze Cache Hit Rates**: Check for repeated DB/cache calls
5. **Optimize Database Queries**: Find N+1 query patterns
6. **Reduce Network Hops**: Minimize service-to-service calls
