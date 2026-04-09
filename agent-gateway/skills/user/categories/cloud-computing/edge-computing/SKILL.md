---
name: edge-computing
description: Distributed computing paradigm processing data closer to its source for reduced latency and bandwidth
license: MIT
compatibility:
  - aws-iot-greengrass
  - azure-iot-edge
  - foghorn
  - openyurt
audience: IoT engineers, embedded systems developers, cloud architects
category: cloud-computing
---

# Edge Computing

## What I Do

I provide expertise in edge computing architecture - a distributed computing paradigm that brings computation and data storage closer to the sources of data and end users. I cover edge device deployment, offline operation, data filtering and aggregation, secure device management, and integration with cloud services. Edge computing reduces latency, saves bandwidth, and enables real-time processing for IoT applications, autonomous systems, and latency-sensitive workloads.

## When to Use Me

- Building IoT applications requiring real-time or near-real-time responses
- Processing large volumes of sensor data locally to reduce cloud costs
- Operating devices in environments with limited or intermittent connectivity
- Implementing predictive maintenance for industrial equipment
- Processing video streams for computer vision at the source
- Managing fleets of distributed IoT devices at scale
- Reducing latency for time-critical applications (autonomous vehicles, robotics)
- Ensuring data privacy by processing sensitive data locally

## Core Concepts

- **Edge Nodes**: Computing devices deployed at the edge (gateways, industrial PCs, embedded systems)
- **Edge Runtime**: Lightweight software platforms managing containerized workloads on edge devices
- **Offline Operation**: Capabilities for devices to function independently during network outages
- **Data Filtering and Aggregation**: Processing data locally before transmitting to cloud
- **Device Twins**: Synchronized digital representations enabling remote management and state tracking
- **Edge-to-Cloud Sync**: Mechanisms for synchronizing data when connectivity is restored
- **Time-Series Data**: Efficient handling of sensor data with timestamps and analytics
- **Rule Engines**: Local decision-making based on data thresholds and conditions
- **Secure Provisioning**: Identity management and secure onboarding of edge devices
- **OTA Updates**: Over-the-air software updates for distributed device fleets
- **Protocol Adapters**: Translating between IoT protocols (MQTT, Modbus, OPC-UA, CAN)
- **Local Storage**: Persistent storage for data resilience and offline operation
- **Resource Constraints**: Managing limited CPU, memory, and storage on edge devices
- **Container Orchestration at Edge**: Kubernetes variants designed for edge (K3s, OpenYurt)

## Code Examples

### AWS IoT Greengrass Component

```python
# greengrass_component/recipes/com.example.DataProcessor-1.0.0.yaml
---
RecipeFormatVersion: "2020-01-25"
ComponentName: "com.example.DataProcessor"
ComponentVersion: "1.0.0"
ComponentDescription: "Processes sensor data locally and uploads aggregates"
ComponentPublisher: "Example Corp"
ComponentDependencies:
  "aws.greengrass.Nucleus": "^2.9.0"
Manifests:
  - Platform:
      os: "linux"
      architecture: "amd64"
    Artifacts:
      - Uri: "s3://bucket/data-processor-1.0.0.tar.gz"
        Unarchive: "ZIP"
    Lifecycle:
      Install:
        python3 -m pip install -r requirements.txt
        mkdir -p /greengrass/v2/logs/com.example.DataProcessor
      Startup:
        python3 -r /greengrass/v2/artifacts/com.example.DataProcessor/1.0.0/main.py
      Shutdown: |
        pkill -f "python3.*DataProcessor"
  - Platform:
      os: "linux"
      architecture: "armv7l"
    Artifacts:
      - Uri: "s3://bucket/data-processor-1.0.0-arm.tar.gz"
        Unarchive: "ZIP"
    Lifecycle:
      Startup: |
        cd /greengrass/v2/artifacts/com.example.DataProcessor/1.0.0
        ./data-processor-arm --config config.json
```

