import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProvider, OpenAIProvider, AnthropicProvider, GoogleProvider, OllamaProvider } from '../../src/providers/index.js';

vi.mock('undici', () => ({
  fetch: vi.fn(),
}));

const { fetch } = await import('undici');

describe('Provider Factory', () => {
  it('should create OpenAI provider', () => {
    const provider = createProvider('openai', 'test', { apiKey: 'test-key', model: 'gpt-4' });
    expect(provider.type).toBe('openai');
    expect(provider.config.model).toBe('gpt-4');
  });

  it('should create Anthropic provider', () => {
    const provider = createProvider('anthropic', 'test', { apiKey: 'test-key', model: 'claude-4' });
    expect(provider.type).toBe('anthropic');
  });

  it('should create Google provider', () => {
    const provider = createProvider('google', 'test', { apiKey: 'test-key', model: 'gemini-1.5-flash' });
    expect(provider.type).toBe('google');
  });

  it('should throw for unknown provider', () => {
    expect(() => createProvider('unknown', 'test', {})).toThrow('Unknown provider type: unknown');
  });
});

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new OpenAIProvider('test-openai', { apiKey: 'test-key', model: 'gpt-4o' });
  });

  describe('connect', () => {
    it('should connect successfully', async () => {
      await provider.connect();
      expect(provider).toBeDefined();
    });
  });

  describe('chat', () => {
    it('should return model response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'chatcmpl-123',
          model: 'gpt-4o',
          choices: [{
            message: { content: 'Hello!' },
            finish_reason: 'stop',
          }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        }),
      } as any);

      const response = await provider.chat([{ role: 'user', content: 'Hi' }]);

      expect(response.content).toBe('Hello!');
      expect(response.finishReason).toBe('stop');
      expect(response.usage?.totalTokens).toBe(15);
    });

    it('should handle API errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      } as any);

      await expect(provider.chat([{ role: 'user', content: 'Hi' }])).rejects.toThrow('OpenAI API error');
    });
  });

  describe('chatWithTools', () => {
    it('should include tools in request', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'chatcmpl-456',
          model: 'gpt-4o',
          choices: [{
            message: { content: 'Calling tool...', tool_calls: [{ id: 'call-1', type: 'function', function: { name: 'getWeather', arguments: '{"location":"NYC"}' } }] },
            finish_reason: 'tool_calls',
          }],
        }),
      } as any);

      const tools = [{ name: 'getWeather', description: 'Get weather', parameters: { type: 'object', properties: { location: { type: 'string' } } } }];
      const response = await provider.chatWithTools([{ role: 'user', content: 'Weather?' }], tools);

      expect(response.toolCalls).toHaveLength(1);
      expect(response.toolCalls?.[0].function.name).toBe('getWeather');
    });
  });
});

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new AnthropicProvider('test-anthropic', { apiKey: 'test-key', model: 'claude-sonnet-4-20250514' });
  });

  describe('chat', () => {
    it('should return model response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'msg_123',
          model: 'claude-sonnet-4-20250514',
          content: [{ type: 'text', text: 'Hello from Claude!' }],
          stop_reason: 'end_turn',
          usage: { input_tokens: 10, output_tokens: 20 },
        }),
      } as any);

      const response = await provider.chat([{ role: 'user', content: 'Hi' }]);

      expect(response.content).toBe('Hello from Claude!');
      expect(response.finishReason).toBe('stop');
    });

    it('should include system message', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'msg_456',
          content: [{ type: 'text', text: 'Response' }],
          stop_reason: 'end_turn',
        }),
      } as any);

      await provider.chat([
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'Hi' }
      ]);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          body: expect.stringContaining('You are helpful'),
        })
      );
    });
  });

  describe('chatWithTools', () => {
    it('should return tool calls', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'msg_789',
          content: [
            { type: 'text', text: 'Let me check...' },
            { type: 'tool_use', id: 'call_1', name: 'search', input: { query: 'weather' } },
          ],
          stop_reason: 'tool_use',
        }),
      } as any);

      const tools = [{ name: 'search', description: 'Search', parameters: { type: 'object', properties: { query: { type: 'string' } } } }];
      const response = await provider.chatWithTools([{ role: 'user', content: 'Search' }], tools);

      expect(response.toolCalls).toHaveLength(1);
      expect(response.toolCalls?.[0].function.name).toBe('search');
    });
  });
});

describe('GoogleProvider', () => {
  let provider: GoogleProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new GoogleProvider('test-google', { apiKey: 'test-key', model: 'gemini-1.5-flash' });
  });

  describe('chat', () => {
    it('should return model response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: { parts: [{ text: 'Hello from Gemini!' }] },
            finishReason: 'STOP',
          }],
        }),
      } as any);

      const response = await provider.chat([{ role: 'user', content: 'Hi' }]);

      expect(response.content).toBe('Hello from Gemini!');
      expect(response.finishReason).toBe('stop');
    });
  });

  describe('chatWithTools', () => {
    it('should return function calls', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [
                { text: 'Checking...' },
                { functionCall: { name: 'getWeather', args: { location: 'NYC' } } },
              ],
            },
          }],
        }),
      } as any);

      const tools = [{ name: 'getWeather', description: 'Get weather', parameters: { type: 'object', properties: { location: { type: 'string' } } } }];
      const response = await provider.chatWithTools([{ role: 'user', content: 'Weather?' }], tools);

      expect(response.toolCalls).toHaveLength(1);
    });
  });
});

describe('OllamaProvider', () => {
  let provider: OllamaProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new OllamaProvider('test-ollama', { baseUrl: 'http://localhost:11434', model: 'llama3' });
  });

  describe('connect', () => {
    it('should connect when server available', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ models: [] }),
      } as any);

      await provider.connect();
      expect(fetch).toHaveBeenCalledWith('http://localhost:11434/api/tags');
    });

    it('should throw when server unavailable', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Connection refused'));

      await expect(provider.connect()).rejects.toThrow();
    });
  });

  describe('chat', () => {
    it('should return model response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          message: { content: 'Hello from Ollama!' },
          done: true,
          model: 'llama3',
        }),
      } as any);

      const response = await provider.chat([{ role: 'user', content: 'Hi' }]);

      expect(response.content).toBe('Hello from Ollama!');
    });
  });
});