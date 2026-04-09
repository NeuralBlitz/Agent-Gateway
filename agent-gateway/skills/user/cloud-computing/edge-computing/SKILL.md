---
name: edge-computing
description: Distributed computing paradigm that brings computation and data storage closer to the sources of data
category: cloud-computing
---

# Edge Computing

## What I Do

I enable processing data near its source rather than in centralized data centers. I reduce latency, bandwidth usage, and enable real-time processing for IoT devices, autonomous systems, and latency-sensitive applications.

## When to Use Me

- IoT sensor networks generating massive data
- Autonomous vehicles requiring millisecond decisions
- AR/VR applications needing low-latency rendering
- Industrial automation and predictive maintenance
- Content delivery with geographic distribution
- Healthcare devices requiring real-time analysis
- Smart city infrastructure

## Core Concepts

- **Edge Nodes**: Compute devices at the network edge
- **Latency Reduction**: Processing closer to data sources
- **Bandwidth Optimization**: Filter/process data before transmission
- **Offline Operation**: Continue functioning without cloud connectivity
- **Hierarchical Computing**: Multi-tier architecture (cloud → edge → device)
- **Data Filtering**: Process and aggregate at the edge
- **Time-Sensitive Networking**: Deterministic low-latency communication
- **Device Shadow**: Synchronized digital twin for offline operation
- **Fog Computing**: Intermediate layer between cloud and edge
- **Container Orchestration at Edge**: K3s, MicroK8s for edge clusters

## Code Examples

**AWS Greengrass Lambda (Python):**
```python
def lambda_handler(event, context):
    # Process sensor data locally
    temperature = event.get('temperature')
    humidity = event.get('humidity')
    
    # Local decision making
    if temperature > threshold:
        alert = {'alert': 'high_temp', 'value': temperature}
        local_alert(alert)
        return {'action': 'alert_sent', 'local': True}
    
    # Aggregate for cloud transmission
    aggregated = aggregate_hourly(event)
    
    return {
        'action': 'aggregate',
        'local_processed': True,
        'cloud_sync': False
    }

def local_alert(alert):
    # Immediate local response without cloud
    trigger_local_alarm(alert)
```

**Azure IoT Edge Module (C#):**
```csharp
using System;
using System.IO;
using Microsoft.Azure.Devices.Client;
using Microsoft.Azure.Devices.Shared;

public class TempFilterModule : IModuleClient
{
    private static readonly double Threshold = 25.0;
    
    public async Task<MessageResponse> ProcessInputMessageAsync(Message message)
    {
        byte[] messageBytes = message.GetBytes();
        var sensorData = System.Text.Json.JsonSerializer.Deserialize<SensorData>(messageBytes);
        
        if (sensorData.Temperature > Threshold)
        {
            await SendAlertToHub(sensorData);
        }
        
        var filteredMessage = new Message(messageBytes);
        await _moduleClient.SendEventAsync("output1", filteredMessage);
        
        return MessageResponse.Completed;
    }
}
```

**Kubernetes Edge with K3s (YAML):**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: edge-analytics
  namespace: edge
spec:
  replicas: 3
  selector:
    matchLabels:
      app: edge-analytics
  template:
    spec:
      containers:
      - name: analytics
        image: myregistry/edge-analytics:v1.5
        resources:
          limits:
            memory: "256Mi"
            cpu: "500m"
        env:
        - name: PROCESSING_INTERVAL
          value: "1000"
        - name: BATCH_SIZE
          value: "100"
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: edge-config
  namespace: edge
data:
  threshold.yaml: |
    max_temp: 85
    max_humidity: 80
    processing_mode: real-time
```

## Best Practices

1. **Design for intermittent connectivity** - Assume cloud connection will fail
2. **Filter data at the source** - Only send relevant data to cloud
3. **Use appropriate compute hardware** - Match capabilities to workload
4. **Implement local caching** - Reduce cloud dependency for common queries
5. **Secure edge devices** - Physical security and authentication
6. **Use lightweight containers** - Optimize for resource-constrained devices
7. **Implement over-the-air updates** - Automated patching without physical access
8. **Monitor edge health** - Remote visibility into device status
9. **Architect for hierarchy** - Multi-tier edge-cloud architecture
10. **Test offline scenarios** - Validate behavior without connectivity