### Azure IoT Edge Module

```csharp
// DataProcessorModule.cs
using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using Microsoft.Azure.Devices.Client;
using Microsoft.Azure.Devices.Shared;
using Newtonsoft.Json;

public class DataProcessorModule : IModuleClient
{
    private ModuleClient _moduleClient;
    private readonly string _outputEndpoint = "output1";
    private readonly TimeSpan _processingInterval = TimeSpan.FromSeconds(10);
    private readonly CircularBuffer<SensorData> _dataBuffer;

    public async Task InitAsync(ModuleClient moduleClient)
    {
        _moduleClient = moduleClient;
        _dataBuffer = new CircularBuffer<SensorData>(1000);

        await _moduleClient.OpenAsync();
        await _moduleClient.SetInputMessageHandlerAsync("input1", ProcessMessageAsync, null);
        
        var twin = await _moduleClient.GetTwinAsync();
        await UpdateConfigurationAsync(twin.Properties.Desired);
        
        _moduleClient.TwinDesiredPropertiesUpdated += OnTwinUpdated;
    }

    private async Task<MessageResponse> ProcessMessageAsync(Message message, object userContext)
    {
        var messageBytes = message.GetBytes();
        var sensorData = JsonConvert.DeserializeObject<SensorData>(Encoding.UTF8.GetString(messageBytes));
        
        _dataBuffer.Add(sensorData);
        
        if (_dataBuffer.Count >= 100)
        {
            await ProcessAndForwardAsync();
        }
        
        await _moduleClient.CompleteAsync(message);
        return MessageResponse.Completed;
    }

    private async Task ProcessAndForwardAsync()
    {
        var aggregated = new AggregatedData
        {
            Timestamp = DateTime.UtcNow,
            Count = _dataBuffer.Count,
            AvgValue = _dataBuffer.Average(d => d.Value),
            MaxValue = _dataBuffer.Max(d => d.Value),
            MinValue = _dataBuffer.Min(d => d.Value),
            StdDev = CalculateStdDev(_dataBuffer)
        };

        var message = new Message(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(aggregated)));
        message.Properties["content-type"] = "application/json";
        message.Properties["device-id"] = Environment.GetEnvironmentVariable("IOTEDGE_DEVICE_ID");
        
        await _moduleClient.SendEventAsync(_outputEndpoint, message);
        _dataBuffer.Clear();
    }

    public Task CloseAsync() => _moduleClient?.CloseAsync() ?? Task.CompletedTask;
}

public class SensorData
{
    public string DeviceId { get; set; }
    public double Value { get; set; }
    public DateTime Timestamp { get; set; }
    public string MetricType { get; set; }
}

public class AggregatedData
{
    public DateTime Timestamp { get; set; }
    public int Count { get; set; }
    public double AvgValue { get; set; }
    public double MaxValue { get; set; }
    public double MinValue { get; set; }
    public double StdDev { get; set; }
}
```

### OpenYurt Edge Node Configuration

```yaml
# edge-node/yurtadm join command
yurtadm join <kubernetes-api-server>:6443 \
  --token <token> \
  --node-type edge \
  --cloud-nodes false \
  --node-labels \
    alibabacloud.com/is-edge-worker=true,\
    workload.flannel.com/backend=vxlan,\
    topology.kubernetes.io/zone=cn-shanghai-b,\
    alibabacloud.com/gpu-count=2,\
    alibabacloud.comaccelerator=nvidia-tesla-v100

---
# yurt-app-manager Pool Singleton config
apiVersion: apps.openyurt.io/v1alpha1
kind: NodePool
metadata:
  name: shanghai-edge-pool
  annotations:
    apps.openyurt.io/autoscaler: "true"
spec:
  type: Edge
  displayName: "Shanghai Edge Pool"
  nodeSelector:
    matchLabels:
      apps.openyurt.io/pool: shanghai-edge-pool
  labels:
    apps.openyurt.io/pool: shanghai-edge-pool
  taints:
    - key: "edge.workload.com"
      value: "true"
      effect: NoSchedule
  provider:
    name: "AlibabaCloud"
  topologySpreadConstraints:
    - maxSkew: 1
      topologyKey: topology.kubernetes.io/zone
      whenUnsatisfiable: ScheduleAnyway
      labelSelector:
        matchLabels:
          apps.openyurt.io/pool: shanghai-edge-pool
```

