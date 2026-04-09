---
name: typescript
description: TypeScript typed superset of JavaScript for safer, more maintainable code
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: programming-languages
---
## What I do
- Write type-safe TypeScript code
- Use generics for reusable types
- Create interfaces and type aliases
- Implement advanced utility types
- Configure tsconfig for projects
- Handle strict null checking

## When to use me
When building JavaScript applications that need type safety and better tooling.

## Basic Types
```typescript
let name: string = "John";
let age: number = 30;
let isActive: boolean = true;
let numbers: number[] = [1, 2, 3];
let anything: any = "hello";
let unknown: unknown = "world";

function log(): void { }
function fail(): never { throw new Error(); }
```

## Interfaces & Types
```typescript
interface User {
  id: number;
  name: string;
  email?: string;
  readonly createdAt: Date;
}

type Status = "pending" | "active" | "disabled";
type ID = string | number;
```

## Functions
```typescript
function greet(name: string): string {
  return `Hello, ${name}`;
}

const add = (a: number, b: number): number => a + b;

function createUser(name: string, age?: number = 18): User {
  return { name, age };
}
```

## Generics
```typescript
function identity<T>(value: T): T {
  return value;
}

interface Box<T> {
  value: T;
}
```

## Utility Types
```typescript
type PartialUser = Partial<User>;
type UserPreview = Pick<User, "id" | "name">;
type UserWithoutPassword = Omit<User, "password">;
```
