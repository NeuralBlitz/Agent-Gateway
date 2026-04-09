---
name: typescript
description: Typed superset of JavaScript that compiles to plain JavaScript
category: web-development
---

# TypeScript

## What I Do

TypeScript is a typed superset of JavaScript that compiles to plain JavaScript, developed by Microsoft. I add optional static typing and class-based object-oriented programming to JavaScript, enabling better tooling, error detection, and code organization. I run anywhere JavaScript runs, making me compatible with all JavaScript environments including browsers, Node.js, and Deno.

I excel at improving code quality and developer productivity through compile-time type checking. IDEs provide better autocomplete, refactoring support, and documentation with TypeScript types. TypeScript catches common errors before runtime, reducing bugs in production. My type system scales from simple type annotations to advanced generic programming patterns.

## When to Use Me

Choose TypeScript for any JavaScript project where code quality and maintainability matter. I am particularly valuable for large codebases with multiple developers, providing documentation through types and catching errors early. TypeScript is ideal for projects that will grow over time or need long-term maintenance. Avoid TypeScript for simple scripts, rapid prototyping where typing slows iteration, or teams unfamiliar with static typing concepts.

## Core Concepts

TypeScript adds types to JavaScript variables, function parameters, return values, and object properties. The type system is structural, meaning type compatibility is based on shape rather than name. Basic types include number, string, boolean, array, tuple, enum, and object. Advanced types include union types, intersection types, mapped types, and conditional types. Generics enable creating reusable components that work with multiple types while preserving type safety.

Interfaces define object shapes, while type aliases create names for complex types. Type assertions tell TypeScript to treat a value as a specific type when you know more than the compiler. Type guards narrow types within conditional blocks. Module systems include ES modules and CommonJS, with type declarations providing types for JavaScript libraries.

## Code Examples

```typescript
// Type aliases and interfaces
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  preferences?: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

type UserUpdate = Partial<Omit<User, 'id'>>;

// Generics
function getFirst<T>(array: T[]): T | undefined {
  return array[0];
}

function map<T, U>(array: T[], transform: (item: T) => U): U[] {
  return array.map(transform);
}

class Cache<T> {
  private store = new Map<string, T>();
  
  set(key: string, value: T): void {
    this.store.set(key, value);
  }
  
  get(key: string): T | undefined {
    return this.store.get(key);
  }
  
  has(key: string): boolean {
    return this.store.has(key);
  }
}

// Utility types
type ReadonlyUser = Readonly<User>;
type RequiredUser = Required<User>;
type PickUser = Pick<User, 'id' | 'name'>;
type RecordUser = Record<string, User>;

// Conditional types
type IsString<T> = T extends string ? true : false;
type MessageOf<T> = T extends { message: unknown } ? T['message'] : never;

// Mapped types
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type PartialWithNull<T> = {
  [P in keyof T]: T[P] | null;
};

// Function types
type Callback<T> = (error: Error | null, result?: T) => void;
type AsyncCallback<T> = Promise<T>;
type Constructor<T> = new (...args: any[]) => T;

// Usage
function createUser(id: string, name: string, email: string): User {
  return { id, name, email, role: 'user' };
}

async function fetchUsers(): Promise<User[]> {
  const response = await fetch('/api/users');
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}

function processUsers(users: User[], callback: (user: User) => boolean): User[] {
  return users.filter(callback);
}

const cache = new Cache<User>();
cache.set('user1', { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin' });
```

```typescript
// Advanced patterns
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

type Unpacked<T> = 
  T extends (infer U)[] ? U :
  T extends Promise<infer U> ? U :
  T;

type TupleToUnion<T extends readonly any[]> = T[number];

// Union types with discriminants
type LoadingState = { status: 'loading' };
type SuccessState<T> = { status: 'success'; data: T };
type ErrorState = { status: 'error'; error: Error };
type AsyncState<T> = LoadingState | SuccessState<T> | ErrorState;

function handleAsyncState<T>(state: AsyncState<T>): T | null {
  if (state.status === 'success') return state.data;
  if (state.status === 'error') return null;
  return null;
}

// Class with generics and decorators
function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@sealed
class Repository<T extends { id: string }> {
  private items = new Map<string, T>();
  
  constructor(private endpoint: string) {}
  
  async findAll(): Promise<T[]> {
    const response = await fetch(this.endpoint);
    return response.json();
  }
  
  async findById(id: string): Promise<T | undefined> {
    const items = await this.findAll();
    return items.find(item => item.id === id);
  }
  
  save(item: T): void {
    this.items.set(item.id, item);
  }
  
  remove(id: string): boolean {
    return this.items.delete(id);
  }
}

// Module augmentation
declare module './user' {
  interface User {
    lastLogin?: Date;
  }
}

// Type assertions
const userElement = document.getElementById('user') as HTMLElement;
const userData = JSON.parse(localStorage.getItem('user') || '{}') as User;
```

## Best Practices

Enable strict mode in TypeScript configuration to catch more potential errors. Use interfaces for object shapes that will be implemented or extended, and type aliases for unions, primitives, and complex types. Prefer union types and enums over string literals for type safety. Use generics over any types to maintain type safety while allowing flexibility.

Use readonly for properties that should not be mutated. Implement proper null checking with non-null assertions only when absolutely necessary. Use type guards and assertion functions for complex type narrowing. Keep type definitions in separate files for large projects. Generate type declarations from TypeScript code for JavaScript libraries.

## Common Patterns

The factory pattern uses generics to create objects with type-safe construction. The builder pattern chains method calls with proper type inference for optional parameters. The strategy pattern uses union types to represent different behaviors with type-safe selection.

The event system pattern uses type-safe event handlers with generics for event data. The repository pattern uses generics for consistent data access with type-safe queries. The dependency injection pattern uses constructor injection with interface types for flexible mocking.
