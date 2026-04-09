---
name: http-https
description: HTTP/HTTPS protocol implementation and best practices
category: networking
difficulty: intermediate
tags: [http, https, protocol, web, rest]
author: OpenCode Community
version: 1.0
last_updated: 2024-01-15
---

# HTTP/HTTPS Protocols

## What I Do

I am HTTP/HTTPS, the application layer protocol enabling communication between clients and servers on the World Wide Web. I define the rules for requesting and transferring web resources through methods (GET, POST, PUT, DELETE, etc.), status codes, headers, and message bodies. HTTPS adds Transport Layer Security (TLS) encryption to protect data in transit. I support persistent connections, chunked transfer encoding, content negotiation, and caching mechanisms. HTTP/2 and HTTP/3 introduce multiplexing, header compression, and server push for improved performance. I form the foundation for RESTful APIs, web services, and modern web applications.

## When to Use Me

- Building RESTful APIs and web services
- Client-server communication in web applications
- Implementing microservices architecture
- Webhook and callback integrations
- File upload and download services
- Real-time communication (WebSocket, Server-Sent Events)
- API authentication and authorization
- Content delivery and caching strategies

## Core Concepts

**HTTP Methods**: GET (retrieve), POST (create), PUT (update), PATCH (partial update), DELETE (remove).

**Status Codes**: 1xx (informational), 2xx (success), 3xx (redirection), 4xx (client error), 5xx (server error).

**Headers**: Metadata controlling caching, authentication, content type, and request behavior.

**Body/Payload**: Request or response content in various formats (JSON, XML, multipart, streaming).

**Cookies and Sessions**: State management across HTTP requests.

**Caching**: Headers (Cache-Control, ETag, Last-Modified) controlling response caching.

**Content Negotiation**: Headers (Accept, Accept-Language) for format and language preferences.

**HTTPS/TLS**: Encryption, certificate validation, and secure communication.

## Code Examples

