---
name: rest-api
description: REST API design best practices and patterns
category: web-development
---

# REST API

## What I Do

REST (Representational State Transfer) is an architectural style for designing networked applications. I define a set of constraints for creating web services that are scalable, stateless, and cacheable. RESTful APIs use HTTP methods semantically to perform CRUD operations on resources identified by URLs. I am the most widely adopted API style, supported by all HTTP clients and gateways.

I excel at microservices architectures, public APIs, and systems requiring simple integration patterns. My caching-friendly nature improves performance and scalability. The uniform interface constraint simplifies client and server evolution independently. Hypermedia links enable discoverability and navigation of API resources.

## When to Use Me

Choose REST when building web APIs consumed by diverse clients including browsers, mobile apps, and third-party integrations. REST is ideal for CRUD-oriented applications and when caching is important for performance. REST works well with HTTP infrastructure including CDNs, proxies, and load balancers. Avoid REST for complex queries requiring flexible data shapes, where GraphQL would be more appropriate, or when real-time updates are a primary requirement.

## Core Concepts

Resources are identified by URLs and manipulated using HTTP methods. The uniform interface uses standard HTTP methods (GET, POST, PUT, PATCH, DELETE) with semantic meanings. Representations transfer data between clients and servers, typically JSON. Statelessness means each request contains all information needed for processing. Hypermedia as the Engine of Application State (HATEOAS) uses links for navigation.

HTTP caching uses headers like ETag, Last-Modified, and Cache-Control. Status codes communicate operation results (200s for success, 400s for client errors, 500s for server errors). Content negotiation selects representation formats. Versioning manages API evolution without breaking clients.

## Code Examples

```javascript
const express = require('express');
const app = express();
app.use(express.json());

// Resource: Users
// GET    /users              - List users
// GET    /users/:id          - Get user
// POST   /users              - Create user
// PUT    /users/:id          - Replace user
// PATCH  /users/:id          - Update user
// DELETE /users/:id          - Delete user

// Nested resource: User's posts
// GET    /users/:id/posts     - List user's posts
// POST   /users/:id/posts    - Create post for user

const users = new Map();
const posts = new Map();

app.get('/api/users', (req, res) => {
  const { page = 1, limit = 20, sort = 'createdAt', order = 'desc' } = req.query;
  
  const userList = Array.from(users.values());
  
  userList.sort((a, b) => {
    const aVal = a[sort];
    const bVal = b[sort];
    if (order === 'desc') return bVal > aVal ? 1 : -1;
    return aVal > bVal ? 1 : -1;
  });
  
  const start = (page - 1) * limit;
  const paginated = userList.slice(start, start + Number(limit));
  
  res.json({
    data: paginated,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total: userList.length,
      totalPages: Math.ceil(userList.length / limit)
    },
    links: {
      self: `/api/users?page=${page}&limit=${limit}`,
      first: `/api/users?page=1&limit=${limit}`,
      last: `/api/users?page=${Math.ceil(userList.length / limit)}&limit=${limit}`,
      next: Number(page) < Math.ceil(userList.length / limit)
        ? `/api/users?page=${Number(page) + 1}&limit=${limit}`
        : null,
      prev: Number(page) > 1
        ? `/api/users?page=${Number(page) - 1}&limit=${limit}`
        : null
    }
  });
});

app.get('/api/users/:id', (req, res) => {
  const user = users.get(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      error: 'Not found',
      message: `User with id ${req.params.id} not found`
    });
  }
  
  const userPosts = Array.from(posts.values())
    .filter(p => p.authorId === req.params.id)
    .map(p => ({
      id: p.id,
      title: p.title,
      createdAt: p.createdAt
    }));
  
  res.json({
    data: {
      ...user,
      posts: {
        count: userPosts.length,
        links: {
          self: `/api/users/${req.params.id}/posts`
        }
      }
    },
    links: {
      self: `/api/users/${req.params.id}`,
      collection: '/api/users'
    }
  });
});

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({
      error: 'Validation error',
      details: [
        { field: 'name', message: 'Name is required' },
        { field: 'email', message: 'Email is required' }
      ]
    });
  }
  
  const id = Date.now().toString(36);
  const user = {
    id,
    name,
    email,
    role: 'user',
    createdAt: new Date().toISOString(),
    links: {
      self: `/api/users/${id}`
    }
  };
  
  users.set(id, user);
  
  res.status(201)
    .location(`/api/users/${id}`)
    .json({ data: user });
});

app.put('/api/users/:id', (req, res) => {
  const user = users.get(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      error: 'Not found',
      message: `User with id ${req.params.id} not found`
    });
  }
  
  const { name, email, role } = req.body;
  
  const updated = {
    ...user,
    name: name ?? user.name,
    email: email ?? user.email,
    role: role ?? user.role,
    updatedAt: new Date().toISOString()
  };
  
  users.set(req.params.id, updated);
  
  res.json({
    data: updated,
    links: {
      self: `/api/users/${req.params.id}`
    }
  });
});

app.patch('/api/users/:id', (req, res) => {
  const user = users.get(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      error: 'Not found',
      message: `User with id ${req.params.id} not found`
    });
  }
  
  const allowedFields = ['name', 'email', 'role'];
  const updates = {};
  
  for (const [key, value] of Object.entries(req.body)) {
    if (allowedFields.includes(key)) {
      updates[key] = value;
    }
  }
  
  const updated = {
    ...user,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  users.set(req.params.id, updated);
  
  res.json({ data: updated });
});

app.delete('/api/users/:id', (req, res) => {
  if (!users.has(req.params.id)) {
    return res.status(404).json({
      error: 'Not found',
      message: `User with id ${req.params.id} not found`
    });
  }
  
  users.delete(req.params.id);
  
  res.status(204).send();
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(3000, () => {
  console.log('REST API running on http://localhost:3000');
});
```

