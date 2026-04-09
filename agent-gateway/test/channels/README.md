# Channel Tests

> **Test suite for messaging channel adapters in Agent Gateway**

This directory contains tests for all messaging channel adapters supported by Agent Gateway. Tests verify channel creation, connection lifecycle, message sending, message receiving, format normalization, error handling, and platform-specific features.

---

## Table of Contents

- [Overview](#overview)
- [Test Scope](#test-scope)
- [Supported Channels](#supported-channels)
- [Test Architecture](#test-architecture)
- [Test Scenarios](#test-scenarios)
- [Mocking Strategy](#mocking-strategy)
- [Running Channel Tests](#running-channel-tests)
- [Message Normalization](#message-normalization)
- [Error Handling Tests](#error-handling-tests)
- [Writing New Channel Tests](#writing-new-channel-tests)
- [Integration Points](#integration-points)

---

## Overview

Location: `/home/runner/workspace/agent-gateway/test/channels/`

Channel adapters translate platform-specific messaging APIs into the unified `Channel` interface. Each channel test file validates the complete lifecycle of a channel adapter from creation through message processing to cleanup.

---

## Test Scope

Each channel test file covers:

| Category | Scenarios |
|----------|-----------|
| **Creation** | Factory function, configuration validation |
| **Connection** | Connect, disconnect, reconnection, timeout |
| **Message Sending** | Text, media, formatted messages |
| **Message Receiving** | Inbound message parsing, normalization |
| **Error Handling** | Network errors, API errors, invalid responses |
| **Events** | Event emission, listener registration |
| **User Info** | getUser, getMe implementations |

---

## Supported Channels

| Channel | Test File | Status |
|---------|-----------|--------|
| **Telegram** | `telegram.test.ts` | Full coverage |
| **Discord** | `discord.test.ts` | Full coverage |
| **Slack** | `slack.test.ts` | Full coverage |
| **WhatsApp** | `whatsapp.test.ts` | Full coverage |
| **Signal** | `signal.test.ts` | Stub tests |
| **Matrix** | `matrix.test.ts` | Full coverage |

---

## Test Architecture

### Common Test Pattern

All channel tests follow a consistent structure:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createChannel } from '/home/runner/workspace/agent-gateway/src/channels/index.js';

describe('TelegramChannel', () => {
  let channel: ReturnType<typeof createChannel>;

  beforeEach(() => {
    channel = createChannel('telegram', { token: 'test-token' });
  });

  afterEach(async () => {
    if (channel.connected) await channel.disconnect();
  });

  describe('creation', () => { /* ... */ });
  describe('connection', () => { /* ... */ });
  describe('messaging', () => { /* ... */ });
  describe('events', () => { /* ... */ });
  describe('errors', () => { /* ... */ });
});
```

---

## Test Scenarios

### Connection Tests

- Connect with valid credentials
- Connect with invalid token (should fail)
- Disconnect cleanly
- Reconnect after disconnection
- Connection timeout handling
- Multiple connect/disconnect cycles

### Message Sending Tests

- Send plain text message
- Send formatted message (Markdown/HTML)
- Send message with attachments
- Send to invalid chat ID (should fail gracefully)
- Send when disconnected (should fail)

### Message Receiving Tests

- Receive text message
- Receive photo message
- Receive document message
- Receive sticker/reaction
- Receive group message
- Normalize all platform formats to standard `ChannelMessage`

### Event Tests

- Subscribe to `message` events
- Subscribe to `connected`/`disconnected` events
- Event handler receives correct payload
- Multiple listeners for same event

---

## Mocking Strategy

### Mock HTTP Client

```typescript
import { vi } from 'vitest';

vi.mock('undici', () => ({
  fetch: vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ ok: true, result: {} }),
  }),
}));
```

### Mock Platform API

Each channel mocks its specific platform API responses:

**Telegram mock**:

```typescript
const telegramMock = {
  getMe: vi.fn().mockResolvedValue({ ok: true, result: { id: 123, username: 'testbot' } }),
  sendMessage: vi.fn().mockResolvedValue({ ok: true, result: { message_id: 1 } }),
  setWebhook: vi.fn().mockResolvedValue({ ok: true }),
};
```

**Discord mock**:

```typescript
const discordMock = {
  login: vi.fn().mockResolvedValue({ id: '123', username: 'testbot' }),
  createMessage: vi.fn().mockResolvedValue({ id: 'msg-1', content: 'Hello' }),
};
```

---

## Running Channel Tests

```bash
cd /home/runner/workspace/agent-gateway

# Run all channel tests
npm run test -- channels

# Run specific channel tests
npm run test -- channels/telegram.test.ts
npm run test -- channels/discord.test.ts

# Run with coverage for channel modules
npm run test:coverage -- --include "src/channels/**"
```

---

## Message Normalization

All channels normalize inbound messages to the standard format:

```typescript
interface ChannelMessage {
  channel: string;
  chatId: string;
  userId: string;
  content: string;
  type: 'text' | 'image' | 'document' | 'sticker' | 'video' | 'audio' | 'location';
  timestamp: number;
  attachments?: Array<{ url: string; type: string }>;
  replyTo?: string;
  metadata?: Record<string, any>;
}
```

Tests verify that each channel correctly transforms platform-specific message formats to this standard format.

### Normalization Test Examples

```typescript
it('should normalize a Telegram text message', () => {
  const platformMessage = {
    message_id: 1,
    from: { id: 12345, username: 'user1' },
    chat: { id: 67890 },
    text: 'Hello bot!',
    date: 1712345678,
  };

  const normalized = telegramChannel.normalize(platformMessage);

  expect(normalized).toEqual({
    channel: 'telegram',
    chatId: '67890',
    userId: '12345',
    content: 'Hello bot!',
    type: 'text',
    timestamp: 1712345678000,
  });
});
```

---

## Error Handling Tests

### Network Errors

```typescript
it('should handle network timeout', async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new Error('Network timeout'));

  await expect(channel.sendMessage('123', 'Hello')).rejects.toThrow();
  expect(channel.connected).toBe(true); // Connection should survive
});
```

### API Errors

```typescript
it('should handle 401 Unauthorized', async () => {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: false,
    status: 401,
    json: () => Promise.resolve({ error: 'Unauthorized' }),
  });

  await expect(channel.connect()).rejects.toThrow();
});
```

### Reconnection

```typescript
it('should reconnect after connection loss', async () => {
  await channel.connect();
  // Simulate connection loss
  await channel.disconnect();
  // Reconnect should succeed
  await channel.connect();
  expect(channel.connected).toBe(true);
});
```

---

## Writing New Channel Tests

### Checklist

- [ ] Test channel creation with valid config
- [ ] Test channel creation with invalid config (should fail)
- [ ] Test successful connection
- [ ] Test failed connection with bad credentials
- [ ] Test disconnection
- [ ] Test message sending (text)
- [ ] Test message sending with media
- [ ] Test message receiving and normalization
- [ ] Test event emission
- [ ] Test error handling (network, API, timeout)
- [ ] Test reconnection behavior
- [ ] Test getUser/getMe implementations

### Template

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createChannel } from '/home/runner/workspace/agent-gateway/src/channels/index.js';

describe('MyChannelAdapter', () => {
  let channel: ReturnType<typeof createChannel>;

  beforeEach(() => {
    channel = createChannel('mychannel', { token: 'test' });
  });

  afterEach(async () => {
    await channel.disconnect?.();
  });

  describe('creation', () => {
    it('should create with valid config', () => {
      expect(channel).toBeDefined();
      expect(channel.id).toBe('mychannel');
    });
  });

  describe('connection', () => {
    it('should connect successfully', async () => {
      await channel.connect();
      expect(channel.connected).toBe(true);
    });
  });

  describe('messaging', () => {
    it('should send text messages', async () => {
      await channel.connect();
      await channel.sendMessage('chat1', 'Hello');
      // Verify mock was called
    });
  });
});
```

---

## Integration Points

The channel tests validate integration with:

| Component | Integration |
|-----------|-------------|
| **Gateway** | Channel registration and lifecycle |
| **Event Bus** | Message event emission |
| **Hook System** | before/after message hooks |
| **Session Manager** | Session lookup by channel+userId |
| **Auto-Reply** | Inbound message triggers reply pipeline |
| **Observability** | Message metrics recording |
| **Webhook Server** | Webhook endpoint for inbound messages |
