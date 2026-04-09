---
name: nodejs
description: JavaScript runtime built on Chrome's V8 JavaScript engine
category: web-development
---

# Node.js

## What I Do

Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine, created by Ryan Dahl. I enable JavaScript to run on the server, allowing developers to use a single language for both frontend and backend. I use an event-driven, non-blocking I/O model that makes me efficient for handling concurrent requests and real-time applications.

I excel at building APIs, microservices, real-time applications, and command-line tools. My npm ecosystem is the largest package registry in the world, providing solutions for almost any need. Node.js powers serverless functions, streaming services, and enterprise applications. The V8 engine provides excellent performance, and my modular architecture scales well for microservices architectures.

## When to Use Me

Choose Node.js for building REST APIs, GraphQL servers, real-time applications with WebSockets, and microservices. I am ideal for applications handling many concurrent connections with I/O operations. Node.js works well for teams wanting to share code between frontend and backend. Avoid Node.js for CPU-intensive computation where languages like Go or Rust would perform better, or for applications requiring strong consistency in distributed systems.

## Core Concepts

Node.js uses an event loop to handle asynchronous operations without blocking the main thread. Modules encapsulate functionality with CommonJS require syntax. The file system, HTTP, crypto, and stream modules are built-in. npm manages dependencies with package.json defining project metadata and dependencies. Node.js supports ES modules with .mjs extension or "type": "module" in package.json.

Error handling follows error-first callback conventions or promises with async/await. Streams handle data in chunks for memory efficiency. The cluster module enables utilizing multiple CPU cores. Worker threads handle CPU-intensive tasks without blocking the event loop. The Buffer and process modules provide access to binary data and runtime information.

## Code Examples

```javascript
const http = require('http');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const fs = require('fs');
const path = require('path');

const server = http.createServer(async (req, res) => {
  const { method, url } = req;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
  
  if (method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }
  
  res.setHeader('Content-Type', 'application/json');
  
  try {
    if (url === '/api/users' && method === 'GET') {
      const users = await getUsers();
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify(users));
    } else if (url === '/api/users' && method === 'POST') {
      const body = await readBody(req);
      const user = await createUser(body);
      res.writeHead(201, corsHeaders);
      res.end(JSON.stringify(user));
    } else {
      res.writeHead(404, corsHeaders);
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  } catch (error) {
    res.writeHead(500, corsHeaders);
    res.end(JSON.stringify({ error: error.message }));
  }
});

function readBody(req) {
  return new Promise((resolve, reject) => {
    let chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString());
        resolve(body);
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Mock database
const users = new Map();

async function getUsers() {
  return Array.from(users.values());
}

async function createUser(data) {
  const user = { id: generateId(), ...data, createdAt: new Date() };
  users.set(user.id, user);
  return user;
}

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

```javascript
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');

if (isMainThread) {
  const numWorkers = os.cpus().length;
  const workers = [];
  
  for (let i = 0; i < numWorkers; i++) {
    const worker = new Worker(__filename, {
      workerData: { workerId: i }
    });
    
    worker.on('message', (msg) => {
      console.log(`Worker ${i}:`, msg);
    });
    
    worker.on('error', (err) => {
      console.error(`Worker ${i} error:`, err);
    });
    
    worker.on('exit', (code) => {
      console.log(`Worker ${i} exited with code ${code}`);
    });
    
    workers.push(worker);
  }
  
  // Distribute work to workers
  const tasks = Array.from({ length: 100 }, (_, i) => i);
  tasks.forEach((task, index) => {
    const workerIndex = index % numWorkers;
    workers[workerIndex].postMessage({ task });
  });
} else {
  parentPort.on('message', (msg) => {
    const result = heavyComputation(msg.task);
    parentPort.postMessage(result);
  });
  
  function heavyComputation(n) {
    let result = 0;
    for (let i = 0; i < 10000000; i++) {
      result += Math.sqrt(n) * Math.random();
    }
    return result;
  }
}
```

```javascript
const EventEmitter = require('events');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

class DataProcessor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.batchSize = options.batchSize || 100;
    this.processing = false;
    this.queue = [];
  }
  
  add(data) {
    this.queue.push(data);
    this.emit('queue', { length: this.queue.length });
    
    if (!this.processing) {
      this.process();
    }
  }
  
  async process() {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);
      await this.processBatch(batch);
      
      this.emit('batch-processed', { count: batch.length });
      await sleep(10); // Prevent event loop blocking
    }
    
    this.processing = false;
    this.emit('idle');
  }
  
  async processBatch(batch) {
    const results = await Promise.all(
      batch.map(item => this.transform(item))
    );
    await this.save(results);
  }
  
  async transform(item) {
    await sleep(5);
    return { ...item, processedAt: new Date() };
  }
  
  async save(results) {
    // Save to database
    console.log(`Saved ${results.length} items`);
  }
}

const processor = new DataProcessor({ batchSize: 50 });

processor.on('queue', ({ length }) => {
  console.log(`Queue length: ${length}`);
});

processor.on('batch-processed', ({ count }) => {
  console.log(`Processed batch of ${count}`);
});

processor.on('idle', () => {
  console.log('All items processed');
});

processor.on('error', (err) => {
  console.error('Processing error:', err);
});

// Add items to processor
for (let i = 0; i < 200; i++) {
  processor.add({ id: i, data: `item-${i}` });
}
```

## Best Practices

Use async/await for asynchronous code to avoid callback hell and improve readability. Handle errors properly with try/catch and error events on EventEmitters. Keep the event loop healthy by avoiding synchronous operations and using streams for large data. Use clustering or worker threads to utilize multiple CPU cores for CPU-intensive tasks.

Organize code into modules with single responsibilities. Use environment variables for configuration with dotenv. Implement proper logging with structured logging libraries. Use process.exit() only for fatal errors. Monitor memory usage and event loop lag in production.

## Common Patterns

The middleware pattern chains functions to process requests, used by Express and many frameworks. The factory pattern creates objects with configuration options. The repository pattern abstracts data access with a consistent interface. The pub/sub pattern uses EventEmitter for loose coupling between components.

The command pattern encapsulates operations as objects for queuing and undo functionality. The strategy pattern switches algorithms at runtime based on context. The singleton pattern ensures single instances with module-level exports in Node.js.
