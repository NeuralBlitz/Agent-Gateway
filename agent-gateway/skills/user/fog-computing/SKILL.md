---
name: fog-computing
description: Fog computing architecture and IoT integration
license: MIT
compatibility: opencode
metadata:
  audience: architect, iot-engineer, devops-engineer
  category: devops
---

## What I do

- Design fog computing architectures for IoT
- Implement hierarchical processing layers
- Configure data filtering and aggregation
- Build latency-optimized pipelines
- Manage distributed fog node clusters
- Implement offline operation capabilities

## When to use me

- When processing large volumes of IoT data
- When network connectivity is limited
- When implementing smart city infrastructure
- When building industrial IoT solutions
- When processing time-sensitive data
- When reducing cloud bandwidth costs

## Key Concepts

### Fog Architecture Layers

```
┌─────────────────────────────────────────┐
│           Cloud (Tier 3)                │
│    Long-term storage, ML training       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Fog Layer (Tier 2)              │
│   Regional data centers, analytics      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Edge Layer (Tier 1)             │
│   Gateways, local processing            │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          IoT Devices (Tier 0)           │
│   Sensors, actuators, controllers       │
└─────────────────────────────────────────┘
```

### MQTT with QoS

```python
import paho.mqtt.client as mqtt

# Fog node configuration
class FogNode:
    def __init__(self, broker, node_id):
        self.client = mqtt.Client(client_id=node_id)
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.broker = broker
        
    def on_connect(self, client, userdata, flags, rc):
        # Subscribe with QoS levels
        # QoS 0: At most once (fire and forget)
        # QoS 1: At least once (acknowledged delivery)
        # QoS 2: Exactly once (assured delivery)
        client.subscribe("sensors/#", qos=1)
        client.subscribe("alerts/#", qos=2)
        
    def on_message(self, client, userdata, msg):
        # Process at fog layer
        payload = json.loads(msg.payload)
        
        # Filter and aggregate
        if self.should_process(payload):
            result = self.process_locally(payload)
            
            # Forward important data to cloud
            if result.important:
                client.publish("cloud/data", json.dumps(result))
                
    def should_process(self, payload):
        # Local processing decisions
        return payload.get('priority') == 'high'
```

### Data Aggregation

```python
class DataAggregator:
    def __init__(self, window_size=60):
        self.window_size = window_size
        self.buffer = []
        
    def aggregate(self, data_points):
        # Time-windowed aggregation
        aggregated = {
            'count': len(data_points),
            'avg': sum(d['value'] for d in data_points) / len(data_points),
            'min': min(d['value'] for d in data_points),
            'max': max(d['value'] for d in data_points),
            'sum': sum(d['value'] for d in data_points),
            'window': self.window_size
        }
        
        # Downsampling for cloud
        if aggregated['count'] > 1000:
            return self.downsample(aggregated)
        
        return aggregated
    
    def downsample(self, data):
        # Keep statistical summary
        return {
            'count': data['count'],
            'avg': data['avg'],
            'std': self.calculate_std(data),
            'min': data['min'],
            'max': data['max']
        }
```

### Edge-Fog-Cloud Integration

```yaml
# Kubernetes deployment for fog
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fog-collector
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fog-collector
  template:
    spec:
      affinity:
        nodeAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              preference:
                matchLabels:
                  tier: fog
      containers:
        - name: collector
          image: fog-collector:latest
          env:
            - name: CLOUD_ENDPOINT
              valueFrom:
                configMapKeyRef:
                  name: fog-config
                  key: cloud.endpoint
            - name: OFFLINE_MODE
              value: "true"
          volumeMounts:
            - name: local-storage
              mountPath: /data
      volumes:
        - name: local-storage
          persistentVolumeClaim:
            claimName: fog-local-pvc
```

### Use Cases

- **Smart Cities**: Traffic management, environmental monitoring
- **Industrial IoT**: Predictive maintenance, quality control
- **Healthcare**: Patient monitoring, emergency response
- **Agriculture**: Crop monitoring, irrigation control
- **Retail**: Inventory tracking, customer analytics
- **Energy**: Smart grid, consumption optimization

### Offline Operation

```python
class OfflineBuffer:
    def __init__(self, max_size=10000):
        self.buffer = []
        self.max_size = max_size
        
    def store(self, data):
        self.buffer.append(data)
        
        if len(self.buffer) >= self.max_size:
            self.flush()
            
    def flush(self):
        if not self.buffer:
            return
            
        # Try to sync with cloud
        try:
            self.cloud_client.batch_upload(self.buffer)
            self.buffer = []
        except NetworkError:
            # Keep buffering
            pass
```

### Key Characteristics

- Hierarchical architecture
- Geographic distribution
- Low latency processing
- Context awareness
- Real-time analytics
- Reduced bandwidth usage