### Example 1: HTTP Client with Retry and Circuit Breaker (Go)
```go
package main

import (
    "context"
    "encoding/json"
    "fmt"
    "io"
    "log"
    "math"
    "net/http"
    "sync"
    "time"
)

type HTTPClient struct {
    client          *http.Client
    baseURL         string
    defaultTimeout  time.Duration
    retryConfig     RetryConfig
    circuitBreaker  *CircuitBreaker
}

type RetryConfig struct {
    MaxRetries     int
    InitialDelay   time.Duration
    MaxDelay       time.Duration
    Multiplier     float64
}

type CircuitBreaker struct {
    name            string
    failureCount    int
    failureThreshold int
    resetTimeout    time.Duration
    lastFailure     time.Time
    state           string // closed, open, half-open
    mutex           sync.RWMutex
}

func NewHTTPClient(baseURL string, timeout time.Duration) *HTTPClient {
    return &HTTPClient{
        client: &http.Client{
            Timeout: timeout,
            Transport: &http.Transport{
                MaxIdleConns:        100,
                MaxIdleConnsPerHost:  10,
                IdleConnTimeout:      90 * time.Second,
                MaxConnsPerHost:      100,
            },
        },
        baseURL:        baseURL,
        defaultTimeout: timeout,
        retryConfig: RetryConfig{
            MaxRetries:   3,
            InitialDelay: 100 * time.Millisecond,
            MaxDelay:      10 * time.Second,
            Multiplier:    2.0,
        },
        circuitBreaker: &CircuitBreaker{
            name:            "http-circuit-breaker",
            failureThreshold: 5,
            resetTimeout:    30 * time.Second,
            state:           "closed",
        },
    }
}

func (c *HTTPClient) Get(ctx context.Context, endpoint string, headers map[string]string) (*HTTPResponse, error) {
    return c.doRequest(ctx, http.MethodGet, endpoint, nil, headers)
}

func (c *HTTPClient) Post(ctx context.Context, endpoint string, body interface{}, headers map[string]string) (*HTTPResponse, error) {
    return c.doRequest(ctx, http.MethodPost, endpoint, body, headers)
}

func (c *HTTPClient) Put(ctx context.Context, endpoint string, body interface{}, headers map[string]string) (*HTTPResponse, error) {
    return c.doRequest(ctx, http.MethodPut, endpoint, body, headers)
}

func (c *HTTPClient) Delete(ctx context.Context, endpoint string, headers map[string]string) (*HTTPResponse, error) {
    return c.doRequest(ctx, http.MethodDelete, endpoint, nil, headers)
}

func (c *HTTPClient) doRequest(ctx context.Context, method, endpoint string, body interface{}, headers map[string]string) (*HTTPResponse, error) {
    if !c.circuitBreaker.canExecute() {
        return nil, fmt.Errorf("circuit breaker is open")
    }
    
    var bodyReader io.Reader
    if body != nil {
        jsonBody, err := json.Marshal(body)
        if err != nil {
            return nil, fmt.Errorf("failed to marshal request body: %w", err)
        }
        bodyReader = bytes.NewReader(jsonBody)
        if headers == nil {
            headers = make(map[string]string)
        }
        headers["Content-Type"] = "application/json"
    }
    
    url := c.baseURL + endpoint
    req, err := http.NewRequestWithContext(ctx, method, url, bodyReader)
    if err != nil {
        return nil, fmt.Errorf("failed to create request: %w", err)
    }
    
    for key, value := range headers {
        req.Header.Set(key, value)
    }
    
    var lastErr error
    var response *http.Response
    
    delay := c.retryConfig.InitialDelay
    
    for attempt := 0; attempt <= c.retryConfig.MaxRetries; attempt++ {
        response, lastErr = c.client.Do(req)
        
        if lastErr == nil {
            break
        }
        
        if attempt == c.retryConfig.MaxRetries {
            c.circuitBreaker.recordFailure()
            return nil, fmt.Errorf("request failed after %d attempts: %w", c.retryConfig.MaxRetries, lastErr)
        }
        
        select {
        case <-ctx.Done():
            return nil, ctx.Err()
        case <-time.After(delay):
        }
        
        delay = time.Duration(float64(delay) * c.retryConfig.Multiplier)
        delay = time.Duration(math.Min(float64(delay), float64(c.retryConfig.MaxDelay)))
    }
    
    defer response.Body.Close()
    
    responseBody, err := io.ReadAll(response.Body)
    if err != nil {
        return nil, fmt.Errorf("failed to read response body: %w", err)
    }
    
    httpResponse := &HTTPResponse{
        StatusCode: response.StatusCode,
        Headers:    response.Header,
        Body:       responseBody,
    }
    
    if response.StatusCode >= 400 {
        c.circuitBreaker.recordFailure()
        return httpResponse, fmt.Errorf("HTTP error %d: %s", response.StatusCode, string(responseBody))
    }
    
    c.circuitBreaker.recordSuccess()
    return httpResponse, nil
}

func (cb *CircuitBreaker) canExecute() bool {
    cb.mutex.RLock()
    defer cb.mutex.RUnlock()
    
    if cb.state == "open" {
        if time.Since(cb.lastFailure) > cb.resetTimeout {
            cb.mutex.RUnlock()
            cb.mutex.Lock()
            cb.state = "half-open"
            cb.mutex.Unlock()
            cb.mutex.RLock()
        }
    }
    return cb.state != "open"
}

func (cb *CircuitBreaker) recordFailure() {
    cb.mutex.Lock()
    defer cb.mutex.Unlock()
    
    cb.failureCount++
    cb.lastFailure = time.Now()
    
    if cb.failureCount >= cb.failureThreshold {
        cb.state = "open"
    }
}

func (cb *CircuitBreaker) recordSuccess() {
    cb.mutex.Lock()
    defer cb.mutex.Unlock()
    
    cb.failureCount = 0
    cb.state = "closed"
}

type HTTPResponse struct {
    StatusCode int
    Headers    http.Header
    Body       []byte
}

func (r *HTTPResponse) UnmarshalJSON(v interface{}) error {
    return json.Unmarshal(r.Body, v)
}
```