```javascript
// REST API client with proper headers

class RESTClient {
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    };
  }
  
  async request(method, path, body = null, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = { ...this.defaultHeaders, ...options.headers };
    
    const config = {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    };
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(response.status, error);
    }
    
    if (response.status === 204) return null;
    
    return response.json();
  }
  
  get(path, options) {
    return this.request('GET', path, null, options);
  }
  
  post(path, body, options) {
    return this.request('POST', path, body, options);
  }
  
  put(path, body, options) {
    return this.request('PUT', path, body, options);
  }
  
  patch(path, body, options) {
    return this.request('PATCH', path, body, options);
  }
  
  delete(path, options) {
    return this.request('DELETE', path, null, options);
  }
}

class APIError extends Error {
  constructor(status, body) {
    super(`HTTP ${status}: ${body.message || 'Request failed'}`);
    this.status = status;
    this.body = body;
  }
}

// Usage
const client = new RESTClient('https://api.example.com', {
  headers: { 'Authorization': `Bearer ${token}` }
});

try {
  const users = await client.get('/api/users?page=1&limit=10');
  const user = await client.get(`/api/users/${users.data[0].id}`);
  await client.patch(`/api/users/${user.data.id}`, { name: 'New Name' });
} catch (err) {
  console.error('API Error:', err.status, err.body);
}
```

## Best Practices

Use nouns for resource URLs, not verbs. Implement proper HTTP status codes for all responses. Version APIs through URL paths or headers. Use pagination with consistent query parameters. Implement filtering and sorting through query parameters.

Use HATEOAS links for discoverability. Set appropriate caching headers. Implement rate limiting and authentication securely. Document APIs with OpenAPI/Swagger. Use consistent naming conventions for fields and errors.

## Common Patterns

The CRUD pattern maps HTTP methods to resource operations. The collection pattern handles lists of resources with pagination. The nested resource pattern represents relationships between resources. The bulk operation pattern handles multiple resources in one request.

The versioning pattern manages API evolution through versioned URLs. The idempotency pattern ensures safe retries using idempotency keys. The webhook pattern notifies clients of events. The rate limiting pattern protects APIs from abuse.
