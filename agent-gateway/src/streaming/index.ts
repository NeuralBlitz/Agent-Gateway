/**
 * Streaming response handler.
 * Converts provider streaming output into Server-Sent Events (SSE).
 * Works with OpenAI, Anthropic, and other streaming-compatible APIs.
 */

import { logger } from '../infra/index.js';

export interface StreamChunk {
  /** Incremental text delta (may be empty) */
  delta: string;
  /** Whether this is the final chunk */
  done: boolean;
  /** Full accumulated content (present on final chunk) */
  content?: string;
  /** Tool calls detected during streaming */
  toolCalls?: StreamToolCall[];
  /** Finish reason */
  finishReason?: string;
  /** Token usage (present on final chunk) */
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export interface StreamToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export type StreamCallback = (chunk: StreamChunk) => void | Promise<void>;

/**
 * Parse an OpenAI-style SSE stream.
 * Each line is either `[DONE]` or `data: {...}`.
 */
export async function* parseOpenAIStream(
  body: ReadableStream<Uint8Array> | NodeJS.ReadableStream,
): AsyncGenerator<StreamChunk> {
  let buffer = '';
  const decoder = new TextDecoder();

  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;

      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') {
        yield { delta: '', done: true, finishReason: 'stop' };
        return;
      }

      try {
        const parsed = JSON.parse(data);
        const choice = parsed.choices?.[0];
        if (!choice) continue;

        const delta = choice.delta?.content || '';
        const toolCalls = choice.delta?.tool_calls;
        const finishReason = choice.finish_reason;

        yield {
          delta,
          done: false,
          toolCalls: toolCalls?.map((tc: any) => ({
            id: tc.id || `tc_${Date.now()}`,
            type: 'function' as const,
            function: {
              name: tc.function?.name || '',
              arguments: tc.function?.arguments || '',
            },
          })),
          finishReason: finishReason || undefined,
        };

        if (finishReason) {
          yield {
            delta: '',
            done: true,
            finishReason,
            usage: parsed.usage
              ? {
                  promptTokens: parsed.usage.prompt_tokens,
                  completionTokens: parsed.usage.completion_tokens,
                  totalTokens: parsed.usage.total_tokens,
                }
              : undefined,
          };
          return;
        }
      } catch {
        // Skip malformed JSON
      }
    }
  }
}

/**
 * Parse an Anthropic-style SSE stream.
 * Events are separated by `\n\n` and have `event:` and `data:` lines.
 */
export async function* parseAnthropicStream(
  body: ReadableStream<Uint8Array> | NodeJS.ReadableStream,
): AsyncGenerator<StreamChunk> {
  let buffer = '';
  const decoder = new TextDecoder();
  let contentBuffer = '';
  const toolCalls: StreamToolCall[] = [];

  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    buffer += decoder.decode(chunk, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const event of events) {
      const lines = event.split('\n');
      let eventType = '';
      let dataStr = '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          dataStr = line.slice(5).trim();
        }
      }

      if (!dataStr) continue;

      try {
        const data = JSON.parse(dataStr);

        switch (eventType) {
          case 'content_block_delta':
            if (data.delta?.type === 'text_delta') {
              contentBuffer += data.delta.text;
              yield { delta: data.delta.text, done: false };
            } else if (data.delta?.type === 'input_json_delta') {
              // Accumulating tool call arguments
              if (toolCalls.length > 0) {
                const last = toolCalls[toolCalls.length - 1];
                last.function.arguments += data.delta.partial_json;
              }
            }
            break;

          case 'content_block_start':
            if (data.content_block?.type === 'tool_use') {
              toolCalls.push({
                id: data.content_block.id || `tc_${Date.now()}`,
                type: 'function',
                function: {
                  name: data.content_block.name || '',
                  arguments: '',
                },
              });
            }
            break;

          case 'message_delta':
            yield {
              delta: '',
              done: true,
              content: contentBuffer,
              toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
              finishReason: data.delta?.stop_reason || 'stop',
              usage: data.usage
                ? {
                    promptTokens: data.usage.input_tokens || 0,
                    completionTokens: data.usage.output_tokens || 0,
                    totalTokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
                  }
                : undefined,
            };
            return;
        }
      } catch {
        // Skip malformed
      }
    }
  }
}

/**
 * Stream a response from a provider and call the callback for each chunk.
 * Returns the full accumulated content.
 */
export async function streamToCallback(
  stream: AsyncGenerator<StreamChunk>,
  callback: StreamCallback,
): Promise<{ content: string; toolCalls?: StreamToolCall[]; finishReason?: string }> {
  let content = '';
  let toolCalls: StreamToolCall[] | undefined;
  let finishReason: string | undefined;

  for await (const chunk of stream) {
    content += chunk.delta;
    if (chunk.toolCalls) toolCalls = chunk.toolCalls;
    if (chunk.finishReason) finishReason = chunk.finishReason;
    await callback(chunk);
  }

  return { content, toolCalls, finishReason };
}

/**
 * Convert a stream into a full string (non-streaming consumer).
 */
export async function streamToString(
  stream: AsyncGenerator<StreamChunk>,
): Promise<string> {
  let content = '';
  for await (const chunk of stream) {
    content += chunk.delta;
  }
  return content;
}

/**
 * SSE response writer for Express.
 * Sets headers and provides a write method.
 */
export function createSSEResponse(res: any) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable nginx buffering
  });

  return {
    write(chunk: StreamChunk): void {
      const data = JSON.stringify(chunk);
      res.write(`data: ${data}\n\n`);
    },
    done(): void {
      res.write('data: [DONE]\n\n');
      res.end();
    },
    error(message: string): void {
      res.write(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`);
      res.end();
    },
  };
}
