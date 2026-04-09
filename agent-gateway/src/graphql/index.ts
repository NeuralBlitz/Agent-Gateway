/**
 * Enterprise GraphQL Gateway
 * GraphQL schema stitching, federation, and API gateway integration
 * for unified data access across services.
 */

import { EventEmitter } from 'events';
import { logger } from '../infra/index.js';

export interface GraphQLField {
  name: string;
  type: string;
  description?: string;
  args?: Record<string, { type: string; description?: string; required?: boolean }>;
  deprecated?: boolean;
  deprecationReason?: string;
}

export interface GraphQLType {
  name: string;
  kind: 'object' | 'input' | 'enum' | 'scalar' | 'union' | 'interface';
  description?: string;
  fields?: Record<string, GraphQLField>;
  values?: string[];
}

export interface GraphQLQuery {
  name: string;
  description?: string;
  args?: Record<string, { type: string; description?: string; required?: boolean }>;
  returnType: string;
  resolver: (args: any, context: any) => Promise<any>;
  deprecated?: boolean;
}

export interface GraphQLMutation {
  name: string;
  description?: string;
  args: Record<string, { type: string; description?: string; required?: boolean }>;
  returnType: string;
  resolver: (args: any, context: any) => Promise<any>;
}

export interface GraphQLSubscription {
  name: string;
  description?: string;
  returnType: string;
  filter?: (payload: any, args: any, context: any) => boolean;
}

export interface GraphQLService {
  name: string;
  url: string;
  schema?: string;
  introspection?: any;
  headers?: Record<string, string>;
}

export class GraphQLGateway extends EventEmitter {
  private types: Map<string, GraphQLType> = new Map();
  private queries: Map<string, GraphQLQuery> = new Map();
  private mutations: Map<string, GraphQLMutation> = new Map();
  private subscriptions: Map<string, GraphQLSubscription> = new Map();
  private services: Map<string, GraphQLService> = new Map();
  private resolvers: Map<string, (args: any, context: any) => Promise<any>> = new Map();
  private queryCount = 0;
  private errorCount = 0;

  /** Register a custom type */
  registerType(type: GraphQLType): void {
    this.types.set(type.name, type);
  }

  /** Register a query */
  registerQuery(query: GraphQLQuery): void {
    this.queries.set(query.name, query);
    this.resolvers.set(`Query.${query.name}`, query.resolver);
  }

  /** Register a mutation */
  registerMutation(mutation: GraphQLMutation): void {
    this.mutations.set(mutation.name, mutation);
    this.resolvers.set(`Mutation.${mutation.name}`, mutation.resolver);
  }

  /** Register a subscription */
  registerSubscription(subscription: GraphQLSubscription): void {
    this.subscriptions.set(subscription.name, subscription);
  }

  /** Register an upstream GraphQL service */
  registerService(service: GraphQLService): void {
    this.services.set(service.name, service);
    logger.info({ service: service.name, url: service.url }, 'GraphQL service registered');
  }

  /** Execute a query */
  async execute(query: string, variables?: Record<string, any>, context?: any): Promise<any> {
    this.queryCount++;
    const startTime = Date.now();

    try {
      // Parse and validate query (simplified - full implementation needs a GraphQL parser)
      const operationName = this.extractOperationName(query);
      const resolver = this.resolvers.get(operationName);

      if (resolver) {
        const result = await resolver(variables || {}, context || {});
        const latency = Date.now() - startTime;

        logger.debug(
          { operation: operationName, latency, variables },
          'GraphQL query executed',
        );

        return { data: result, extensions: { latency } };
      }

      // Proxy to upstream service
      const serviceResult = await this.proxyToService(query, variables);
      return serviceResult;
    } catch (err: any) {
      this.errorCount++;
      logger.error({ query, variables, err }, 'GraphQL execution error');
      return { errors: [{ message: err.message, extensions: { code: 'INTERNAL_ERROR' } }] };
    }
  }

  /** Generate SDL (Schema Definition Language) from registered types and operations */
  generateSDL(): string {
    let sdl = '';

    // Custom types
    for (const [, type] of this.types) {
      sdl += this.typeToSDL(type) + '\n\n';
    }

    // Query type
    if (this.queries.size > 0) {
      sdl += 'type Query {\n';
      for (const [, query] of this.queries) {
        const args = query.args
          ? Object.entries(query.args)
              .map(([name, arg]) => `${name}${arg.required ? '!' : ''}: ${arg.type}`)
              .join(', ')
          : '';
        sdl += `  ${query.name}${args ? `(${args})` : ''}: ${query.returnType}\n`;
      }
      sdl += '}\n\n';
    }

    // Mutation type
    if (this.mutations.size > 0) {
      sdl += 'type Mutation {\n';
      for (const [, mutation] of this.mutations) {
        const args = Object.entries(mutation.args)
          .map(([name, arg]) => `${name}${arg.required ? '!' : ''}: ${arg.type}`)
          .join(', ');
        sdl += `  ${mutation.name}(${args}): ${mutation.returnType}\n`;
      }
      sdl += '}\n\n';
    }

    // Subscription type
    if (this.subscriptions.size > 0) {
      sdl += 'type Subscription {\n';
      for (const [, sub] of this.subscriptions) {
        sdl += `  ${sub.name}: ${sub.returnType}\n`;
      }
      sdl += '}\n';
    }

    return sdl;
  }

  /** Convert a type to SDL */
  private typeToSDL(type: GraphQLType): string {
    switch (type.kind) {
      case 'enum':
        return `enum ${type.name} {\n  ${(type.values || []).join('\n  ')}\n}`;

      case 'scalar':
        return `scalar ${type.name}`;

      case 'input':
        return `input ${type.name} {\n${Object.entries(type.fields || {})
          .map(([name, field]) => `  ${name}: ${field.type}`)
          .join('\n')}\n}`;

      case 'object':
      default:
        return `type ${type.name} {\n${Object.entries(type.fields || {})
          .map(([name, field]) => {
            const args = field.args
              ? `(${Object.entries(field.args)
                  .map(([an, arg]) => `${an}: ${arg.type}`)
                  .join(', ')})`
              : '';
            return `  ${name}${args}: ${field.type}`;
          })
          .join('\n')}\n}`;
    }
  }

  /** Extract operation name from query */
  private extractOperationName(query: string): string {
    const match = query.match(/(?:query|mutation|subscription)\s+(\w+)/);
    return match ? match[1] : 'anonymous';
  }

  /** Proxy query to an upstream service */
  private async proxyToService(query: string, variables?: Record<string, any>): Promise<any> {
    // Use the first registered service
    const service = this.services.values().next().value;
    if (!service) {
      throw new Error('No upstream GraphQL service registered');
    }

    const response = await fetch(service.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...service.headers,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`Upstream service error: ${response.status}`);
    }

    return response.json();
  }

  /** Get stats */
  getStats(): {
    queries: number;
    mutations: number;
    subscriptions: number;
    services: number;
    types: number;
    totalQueries: number;
    errorCount: number;
  } {
    return {
      queries: this.queries.size,
      mutations: this.mutations.size,
      subscriptions: this.subscriptions.size,
      services: this.services.size,
      types: this.types.size,
      totalQueries: this.queryCount,
      errorCount: this.errorCount,
    };
  }
}

export function createGraphQLGateway(): GraphQLGateway {
  return new GraphQLGateway();
}
