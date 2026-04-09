---
name: expressjs
description: Express.js web framework best practices and patterns
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: frameworks
---
## What I do
- Build REST APIs with Express.js
- Implement middleware for cross-cutting concerns
- Handle async errors properly
- Structure applications with routers
- Implement authentication and authorization
- Use proper error handling
- Configure CORS and security headers
- Write tests with Jest and Supertest

## When to use me
When building Express.js applications or APIs.

## Application Structure
```
src/
├── app.ts                 # App configuration
├── server.ts              # Entry point
├── config/
│   ├── environment.ts
│   └── database.ts
├── routes/
│   ├── index.ts
│   ├── users/
│   │   ├── routes.ts
│   │   ├── controller.ts
│   │   ├── service.ts
│   │   ├── model.ts
│   │   └── validation.ts
│   └── posts/
├── middleware/
│   ├── auth.ts
│   ├── error.ts
│   ├── validation.ts
│   └── logging.ts
├── utils/
│   ├── logger.ts
│   └── helpers.ts
├── types/
│   └── express.d.ts
└── tests/
    └── *.test.ts
```

## Express Application
```typescript
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/environment';
import { errorHandler } from './middleware/error';
import { requestLogger } from './middleware/logging';
import routes from './routes';


const app: Application = express();


// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
}));


// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


// Compression
app.use(compression());


// Logging
app.use(requestLogger);


// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});


// API routes
app.use('/api/v1', routes);


// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});


// Error handling
app.use(errorHandler);


export default app;
```

## Router Structure
```typescript
// routes/users/routes.ts
import { Router, Request, Response } from 'express';
import { userController } from './controller';
import { authenticate } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import { createUserSchema, updateUserSchema } from './validation';


const router: Router = Router();


router.post(
  '/',
  authenticate,
  createUserSchema,
  validateRequest,
  userController.create
);

router.get(
  '/',
  authenticate,
  userController.list
);

router.get(
  '/:id',
  authenticate,
  userController.getById
);

router.patch(
  '/:id',
  authenticate,
  updateUserSchema,
  validateRequest,
  userController.update
);

router.delete(
  '/:id',
  authenticate,
  userController.delete
);


export default router;
```

## Controller with Error Handling
```typescript
// routes/users/controller.ts
import { Request, Response, NextFunction } from 'express';
import { userService } from './service';
import { CreateUserInput, UpdateUserInput } from './model';


export const userController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input: CreateUserInput = req.body;

      const user = await userService.create(input);

      res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, sort = '-createdAt' } = req.query;

      const { users, total } = await userService.list({
        page: Number(page),
        limit: Number(limit),
        sort: String(sort),
      });

      res.json({
        success: true,
        data: users,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const user = await userService.getById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: `User with ID ${id} not found`,
          },
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },
};
```

## Middleware
```typescript
// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';


export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}


export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'No token provided',
      },
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
      },
    });
  }
}


export function authorize(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
      return;
    }

    next();
  };
}
```

## Error Handling
```typescript
// middleware/error.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { config } from '../config/environment';


export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}


export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  if (err.name === 'UnauthorizedError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid authentication',
      },
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: config.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
    },
  });
}
```

## Testing
```typescript
// tests/users.test.ts
import request from 'supertest';
import app from '../app';
import { createTestUser, generateToken } from './fixtures';


describe('Users API', () => {
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    testUser = await createTestUser();
    authToken = generateToken(testUser);
  });

  describe('GET /api/v1/users', () => {
    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/users');

      expect(res.status).toBe(401);
    });

    it('should return list of users with authentication', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/users', () => {
    it('should create a new user', async () => {
      const newUser = {
        email: 'newuser@example.com',
        name: 'New User',
        password: 'securepassword123',
      };

      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(newUser.email);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```
