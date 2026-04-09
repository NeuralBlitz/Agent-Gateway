---
name: edge-computing
description: Edge computing architecture and implementation
license: MIT
compatibility: opencode
metadata:
  audience: architect, devops-engineer
  category: devops
---

## What I do

- Design edge computing architectures
- Deploy applications to edge locations
- Optimize for low-latency processing
- Implement edge-cloud hybrid solutions
- Configure content delivery at the edge
- Manage distributed edge infrastructure

## When to use me

- When latency is critical for applications
- When processing IoT data streams
- When reducing bandwidth costs
- When operating in disconnected environments
- When implementing CDN with compute
- When building IoT platforms

## Key Concepts

### Edge Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   IoT       │     │   Edge      │     │   Cloud     │
│   Devices   │────►│   Node      │────►│   Backend   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                  │                   │
       │            ┌─────▼─────┐             │
       │            │   Local    │             │
       └───────────►│   Storage  │             │
                    └────────────┘             │
                    ┌────────────┐             │
                    │  Analytics │             │
                    └────────────┘             │
```

### Cloudflare Workers

```javascript
// Edge computing with Cloudflare Workers
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // A/B testing at edge
  const bucket = Math.random() < 0.5 ? 'a' : 'b'
  
  // Transform response
  const response = await fetch(request)
  const headers = new Headers(response.headers)
  headers.set('X-Edge-Bucket', bucket)
  
  return new Response(response.body, {
    status: response.status,
    headers
  })
}

// KV storage at edge
export async function onRequest(context) {
  const cache = await context.env.CACHE.get('data')
  if (cache) return new Response(cache)
  
  const response = await fetch('https://api.example.com/data')
  const text = await response.text()
  
  await context.env.CACHE.put('data', text, { expirationTtl: 3600 })
  return new Response(text)
}
```

### AWS Lambda@Edge

```javascript
// Lambda@Edge function
exports.handler = async (event) => {
  const request = event.Records[0].cf.request
  
  // Add security headers
  request.headers['strict-transport-security'] = [{
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains'
  }]
  
  // Redirect based on country
  const country = request.headers['cloudfront-viewer-country'][0].value
  if (country === 'EU') {
    request.uri = '/eu' + request.uri
  }
  
  return request
}
```

### Kubernetes at the Edge

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: edge-node
spec:
  nodeSelector:
    node-type: edge
  tolerations:
    - key: "edge"
      operator: "Equal"
      value: "true"
      effect: "NoSchedule"
  containers:
    - name: edge-app
      image: edge-app:latest
      resources:
        limits:
          cpu: "500m"
          memory: "512Mi"
```

### Edge Use Cases

- **Video Processing**: Transcoding, content moderation
- **IoT Analytics**: Real-time data filtering and aggregation
- **AR/VR**: Low-latency rendering
- **Autonomous Vehicles**: Immediate decision making
- **Retail**: Inventory management, personalized offers
- **Healthcare**: Remote monitoring, emergency alerts

### Hybrid Edge-Cloud

```yaml
# Kubernetes Federation
apiVersion: core.kubefed.io/v1beta1
kind: KubeFedConfig
metadata:
  name: kubefed
spec:
  scope: Namespaced
  controllerDuration:
    availableDelay: 20s
    unavailableDelay: 60s
  leaderElect:
    leaseDuration: 15s
    renewDeadline: 10s
    retryPeriod: 5s
    resourceLock: configmaps
  featureGates:
    - name: PushReconciler
      configuration: Enabled
    - name: SchedulerPreferences
      configuration: Enabled
```

### Key Considerations

- Network connectivity and reliability
- Data sovereignty and compliance
- Resource constraints at edge nodes
- Security at edge locations
- Offline operation capability
- Synchronization with cloud
