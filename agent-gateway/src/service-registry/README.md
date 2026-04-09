# Service Registry Module

## Overview

The Service Registry module provides service discovery, health tracking, and load balancing for microservice architectures within the Agent Gateway. It manages a registry of named services, each with one or more instances, and supports configurable health checking and multiple load balancing strategies (round-robin, least-connections, weighted, and random).

The `ServiceRegistry` class extends Node.js `EventEmitter` and provides both service-level configuration and instance-level tracking. It supports periodic health checking via HTTP endpoints, connection count tracking for least-connections load balancing, and comprehensive statistics reporting.

## File Structure

```
src/service-registry/
  index.ts          # Service registry implementation (ServiceRegistry, types, factory)
```

The module is a single-file implementation that imports the shared `logger` from `../infra/index.js`.

## Class and Function API

### Interfaces

#### `ServiceInstance`

```typescript
interface ServiceInstance {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol?: 'http' | 'https' | 'grpc' | 'tcp';
  metadata?: Record<string, any>;
  registeredAt: number;
  lastHealthCheck?: number;
  healthy: boolean;
  weight?: number;
  tags?: string[];
}
```

| Field             | Type                  | Description                                      |
|-------------------|-----------------------|--------------------------------------------------|
| `id`             | `string`              | Unique instance identifier                       |
| `name`           | `string`              | Service name (groups instances together)         |
| `host`           | `string`              | Hostname or IP address                           |
| `port`           | `number`              | Port number                                      |
| `protocol`       | `'http' \| 'https' \| 'grpc' \| 'tcp'` | Network protocol         |
| `metadata`       | `Record<string, any>` | Arbitrary metadata key-value pairs               |
| `registeredAt`   | `number`              | Unix timestamp of registration (auto-set)        |
| `lastHealthCheck`| `number`              | Unix timestamp of last health check              |
| `healthy`        | `boolean`             | Current health status                            |
| `weight`         | `number`              | Weight for weighted load balancing (default: 1)  |
| `tags`           | `string[]`            | Optional tags for categorization                 |

#### `ServiceHealthCheck`

```typescript
interface ServiceHealthCheck {
  endpoint: string;
  intervalMs: number;
  timeoutMs: number;
  healthyThreshold: number;
  unhealthyThreshold: number;
}
```

| Field                | Type      | Description                                  |
|----------------------|-----------|----------------------------------------------|
| `endpoint`           | `string`  | HTTP path to check (e.g., `/health`)         |
| `intervalMs`         | `number`  | How often to check (ms)                      |
| `timeoutMs`          | `number`  | Request timeout (ms)                         |
| `healthyThreshold`   | `number`  | Consecutive successes to mark healthy        |
| `unhealthyThreshold` | `number`  | Consecutive failures to mark unhealthy       |

#### `ServiceConfig`

```typescript
interface ServiceConfig {
  name: string;
  healthCheck?: ServiceHealthCheck;
  loadBalancing?: 'round-robin' | 'least-connections' | 'weighted' | 'random';
  ttl?: number;
}
```

| Field           | Type                        | Description                                    |
|-----------------|-----------------------------|------------------------------------------------|
| `name`          | `string`                    | Service name                                   |
| `healthCheck`   | `ServiceHealthCheck`        | Health check configuration                     |
| `loadBalancing` | `'round-robin' \| ...`      | Load balancing strategy (default: round-robin) |
| `ttl`           | `number`                    | Instance TTL in ms (not currently enforced)    |

### `ServiceRegistry` Class

The main service registry class. Extends `EventEmitter`.

#### Constructor

```typescript
constructor()
```

Takes no arguments. Use `register()` to add service definitions.

#### Methods

**`register(config: ServiceConfig): void`**

Registers a service definition. Creates an empty instance map for the service. If a health check is configured, starts periodic health checking. Emits `service:registered`.

**`registerInstance(instance: Omit<ServiceInstance, 'registeredAt' | 'lastHealthCheck' | 'healthy'>): ServiceInstance`**

Registers a service instance. Throws `Error('Service not registered: <name>')` if the parent service is not registered. Auto-sets `registeredAt`, initializes `healthy: true`, and sets `weight` to 1 if not provided. Emits `instance:registered`.

**`deregisterInstance(serviceName: string, instanceId: string): boolean`**

Removes a service instance. Returns `false` if the service or instance does not exist. Cleans up connection count tracking. Emits `instance:deregistered` on success.

**`getHealthyInstances(serviceName: string): ServiceInstance[]`**

