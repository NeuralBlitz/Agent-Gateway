import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ServiceRegistry, createServiceRegistry } from '../src/service-registry/index.js';

vi.mock('../src/infra/index.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('ServiceRegistry', () => {
  let registry: ServiceRegistry;

  beforeEach(() => {
    registry = createServiceRegistry();
  });

  afterEach(() => {
    registry.close();
  });

  describe('register', () => {
    it('should register a service', () => {
      registry.register({ name: 'api-gateway' });
      const services = registry.getServices();
      expect(services.length).toBe(1);
      expect(services[0].name).toBe('api-gateway');
    });

    it('should emit service:registered event', () => {
      const handler = vi.fn();
      registry.on('service:registered', handler);
      registry.register({ name: 'user-service' });
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ name: 'user-service' }));
    });

    it('should initialize instances map', () => {
      registry.register({ name: 'test-service' });
      const service = registry.getService('test-service');
      expect(service.config).toBeDefined();
      expect(service.instances).toEqual([]);
    });
  });

  describe('registerInstance', () => {
    it('should register a service instance', () => {
      registry.register({ name: 'api-gateway' });
      const instance = registry.registerInstance({
        id: 'inst-1',
        name: 'api-gateway',
        host: 'localhost',
        port: 8080,
      });

      expect(instance.id).toBe('inst-1');
      expect(instance.healthy).toBe(true);
      expect(instance.registeredAt).toBeDefined();

      const instances = registry.getHealthyInstances('api-gateway');
      expect(instances.length).toBe(1);
    });

    it('should throw for unregistered service', () => {
      expect(() =>
        registry.registerInstance({
          id: 'inst-1',
          name: 'unknown-service',
          host: 'localhost',
          port: 8080,
        })
      ).toThrow('Service not registered');
    });

    it('should emit instance:registered event', () => {
      registry.register({ name: 'api-gateway' });
      const handler = vi.fn();
      registry.on('instance:registered', handler);
      registry.registerInstance({
        id: 'inst-1',
        name: 'api-gateway',
        host: 'localhost',
        port: 8080,
      });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should set default weight to 1', () => {
      registry.register({ name: 'api-gateway' });
      const instance = registry.registerInstance({
        id: 'inst-1',
        name: 'api-gateway',
        host: 'localhost',
        port: 8080,
      });
      expect(instance.weight).toBe(1);
    });

    it('should allow custom weight', () => {
      registry.register({ name: 'api-gateway' });
      const instance = registry.registerInstance({
        id: 'inst-1',
        name: 'api-gateway',
        host: 'localhost',
        port: 8080,
        weight: 5,
      });
      expect(instance.weight).toBe(5);
    });
  });

  describe('deregisterInstance', () => {
    it('should deregister a service instance', () => {
      registry.register({ name: 'api-gateway' });
      registry.registerInstance({ id: 'inst-1', name: 'api-gateway', host: 'localhost', port: 8080 });

      const result = registry.deregisterInstance('api-gateway', 'inst-1');
      expect(result).toBe(true);
      expect(registry.getHealthyInstances('api-gateway').length).toBe(0);
    });

    it('should return false for unknown service', () => {
      expect(registry.deregisterInstance('unknown', 'inst-1')).toBe(false);
    });

    it('should return false for unknown instance', () => {
      registry.register({ name: 'api-gateway' });
      expect(registry.deregisterInstance('api-gateway', 'unknown')).toBe(false);
    });

    it('should emit instance:deregistered event', () => {
      registry.register({ name: 'api-gateway' });
      registry.registerInstance({ id: 'inst-1', name: 'api-gateway', host: 'localhost', port: 8080 });

      const handler = vi.fn();
      registry.on('instance:deregistered', handler);
      registry.deregisterInstance('api-gateway', 'inst-1');
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('getHealthyInstances', () => {
    it('should return only healthy instances', () => {
      registry.register({ name: 'api-gateway' });
      registry.registerInstance({ id: 'h1', name: 'api-gateway', host: 'localhost', port: 8080 });
      registry.registerInstance({ id: 'h2', name: 'api-gateway', host: 'localhost', port: 8081 });

      const healthy = registry.getHealthyInstances('api-gateway');
      expect(healthy.length).toBe(2);
    });

    it('should return empty array for unknown service', () => {
      expect(registry.getHealthyInstances('unknown')).toEqual([]);
    });
  });

  describe('getInstance — load balancing', () => {
    it('should return null for service with no instances', () => {
      registry.register({ name: 'api-gateway' });
      expect(registry.getInstance('api-gateway')).toBeNull();
    });

    it('should return null for unknown service', () => {
      expect(registry.getInstance('unknown')).toBeNull();
    });

    it('should use round-robin strategy', () => {
      registry.register({ name: 'api-gateway', loadBalancing: 'round-robin' });
      registry.registerInstance({ id: 'a', name: 'api-gateway', host: 'localhost', port: 8080 });
      registry.registerInstance({ id: 'b', name: 'api-gateway', host: 'localhost', port: 8081 });

      const instance = registry.getInstance('api-gateway');
      expect(instance).not.toBeNull();
    });

    it('should use least-connections strategy', () => {
      registry.register({ name: 'api-gateway', loadBalancing: 'least-connections' });
      registry.registerInstance({ id: 'a', name: 'api-gateway', host: 'localhost', port: 8080 });
      registry.registerInstance({ id: 'b', name: 'api-gateway', host: 'localhost', port: 8081 });

      registry.trackConnection('a');
      registry.trackConnection('a');

      const instance = registry.getInstance('api-gateway');
      expect(instance!.id).toBe('b'); // b has fewer connections
    });

    it('should use weighted strategy', () => {
      registry.register({ name: 'api-gateway', loadBalancing: 'weighted' });
      registry.registerInstance({ id: 'a', name: 'api-gateway', host: 'localhost', port: 8080, weight: 10 });
      registry.registerInstance({ id: 'b', name: 'api-gateway', host: 'localhost', port: 8081, weight: 1 });

      // Run multiple times to verify weighted distribution
      let aCount = 0;
      for (let i = 0; i < 100; i++) {
        const instance = registry.getInstance('api-gateway');
        if (instance!.id === 'a') aCount++;
      }

      expect(aCount).toBeGreaterThan(50); // a has 10x weight, should get ~90%
    });

    it('should use random strategy', () => {
      registry.register({ name: 'api-gateway', loadBalancing: 'random' });
      registry.registerInstance({ id: 'a', name: 'api-gateway', host: 'localhost', port: 8080 });
      registry.registerInstance({ id: 'b', name: 'api-gateway', host: 'localhost', port: 8081 });

      const instance = registry.getInstance('api-gateway');
      expect(['a', 'b']).toContain(instance!.id);
    });
  });

  describe('trackConnection / releaseConnection', () => {
    it('should increment connection count', () => {
      registry.register({ name: 'api-gateway' });
      registry.registerInstance({ id: 'inst-1', name: 'api-gateway', host: 'localhost', port: 8080 });

      registry.trackConnection('inst-1');
      registry.trackConnection('inst-1');

      const stats = registry.getStats();
      expect(stats.totalConnections).toBe(2);
    });

    it('should decrement connection count', () => {
      registry.register({ name: 'api-gateway' });
      registry.registerInstance({ id: 'inst-1', name: 'api-gateway', host: 'localhost', port: 8080 });

      registry.trackConnection('inst-1');
      registry.trackConnection('inst-1');
      registry.releaseConnection('inst-1');

      const stats = registry.getStats();
      expect(stats.totalConnections).toBe(1);
    });

    it('should not go below zero', () => {
      registry.register({ name: 'api-gateway' });
      registry.registerInstance({ id: 'inst-1', name: 'api-gateway', host: 'localhost', port: 8080 });

      registry.releaseConnection('inst-1'); // No prior track

      const stats = registry.getStats();
      expect(stats.totalConnections).toBe(0);
    });
  });

  describe('getServices', () => {
    it('should return all services with instance counts', () => {
      registry.register({ name: 'api-gateway' });
      registry.register({ name: 'user-service' });
      registry.registerInstance({ id: 'a1', name: 'api-gateway', host: 'localhost', port: 8080 });

      const services = registry.getServices();
      expect(services.length).toBe(2);

      const apiService = services.find((s) => s.name === 'api-gateway')!;
      expect(apiService.instanceCount).toBe(1);
      expect(apiService.healthyCount).toBe(1);
    });

    it('should return empty array when no services', () => {
      expect(registry.getServices()).toEqual([]);
    });
  });

  describe('getService', () => {
    it('should return service config and instances', () => {
      registry.register({ name: 'api-gateway' });
      registry.registerInstance({ id: 'a1', name: 'api-gateway', host: 'localhost', port: 8080 });

      const service = registry.getService('api-gateway');
      expect(service.config).toBeDefined();
      expect(service.config?.name).toBe('api-gateway');
      expect(service.instances.length).toBe(1);
    });

    it('should return empty instances for unknown service', () => {
      const service = registry.getService('unknown');
      expect(service.config).toBeUndefined();
      expect(service.instances).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should return initial stats', () => {
      const stats = registry.getStats();
      expect(stats.totalServices).toBe(0);
      expect(stats.totalInstances).toBe(0);
      expect(stats.healthyInstances).toBe(0);
      expect(stats.totalConnections).toBe(0);
    });

    it('should return accurate stats', () => {
      registry.register({ name: 'api-gateway' });
      registry.registerInstance({ id: 'a1', name: 'api-gateway', host: 'localhost', port: 8080 });
      registry.registerInstance({ id: 'a2', name: 'api-gateway', host: 'localhost', port: 8081 });
      registry.trackConnection('a1');
      registry.trackConnection('a1');
      registry.trackConnection('a2');

      const stats = registry.getStats();
      expect(stats.totalServices).toBe(1);
      expect(stats.totalInstances).toBe(2);
      expect(stats.healthyInstances).toBe(2);
      expect(stats.totalConnections).toBe(3);
    });
  });

  describe('close', () => {
    it('should clear all state', () => {
      registry.register({ name: 'api-gateway' });
      registry.registerInstance({ id: 'a1', name: 'api-gateway', host: 'localhost', port: 8080 });
      registry.close();

      expect(registry.getServices()).toEqual([]);
      expect(registry.getStats().totalInstances).toBe(0);
    });
  });
});
