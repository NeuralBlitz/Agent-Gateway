---
name: typescript
description: Typed superset of JavaScript that compiles to plain JavaScript
category: web-development
difficulty: intermediate
tags: [language, typed, javascript, transpiler]
author: Microsoft
version: 5.3
last_updated: 2024-01-20
---

# TypeScript

## What I Do

I am TypeScript, a strongly typed programming language that builds on JavaScript. I add optional static typing, classes, interfaces, and modern ECMAScript features to help you build more robust, maintainable JavaScript applications. I serve as a superset of JavaScript, meaning any valid JavaScript code is also valid TypeScript code. I compile down to plain JavaScript that can run in any browser or JavaScript runtime like Node.js. My type system catches errors at compile time rather than runtime, significantly reducing bugs and improving code quality. I provide excellent tooling support including autocompletion, refactoring, and inline documentation through IDE integrations. With each ECMAScript proposal, I implement new features and syntax while maintaining backward compatibility. My type inference capabilities let you enjoy type safety without excessive boilerplate, while explicit types provide clarity and documentation for complex APIs.

## When to Use Me

- Building large-scale JavaScript applications
- Projects requiring static type checking for error prevention
- Team environments where code maintainability is critical
- Library and framework development
- Refactoring legacy JavaScript codebases
- Applications needing IDE support for autocomplete and navigation
- Projects requiring compile-time error detection
- Building public APIs or packages for others to use
- Any project where code quality and maintainability are priorities

## Core Concepts

**Type Annotations**: Explicit type declarations using `: Type` syntax after variables, parameters, and function returns.

**Type Inference**: TypeScript's ability to automatically deduce types from context, reducing explicit type annotations.

**Interfaces**: Named type definitions describing object shapes, supporting extends for inheritance and optional properties.

**Type Aliases**: Custom names for types using the `type` keyword, useful for unions, intersections, and primitives.

**Generics**: Parameterized types that allow functions, classes, and interfaces to work with multiple data types while maintaining type safety.

**Union and Intersection Types**: Combining multiple types with `|` for unions (either/or) and `&` for intersections (all/and).

**Utility Types**: Built-in generic types like `Partial<T>`, `Required<T>`, `Pick<T>`, `Record<K,V>` for common transformations.

**Modules and Namespaces**: Organizing code with ES modules (`import`/`export`) and internal namespaces for logical grouping.

## Code Examples

### Example 1: Advanced Generics with Constraints
```typescript
// Generic repository pattern
interface Entity {
  id: string | number
  createdAt: Date
  updatedAt?: Date
}

interface Repository<T extends Entity> {
  findById(id: T['id']): Promise<T | null>
  findAll(): Promise<T[]>
  create(data: Omit<T, 'id' | 'createdAt'>): Promise<T>
  update(id: T['id'], data: Partial<Omit<T, 'id'>>): Promise<T>
  delete(id: T['id']): Promise<void>
}

abstract class BaseRepository<T extends Entity> implements Repository<T> {
  protected collection: Map<T['id'], T> = new Map()
  
  async findById(id: T['id']): Promise<T | null> {
    return this.collection.get(id) || null
  }
  
  async findAll(): Promise<T[]> {
    return Array.from(this.collection.values())
  }
  
  async create(data: Omit<T, 'id' | 'createdAt'>): Promise<T> {
    const id = crypto.randomUUID()
    const entity = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: undefined
    } as T
    this.collection.set(id, entity)
    return entity
  }
  
  async update(id: T['id'], data: Partial<Omit<T, 'id'>>): Promise<T> {
    const existing = await this.findById(id)
    if (!existing) throw new Error(`Entity ${id} not found`)
    
    const updated = { 
      ...existing, 
      ...data, 
      updatedAt: new Date() 
    }
    this.collection.set(id, updated)
    return updated
  }
  
  async delete(id: T['id']): Promise<void> {
    this.collection.delete(id)
  }
}

// Usage
interface User extends Entity {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  preferences?: {
    theme: 'light' | 'dark'
    notifications: boolean
  }
}

class UserRepository extends BaseRepository<User> {}

const userRepo = new UserRepository()

const newUser = await userRepo.create({
  email: 'alice@example.com',
  name: 'Alice',
  role: 'admin',
  preferences: { theme: 'dark', notifications: true }
})

const adminUsers = await userRepo.findAll().then(users => 
  users.filter(u => u.role === 'admin')
)
```

