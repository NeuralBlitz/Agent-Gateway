---
name: real-time
description: Real-time systems and processing
license: MIT
metadata:
  audience: developers
  category: software-development
---

## What I do
- Build real-time data pipelines
- Implement WebSocket communication
- Design streaming architectures
- Handle time-sensitive processing
- Manage event-driven systems
- Optimize latency requirements

## When to use me
When building applications requiring immediate data processing, live updates, or time-critical operations.

## Key Concepts

### Real-Time Classifications
```
Hard Real-Time: Missed deadline = failure
Firm Real-Time: Missed deadline = degraded quality
Soft Real-Time: Missed deadline = performance drop
```

### WebSocket Implementation
```javascript
// Server
const wss = new WebSocket.Server({ port: 8080 });
wss.on('connection', ws => {
  ws.on('message', message => {
    broadcast(message);
  });
});

// Client
const ws = new WebSocket('ws://localhost:8080');
ws.onmessage = (event) => {
  updateUI(JSON.parse(event.data));
};
```

### Streaming Architectures
```python
# Apache Kafka + Spark Streaming
from pyspark.streaming import StreamingContext
ssc = StreamingContext(sc, 1)
kafka_stream = KafkaUtils.createDirectStream(
    ssc, ['topic'], {'bootstrap.servers': 'localhost:9092'}
)
```

### Latency Optimization
```
Target latencies:
- Hard real-time: < 1ms
- Trading systems: < 10ms
- Gaming: < 50ms
- Web updates: < 100ms
```

### Event-Driven Patterns
```javascript
// Event sourcing
const store = createStore((state, event) => {
  switch (event.type) {
    case 'USER_UPDATED':
      return { ...state, user: event.data };
  }
});

// CQRS pattern
Command: writeModel.execute(command)
Query: readModel.query(query)
```

### Technologies
- WebSockets, SSE
- Apache Kafka, RabbitMQ
- Redis Pub/Sub
- gRPC streaming
- WebRTC
- Edge computing

### Monitoring
```python
# Latency tracking
from prometheus_client import Histogram
request_latency = Histogram('request_latency_seconds')
```
