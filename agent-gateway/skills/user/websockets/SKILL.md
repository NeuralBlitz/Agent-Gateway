---
name: websockets
description: WebSocket implementation and best practices
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: real-time
---
## What I do
- Implement WebSocket connections
- Handle real-time bidirectional communication
- Manage connection lifecycle
- Implement authentication
- Handle reconnection
- Message framing and protocols
- Scale WebSocket connections
- Monitor and debug

## When to use me
When implementing real-time features with WebSockets.

## WebSocket Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        Client                                    │
│  ┌─────────┐    ┌──────────┐    ┌─────────┐                    │
│  │Socket.io│◄──►│Reconnect │◄──►│Protocol │                    │
│  │ Client  │    │ Logic    │    │Parser   │                    │
│  └─────────┘    └──────────┘    └─────────┘                    │
└────────────────────────────┬────────────────────────────────────┘
                             │ WebSocket
┌────────────────────────────▼────────────────────────────────────┐
│                      Load Balancer                              │
│                    (Sticky Sessions)                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ WebSocket   │     │ WebSocket   │     │ WebSocket   │
│ Server 1    │     │ Server 2    │     │ Server 3    │
└─────────────┘     └─────────────┘     └─────────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                    ┌────────▼────────┐
                    │ Message Broker  │
                    │ (Redis Pub/Sub) │
                    └─────────────────┘
```

## Python WebSocket Server
```python
import asyncio
import json
from typing import Dict, Set
from dataclasses import dataclass, field
from enum import Enum


class MessageType(Enum):
    # Client → Server
    SUBSCRIBE = "subscribe"
    UNSUBSCRIBE = "unsubscribe"
    SEND_MESSAGE = "send_message"
    
    # Server → Client
    WELCOME = "welcome"
    MESSAGE = "message"
    ERROR = "error"
    SUBSCRIBED = "subscribed"
    UNSUBSCRIBED = "unsubscribed"


@dataclass
class Client:
    id: str
    websocket: asyncio.WebSocketConnection
    subscriptions: Set[str] = field(default_factory=set)


class WebSocketServer:
    """WebSocket server with subscriptions and broadcasting."""
    
    def __init__(self) -> None:
        self.clients: Dict[str, Client] = {}
        self.subscriptions: Dict[str, Set[str]] = {}  # topic -> client IDs
    
    async def handle_client(
        self,
        websocket: asyncio.WebSocketConnection,
        client_id: str
    ) -> None:
        """Handle individual client connection."""
        client = Client(id=client_id, websocket=websocket)
        self.clients[client_id] = client
        
        # Send welcome message
        await self.send_message(
            client,
            MessageType.WELCOME.value,
            {"client_id": client_id}
        )
        
        try:
            async for message in websocket:
                await self.handle_message(client, message)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"Error handling client {client_id}: {e}")
        finally:
            await self.disconnect(client)
    
    async def handle_message(
        self,
        client: Client,
        raw_message: str
    ) -> None:
        """Process incoming message."""
        try:
            message = json.loads(raw_message)
            msg_type = message.get("type")
            payload = message.get("payload", {})
            
            if msg_type == MessageType.SUBSCRIBE.value:
                await self.subscribe(client, payload.get("topic"))
            elif msg_type == MessageType.UNSUBSCRIBE.value:
                await self.unsubscribe(client, payload.get("topic"))
            elif msg_type == MessageType.SEND_MESSAGE.value:
                await self.send_to_topic(
                    payload.get("topic"),
                    payload.get("message")
                )
            else:
                await self.send_error(client, f"Unknown message type: {msg_type}")
        
        except json.JSONDecodeError:
            await self.send_error(client, "Invalid JSON")
    
    async def subscribe(self, client: Client, topic: str) -> None:
        """Subscribe client to a topic."""
        if topic not in self.subscriptions:
            self.subscriptions[topic] = set()
        
        self.subscriptions[topic].add(client.id)
        client.subscriptions.add(topic)
        
        await self.send_message(
            client,
            MessageType.SUBSCRIBED.value,
            {"topic": topic}
        )
    
    async def unsubscribe(self, client: Client, topic: str) -> None:
        """Unsubscribe from a topic."""
        if topic in self.subscriptions:
            self.subscriptions[topic].discard(client.id)
        
        client.subscriptions.discard(topic)
        
        await self.send_message(
            client,
            MessageType.UNSUBSCRIBED.value,
            {"topic": topic}
        )
    
    async def send_to_topic(
        self,
        topic: str,
        message: dict
    ) -> None:
        """Broadcast message to all subscribers of a topic."""
        if topic not in self.subscriptions:
            return
        
        payload = {
            "type": MessageType.MESSAGE.value,
            "payload": {
                "topic": topic,
                "message": message,
            }
        }
        
        # Send to all subscribers
        for client_id in self.subscriptions[topic]:
            if client_id in self.clients:
                await self.send_message_json(
                    self.clients[client_id],
                    payload
                )
    
    async def send_message(
        self,
        client: Client,
        msg_type: str,
        payload: dict
    ) -> None:
        """Send message to client."""
        await self.send_message_json(client, {
            "type": msg_type,
            "payload": payload,
        })
    
    async def send_message_json(
        self,
        client: Client,
        message: dict
    ) -> None:
        """Send JSON message to client."""
        try:
            await client.websocket.send(json.dumps(message))
        except Exception as e:
            print(f"Error sending to {client.id}: {e}")
            await self.disconnect(client)
    
    async def send_error(self, client: Client, error: str) -> None:
        """Send error message to client."""
        await self.send_message(
            client,
            MessageType.ERROR.value,
            {"error": error}
        )
    
    async def disconnect(self, client: Client) -> None:
        """Handle client disconnection."""
        # Unsubscribe from all topics
        for topic in list(client.subscriptions):
            if topic in self.subscriptions:
                self.subscriptions[topic].discard(client.id)
        
        # Remove from clients
        self.clients.pop(client.id, None)
        
        # Close connection
        try:
            await client.websocket.close()
        except Exception:
            pass
