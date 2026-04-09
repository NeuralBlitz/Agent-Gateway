---
name: nodejs
description: JavaScript runtime built on Chrome's V8 JavaScript engine
category: web-development
difficulty: intermediate
tags: [runtime, javascript, server-side, async]
author: OpenJS Foundation
version: 21
last_updated: 2024-01-15
---

# Node.js

## What I Do

I am Node.js, a JavaScript runtime built on Chrome's V8 engine that enables JavaScript execution outside the browser. I provide an event-driven, non-blocking I/O model that makes me exceptionally efficient for building scalable network applications. My architecture excels at handling concurrent connections with minimal overhead, making me ideal for real-time applications, APIs, and microservices. I run JavaScript code with access to the file system, network requests, child processes, and operating system functionality. My npm ecosystem is the largest package registry in the world, providing millions of reusable packages. I support modern JavaScript features through native ECMAScript module support and experimental features. My HTTP server capabilities built into the standard library enable quick prototyping and production deployment without external dependencies. My worker threads provide true parallelism for CPU-intensive tasks while maintaining the event loop model.

## When to Use Me

- Building RESTful APIs and GraphQL servers
- Real-time applications (chat, gaming, collaboration)
- Microservices architecture
- Server-side rendering (Next.js, Nuxt)
- Command-line tools and CLI applications
- Build tools and task runners (Webpack, Vite)
- Desktop applications (Electron)
- IoT applications and streaming services
- Proxy servers and API gateways
- Any JavaScript-heavy backend development

## Core Concepts

**Event Loop**: My single-threaded execution model that processes asynchronous operations in phases, allowing non-blocking I/O while handling thousands of concurrent connections.

**Non-blocking I/O**: Operations like file reads, network requests, and database queries don't block the main thread, enabling concurrent processing.

**CommonJS Modules**: The traditional module system using `require()` and `module.exports` for organizing code.

**ES Modules**: Modern JavaScript module syntax with `import` and `export`, supported natively in Node.js 14+.

**Streams**: Abstract interface for working with streaming data, enabling memory-efficient processing of large files and network data.

**Buffers**: Raw binary data handling for working with binary protocols, file systems, and network packets.

**Child Processes**: Spawning and managing subprocesses for CPU-intensive tasks and system integration.

**Worker Threads**: True parallelism for CPU-bound JavaScript code while sharing memory with the main thread.

## Code Examples

### Example 1: Asynchronous HTTP Server with Middleware
```javascript
// server.js
const http = require('http')
const { EventEmitter } = require('events')

class KoaRouter {
  constructor() {
    this.layers = []
  }
  
  get(path, handler) {
    this.layers.push({ method: 'GET', path, handler })
    return this
  }
  
  post(path, handler) {
    this.layers.push({ method: 'POST', path, handler })
    return
  }
  
  async handle(ctx) {
    for (const layer of this.layers) {
      if (ctx.method === layer.method && ctx.path === layer.path) {
        return layer.handler(ctx)
      }
    }
    ctx.status = 404
    ctx.body = { error: 'Not Found' }
  }
}

class Context {
  constructor(req, res) {
    this.req = req
    this.res = res
    this.method = req.method
    this.path = new URL(req.url, `http://${req.headers.host}`).pathname
    this.query = Object.fromEntries(
      new URL(req.url, `http://${req.headers.host}`).searchParams
    )
    this.params = {}
    this.body = null
    this.status = 200
  }
  
  json(data) {
    this.body = data
    this.res.setHeader('Content-Type', 'application/json')
  }
}

class App extends EventEmitter {
  constructor() {
    super()
    this.router = new KoaRouter()
    this.middleware = []
  }
  
  use(fn) {
    this.middleware.push(fn)
    return this
  }
  
  get(path, handler) {
    this.router.get(path, handler)
    return this
  }
  
  post(path, handler) {
    this.router.post(path, handler)
    return this
  }
  
  async handleRequest(req, res) {
    const ctx = new Context(req, res)
    
    for (const fn of this.middleware) {
      await fn(ctx)
      if (ctx.res.writableEnded) return
    }
    
    await this.router.handle(ctx)
    
    res.statusCode = ctx.status
    res.end(JSON.stringify(ctx.body))
  }
  
  listen(...args) {
    const server = http.createServer(this.handleRequest.bind(this))
    return server.listen(...args)
  }
}

const app = new App()

app.use(async (ctx) => {
  const start = Date.now()
  await new Promise(resolve => ctx.req.on('end', resolve))
  const ms = Date.now() - start
  console.log(`${ctx.method} ${ctx.path} - ${ms}ms`)
})

app.get('/', async (ctx) => {
  ctx.json({ message: 'Welcome to Node.js API', timestamp: new Date().toISOString() })
})

app.get('/users/:id', async (ctx) => {
  ctx.params.id
  ctx.json({ id: ctx.params.id, name: 'User ' + ctx.params.id })
})

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
```

### Example 2: File Streams and Pipe Operations
```javascript
// file-processor.js
const fs = require('fs')
const { pipeline } = require('stream/promises')
const { createGzip, createGunzip } = require('zlib')
const { Transform } = require('stream')