### Example 2: Middleware-Based HTTP Server (Node.js)
```javascript
const http = require('http');

class HTTPMiddleware {
    constructor() {
        this.middleware = [];
    }
    
    use(fn) {
        this.middleware.push(fn);
        return this;
    }
    
    async handle(request, response) {
        const context = {
            request,
            response,
            state: {},
            status: 200
        };
        
        for (const fn of this.middleware) {
            await fn(context);
            
            if (context.response.writableEnded) {
                return;
            }
            
            if (context.status >= 400) {
                break;
            }
        }
        
        if (!context.response.writableEnded) {
            response.statusCode = context.status;
            response.end(JSON.stringify(context.body || {}));
        }
    }
}

class HTTPServer {
    constructor(port = 3000) {
        this.port = port;
        this.middleware = new HTTPMiddleware();
        this.routes = new Map();
        this.server = null;
    }
    
    use(fn) {
        this.middleware.use(fn);
        return this;
    }
    
    get(path, handler) {
        this.addRoute('GET', path, handler);
        return this;
    }
    
    post(path, handler) {
        this.addRoute('POST', path, handler);
        return this;
    }
    
    put(path, handler) {
        this.addRoute('PUT', path, handler);
        return this;
    }
    
    delete(path, handler) {
        this.addRoute('DELETE', path, handler);
        return this;
    }
    
    addRoute(method, path, handler) {
        const pattern = this.pathToRegex(path);
        this.routes.set(`${method}:${pattern}`, { pattern, handler });
    }
    
    pathToRegex(path) {
        const pattern = path
            .replace(/\//g, '\\/')
            .replace(/:(\w+)/g, '(?<$1>[^/]+)');
        return new RegExp(`^${pattern}$`);
    }
    
    findRoute(method, path) {
        for (const [key, route] of this.routes) {
            const [routeMethod, pattern] = key.split(':');
            if (routeMethod !== method) continue;
            
            const match = path.match(pattern);
            if (match) {
                return { handler: route.handler, params: match.groups };
            }
        }
        return null;
    }
    
    async handleRequest(req, res) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const route = this.findRoute(req.method, url.pathname);
        
        const context = {
            request: req,
            response: res,
            method: req.method,
            path: url.pathname,
            query: Object.fromEntries(url.searchParams),
            params: route?.params || {},
            body: null,
            status: 200
        };
        
        // Parse body for POST/PUT
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            await this.parseBody(req);
            context.body = req.body;
        }
        
        // Run middleware
        for (const fn of this.middleware.middleware) {
            await fn(context);
            if (res.writableEnded) return;
        }
        
        // Handle route
        if (route) {
            await route.handler(context);
        } else {
            context.status = 404;
            context.body = { error: 'Not Found' };
            res.statusCode = 404;
            res.end(JSON.stringify(context.body));
        }
    }
    
    async parseBody(req) {
        return new Promise((resolve) => {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
                try {
                    req.body = JSON.parse(body || '{}');
                } catch {
                    req.body = {};
                }
                resolve();
            });
        });
    }
    
    listen() {
        this.server = http.createServer(this.handleRequest.bind(this));
        this.server.listen(this.port, () => {
            console.log(`Server running on port ${this.port}`);
        });
        return this.server;
    }
}

// Usage
const app = new HTTPServer(3000);

// Logging middleware
app.use(async (ctx) => {
    console.log(`${ctx.method} ${ctx.path} - ${ctx.status}`);
});

// CORS middleware
app.use(async (ctx) => {
    ctx.response.setHeader('Access-Control-Allow-Origin', '*');
    ctx.response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    ctx.response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
});

// Auth middleware
app.use(async (ctx) => {
    const auth = ctx.request.headers.authorization;
    if (!auth && !ctx.request.url.includes('/public')) {
        ctx.status = 401;
        ctx.body = { error: 'Unauthorized' };
    }
});

// Routes
app.get('/api/users', async (ctx) => {
    ctx.body = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
});

app.get('/api/users/:id', async (ctx) => {
    ctx.body = { id: ctx.params.id, name: `User ${ctx.params.id}` };
});

app.post('/api/users', async (ctx) => {
    ctx.body = { id: 3, ...ctx.body };
    ctx.status = 201;
});

app.listen();
```

