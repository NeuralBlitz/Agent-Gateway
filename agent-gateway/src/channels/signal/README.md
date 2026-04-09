# Signal Channel (`src/channels/signal/`)

> **Signal messaging — stub implementation (requires signal-cli integration).**

---

## Overview

The `SignalChannel` class is a **stub implementation** of the `Channel` interface for the Signal messaging platform. It logs all operations but does not actually communicate with the Signal network.

Full Signal support requires integrating with [signal-cli](https://github.com/AsamK/signal-cli), a command-line interface for the Signal protocol that runs as a separate process on your system.

---

## File Structure

```
signal/
└── index.ts    # SignalChannel stub implementation
```

---

## Current Implementation

### Methods (All Stubs)

| Method | Current Behavior |
|--------|-----------------|
| `sendMessage()` | Logs the message content, returns `{ success: false, error: "Signal not configured" }` |
| `sendGroupMessage()` | Logs the group ID and message, returns stub result |
| `joinGroup()` | Logs the group URI, returns null |
| `leaveGroup()` | Logs the group URI, returns null |
| `start()` | No-op (no polling or connection established) |
| `stop()` | No-op (nothing to clean up) |

### Logging

All operations are logged at the `info` level:
```
[Signal] sendMessage called for +1234567890: "Hello"
[Signal] sendGroupMessage called for group-abc: "Hello group!"
```

---

## Why a Stub?

Signal's architecture is fundamentally different from other supported channels:

1. **No official Bot API**: Signal does not provide a REST API or Bot platform
2. **End-to-end encryption**: All messages are E2E encrypted, requiring a local client
3. **Phone number based**: Accounts are tied to phone numbers, not usernames
4. **signal-cli requirement**: The most common approach is to wrap signal-cli via D-Bus or JSON-RPC

---

## Full Integration Path

To implement full Signal support, you would need:

### 1. Install signal-cli

```bash
# Ubuntu/Debian
sudo apt install signal-cli

# Or build from source
git clone https://github.com/AsamK/signal-cli.git
cd signal-cli && ./gradlew installDist
```

### 2. Register a Phone Number

```bash
signal-cli -u +1234567890 register
signal-cli -u +1234567890 verify -c CODE
```

### 3. Run signal-cli as a Daemon

```bash
# JSON-RPC mode
signal-cli -u +1234567890 daemon --json-rpc

# Or D-Bus mode
signal-cli -u +1234567890 daemon
```

### 4. Implement the Adapter

A full adapter would:
- Connect to signal-cli via JSON-RPC (TCP socket) or D-Bus
- Send messages via `send` RPC call
- Receive messages via event subscription
- Handle group management via `joinGroup`/`leaveGroup` RPC calls

### JSON-RPC Protocol Example

```json
// Send a message
{"jsonrpc": "2.0", "method": "send", "params": {"recipient": "+1234567890", "message": "Hello"}, "id": 1}

// Response
{"jsonrpc": "2.0", "result": {"timestamp": 1704067200000}, "id": 1}

// Receive a message (server-pushed)
{"jsonrpc": "2.0", "method": "receive", "params": {"envelope": {...}}}
```

---

## Alternative: signal-cli-rest-api

An easier approach is to use [signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api), which wraps signal-cli in a REST API:

```bash
docker run -d --name signal-api \
  -p 8080:8080 \
  -v signal-cli-config:/home/.local/share/signal-cli \
  bbernhard/signal-cli-rest-api
```

Then the adapter would make HTTP calls to `http://localhost:8080/v2/send`:

```json
{
  "message": "Hello from Agent Gateway!",
  "number": "+1234567890",
  "recipients": ["+0987654321"]
}
```

---

## Use Cases for Signal

Despite being a stub, the Signal channel module serves as:

1. **Placeholder**: Shows Signal is a supported channel type in the registry
2. **Documentation**: Guides users on what's needed for full implementation
3. **Type Safety**: Implements the Channel interface so the type system is satisfied
4. **Testing**: Can be used in tests where a "dumb" channel that always fails is needed

---

## Configuration

Even as a stub, Signal can be "configured" (it just won't do anything):

```json
{
  "channels": {
    "signal": {
      "note": "Signal requires signal-cli integration. See docs."
    }
  }
}
```

---

## Future Work

A full Signal implementation would add these configuration options:

| Parameter | Description |
|-----------|-------------|
| `signalCliUrl` | URL of signal-cli REST API (default: `http://localhost:8080`) |
| `phoneNumber` | Registered Signal phone number |
| `jsonRpcPort` | JSON-RPC TCP port (if using direct connection) |
| `groups` | List of group URIs to auto-join |

And these capabilities:
- ✅ Send/receive individual messages
- ✅ Group chat support
- ✅ Attachment handling (images, documents)
- ✅ Contact list management
- ✅ Profile management

---

## Related Documentation

- [`channels/`](../README.md) — Parent channels module
- [signal-cli GitHub](https://github.com/AsamK/signal-cli) — Signal CLI implementation
- [signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) — REST API wrapper
- [Signal Protocol](https://signal.org/docs/) — Signal protocol documentation
