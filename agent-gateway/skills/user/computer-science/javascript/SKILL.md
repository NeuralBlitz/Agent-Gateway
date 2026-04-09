---
name: JavaScript
description: Dynamic, prototype-based scripting language that powers interactive web experiences and runs in all major browsers and Node.js environments.
license: MIT License
compatibility: ECMAScript 2021+ (ES12)
audience: Frontend developers, full-stack developers, Node.js backend developers
category: Programming Languages
---

# JavaScript

## What I do

I am a dynamic, prototype-based scripting language created by Brendan Eich in 1995. I started as a simple scripting language for web browsers but have evolved into one of the most popular and versatile programming languages. I power interactive web experiences, server-side applications (Node.js), mobile apps (React Native, Ionic), desktop applications (Electron), and IoT devices. I support multiple programming paradigms including procedural, object-oriented, and functional programming. My event-driven, non-blocking I/O model makes me ideal for building responsive web applications and scalable network services.

## When to use me

Use JavaScript when building interactive web frontends with React/Vue/Angular, server-side applications with Node.js/Express/Deno, real-time applications with WebSockets, cross-platform mobile apps with React Native, desktop applications with Electron, or when building full-stack JavaScript applications.

## Core Concepts

- **Dynamic Typing**: Variables can hold any type and types are determined at runtime.
- **Prototype-Based Inheritance**: Objects inherit directly from other objects via prototypes rather than classes.
- **First-Class Functions**: Functions are treated as first-class citizens that can be assigned to variables, passed as arguments, and returned from other functions.
- **Event Loop and Non-Blocking I/O**: Asynchronous operations don't block the main thread, enabling responsive applications.
- **Closures**: Functions that capture and remember their lexical environment, enabling powerful patterns like partial application and module patterns.
- **this Keyword**: Context-dependent reference to the current object, binding varies by how function is called.
- **Event-Driven Programming**: Applications respond to events like user actions, network requests, and timers.
- **Modules (ES6+)**: Official module system with import/export statements for code organization and dependency management.
- **Async/Await**: Syntactic sugar over Promises for writing asynchronous code that looks synchronous.
- **Destructuring and Spread**: Convenient syntax for extracting values from objects and arrays and creating new instances.

## Code Examples

**Modern ES6+ Syntax:**
```javascript
const greet = (name, greeting = "Hello") => `${greeting}, ${name}!`;

const numbers = [1, 2, 3, 4, 5];
const [first, second, ...rest] = numbers;

const user = { name: "Alice", age: 30, city: "NYC" };
const { name, age } = user;

const doubled = numbers.map(n => n * 2);
const sum = numbers.reduce((acc, n) => acc + n, 0);

console.log(greet("World"));
console.log(doubled, sum);
```

**Asynchronous Programming with Promises and Async/Await:**
```javascript
const fetchUser = async (userId) => {
  try {
    const response = await fetch(`https://api.example.com/users/${userId}`);
    if (!response.ok) throw new Error('User not found');
    const user = await response.json();
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

const fetchMultipleUsers = async (userIds) => {
  const promises = userIds.map(id => fetchUser(id));
  const users = await Promise.all(promises);
  return users;
};

fetchMultipleUsers([1, 2, 3])
  .then(users => console.log(users))
  .catch(err => console.error(err));
```

**Object-Oriented Patterns:**
```javascript
class Animal {
  constructor(name) {
    this.name = name;
  }
  
  speak() {
    console.log(`${this.name} makes a sound.`);
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);
    this.breed = breed;
  }
  
  speak() {
    console.log(`${this.name} barks!`);
  }
  
  static create(name, breed) {
    return new Dog(name, breed);
  }
}

const buddy = Dog.create("Buddy", "Golden Retriever");
buddy.speak();

const animals = [new Dog("Rex", "Labrador"), new Cat("Whiskers", "Siamese")];
animals.forEach(animal => animal.speak());
```

**Module System:**
```javascript
// math.js
export const add = (a, b) => a + b;
export const multiply = (a, b) => a * b;
export default class Calculator {
  static divide(a, b) {
    if (b === 0) throw new Error("Division by zero");
    return a / b;
  }
}

// main.js
import Calculator, { add, multiply } from './math.js';

console.log(add(2, 3)); // 5
console.log(multiply(4, 5)); // 20
console.log(Calculator.divide(10, 2)); // 5
```

## Best Practices

1. **Use const by Default**: Declare variables with const unless you need to reassign, making intent clear and enabling optimizations.
2. **Prefer Arrow Functions**: Use arrow functions for callbacks and methods that don't need their own this binding.
3. **Handle Async Errors**: Always handle Promise rejections with .catch() or try/catch with async/await to avoid unhandled promise rejections.
4. **Use Strict Mode**: Enable "use strict" at the top of files to catch common mistakes and enable stricter parsing.
5. **Avoid Global Variables**: Use IIFE, modules, or blocks to encapsulate code and avoid polluting the global namespace.
6. **Use Descriptive Variable Names**: Avoid single-letter variable names except for loop counters and mathematical variables.
7. **Leverage Modern Syntax**: Use destructuring, spread operators, template literals, and optional chaining (?.) for cleaner code.
8. **Handle Null and Undefined Safely**: Use optional chaining (?.) and nullish coalescing (??) operators to avoid TypeErrors.
9. **Write Pure Functions When Possible**: Functions without side effects are easier to test, reason about, and compose.
10. **Use Linting Tools**: Configure ESLint with appropriate rules (like Airbnb or Standard) to enforce code quality.