class LineCounter extends Transform {
  constructor(options = {}) {
    super({ ...options, objectMode: true })
    this.lineCount = 0
  }
  
  _transform(chunk, encoding, callback) {
    const lines = chunk.toString().split('\n')
    if (!this.lastChunk) {
      this.lineCount += lines.length - 1
    } else {
      this.lineCount += lines.length
    }
    this.lastChunk = chunk
    callback(null, { lines: chunk.toString().split('\n'), count: this.lineCount })
  }
}

class CSVToJSON extends Transform {
  constructor() {
    super({ objectMode: true })
    this.headers = null
  }
  
  _transform(chunk, encoding, callback) {
    const lines = chunk.lines
    if (!this.headers && lines.length > 0) {
      this.headers = lines[0].split(',')
      lines.shift()
    }
    
    const records = lines
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(',')
        return this.headers.reduce((obj, header, i) => {
          obj[header.trim()] = values[i]?.trim()
          return obj
        }, {})
      })
    
    callback(null, records)
  }
}

async function processLargeCSV(inputPath, outputPath) {
  const readStream = fs.createReadStream(inputPath)
  const writeStream = fs.createWriteStream(outputPath)
  const gzip = createGzip()
  
  const lineCounter = new LineCounter()
  const csvToJson = new CSVToJSON()
  
  readStream
    .pipe(lineCounter)
    .pipe(csvToJson)
    .pipe(gzip)
    .pipe(writeStream)
  
  await pipeline(readStream, lineCounter, csvToJson, gzip, writeStream)
  
  console.log(`Processed ${lineCounter.lineCount} lines`)
}

async function decompressFile(gzipPath, outputPath) {
  const gzip = createGunzip()
  const input = fs.createReadStream(gzipPath)
  const output = fs.createWriteStream(outputPath)
  
  await pipeline(input, gzip, output)
  console.log('Decompression complete')
}
```

### Example 3: Worker Threads for CPU-Intensive Tasks
```javascript
// worker-controller.js
const {
  Worker, isMainThread, parentPort, workerData
} = require('worker_threads')

if (isMainThread) {
  class ThreadPool {
    constructor(size = navigator.hardwareConcurrency) {
      this.size = size
      this.workers = []
      this.queue = []
      this.active = 0
    }
    
    run(task) {
      return new Promise((resolve, reject) => {
        const worker = this.findAvailableWorker()
        if (worker) {
          this.execute(worker, task, resolve, reject)
        } else {
          this.queue.push({ task, resolve, reject })
        }
      })
    }
    
    findAvailableWorker() {
      if (this.active < this.size) {
        this.active++
        return new Worker(__filename)
      }
      return null
    }
    
    execute(worker, task, resolve, reject) {
      worker.postMessage({ task })
      worker.once('message', (result) => {
        resolve(result)
        this.active--
        worker.terminate()
        this.processQueue()
      })
      worker.once('error', reject)
    }
    
    processQueue() {
      while (this.queue.length > 0) {
        const { task, resolve, reject } = this.queue.shift()
        const worker = this.findAvailableWorker()
        if (worker) {
          this.execute(worker, task, resolve, reject)
        } else {
          this.queue.unshift({ task, resolve, reject })
          break
        }
      }
    }
  }
  
  // Heavy computation function
  function fibonacci(n) {
    if (n <= 1) return n
    return fibonacci(n - 1) + fibonacci(n - 2)
  }
  
  const pool = new ThreadPool(4)
  
  async function main() {
    console.time('computation')
    
    const results = await Promise.all([
      pool.run({ fn: 'fibonacci', args: [40] }),
      pool.run({ fn: 'fibonacci', args: [40] }),
      pool.run({ fn: 'fibonacci', args: [40] }),
      pool.run({ fn: 'fibonacci', args: [40] })
    ])
    
    console.timeEnd('computation')
    console.log('Results:', results)
  }
  
  main()
} else {
  parentPort.on('message', (msg) => {
    const { fn, args } = msg.task
    const result = require('./compute')[fn](...args)
    parentPort.postMessage(result)
  })
}
```

### Example 4: Database Connection Pool with Promise Wrapper
```javascript
// database.js
const { createPool, Pool } = require('pg')

class Database {
  constructor(config) {
    this.pool = new Pool(config)
    this.pool.on('error', (err) => {
      console.error('Unexpected database error:', err)
    })
  }
  
  async query(text, params = []) {
    const start = Date.now()
    try {
      const result = await this.pool.query(text, params)
      const duration = Date.now() - start
      console.log('Query executed:', { text: text.substring(0, 100), duration, rows: result.rowCount })
      return result
    } catch (error) {
      console.error('Query error:', { text: text.substring(0, 100), error: error.message })
      throw error
    }
  }
  
  async getClient() {
    const client = await this.pool.connect()
    const originalRelease = client.release.bind(client)
    let released = false
    
    client.release = () => {
      if (released) return
      released = true
      client.query('ROLLBACK').finally(() => originalRelease())
    }
    
    return client
  }
  
