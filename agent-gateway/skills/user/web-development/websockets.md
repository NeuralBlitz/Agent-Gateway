---
name: websockets
description: WebSocket implementation and best practices
category: web-development
---

# WebSockets

## What I Do

WebSockets provide a full-duplex communication channel over a single TCP connection. Unlike HTTP's request-response model, WebSockets allow servers to push data to clients and vice versa without polling. The connection starts with an HTTP handshake and upgrades to the WebSocket protocol, remaining open for the session duration.

I excel at real-time applications including chat systems, live updates, collaborative editing, gaming, and notifications. WebSockets eliminate the overhead of HTTP headers for each message, making them efficient for high-frequency communication. The persistent connection enables bidirectional data flow with low latency.

## When to Use Me

Choose WebSockets for applications requiring real-time bidirectional communication. I am ideal for chat applications, live dashboards, multiplayer games, collaborative tools, and notification systems. WebSockets work well when clients need immediate updates without polling overhead. Avoid WebSockets for simple request-response patterns where REST would suffice, or when working through proxies that don't support WebSocket upgrades.

## Core Concepts

WebSocket connections start with an HTTP Upgrade request with the Sec-WebSocket-Key header. Servers respond with 101 Switching Protocols to confirm the upgrade. Frames carry messages, with text and binary types for different data. The opening handshake validates the connection through Sec-WebSocket-Accept.

Heartbeat messages detect connection health through ping-pong frames. Subprotocols negotiate application-level protocols. The close frame terminates connections gracefully. Message fragmentation splits large messages across frames. Extensions provide compression and other capabilities.

## Code Examples

```javascript
// WebSocket server using ws library
const WebSocket = require('ws');
const http = require('http');
const jwt = require('jsonwebtoken');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const clients = new Map();

wss.on('connection', (ws, req) => {
  const clientId = generateId();
  const clientIp = req.socket.remoteAddress;
  
  ws.clientId = clientId;
  ws.isAlive = true;
  
  ws.on('pong', () => {
    ws.isAlive = true;
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      handleMessage(ws, clientId, message);
    } catch (err) {
      sendError(ws, 'Invalid message format');
    }
  });
  
  ws.on('close', (code, reason) => {
    console.log(`Client ${clientId} disconnected: ${code} - ${reason}`);
    clients.delete(clientId);
    broadcastUserList();
  });
  
  ws.on('error', (err) => {
    console.error(`Client ${clientId} error:`, err.message);
  });
  
  clients.set(clientId, { ws, joinedAt: new Date() });
  
  send(ws, {
    type: 'welcome',
    payload: {
      clientId,
      timestamp: new Date().toISOString()
    }
  });
  
  broadcastUserList();
});

function handleMessage(ws, clientId, message) {
  switch (message.type) {
    case 'auth':
      handleAuth(ws, clientId, message.payload);
      break;
    case 'ping':
      send(ws, { type: 'pong', timestamp: Date.now() });
      break;
    case 'chat':
      broadcast({
        type: 'chat',
        payload: {
          from: clientId,
          content: message.payload.content,
          timestamp: new Date().toISOString()
        }
      });
      break;
    case 'subscribe':
      ws.subscriptions = new Set([...message.payload.channels]);
      send(ws, {
        type: 'subscribed',
        payload: { channels: Array.from(ws.subscriptions) }
      });
      break;
    default:
      sendError(ws, `Unknown message type: ${message.type}`);
  }
}

function handleAuth(ws, clientId, payload) {
  try {
    const decoded = jwt.verify(payload.token, process.env.JWT_SECRET);
    ws.userId = decoded.userId;
    ws.isAuthenticated = true;
    
    send(ws, {
      type: 'auth_success',
      payload: { userId: decoded.userId }
    });
  } catch (err) {
    sendError(ws, 'Authentication failed');
  }
}

function broadcast(message) {
  const data = JSON.stringify(message);
  clients.forEach(({ ws }) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });
}

function broadcastUserList() {
  const userList = Array.from(clients.entries()).map(([id, data]) => ({
    id,
    joinedAt: data.joinedAt.toISOString()
  }));
  
  broadcast({
    type: 'users',
    payload: { users: userList, count: clients.size }
  });
}

function send(ws, message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function sendError(ws, error) {
  send(ws, {
    type: 'error',
    payload: { message: error }
  });
}

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

// Heartbeat interval
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});

server.listen(8080, () => {
  console.log('WebSocket server running on ws://localhost:8080');
});
```

```javascript
// WebSocket client
class WebSocketClient {
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;
    this.handlers = new Map();
    this.messageQueue = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }
  
  connect(token) {
    return new Promise((resolve, reject) => {
      this.token = token;
      
      this.ws = new WebSocket(this.url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      this.ws.onopen = () => {
        console.log('Connected');
        this.reconnectAttempts = 0;
        this.flushQueue();
        resolve();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log('Disconnected:', event.code, event.reason);
        this.handleDisconnect();
      };
      
      this.ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        reject(err);
      };
    });
  }
  
  handleMessage(message) {
    const handlers = this.handlers.get(message.type) || [];
    handlers.forEach(handler => handler(message.payload));
  }
  
  on(type, handler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type).push(handler);
  }
  
  off(type, handler) {
    const handlers = this.handlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    }
  }
  
  send(type, payload) {
    const message = { type, payload };
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }
  
  flushQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.ws.send(JSON.stringify(message));
    }
  }
  
  handleDisconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Reconnecting in ${delay}ms...`);
      
      setTimeout(() => {
        this.connect(this.token).catch(console.error);
      }, delay);
    }
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
    }
  }
}

// Usage
const client = new WebSocketClient('ws://localhost:8080');

client.on('welcome', (payload) => {
  console.log('Welcome:', payload);
});

client.on('chat', (payload) => {
  console.log(`${payload.from}: ${payload.content}`);
});

client.on('users', (payload) => {
  console.log(`Online users: ${payload.count}`);
});

await client.connect('your-jwt-token');

client.send('subscribe', { channels: ['general', 'alerts'] });

client.send('chat', { content: 'Hello, world!' });

setTimeout(() => client.disconnect(), 60000);
```

## Best Practices

Implement heartbeat/ping-pong to detect dead connections. Handle reconnection with exponential backoff. Authenticate during the WebSocket upgrade handshake. Validate and sanitize all incoming messages. Use message queues during disconnections.

Set message size limits to prevent memory issues. Close connections gracefully with proper codes. Log connection events for monitoring. Use compression for large message streams. Separate concerns with message handlers and routing.

## Common Patterns

The pub/sub pattern routes messages based on topics or channels. The event sourcing pattern stores all messages for replay capability. The command pattern treats messages as commands with handlers. The gateway pattern routes WebSocket connections through edge services.

The multiplexing pattern uses subprotocols or message prefixes for channel separation. The room pattern groups clients into rooms for targeted messaging. The presence pattern tracks and broadcasts user online status. The typing indicator pattern broadcasts real-time typing state.
