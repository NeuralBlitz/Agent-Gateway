/** Enterprise Request Deduplicator — coalesce identical in-flight requests */
import { randomUUID } from 'crypto';

export class RequestDeduplicator {
  private inFlight: Map<string, Promise<any>> = new Map();

  async deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.inFlight.has(key)) return this.inFlight.get(key)!;
    const promise = fn().finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, promise);
    return promise;
  }

  get activeCount(): number { return this.inFlight.size; }
}

/** Enterprise LRU Cache */
export class LruCache<K, V> {
  private store: Map<K, V>;
  constructor(private max: number = 10000) { this.store = new Map(); }
  get(key: K): V | undefined { const v = this.store.get(key); if (v !== undefined) { this.store.delete(key); this.store.set(key, v); } return v; }
  set(key: K, value: V): void { if (this.store.has(key)) this.store.delete(key); else if (this.store.size >= this.max) this.store.delete(this.store.keys().next().value!); this.store.set(key, value); }
  delete(key: K): boolean { return this.store.delete(key); }
  clear(): void { this.store.clear(); }
  get size(): number { return this.store.size; }
  has(key: K): boolean { return this.store.has(key); }
}

/** Enterprise Debounce */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timer: ReturnType<typeof setTimeout>;
  let resolve: (value: ReturnType<T>) => void;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    return new Promise<ReturnType<T>>((res) => {
      resolve = res;
      timer = setTimeout(() => res(fn(...args)), delay);
    });
  };
}

/** Enterprise Throttle */
export function throttle<T extends (...args: any[]) => any>(fn: T, limit: number): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= limit) { lastCall = now; fn(...args); }
  };
}

/** Deep clone with structured clone fallback */
export function deepClone<T>(obj: T): T {
  try { return structuredClone(obj); } catch { return JSON.parse(JSON.stringify(obj)); }
}

/** Flatten nested object to dot-notation keys */
export function flatten(obj: Record<string, any>, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) Object.assign(result, flatten(value, fullKey));
    else result[fullKey] = value;
  }
  return result;
}

/** Unflatten dot-notation keys back to nested object */
export function unflatten(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) { current[parts[i]] = current[parts[i]] || {}; current = current[parts[i]]; }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}
