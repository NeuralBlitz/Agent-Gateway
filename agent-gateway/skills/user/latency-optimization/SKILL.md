---
name: latency-optimization
description: Network latency optimization techniques
license: MIT
compatibility: opencode
metadata:
  audience: web-developers
  category: networking
---

## What I do

- Identify and eliminate latency bottlenecks
- Optimize TCP/UDP connections
- Implement connection pooling
- Use CDNs and edge computing
- Optimize TLS handshakes
- Reduce DNS lookup times
- Implement HTTP/2 and HTTP/3
- Design for geographic distribution

## When to use me

Use me when:
- Applications require low latency
- Global user base with performance issues
- Real-time features (gaming, trading, chat)
- Page load times exceed targets
- Optimizing API response times
- Reducing time to first byte (TTFB)

## Key Concepts

### Latency Sources
| Source | Typical Time | Optimization |
|--------|--------------|--------------|
| DNS | 20-200ms | Caching, prefetch |
| TCP Connect | 30-100ms | Keep-alive, HTTP/2 |
| TLS | 50-200ms | TLS 1.3, session tickets |
| TTFB | 50-500ms | Caching, CDN |
| Transfer | Varies | Compression, HTTP/2 |

### Connection Optimization
```javascript
// Connection pooling (Node.js)
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// HTTP/2 multiplexing
const http2 = require('http2');
const client = http2.connect('https://api.example.com');

const req = client.request({ ':path': '/data' });
req.on('response', handleResponse);

// Prefetch DNS
<link rel="dns-prefetch" href="//api.example.com">
```

### CDN Strategies
- Static asset caching at edge
- Geographic routing to nearest POP
- Image optimization and format conversion
- API request acceleration
- Origin shielding

### Real-time Optimizations
- WebSocket over polling
- Server-Sent Events for one-way
- QUIC/HTTP/3 for reduced latency
- Binary protocols (gRPC, MessagePack)
- Edge computing for computation