### Example 3: Secure HTTPS Server with TLS (Python)
```python
import ssl
import http.server
import socketserver
import json
import os
from urllib.parse import urlparse, parse_qs
from typing import Dict, Any, Optional
from datetime import datetime

class HTTPSServer:
    def __init__(
        self,
        host: str = '0.0.0.0',
        port: int = 8443,
        cert_path: str = 'cert.pem',
        key_path: str = 'key.pem'
    ):
        self.host = host
        self.port = port
        self.cert_path = cert_path
        self.key_path = key_path
        self.routes: Dict[str, Dict[str, Any]] = {}
        self.middleware: list = []
        
    def route(self, path: str, methods: list = ['GET']):
        def decorator(func):
            self.routes[f"{methods[0]}:{path}"] = {
                'handler': func,
                'methods': methods
            }
            return func
        return decorator
    
    def use(self, middleware_func):
        self.middleware.append(middleware_func)
        return middleware_func
    
    def create_ssl_context(self) -> ssl.SSLContext:
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(self.cert_path, self.key_path)
        context.minimum_version = ssl.TLSVersion.TLSv1_3
        context.set_alpn_protocols(['h2', 'http/1.1'])
        context.options |= ssl.OP_NO_TLSv1 | ssl.OP_NO_TLSv1_1 | ssl.OP_NO_TLSv1_2
        return context
    
    def run(self):
        context = self.create_ssl_context()
        
        class RequestHandler(http.server.BaseHTTPRequestHandler):
            def log_message(self, format, *args):
                print(f"[{datetime.now().isoformat()}] {args[0]}")
            
            def do_method(self, method: str):
                parsed = urlparse(self.path)
                path = parsed.path
                query = parse_qs(parsed.query)
                
                handler_key = f"{method}:{path}"
                if handler_key not in self.server.routes:
                    self.send_error(404, 'Not Found')
                    return
                
                route = self.server.routes[handler_key]
                if method not in route['methods']:
                    self.send_error(405, 'Method Not Allowed')
                    return
                
                try:
                    # Read request body
                    content_length = int(self.headers.get('Content-Length', 0))
                    body = self.rfile.read(content_length) if content_length > 0 else None
                    
                    request_context = {
                        'method': method,
                        'path': path,
                        'query': query,
                        'body': json.loads(body.decode('utf-8')) if body else None,
                        'headers': dict(self.headers),
                        'params': {}
                    }
                    
                    # Run middleware
                    for middleware in self.server.middleware:
                        result = middleware(request_context)
                        if result and 'response' in result:
                            self.send_json_response(result['response'])
                            return
                    
                    # Handle route
                    response = route['handler'](request_context)
                    self.send_json_response(response)
                    
                except Exception as e:
                    self.send_json_response({'error': str(e)}, status=500)
            
            def do_GET(self):
                self.do_method('GET')
            
            def do_POST(self):
                self.do_method('POST')
            
            def do_PUT(self):
                self.do_method('PUT')
            
            def do_DELETE(self):
                self.do_method('DELETE')
            
            def send_json_response(self, data: dict, status: int = 200):
                response_body = json.dumps(data, default=str).encode('utf-8')
                self.send_response(status)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', len(response_body))
                self.send_header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
                self.end_headers()
                self.wfile.write(response_body)
        
        socketserver.TCPServer.allow_reuse_address = True
        with socketserver.TCPServer((self.host, self.port), RequestHandler) as httpd:
            httpd.routes = self.routes
            httpd.middleware = self.middleware
            print(f"HTTPS Server running on https://{self.host}:{self.port}")
            httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
            httpd.serve_forever()


# Usage
app = HTTPSServer(host='0.0.0.0', port=8443)

# Middleware
@app.use
def cors_middleware(request):
    if 'Origin' in request['headers']:
        return {
            'response': {
                'headers': {
                    'Access-Control-Allow-Origin': request['headers']['Origin'],
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                }
            }
        }

@app.use
def auth_middleware(request):
    protected_paths = ['/api/admin', '/api/users']
    if any(request['path'].startswith(p) for p in protected_paths):
        auth = request['headers'].get('Authorization', '')
        if not auth.startswith('Bearer '):
            return {'response': {'error': 'Unauthorized'}, 'status': 401}

# Routes
@app.route('/api/health', methods=['GET'])
def health_check(request):
    return {'status': 'healthy', 'timestamp': datetime.now().isoformat()}

@app.route('/api/users', methods=['GET'])
def get_users(request):
    return [{'id': 1, 'name': 'Alice'}, {'id': 2, 'name': 'Bob'}]

@app.route('/api/users/:id', methods=['GET'])
def get_user(request):
    return {'id': request['params']['id'], 'name': f"User {request['params']['id']}"}

@app.route('/api/users', methods=['POST'])
def create_user(request):
    return {'id': 3, **request['body']}, 201

# Generate self-signed certificate for testing
# openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

if __name__ == '__main__':
    if os.path.exists('cert.pem') and os.path.exists('key.pem'):
        app.run()
    else:
        print("Please generate TLS certificate and key first:")
        print("openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes")
```