```

## Socket.IO Implementation
```typescript
// Server-side (Node.js)
import { Server } from 'socket.io';


const io = new Server(3000, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});


// Authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication required'));
  }
  
  try {
    const user = verifyToken(token);
    socket.user = user;
    next();
  } catch (e) {
    next(new Error('Invalid token'));
  }
});


io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.id}`);
  
  // Join rooms
  socket.on('join:room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user:joined', {
      userId: socket.user.id,
      roomId,
    });
  });
  
  // Leave rooms
  socket.on('leave:room', (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit('user:left', {
      userId: socket.user.id,
      roomId,
    });
  });
  
  // Handle events
  socket.on('message:send', (data) => {
    const { roomId, content } = data;
    
    const message = {
      id: generateId(),
      content,
      userId: socket.user.id,
      timestamp: new Date().toISOString(),
    };
    
    // Broadcast to room
    io.to(roomId).emit('message:received', message);
  });
  
  // Typing indicators
  socket.on('typing:start', (roomId) => {
    socket.to(roomId).emit('user:typing', {
      userId: socket.user.id,
      isTyping: true,
    });
  });
  
  socket.on('typing:stop', (roomId) => {
    socket.to(roomId).emit('user:typing', {
      userId: socket.user.id,
      isTyping: false,
    });
  });
  
  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${socket.user.id}, reason: ${reason}`);
    
    // Notify rooms
    socket.rooms.forEach((roomId) => {
      if (roomId !== socket.id) {
        socket.to(roomId).emit('user:left', {
          userId: socket.user.id,
          roomId,
        });
      }
    });
  });
});
```

## Client Implementation
```typescript
// Client-side (React)
import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';


interface UseSocketOptions {
  url: string;
  token: string;
  autoConnect?: boolean;
}


export function useSocket({
  url,
  token,
  autoConnect = true,
}: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  
  useEffect(() => {
    socketRef.current = io(url, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to WebSocket server');
    });
    
    socketRef.current.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('Disconnected:', reason);
    });
    
    socketRef.current.on('message:received', (message) => {
      setLastMessage(message);
    });
    
    if (autoConnect) {
      socketRef.current.connect();
    }
    
    return () => {
      socketRef.current?.disconnect();
    };
  }, [url, token, autoConnect]);
  
  const joinRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('join:room', roomId);
  }, []);
  
  const leaveRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('leave:room', roomId);
  }, []);
  
  const sendMessage = useCallback((roomId: string, content: string) => {
    socketRef.current?.emit('message:send', { roomId, content });
  }, []);
  
  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    socketRef.current?.on(event, callback);
    return () => {
      socketRef.current?.off(event, callback);
    };
  }, []);
  
  return {
    isConnected,
    lastMessage,
    joinRoom,
    leaveRoom,
    sendMessage,
    on,
    socket: socketRef.current,
  };
}
```

## Scaling WebSockets
```python
# Using Redis Pub/Sub for horizontal scaling
import aioredis
import json


class RedisPubSubManager:
    """Redis Pub/Sub for multi-instance WebSocket scaling."""
    
    def __init__(self, redis_url: str) -> None:
        self.redis = aioredis.from_url(redis_url)
        self.pubsub = self.redis.pubsub()
        self.subscriptions: Dict[str, Set[str]] = {}
        self.client_messages: asyncio.Queue = asyncio.Queue()
    
    async def subscribe(self, topic: str, server_id: str) -> None:
        """Subscribe to topic across all servers."""
        await self.redis.subscribe(topic)
        
        if topic not in self.subscriptions:
            self.subscriptions[topic] = set()
        
        self.subscriptions[topic].add(server_id)
    
    async def publish(self, topic: str, message: dict) -> None:
        """Publish message to topic."""
        await self.redis.publish(
            topic,
            json.dumps({
                'server_id': self.server_id,
                'message': message,
            })
        )
    
    async def handle_messages(self) -> None:
        """Handle incoming pub/sub messages."""
        async for message in self.pubsub.listen():
            if message['type'] == 'message':
                data = json.loads(message['data'])
                
                # If from another server, relay to local clients
                if data['server_id'] != self.server_id:
                    await self.relay_to_local_clients(
                        message['channel'],
                        data['message']
                    )
```

## Best Practices
```
1. Use secure WebSockets (wss://)
   Always use TLS in production

2. Authenticate connections
   Validate tokens on connection

3. Implement heartbeat/ping
   Detect dead connections quickly

4. Handle reconnection
   Exponential backoff with jitter

5. Limit connection lifetime
   Require re-authentication periodically

6. Scale horizontally
   Use Redis Pub/Sub for broadcasting

7. Monitor connections
   Track connection counts, message rates

8. Set message size limits
   Prevent memory exhaustion

9. Handle backpressure
   Don't overwhelm slow clients

10. Graceful shutdown
    Notify clients before disconnecting
```