### Example 2: Discriminated Unions and Pattern Matching
```typescript
// State machine with discriminated unions
type AsyncState<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

class AsyncMachine<T> {
  state: AsyncState<T> = { status: 'idle' }
  
  async load(promise: Promise<T>): Promise<void> {
    this.state = { status: 'loading' }
    try {
      const data = await promise
      this.state = { status: 'success', data }
    } catch (error) {
      this.state = { status: 'error', error: error as Error }
    }
  }
  
  // Pattern matching helper
  match<R>(
    patterns: {
      idle: () => R
      loading: () => R
      success: (data: T) => R
      error: (error: Error) => R
    }
  ): R {
    const { status } = this.state
    switch (status) {
      case 'idle': return patterns.idle()
      case 'loading': return patterns.loading()
      case 'success': return patterns.success(this.state.data)
      case 'error': return patterns.error(this.state.error)
    }
  }
  
  get isLoading() { return this.state.status === 'loading' }
  get isSuccess() { return this.state.status === 'success' }
  get isError() { return this.state.status === 'error' }
}

// Usage
interface Product {
  id: string
  name: string
  price: number
}

const productLoader = new AsyncMachine<Product>()

// Render helper
function renderState<T>(machine: AsyncMachine<T>): string {
  return machine.match({
    idle: () => 'Click to load data',
    loading: () => 'Loading...',
    success: (data) => `Loaded: ${data.name} - $${data.price}`,
    error: (err) => `Error: ${err.message}`
  })
}
```

### Example 3: Type Guards and Assertion Functions
```typescript
// Runtime type checking
type JSONValue = 
  | string 
  | number 
  | boolean 
  | null 
  | JSONValue[] 
  | { [key: string]: JSONValue }

interface User {
  id: string
  name: string
  email: string
  age?: number
}

// Type guards
function isUser(value: unknown): value is User {
  if (!value || typeof value !== 'object') return false
  
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.email === 'string' &&
    (candidate.age === undefined || typeof candidate.age === 'number')
  )
}

function isUserArray(value: unknown): value is User[] {
  return Array.isArray(value) && value.every(isUser)
}

// Assertion functions
function assertUser(value: unknown): asserts value is User {
  if (!isUser(value)) {
    throw new Error(`Expected User, got: ${JSON.stringify(value)}`)
  }
}

function assertHasProperty<T extends string>(
  obj: unknown, 
  prop: T
): asserts obj is Record<T, unknown> {
  if (!obj || typeof obj !== 'object' || !(prop in (obj as object))) {
    throw new Error(`Object missing property: ${prop}`)
  }
}

// Usage with validation
function processAPIResponse(data: unknown): User[] {
  assertHasProperty(data, 'users')
  assertHasProperty(data.users, '0') // Check array
  
  if (isUserArray(data.users)) {
    return data.users
  }
  
  throw new Error('Invalid users array')
}

// Narrowing with type guards
function handleValue(value: JSONValue): string {
  if (typeof value === 'string') {
    return value.toUpperCase()
  }
  if (typeof value === 'number') {
    return value.toFixed(2)
  }
  if (Array.isArray(value)) {
    return `[${value.map(handleValue).join(', ')}]`
  }
  if (value === null) {
    return 'null'
  }
  return `unknown: ${typeof value}`
}
```

