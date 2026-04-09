---
name: latency
description: Network latency fundamentals
license: MIT
compatibility: opencode
metadata:
  audience: web-developers
  category: networking
---

## What I do

- Measure and analyze network latency
- Identify latency sources in systems
- Design low-latency architectures
- Optimize data transfer protocols
- Implement caching strategies
- Reduce round-trip times
- Profile application performance

## When to use me

Use me when:
- Diagnosing slow network performance
- Building real-time applications
- Designing distributed systems
- Optimizing user experience
- Understanding network bottlenecks
- Planning capacity and scaling

## Key Concepts

### Latency vs Bandwidth
- **Latency**: Time for single packet (ms)
- **Bandwidth**: Data per second (Mbps)
- They affect performance differently:
  - Latency critical for interactive apps
  - Bandwidth critical for bulk transfers

### Speed of Light Limits
- Fiber: ~200,000 km/s (2/3 c)
- Theoretical minimum latency = distance / speed
- Example: NYC to London ~70ms minimum

### Latency Components
```
Total Latency = 
  ┌─────────────────┐
  │ Processing      │  (routers, switches)
  │ + Serialization │  (bits on wire)
  │ + Propagation   │  (distance/speed of light)
  │ + Transmission  │  (bandwidth limits)
  │ + Queuing       │  (congestion)
  └─────────────────┘
```

### Measurement Tools
- **ping**: RTT to host
- **traceroute**: Path and per-hop latency
- **WebPageTest**: Full page load analysis
- **Chrome DevTools**: Network timing
- **APM tools**: Application latency tracking

### Common Latency Targets
| Application | Target Latency |
|-------------|----------------|
| Web (initial) | < 2 seconds |
| API calls | < 200ms |
| Real-time (gaming) | < 50ms |
| Financial trading | < 1ms |
| VoIP | < 150ms |
