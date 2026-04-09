---
name: javascript
description: JavaScript programming language for web development
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: programming-languages
---
## What I do
- Write modern JavaScript (ES6+)
- Handle async operations with promises and async/await
- Use array methods (map, filter, reduce)
- Work with objects and arrays
- Handle DOM manipulation
- Use modules and imports
- Implement error handling

## When to use me
When building web applications or server-side code with Node.js.

## Variables & Types
```javascript
// Let and const
const PI = 3.14159;
let count = 0;

// Template literals
const greeting = `Hello, ${name}!`;

// Destructuring
const { name, age } = user;
const [first, second] = array;

// Spread operator
const copy = { ...original, newProp: value };
const merged = [...arr1, ...arr2];
```

## Arrays
```javascript
const numbers = [1, 2, 3, 4, 5];

// Map, Filter, Reduce
const doubled = numbers.map(n => n * 2);
const evens = numbers.filter(n => n % 2 === 0);
const sum = numbers.reduce((acc, n) => acc + n, 0);

// Find
const found = numbers.find(n => n > 3);
const index = numbers.findIndex(n => n === 3);

// Other methods
numbers.includes(3);
numbers.flatMap(x => [x, x * 2]);
```

## Objects
```javascript
const user = {
  name: 'John',
  age: 30,
  greet() { return `Hi, I'm ${this.name}`; }
};

// Shorthand
const name = 'John';
const obj = { name };

// Optional chaining
const city = user?.address?.city;

// Nullish coalescing
const value = data ?? 'default';
```

## Async
```javascript
// Promises
fetch('/api/data')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));

// Async/await
async function fetchData() {
  try {
    const res = await fetch('/api/data');
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(err);
  }
}

// Parallel
const [users, posts] = await Promise.all([
  fetch('/api/users').then(r => r.json()),
  fetch('/api/posts').then(r => r.json())
]);
```

## Modules
```javascript
// export.js
export const API_URL = 'https://api.example.com';
export function fetchData() { }
export default class MyClass { }

// import.js
import MyClass, { fetchData, API_URL } from './export.js';
```