Returns all healthy instances for a service. Returns an empty array if the service is not registered or has no healthy instances.

**`getInstance(serviceName: string): ServiceInstance | null`**

Returns a single instance using the configured load balancing strategy. Returns `null` if no healthy instances exist.

**`trackConnection(instanceId: string): void`**

Increments the connection count for an instance (used by least-connections load balancing).

**`releaseConnection(instanceId: string): void`**

Decrements the connection count for an instance. Clamps to 0 minimum.

**`getServices(): Array<{ name: string; instanceCount: number; healthyCount: number }>`**

Returns summary information for all registered services.

**`getService(serviceName: string): { config?: ServiceConfig; instances: ServiceInstance[] }`**

Returns detailed information for a specific service, including its configuration and all instances.

**`getStats(): { totalServices: number; totalInstances: number; healthyInstances: number; totalConnections: number }`**

Returns aggregate registry statistics.

**`close(): void`**

Stops all health check timers and clears all registry data. Call this during graceful shutdown.

### Factory Function

```typescript
function createServiceRegistry(): ServiceRegistry
```

Convenience factory that returns a new `ServiceRegistry` instance.

## Configuration Options

### Load Balancing Strategies

| Strategy              | Description                                                      |
|-----------------------|------------------------------------------------------------------|
| `round-robin`         | Cycles through healthy instances sequentially                    |
| `least-connections`   | Selects the instance with the fewest active connections          |
| `weighted`            | Selects instances probabilistically based on their weight values |
| `random`              | Selects a random healthy instance                                |

### Health Check Configuration

| Field                | Type      | Description                                  |
|----------------------|-----------|----------------------------------------------|
| `endpoint`           | `string`  | HTTP path (e.g., `/health`, `/ready`)        |
| `intervalMs`         | `number`  | Check interval in milliseconds               |
| `timeoutMs`          | `number`  | HTTP request timeout                         |
| `healthyThreshold`   | `number`  | Not currently used (stored for future use)   |
| `unhealthyThreshold` | `number`  | Not currently used (stored for future use)   |

Note: The current implementation marks instances as healthy/unhealthy based on a single health check response (not threshold-based). The threshold fields are stored for future enhancement.

## Usage Examples

### Basic Service Registration

```typescript
import { createServiceRegistry } from './src/service-registry/index.js';

const registry = createServiceRegistry();

// Register a service
registry.register({
  name: 'user-service',
  loadBalancing: 'round-robin',
});

// Register instances
registry.registerInstance({
  id: 'user-1',
  name: 'user-service',
  host: '10.0.1.10',
  port: 8080,
  protocol: 'http',
});

registry.registerInstance({
  id: 'user-2',
  name: 'user-service',
  host: '10.0.1.11',
  port: 8080,
  protocol: 'http',
});

// Get an instance (round-robin)
const instance1 = registry.getInstance('user-service');
const instance2 = registry.getInstance('user-service');
```

### Health Checking

```typescript
registry.register({
  name: 'payment-service',
  loadBalancing: 'round-robin',
  healthCheck: {
    endpoint: '/health',
    intervalMs: 10000,   // Check every 10 seconds
    timeoutMs: 3000,     // 3 second timeout
    healthyThreshold: 1,
    unhealthyThreshold: 1,
  },
});

registry.registerInstance({
  id: 'payment-1',
  name: 'payment-service',
  host: 'payments.internal',
  port: 443,
  protocol: 'https',
});

// Health checks run automatically every 10 seconds
// Unhealthy instances are excluded from getInstance()
```

### Weighted Load Balancing

```typescript
registry.register({
  name: 'llm-service',
  loadBalancing: 'weighted',
});

// Primary instance (handles 70% of traffic)
registry.registerInstance({
  id: 'llm-primary',
  name: 'llm-service',
  host: 'llm-primary.internal',
  port: 8080,
  weight: 7,
});

// Secondary instance (handles 30% of traffic)
registry.registerInstance({
  id: 'llm-secondary',
  name: 'llm-service',
  host: 'llm-secondary.internal',
  port: 8080,
  weight: 3,
});
```

### Least-Connections Load Balancing

```typescript
registry.register({
  name: 'worker-service',
  loadBalancing: 'least-connections',
});

for (let i = 0; i < 3; i++) {
  registry.registerInstance({
    id: `worker-${i}`,
    name: 'worker-service',
    host: `worker-${i}.internal`,
    port: 9000,
  });
}

// In request handler
function handleRequest() {
  const instance = registry.getInstance('worker-service');
  registry.trackConnection(instance.id);

  try {
    await forwardToWorker(instance, request);
  } finally {
    registry.releaseConnection(instance.id);
  }
}
```