### Example 4: Mapped Types and Conditional Types
```typescript
// Advanced mapped types
type Readonly<T> = { readonly [K in keyof T]: T[K] }
type Partial<T> = { [K in keyof T]?: T[K] }

interface APIResponse {
  id: number
  name: string
  email: string
  createdAt: Date
  metadata: {
    source: string
    version: number
  }
}

// Built-in utility types demo
type Nullable<T> = { [K in keyof T]: T[K] | null }
type PickRequired<T> = { [K in keyof T as T[K] extends Required<T>[K] ? K : never]: T[K] }
type OptionalKeys<T> = { [K in keyof T]: undefined extends T[K] ? K : never }[keyof T]

// Conditional types with infer
type ReturnType<T> = T extends (...args: unknown[]) => infer R ? R : never
type ConstructorParam<T> = T extends new (...args: infer P) => unknown ? P : never
type ArrayElement<T> = T extends readonly (infer E)[] ? E : never

// Recursive conditional types
type DeepPartial<T> = T extends Function | Date | RegExp
  ? T
  : T extends readonly unknown[]
    ? DeepPartial<T>[]
    : { [K in keyof T]?: DeepPartial<T[K]> }

// Mapped type modifiers
type Getters<T> = {
  [K in keyof T as `get${Capitalize<K & string>}`]: () => T[K]
}

type Setters<T> = {
  [K in keyof T as `set${Capitalize<K & string>}`]: (value: T[K]) => void
}

// Complete type transformation
type Observable<T> = {
  subscribe: (callback: (value: T) => void) => () => void
  getValue: () => T
}

function createObservable<T>(initialValue: T): Observable<T> {
  const listeners = new Set<(value: T) => void>()
  let value = initialValue
  
  return {
    subscribe: (callback) => {
      listeners.add(callback)
      callback(value)
      return () => listeners.delete(callback)
    },
    getValue: () => value
  }
}

// Usage
type ObservableUser = Observable<APIResponse>
type ObservableUserGetters = Getters<APIResponse>
type ObservableUserSetters = Setters<APIResponse>

const user$ = createObservable<APIResponse>({
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  createdAt: new Date(),
  metadata: { source: 'web', version: 1 }
})

user$.subscribe(user => console.log('User updated:', user.name))
```

### Example 5: Module System and Declaration Merging
```typescript
// Declaration merging - extending interfaces
interface Window {
  __INITIAL_DATA__?: Record<string, unknown>
  ga?: (command: string, ...args: unknown[]) => void
}

// Extending built-in types
interface Array<T> {
  groupBy<K extends keyof any>(key: keyof T): Record<K, T[]>
  chunk(size: number): T[][]
}

Array.prototype.chunk = function<T>(this: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < this.length; i += size) {
    chunks.push(this.slice(i, i + size))
  }
  return chunks
}

// Module augmentation
// math.ts
export interface Vector2D {
  x: number
  y: number
}

export function createVector(x: number, y: number): Vector2D {
  return { x, y }
}

// extended-math.ts
import { Vector2D } from './math'

declare module './math' {
  interface Vector2D {
    magnitude(): number
    normalize(): Vector2D
    add(other: Vector2D): Vector2D
    dot(other: Vector2D): number
  }
}

Vector2D.prototype.magnitude = function(this: Vector2D) {
  return Math.sqrt(this.x ** 2 + this.y ** 2)
}

Vector2D.prototype.normalize = function(this: Vector2D) {
  const mag = this.magnitude()
  return mag === 0 ? { x: 0, y: 0 } : { x: this.x / mag, y: this.y / mag }
}

// Global module augmentation
declare global {
  interface Promise<T> {
    finally(callback: () => void): Promise<T>
  }
}
```

## Best Practices

- Enable `strict: true` in tsconfig.json for maximum type safety
- Use interfaces for object shapes, type aliases for unions/primitives
- Prefer composition over inheritance with type composition
- Use `unknown` instead of `any` for truly unknown values
- Exhaustiveness checking with never type for exhaustive switches
- Create branded types for primitive type refinement
- Use const assertions for immutable array literals
- Leverage IDE features: go-to-definition, find-all-references
- Incrementally migrate JavaScript to TypeScript with allowJs
- Use declaration files (.d.ts) for type documentation

## Core Competencies

- Static type checking with compile-time error detection
- Generics for reusable, type-safe components
- Advanced type system features (conditional, mapped, template literal types)
- Type guards and assertion functions for runtime validation
- Declaration merging and module augmentation
- Utility types for common transformations
- Discriminated unions for pattern matching
- ECMAScript feature support and transpilation
- IDE integration for autocomplete and refactoring
- Integration with build tools and frameworks