### MQTT Edge Gateway

```python
# edge_gateway/mqtt_gateway.py
import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List
from dataclasses import dataclass, asdict
import paho.mqtt.client as mqtt
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS

@dataclass
class TelemetryPoint:
    device_id: str
    sensor_type: str
    value: float
    timestamp: datetime
    quality: int

class EdgeMQTTGateway:
    def __init__(self, config: Dict):
        self.config = config
        self.buffer: List[TelemetryPoint] = []
        self.buffer_max_size = 1000
        self.flush_interval = 5.0
        
        self.mqtt_client = mqtt.Client(
            client_id=config['device_id'],
            clean_session=False,
            userdata={'gateway_id': config['gateway_id']}
        )
        self.mqtt_client.on_connect = self.on_connect
        self.mqtt_client.on_message = self.on_message
        self.mqtt_client.on_disconnect = self.on_disconnect
        
        self.influx_client = InfluxDBClient(
            url=config['influx_url'],
            token=config['influx_token'],
            org=config['influx_org']
        )
        self.write_api = self.influx_client.write_api(write_options=SYNCHRONOUS)
        
        self.local_storage_path = config.get('local_storage', '/data/buffer')

    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logging.info("Connected to MQTT broker")
            for topic in self.config['subscribe_topics']:
                client.subscribe(topic, qos=1)
        else:
            logging.error(f"MQTT connection failed: {rc}")

    def on_message(self, client, userdata, msg):
        try:
            payload = json.loads(msg.payload.decode())
            telemetry = TelemetryPoint(
                device_id=payload.get('device_id', 'unknown'),
                sensor_type=payload.get('type', 'generic'),
                value=float(payload.get('value', 0)),
                timestamp=datetime.fromisoformat(payload.get('timestamp', datetime.utcnow().isoformat())),
                quality=payload.get('quality', 192)
            )
            
            self.buffer.append(telemetry)
            
            if len(self.buffer) >= self.buffer_max_size:
                self.flush_buffer()
                
            if self.should_process_locally(payload):
                self.process_locally(payload)
                
        except Exception as e:
            logging.error(f"Error processing message: {e}")
            self.persist_to_local_storage(msg)

    def should_process_local_data(self, payload: Dict) -> bool:
        critical_sensors = ['temperature', 'pressure', 'vibration']
        return (payload.get('type') in critical_sensors and 
                abs(payload.get('value', 0)) > payload.get('threshold', 100))

    def process_locally(self, payload: Dict):
        if payload.get('type') == 'temperature' and payload.get('value', 0) > 100:
            self.trigger_alert({
                'alert_type': 'HIGH_TEMPERATURE',
                'device_id': payload.get('device_id'),
                'value': payload.get('value'),
                'timestamp': datetime.utcnow().isoformat()
            })

    def flush_buffer(self):
        points = []
        for telemetry in self.buffer:
            points.append(Point("sensor_data")
                .tag("device_id", telemetry.device_id)
                .tag("sensor_type", telemetry.sensor_type)
                .field("value", telemetry.value)
                .field("quality", telemetry.quality)
                .time(telemetry.timestamp))
        
        try:
            self.write_api.write(bucket=self.config['influx_bucket'], org=self.config['influx_org'], record=points)
            logging.info(f"Flushed {len(points)} points to InfluxDB")
            self.buffer.clear()
        except Exception as e:
            logging.error(f"Failed to flush buffer: {e}")
            self.persist_buffer_to_disk()

    async def run(self):
        self.mqtt_client.connect(
            self.config['broker_host'],
            self.config['broker_port'],
            keepalive=60
        )
        self.mqtt_client.loop_start()
        
        while True:
            await asyncio.sleep(self.flush_interval)
            if self.buffer:
                self.flush_buffer()
```

