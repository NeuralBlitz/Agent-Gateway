---
name: express
description: Express.js web framework best practices and patterns
category: web-development
---

# Express.js

## What I Do

Express.js is a minimal and flexible Node.js web application framework. I provide a robust set of features for building web and mobile applications. My minimalist approach provides essential web server functionality while remaining unopinionated about architecture and structure. I am the most popular Node.js framework, with excellent documentation and a vast ecosystem of middleware.

I excel at building REST APIs, single-page application backends, and microservices. My routing system handles HTTP methods and URL patterns elegantly. Middleware functions process requests sequentially, enabling composable request handling. Integration with template engines supports server-side rendering, and my error handling system catches and processes errors throughout the middleware chain.

## When to Use Me

Choose Express for building REST APIs, serving static files, or creating web applications with Node.js. I work well for projects needing flexibility in architecture and middleware composition. Express is ideal for teams familiar with Node.js wanting to build web servers quickly. Avoid Express for applications requiring strict structure or built-in features like authentication and database ORM, where frameworks like NestJS would be more appropriate.

## Core Concepts

Express uses middleware functions to process requests in a chain. Each middleware receives request, response, and next callback parameters. Routes match HTTP methods and URL patterns, handling specific endpoints. Router objects create modular route handlers. Error-handling middleware has four parameters and catches errors from previous middleware.

Request objects provide access to headers, parameters, query strings, and body data. Response objects send data with methods like json, send, and status. Application settings control behavior like view engines and case sensitivity. The app object represents the Express application with methods for configuration and routing.

## Code Examples

```javascript
const express = require('express');
const { Router } = express;
const createError = require('http-errors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: 'https://example.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(logger('combined'));

// Static files
app.use(express.static('public'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// User router
const userRouter = Router({ mergeParams: true });

userRouter.param('id', (req, res, next, id) => {
  req.userId = id;
  next();
});

userRouter.get('/', async (req, res, next) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

userRouter.get('/:id', async (req, res, next) => {
  try {
    const user = await getUser(req.params.id);
    if (!user) {
      throw createError(404, 'User not found');
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

userRouter.post('/', async (req, res, next) => {
  try {
    const user = await createUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

// Mount router
app.use('/api/users', userRouter);

// Error handling
app.use((req, res, next) => {
  next(createError(404, 'Not found'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({
    error: { message, status }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Mock database functions
const users = new Map();

async function getUsers() {
  return Array.from(users.values());
}

async function getUser(id) {
  return users.get(id);
}

async function createUser(data) {
  const user = {
    id: Date.now().toString(),
    ...data,
    createdAt: new Date().toISOString()
  };
  users.set(user.id, user);
  return user;
}
```

```javascript
const express = require('express');
const { body, param, query, validationResult } = require('express-validator');

const app = express();
app.use(express.json());

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    res.status(400).json({ errors: errors.array() });
  };
};

const userValidations = [
  body('name')
    .isString()
    .isLength({ min: 2, max: 50 })
    .trim()
    .withMessage('Name must be 2-50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('age')
    .optional()
    .isInt({ min: 0, max: 150 })
    .withMessage('Age must be a number between 0 and 150')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('Limit must be between 1 and 100')
];

app.post('/users',
  validate(userValidations),
  (req, res) => {
    const user = req.body;
    res.status(201).json({ message: 'User created', user });
  }
);

app.get('/users',
  validate(paginationValidation),
  (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    res.json({
      page,
      limit,
      users: []
    });
  }
);

app.get('/users/:id',
  param('id').isUUID().withMessage('Invalid user ID'),
  (req, res) => {
    res.json({ id: req.params.id });
  }
);

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.get('/async-example',
  asyncHandler(async (req, res) => {
    const result = await someAsyncOperation();
    res.json(result);
  })
);
```

## Best Practices

Organize routes using Router objects in separate files. Implement error handling middleware at the application level. Use async handlers to catch promise rejections in route handlers. Validate input with express-validator or similar libraries. Implement rate limiting and security headers with helmet and express-rate-limit.

Keep middleware functions small and focused. Mount middleware at appropriate paths to avoid unnecessary processing. Use environment variables for configuration. Implement proper logging in production. Use compression middleware for response compression.

## Common Patterns

The controller pattern separates route handling from business logic. The service layer pattern creates reusable business logic separate from HTTP concerns. The repository pattern abstracts data access with database-agnostic interfaces. The middleware chain pattern composes request processing with small, focused functions.

The versioning pattern prefixes routes with API version numbers. The modular router pattern creates feature-scoped route handlers. The error boundary pattern catches errors at the router or application level. The request validation pattern uses middleware for input validation.
