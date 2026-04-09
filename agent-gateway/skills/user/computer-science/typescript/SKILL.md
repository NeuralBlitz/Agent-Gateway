---
name: TypeScript
description: Typed superset of JavaScript that compiles to plain JavaScript, adding optional static types and class-based object-oriented programming.
license: Apache License 2.0
compatibility: TypeScript 4.0+
audience: Frontend developers, full-stack developers, enterprise teams
category: Programming Languages
---

# TypeScript

## What I do

I am a typed superset of JavaScript developed by Microsoft in 2012. I compile to plain JavaScript and add optional static types, interfaces, enums, and modern class-based object-oriented features. I help catch errors at compile-time rather than runtime, improve code documentation and autocomplete, and enable better tooling and IDE support. I am widely used in enterprise applications, Angular development, React/Vue projects, and any JavaScript project that benefits from static type checking.

## When to use me

Use TypeScript when working on large-scale applications, Angular projects (which require TypeScript), React/Vue projects with complex state management, enterprise applications requiring maintainability, teams collaborating on shared codebases, or when you want the safety of static typing with the flexibility of JavaScript.

## Core Concepts

- **Static Type System**: Types are checked at compile-time, catching type-related errors before runtime.
- **Type Inference**: TypeScript can often infer types automatically, reducing the need for explicit annotations.
- **Interfaces vs Types**: Interfaces define object shapes and can be extended/merged; types define unions, intersections, and aliases.
- **Generics**: Type-safe constructs that work with various data types while maintaining type safety.
- **Union and Intersection Types**: Combine multiple types using | (union) or & (intersection).
- **Utility Types**: Built-in types like Partial, Required, Readonly, Pick, Omit for common transformations.
- **Decorators (experimental)**: Metadata annotations for classes, methods, and properties (used extensively in Angular).
- **Modules and Namespaces**: Organize code with ES modules and internal namespaces for grouping related functionality.
- **Type Guards**: Narrow types within conditional blocks using typeof, instanceof, or custom type guards.
- **Advanced Patterns**: Conditional types, mapped types, template literal types for complex type manipulations.

## Code Examples

**Basic Types and Interfaces:**
```typescript
interface User {
  id: number;
  name: string;
  email?: string;  // Optional property
  readonly createdAt: Date;  // Read-only property
}

type UserUpdate = Partial<User>;

const createUser = (name: string, email?: string): User => {
  return {
    id: Math.random(),
    name,
    email,
    createdAt: new Date()
  };
};

const user: User = createUser("Alice", "alice@example.com");
console.log(user);
```

**Generics and Utility Types:**
```typescript
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

type UserResponse = ApiResponse<User>;
type PostResponse = ApiResponse<Post>;

const fetchData = async <T>(url: string): Promise<ApiResponse<T>> => {
  const response = await fetch(url);
  const data = await response.json();
  return { data, status: response.status, message: "Success" };
};

type PartialUser = Partial<User>;
type UserWithoutEmail = Omit<User, "email">;
type ReadonlyUser = Readonly<User>;

const updateUser = (user: User, updates: PartialUser): User => {
  return { ...user, ...updates };
};
```

**Advanced Type Patterns:**
```typescript
type Primitive = string | number | boolean | null | undefined;

type NonNullable<T> = T extends null | undefined ? never : T;

type Flatten<T> = T extends Array<infer U> ? U : T;

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type EventHandler<E extends string> = (event: E) => void;

type Coordinates = { x: number; y: number };
type NamedCoordinates = Coordinates & { name: string };

type Shape = 
  | { kind: "circle"; radius: number }
  | { kind: "square"; size: number }
  | { kind: "rectangle"; width: number; height: number };

const getArea = (shape: Shape): number => {
  switch (shape.kind) {
    case "circle": return Math.PI * shape.radius ** 2;
    case "square": return shape.size ** 2;
    case "rectangle": return shape.width * shape.height;
  }
};
```

**Classes and Access Modifiers:**
```typescript
abstract class Animal {
  protected name: string;
  private age: number;
  
  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }
  
  abstract makeSound(): void;
  
  getAge(): number {
    return this.age;
  }
  
  static createDefault(): Animal {
    return new Dog("Default", 1);
  }
}

class Dog extends Animal {
  private breed: string;
  
  constructor(name: string, age: number, breed: string = "Mixed") {
    super(name, age);
    this.breed = breed;
  }
  
  makeSound(): void {
    console.log(`${this.name} barks!`);
  }
  
  public getBreed(): string {
    return this.breed;
  }
}

const dog = new Dog("Buddy", 3, "Golden Retriever");
dog.makeSound();
```

## Best Practices

1. **Enable Strict Mode**: Use "strict": true in tsconfig.json to enable all strict type-checking options.
2. **Avoid any Type**: Use unknown for truly unknown types, and prefer specific types over any to maintain type safety.
3. **Use Interfaces for Objects**: Use interfaces for defining object shapes and class contracts, types for unions, intersections, and primitives.
4. **Leverage Type Inference**: Let TypeScript infer simple types, but add annotations for function signatures and complex cases.
5. **Use Discriminated Unions**: Tag union types with a common property for exhaustive type checking in switch statements.
6. **Prefer Immutable Patterns**: Use readonly for properties that shouldn't change, and const assertions for literal values.
7. **Write Declaration Files (.d.ts)**: Create type definitions for JavaScript libraries to provide type information to users.
8. **Use Generic Constraints Wisely**: Limit generics with extends to maintain type safety while allowing flexibility.
9. **Organize Types Separately**: Keep complex types in separate files or at the bottom of files for better organization.
10. **Use ESLint with TypeScript Support**: Configure eslint-plugin-typescript for linting TypeScript-specific issues.