### Kubernetes Edge Workload with Device Plugin

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: edge-workload-config
  namespace: edge
data:
  config.yaml: |
    processing:
      interval_seconds: 5
      batch_size: 100
      thresholds:
        temperature: 85.0
        vibration: 10.0
    offline:
      enabled: true
      storage_limit_gb: 10
      sync_priority:
        - alerts
        - aggregates
        - raw_data
    cloud_sync:
      enabled: true
      endpoint: https://iot.example.com/api/v1
      retry_attempts: 3
      retry_delay_seconds: 30

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: edge-processor
  namespace: edge
spec:
  replicas: 3
  selector:
    matchLabels:
      app: edge-processor
  template:
    metadata:
      labels:
        app: edge-processor
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: node-role.kubernetes.io/edge
                    operator: Exists
      containers:
        - name: processor
          image: registry.example.com/edge-processor:v2.1.0
          imagePullPolicy: Always
          ports:
            - containerPort: 8080
              name: http
            - containerPort: 9090
              name: metrics
          env:
            - name: NODE_NAME
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
            - name: CLOUD_ENDPOINT
              valueFrom:
                configMapKeyRef:
                  name: edge-workload-config
                  key: cloud_sync.endpoint
          volumeMounts:
            - name: config
              mountPath: /etc/edge-processor
            - name: local-storage
              mountPath: /data
          resources:
            requests:
              cpu: "500m"
              memory: "512Mi"
              nvidia.com/gpu: 1
            limits:
              cpu: "2000m"
              memory: "2Gi"
              nvidia.com/gpu: 1
          livenessProbe:
            httpGet:
              path: /health/live
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
      volumes:
        - name: config
          configMap:
            name: edge-workload-config
        - name: local-storage
          emptyDir:
            sizeLimit: 10Gi
      tolerations:
        - key: "edge.workload.com"
          operator: "Exists"
          effect: "NoSchedule"
```

## Best Practices

- Design for intermittent connectivity with robust offline operation capabilities
- Implement data filtering and aggregation at the edge to reduce bandwidth costs
- Use local caching and buffering for resilience during network outages
- Prioritize critical alerts and process them immediately at the edge
- Implement incremental synchronization when connectivity is restored
- Secure device provisioning with hardware-based trust (TPM, secure elements)
- Use lightweight container runtimes optimized for resource-constrained devices
- Implement over-the-air updates with rollback capabilities
- Monitor device health, connectivity status, and resource utilization remotely
- Use protocol adapters to bridge between IoT protocols and cloud services
- Implement edge AI/ML inference for real-time decision making
- Use time-series databases optimized for sensor data at the edge
- Design for power efficiency in battery-operated edge devices
- Implement geographic distribution with edge clusters for high availability
- Use container orchestration platforms designed for edge (K3s, OpenYurt, MicroK8s)

## Common Patterns

- **Data Diode Pattern**: One-way data flow for highly secure or isolated environments
- **Edge-Hub Pattern**: Central gateway aggregating data from multiple edge devices
- **Filter-Aggregate-Forward**: Process data locally before transmitting summary to cloud
- **Local Decision Making**: Execute business rules and triggers at the edge
- **Digital Twin Sync**: Bidirectional synchronization between edge and cloud twins
- **Delta Encoding**: Transmit only changed data to reduce bandwidth
- **Batch Processing**: Collect and process data in batches for efficiency
- **Event Sourcing**: Store events locally and replay for recovery or analysis
- **CQRS at Edge**: Separate read and write paths for optimized data handling
- **Time-Windowed Processing**: Process data within defined time windows locally
