/**
 * Enterprise Service Registry
 * Service discovery, health tracking, and load balancing for
 * microservice architectures and internal service mesh.
 */

import { EventEmitter } from 'events';
import { logger } from '../infra/index.js';

export interface ServiceInstance {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol?: 'http' | 'https' | 'grpc' | 'tcp';
  metadata?: Record<string, any>;
  registeredAt: number;
  lastHealthCheck?: number;
  healthy: boolean;
  weight?: number; // For weighted load balancing
  tags?: string[];
}

export interface ServiceHealthCheck {
  endpoint: string;
  intervalMs: number;
  timeoutMs: number;
  healthyThreshold: number;
  unhealthyThreshold: number;
}

export interface ServiceConfig {
  name: string;
  healthCheck?: ServiceHealthCheck;
  loadBalancing?: 'round-robin' | 'least-connections' | 'weighted' | 'random';
  ttl?: number; // Instance TTL in ms
}

export class ServiceRegistry extends EventEmitter {
  private services: Map<string, ServiceConfig> = new Map();
  private instances: Map<string, Map<string, ServiceInstance>> = new Map(); // serviceName -> instances
  private healthTimers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private connectionCounts: Map<string, number> = new Map(); // instanceId -> count

  /** Register a service definition */
  register(config: ServiceConfig): void {
    this.services.set(config.name, config);
    if (!this.instances.has(config.name)) {
      this.instances.set(config.name, new Map());
    }

    // Start health checking
    if (config.healthCheck) {
      this.startHealthCheck(config.name, config.healthCheck);
    }

    logger.info({ service: config.name }, 'Service registered');
    this.emit('service:registered', config);
  }

  /** Register a service instance */
  registerInstance(instance: Omit<ServiceInstance, 'registeredAt' | 'lastHealthCheck' | 'healthy'>): ServiceInstance {
    const serviceInstances = this.instances.get(instance.name);
    if (!serviceInstances) {
      throw new Error(`Service not registered: ${instance.name}`);
    }

    const fullInstance: ServiceInstance = {
      ...instance,
      registeredAt: Date.now(),
      lastHealthCheck: undefined,
      healthy: true,
      weight: instance.weight ?? 1,
    };

    serviceInstances.set(instance.id, fullInstance);
    this.connectionCounts.set(instance.id, 0);

    logger.info({ service: instance.name, instanceId: instance.id, host: instance.host, port: instance.port }, 'Service instance registered');
    this.emit('instance:registered', fullInstance);
    return fullInstance;
  }

  /** Deregister a service instance */
  deregisterInstance(serviceName: string, instanceId: string): boolean {
    const serviceInstances = this.instances.get(serviceName);
    if (!serviceInstances) return false;

    const deleted = serviceInstances.delete(instanceId);
    this.connectionCounts.delete(instanceId);

    if (deleted) {
      logger.info({ service: serviceName, instanceId }, 'Service instance deregistered');
      this.emit('instance:deregistered', { serviceName, instanceId });
    }

    return deleted;
  }

  /** Get healthy instances for a service */
  getHealthyInstances(serviceName: string): ServiceInstance[] {
    const serviceInstances = this.instances.get(serviceName);
    if (!serviceInstances) return [];

    return Array.from(serviceInstances.values()).filter((i) => i.healthy);
  }

  /** Get a single instance using load balancing strategy */
  getInstance(serviceName: string): ServiceInstance | null {
    const healthy = this.getHealthyInstances(serviceName);
    if (healthy.length === 0) return null;

    const config = this.services.get(serviceName);
    const strategy = config?.loadBalancing || 'round-robin';

    switch (strategy) {
      case 'round-robin': {
        const idx = (this.connectionCounts.size) % healthy.length;
        return healthy[idx];
      }

      case 'least-connections': {
        return healthy.reduce((best, current) => {
          const bestCount = this.connectionCounts.get(best.id) || 0;
          const currentCount = this.connectionCounts.get(current.id) || 0;
          return currentCount < bestCount ? current : best;
        });
      }

      case 'weighted': {
        const totalWeight = healthy.reduce((sum, i) => sum + (i.weight || 1), 0);
        let random = Math.random() * totalWeight;
        for (const instance of healthy) {
          random -= instance.weight || 1;
          if (random <= 0) return instance;
        }
        return healthy[healthy.length - 1];
      }

      case 'random': {
        return healthy[Math.floor(Math.random() * healthy.length)];
      }

      default:
        return healthy[0];
    }
  }

  /** Track a connection to an instance */
  trackConnection(instanceId: string): void {
    const count = this.connectionCounts.get(instanceId) || 0;
    this.connectionCounts.set(instanceId, count + 1);
  }

  /** Release a connection from an instance */
  releaseConnection(instanceId: string): void {
    const count = this.connectionCounts.get(instanceId) || 0;
    this.connectionCounts.set(instanceId, Math.max(0, count - 1));
  }

  /** Start health checking for a service */
  private startHealthCheck(serviceName: string, config: ServiceHealthCheck): void {
    if (this.healthTimers.has(serviceName)) {
      clearInterval(this.healthTimers.get(serviceName)!);
    }

    const timer = setInterval(async () => {
      const instances = this.instances.get(serviceName);
      if (!instances) return;

      for (const [, instance] of instances) {
        try {
          const url = `${instance.protocol || 'http'}://${instance.host}:${instance.port}${config.endpoint}`;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeout);

          instance.lastHealthCheck = Date.now();
          instance.healthy = response.ok;
        } catch {
          instance.lastHealthCheck = Date.now();
          instance.healthy = false;
        }
      }
    }, config.intervalMs);

    this.healthTimers.set(serviceName, timer);
  }

  /** Get all services */
  getServices(): Array<{ name: string; instanceCount: number; healthyCount: number }> {
    const result: Array<{ name: string; instanceCount: number; healthyCount: number }> = [];

    for (const [name, instances] of this.instances) {
      const all = Array.from(instances.values());
      result.push({
        name,
        instanceCount: all.length,
        healthyCount: all.filter((i) => i.healthy).length,
      });
    }

    return result;
  }

  /** Get service details */
  getService(serviceName: string): { config?: ServiceConfig; instances: ServiceInstance[] } {
    const config = this.services.get(serviceName);
    const instances = this.instances.get(serviceName);

    return {
      config,
      instances: instances ? Array.from(instances.values()) : [],
    };
  }

  /** Get registry stats */
  getStats(): {
    totalServices: number;
    totalInstances: number;
    healthyInstances: number;
    totalConnections: number;
  } {
    let totalInstances = 0;
    let healthyInstances = 0;
    let totalConnections = 0;

    for (const [, instances] of this.instances) {
      for (const instance of instances.values()) {
        totalInstances++;
        if (instance.healthy) healthyInstances++;
      }
    }

    for (const [, count] of this.connectionCounts) {
      totalConnections += count;
    }

    return {
      totalServices: this.services.size,
      totalInstances,
      healthyInstances,
      totalConnections,
    };
  }

  /** Close the registry */
  close(): void {
    for (const [, timer] of this.healthTimers) {
      clearInterval(timer);
    }
    this.healthTimers.clear();
    this.instances.clear();
    this.services.clear();
    this.connectionCounts.clear();
  }
}

export function createServiceRegistry(): ServiceRegistry {
  return new ServiceRegistry();
}