### Example 4: HTTP/2 Server with Server Push (Go)
```go
package main

import (
    "crypto/tls"
    "fmt"
    "io"
    "log"
    "net/http"
    "time"
)

type HTTP2Server struct {
    server *http.Server
    router *Router
}

type Router struct {
    routes map[string]http.Handler
}

func NewRouter() *Router {
    return &Router{
        routes: make(map[string]http.Handler),
    }
}

func (r *Router) GET(path string, handler http.HandlerFunc) {
    r.routes["GET:"+path] = handler
}

func (r *Router) POST(path string, handler http.HandlerFunc) {
    r.routes["POST:"+path] = handler
}

func (r *Router) Handle(path string, handler http.Handler) {
    r.routes["HANDLER:"+path] = handler
}

func NewHTTP2Server(addr string) *HTTP2Server {
    router := NewRouter()
    
    mux := http.NewServeMux()
    
    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        if handler, ok := router.routes["GET:"+r.URL.Path]; ok {
            handler.ServeHTTP(w, r)
            return
        }
        http.NotFound(w, r)
    })
    
    // HTTP/2 server configuration
    server := &http.Server{
        Addr:         addr,
        Handler:      mux,
        ReadTimeout:  15 * time.Second,
        WriteTimeout: 15 * time.Second,
        IdleTimeout:  60 * time.Second,
    }
    
    return &HTTP2Server{
        server: server,
        router: router,
    }
}

func (s *HTTP2Server) ConfigureTLS(minVersion uint16) {
    s.server.TLSConfig = &tls.Config{
        MinVersion:               minVersion,
        CurvePreferences:        []tls.CurveID{tls.CurveP256, tls.X25519},
        CipherSuites: []uint16{
            tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
            tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
            tls.TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305,
            tls.TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305,
        },
        NextProtos: []string{"h2", "http/1.1"},
    }
}

func (s *HTTP2Server) Start() error {
    s.router.GET("/index.html", func(w http.ResponseWriter, r *http.Request) {
        // Server Push for critical resources
        pusher, ok := w.(http.Pusher)
        if ok {
            // Push CSS
            if err := pusher.Push("/styles.css", nil); err != nil {
                log.Printf("Failed to push styles.css: %v", err)
            }
            // Push JavaScript
            if err := pusher.Push("/app.js", nil); err != nil {
                log.Printf("Failed to push app.js: %v", err)
            }
            // Push images
            if err := pusher.Push("/logo.png", nil); err != nil {
                log.Printf("Failed to push logo.png: %v", err)
            }
        }
        
        w.Header().Set("Content-Type", "text/html")
        io.WriteString(w, `<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <h1>HTTP/2 Server Push Demo</h1>
    <script src="/app.js"></script>