### Service Discovery

```typescript
// List all services
const services = registry.getServices();
for (const svc of services) {
  console.log(`${svc.name}: ${svc.healthyCount}/${svc.instanceCount} healthy`);
}

// Get detailed service info
const detail = registry.getService('payment-service');
console.log('Config:', detail.config);
console.log('Instances:', detail.instances);

// Stats
const stats = registry.getStats();
console.log(`Registry: ${stats.totalServices} services, ${stats.healthyInstances} healthy instances`);
```

### Event Monitoring

```typescript
registry.on('service:registered', (config) => {
  logger.info({ service: config.name }, 'New service registered');
});

registry.on('instance:registered', (instance) => {
  logger.info(
    { service: instance.name, instance: instance.id },
    `Instance ${instance.host}:${instance.port} registered`
  );
});

registry.on('instance:deregistered', ({ serviceName, instanceId }) => {
  logger.info({ service: serviceName, instance: instanceId }, 'Instance deregistered');
});
```

### Graceful Shutdown Integration

```typescript
const shutdown = createGracefulShutdownManager();

// Close the registry during shutdown
shutdown.registerCleanup(() => {
  registry.close();
  logger.info('Service registry closed');
});
```

## Integration Points

### With Queue Module

Queue consumers can register as service instances:

```typescript
const registry = createServiceRegistry();
const queue = createMessageQueue();

registry.register({
  name: 'order-processor',
  healthCheck: { endpoint: '/health', intervalMs: 5000, timeoutMs: 2000 },
});

queue.subscribe('orders', async (msg) => {
  const instance = registry.getInstance('order-processor');
  if (instance) {
    registry.trackConnection(instance.id);
    try {
      await processOrder(msg.payload, instance);
    } finally {
      registry.releaseConnection(instance.id);
    }
  }
});
```

### With Rate Limiter

Rate limit service-to-service calls:

```typescript
const limiter = createRateLimiter({ max: 1000, window: 60 });

const instance = registry.getInstance('external-api');
const result = await limiter.check(`service:${instance.id}`);
if (!result.allowed) {
  throw new Error('Service rate limited');
}
```

### With Rule Engine

Rules can route based on service metadata:

```typescript
engine.addRule({
  id: 'route-to-premium',
  name: 'Route Premium Users to Dedicated Instances',
  condition: {
    field: 'user.tier',
    operator: 'eq',
    value: 'enterprise',
  },
  actions: [
    {
      type: 'set',
      params: { field: 'routing.serviceTag', value: 'dedicated' },
    },
  ],
  priority: 50,
  enabled: true,
  category: 'routing',
});
```

### With Tenant Manager

Tenant-scoped service discovery:

```typescript
const tenant = tenantManager.get(tenantId);
if (tenant && tenant.settings.allowedModels.includes(model)) {
  const instance = registry.getInstance(`${model}-service`);
  if (instance) {
    return forwardToInstance(instance, request);
  }
}
```

## Error Handling

### Service Not Registered

`registerInstance()` throws `Error('Service not registered: <name>')` if you attempt to register an instance before the parent service. Call `register()` first.

### No Healthy Instances

`getInstance()` returns `null` if no healthy instances exist for a service. Callers should handle this null case (e.g., return a 503 error or queue the request).

### Health Check Failures

Health checks use `fetch()` with `AbortController` for timeout. If the health endpoint returns a non-OK response or times out, the instance is marked as `healthy: false`. Health checks continue running -- the instance can recover and be marked healthy again.

### Connection Tracking

`trackConnection()` and `releaseConnection()` are safe to call with unknown instance IDs (they default the count to 0). `releaseConnection()` clamps to 0 minimum to prevent negative counts.

### Cleanup on Close

`close()` clears all health check intervals and removes all registry data. This should be called during graceful shutdown to prevent timer leaks.

## Related Documentation

- **Shutdown Module**: `/home/runner/workspace/agent-gateway/README.md`
- **Queue Module**: `/home/runner/workspace/agent-gateway/src/queue/README.md`
- **Rate Limiter**: `/home/runner/workspace/agent-gateway/src/rate-limiter/README.md`
- **Rule Engine**: `/home/runner/workspace/agent-gateway/src/rule-engine/README.md`
- **Tenant Manager**: `/home/runner/workspace/agent-gateway/src/tenant-manager/README.md`
