export * from './logger.js';

export class GatewayError extends Error {
  constructor(message: string, public code?: string, public statusCode?: number) {
    super(message);
    this.name = 'GatewayError';
  }
}

export class ChannelError extends Error {
  constructor(message: string, public channelType?: string) {
    super(message);
    this.name = 'ChannelError';
  }
}

export class ProviderError extends Error {
  constructor(message: string, public providerType?: string) {
    super(message);
    this.name = 'ProviderError';
  }
}

export class PluginError extends Error {
  constructor(message: string, public pluginName?: string) {
    super(message);
    this.name = 'PluginError';
  }
}