</body>
</html>`)
    })
    
    s.router.GET("/styles.css", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "text/css")
        io.WriteString(w, `body { font-family: Arial, sans-serif; margin: 40px; }`)
    })
    
    s.router.GET("/app.js", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/javascript")
        io.WriteString(w, `console.log('Hello from HTTP/2!');`)
    })
    
    s.router.GET("/api/users", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        w.Header().Set("Cache-Control", "public, max-age=3600")
        io.WriteString(w, `[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]`)
    })
    
    s.router.GET("/api/users/:id", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        io.WriteString(w, `{"id":1,"name":"Alice"}`)
    })
    
    s.router.POST("/api/users", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusCreated)
        io.WriteString(w, `{"id":3,"name":"New User"}`)
    })
    
    log.Printf("HTTP/2 Server starting on %s", s.server.Addr)
    return s.server.ListenAndServeTLS("cert.pem", "key.pem")
}
```

### Example 5: WebSocket Implementation (TypeScript)
```typescript
import { IncomingMessage, Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket, ServerOptions } from 'socket.io';
import { URL } from 'url';
import { verify } from 'jsonwebtoken';

interface WebSocketMessage {
    type: string;
    payload: any;
    timestamp: number;
}

interface AuthenticatedSocket extends Socket {
    userId?: string;
    user?: any;
}

class WebSocketServer {
    private io: SocketIOServer;
    private rooms: Map<string, Set<string>> = new Map();
    private userSockets: Map<string, Set<string>> = new Map();
    
    constructor(server: HttpServer, options: Partial<ServerOptions> = {}) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
                methods: ['GET', 'POST'],
                credentials: true
            },
            pingTimeout: 60000,
            pingInterval: 25000,
            ...options
        });
        
        this.setupMiddleware();
        this.setupEventHandlers();
    }
    
    private setupMiddleware(): void {
        this.io.use(async (socket: AuthenticatedSocket, next) => {
            try {
                const token = socket.handshake.auth?.token || 
                              socket.handshake.headers?.authorization?.replace('Bearer ', '');
                
                if (!token) {
                    return next(new Error('Authentication required'));
                }
                
                const decoded = verify(token, process.env.JWT_SECRET!) as any;
                socket.userId = decoded.userId;
                socket.user = decoded;
                
                next();
            } catch (error) {
                next(new Error('Invalid token'));
            }
        });
        
        this.io.engine.on("connection_error", (err) => {
            console.log("Connection error:", err.message);
        });
    }
    
    private setupEventHandlers(): void {
        this.io.on('connection', (socket: AuthenticatedSocket) => {
            console.log(`User connected: ${socket.userId}`);
            
            // Join user's personal room
            const userRoom = `user:${socket.userId}`;
            socket.join(userRoom);
            
            this.trackUserSocket(socket.userId!, socket.id);
            
            // Handle joining topic rooms
            socket.on('join:room', (roomId: string) => {
                socket.join(`room:${roomId}`);
                
                if (!this.rooms.has(roomId)) {
                    this.rooms.set(roomId, new Set());
                }
                this.rooms.get(roomId)!.add(socket.userId!);
                
                socket.to(`room:${roomId}`).emit('user:joined', {
                    userId: socket.userId,
                    roomId,
                    timestamp: Date.now()
                });
            });
            
            // Handle leaving rooms
            socket.on('leave:room', (roomId: string) => {
                socket.leave(`room:${roomId}`);
                
                this.rooms.get(roomId)?.delete(socket.userId!);
                
                socket.to(`room:${roomId}`).emit('user:left', {
                    userId: socket.userId,
                    roomId,
                    timestamp: Date.now()
                });
            });
            
            // Handle private messages
            socket.on('message:private', (data: { to: string; content: string }) => {
                const message: WebSocketMessage = {
                    type: 'private',
                    payload: {
                        from: socket.userId,
                        to: data.to,
                        content: data.content
                    },
                    timestamp: Date.now()
                };
                
                // Send to recipient's personal room
                this.io.to(`user:${data.to}`).emit('message:received', message);
                
                // Confirm delivery to sender
                socket.emit('message:sent', message);
            });
            
            // Handle room messages
            socket.on('message:room', (data: { roomId: string; content: string }) => {
                const message: WebSocketMessage = {
                    type: 'room',
                    payload: {
                        from: socket.userId,
                        fromName: socket.user?.name,
                        roomId: data.roomId,
                        content: data.content
                    },
                    timestamp: Date.now()
                };
                
                socket.to(`room:${data.roomId}`).emit('message:room', message);
                socket.emit('message:sent', message);
            });
            
            // Handle typing indicators
            socket.on('typing:start', (roomId: string) => {
                socket.to(`room:${roomId}`).emit('user:typing', {
                    userId: socket.userId,
                    roomId
                });
            });
            
            socket.on('typing:stop', (roomId: string) => {
                socket.to(`room:${roomId}`).emit('user:stopped-typing', {
                    userId: socket.userId,
                    roomId
                });
            });
            
            // Handle presence updates
            socket.on('presence:update', (status: string) => {
                socket.to(`user:${socket.userId}`).broadcast.emit('presence:changed', {
                    userId: socket.userId,
                    status,
                    timestamp: Date.now()
                });
            });
            
            // Handle disconnection
            socket.on('disconnect', (reason) => {
                console.log(`User disconnected: ${socket.userId}, reason: ${reason}`);
                
                this.removeUserSocket(socket.userId!, socket.id);
                
                // Notify all rooms user was in
                this.rooms.forEach((users, roomId) => {
                    if (users.has(socket.userId!)) {
                        users.delete(socket.userId!);
                        socket.to(`room:${roomId}`).emit('user:left', {
                            userId: socket.userId,
                            roomId,
                            timestamp: Date.now()
                        });
                    }
                });
            });
        });
    }
    
    private trackUserSocket(userId: string, socketId: string): void {
        if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId)!.add(socketId);
    }
    
    private removeUserSocket(userId: string, socketId: string): void {
        const sockets = this.userSockets.get(userId);
        if (sockets) {
            sockets.delete(socketId);
            if (sockets.size === 0) {
                this.userSockets.delete(userId);
            }
        }
    }
    
    // Broadcast to all connected clients
    broadcast(event: string, data: any): void {
        this.io.emit(event, {
            ...data,
            timestamp: Date.now()
        });
    }
    
    // Send to specific user
    sendToUser(userId: string, event: string, data: any): void {
        this.io.to(`user:${userId}`).emit(event, {
            ...data,
            timestamp: Date.now()
        });
    }
    
    // Send to room
    sendToRoom(roomId: string, event: string, data: any, exclude?: string): void {
        if (exclude) {
            this.io.to(`room:${roomId}`).except(`user:${exclude}`).emit(event, {
                ...data,
                timestamp: Date.now()
            });
        } else {
            this.io.to(`room:${roomId}`).emit(event, {
                ...data,
                timestamp: Date.now()
            });
        }
    }
    
    // Get online users in room
    getRoomUsers(roomId: string): string[] {
        return Array.from(this.rooms.get(roomId) || []);
    }
    
    // Check if user is online
    isUserOnline(userId: string): boolean {
        return this.userSockets.has(userId);
    }
}
```

## Best Practices

- Use HTTPS everywhere; enforce TLS 1.2+ with secure cipher suites
- Implement proper HTTP status codes and error responses
- Use HTTP caching headers (Cache-Control, ETag) appropriately
- Implement rate limiting to prevent abuse
- Use HTTP/2 or HTTP/3 for improved performance
- Validate and sanitize all input data
- Implement proper authentication and authorization
- Use content negotiation for API versioning
- Implement proper request/response logging
- Use compression (gzip, Brotli) for response bodies

## Core Competencies

- HTTP methods and status codes
- Request/response headers
- Body parsing and serialization
- URL routing and parameter handling
- TLS/HTTPS configuration
- HTTP/2 multiplexing and server push
- WebSocket implementation
- RESTful API design
- Authentication and authorization
- Rate limiting and throttling
- Caching strategies
- CORS configuration
- Compression
- Content negotiation
- API versioning
