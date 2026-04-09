export interface PubSubMessage<T = unknown> {
  topic: string;
  payload: T;
  timestamp: number;
  messageId: string;
  headers: Record<string, string>;
}

export type MessageHandler<T = unknown> = (message: PubSubMessage<T>) => void | Promise<void>;

export class PubSub {
  private subscribers = new Map<string, Set<MessageHandler>>();
  private messageHistory = new Map<string, PubSubMessage[]>();
  private maxHistoryPerTopic: number;

  constructor(maxHistoryPerTopic: number = 100) {
    this.maxHistoryPerTopic = maxHistoryPerTopic;
  }

  subscribe<T = unknown>(topic: string, handler: MessageHandler<T>): () => void {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    
    const handlers = this.subscribers.get(topic)!;
    handlers.add(handler as MessageHandler);
    
    return () => {
      handlers.delete(handler as MessageHandler);
      if (handlers.size === 0) {
        this.subscribers.delete(topic);
      }
    };
  }

  async publish<T = unknown>(topic: string, payload: T, headers: Record<string, string> = {}): Promise<void> {
    const message: PubSubMessage<T> = {
      topic,
      payload,
      timestamp: Date.now(),
      messageId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      headers,
    };

    this.addToHistory(message);

    const handlers = this.subscribers.get(topic);
    if (!handlers) return;

    const promises: Promise<void>[] = [];
    for (const handler of handlers) {
      promises.push(Promise.resolve(handler(message as PubSubMessage)));
    }

    await Promise.all(promises);
  }

  private addToHistory<T>(message: PubSubMessage<T>): void {
    if (!this.messageHistory.has(message.topic)) {
      this.messageHistory.set(message.topic, []);
    }

    const history = this.messageHistory.get(message.topic)!;
    history.push(message as PubSubMessage);

    if (history.length > this.maxHistoryPerTopic) {
      history.shift();
    }
  }

  getHistory(topic: string, limit?: number): PubSubMessage[] {
    const history = this.messageHistory.get(topic) || [];
    return limit ? history.slice(-limit) : history;
  }

  getTopics(): string[] {
    return Array.from(this.subscribers.keys());
  }

  getSubscriberCount(topic: string): number {
    return this.subscribers.get(topic)?.size || 0;
  }

  clearTopic(topic: string): void {
    this.subscribers.delete(topic);
    this.messageHistory.delete(topic);
  }

  clearAll(): void {
    this.subscribers.clear();
    this.messageHistory.clear();
  }
}

export class EventBus extends PubSub {
  private static instance: EventBus;

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  emit<T = unknown>(event: string, payload: T): Promise<void> {
    return this.publish(event, payload);
  }

  on<T = unknown>(event: string, handler: MessageHandler<T>): () => void {
    return this.subscribe(event, handler);
  }

  once<T = unknown>(event: string, handler: MessageHandler<T>): () => void {
    let unsubscribe: () => void;
    const wrappedHandler: MessageHandler<T> = async (message) => {
      await handler(message);
      unsubscribe();
    };
    unsubscribe = this.subscribe(event, wrappedHandler);
    return unsubscribe;
  }
}

export const events = {
  AGENT_REGISTERED: 'agent.registered',
  AGENT_UNREGISTERED: 'agent.unregistered',
  AGENT_TASK_STARTED: 'agent.task.started',
  AGENT_TASK_COMPLETED: 'agent.task.completed',
  AGENT_TASK_FAILED: 'agent.task.failed',
  CAPABILITY_USED: 'capability.used',
  MEMORY_STORED: 'memory.stored',
  MEMORY_RETRIEVED: 'memory.retrieved',
  SECURITY_VIOLATION: 'security.violation',
  SYSTEM_ERROR: 'system.error',
  SYSTEM_READY: 'system.ready',
  CONFIG_UPDATED: 'config.updated',
};