  async transaction(callback) {
    const client = await this.getClient()
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
  
  async close() {
    await this.pool.end()
  }
}

// Repository pattern
class UserRepository {
  constructor(db) {
    this.db = db
  }
  
  async findById(id) {
    const result = await this.db.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    )
    return result.rows[0] || null
  }
  
  async findByEmail(email) {
    const result = await this.db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )
    return result.rows[0] || null
  }
  
  async create(data) {
    const { name, email, passwordHash } = data
    const result = await this.db.query(
      `INSERT INTO users (name, email, password_hash, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [name, email, passwordHash]
    )
    return result.rows[0]
  }
  
  async update(id, data) {
    const fields = Object.keys(data)
    const values = Object.values(data)
    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ')
    
    const result = await this.db.query(
      `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    )
    return result.rows[0] || null
  }
  
  async delete(id) {
    const result = await this.db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id])
    return result.rowCount > 0
  }
}

// Usage
const db = new Database({
  host: process.env.DB_HOST || 'localhost',
  database: 'myapp',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
})

const users = new UserRepository(db)
```

### Example 5: Real-time Event Bus with Pub/Sub
```javascript
// event-bus.js
const { EventEmitter } = require('events')

class EventBus extends EventEmitter {
  constructor(options = {}) {
    super()
    this.subscriptionCount = new Map()
    this.middleware = options.middleware || []
    this.setMaxListeners(Infinity)
  }
  
  async publish(topic, data, metadata = {}) {
    const context = {
      topic,
      data,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        source: metadata.source || 'unknown'
      }
    }
    
    for (const fn of this.middleware) {
      await fn(context)
    }
    
    this.emit(topic, context)
    return context
  }
  
  subscribe(topic, handler, options = {}) {
    const listener = async (context) => {
      try {
        await handler(context.data, context.metadata)
        if (options.ack !== false) {
          this.emit(`${topic}.ack`, { topic, handler: handler.name })
        }
      } catch (error) {
        this.emit(`${topic}.error`, { topic, error, context })
        if (options.retry !== false) {
          setTimeout(() => this.subscribe(topic, handler, { ...options, retry: false }), 1000)
        }
      }
    }
    
    listener._originalHandler = handler
    this.on(topic, listener)
    
    const count = this.subscriptionCount.get(topic) || 0
    this.subscriptionCount.set(topic, count + 1)
    
    return () => this.unsubscribe(topic, listener)
  }
  
  unsubscribe(topic, handler) {
    this.off(topic, handler)
    const count = this.subscriptionCount.get(topic) || 1
    this.subscriptionCount.set(topic, count - 1)
  }
  
  getStats() {
    return {
      topics: this.subscriptionCount.size,
      subscriptions: Array.from(this.subscriptionCount.values()).reduce((a, b) => a + b, 0),
      eventNames: this.eventNames()
    }
  }
}

class RequestIdMiddleware {
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  async invoke(context) {
    context.metadata.requestId = context.metadata.requestId || this.generateId()
  }
}

class LoggingMiddleware {
  async invoke(context) {
    console.log(`[${context.metadata.timestamp}] ${context.topic}:`, {
      requestId: context.metadata.requestId,
      data: typeof context.data === 'object' ? JSON.stringify(context.data) : context.data
    })
  }
}

// Usage
const eventBus = new EventBus({
  middleware: [new RequestIdMiddleware(), new LoggingMiddleware()]
})

eventBus.subscribe('user.created', async (user) => {
  console.log('New user registered:', user.email)
  await eventBus.publish('email.welcome', { user })
})

eventBus.subscribe('email.welcome', async (data) => {
  console.log('Sending welcome email to:', data.user.email)
})

eventBus.publish('user.created', {
  id: '123',
  email: 'alice@example.com',
  name: 'Alice'
})

const unsubscribe = eventBus.subscribe('user.login', (user) => {
  console.log('User logged in:', user.email)
})
```

## Best Practices

- Use async/await over callbacks for better readability and error handling
- Implement proper error handling with try/catch and domain error boundaries
- Use environment variables for configuration (dotenv package)
- Keep the event loop healthy by offloading CPU-intensive work to worker threads
- Use streams for handling large files and data sets
- Implement connection pooling for databases and external services
- Gracefully handle uncaught exceptions and promise rejections
- Use clustering to utilize multi-core systems for production
- Monitor memory usage and identify leaks with heap snapshots
- Use `--inspect` flag for debugging with Chrome DevTools

## Core Competencies

- Event-driven, non-blocking I/O architecture
- HTTP server and client implementation
- File system operations with streams
- Child processes and worker threads
- npm package management
- ES modules and CommonJS interoperability
- Async programming patterns (callbacks, promises, async/await)
- Real-time communication with WebSocket
- Database connectivity and ORM integration
- CLI application development
- Testing with Jest, Mocha, and Supertest
- Security best practices (input validation, rate limiting)
