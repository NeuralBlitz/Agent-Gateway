---
name: Python
description: High-level interpreted programming language known for its simplicity, readability, and versatility in web development, data science, AI/ML, and automation.
license: Python Software Foundation License
compatibility: Python 3.8+
audience: Developers, data scientists, ML engineers, automation specialists
category: Programming Languages
---

# Python

## What I do

I am a high-level, interpreted programming language designed by Guido van Rossum in 1991. I emphasize code readability with my use of significant whitespace and support for multiple programming paradigms including procedural, object-oriented, and functional programming. I excel in rapid application development, scripting, numerical computing, artificial intelligence, machine learning, data analysis, web development, and automation. My extensive standard library and package ecosystem (via pip) make me one of the most versatile and popular programming languages in the world.

## When to use me

Use Python when you need rapid development and prototyping, data analysis and visualization, machine learning and deep learning with TensorFlow/PyTorch, scientific computing with NumPy/SciPy, web development with Django/Flask/FastAPI, automation scripts and DevOps tooling, API integrations and web scraping, educational programming and learning to code, or when development speed is more important than execution speed.

## Core Concepts

- **Dynamic Typing**: Variables are bound to types at runtime, enabling flexible data handling and rapid development.
- **Interpreted Execution**: Code is executed line-by-line by the Python interpreter, facilitating debugging and interactive development.
- **Indentation-Based Syntax**: Code blocks are defined by indentation rather than braces, enforcing clean and readable code structure.
- **Garbage Collection**: Automatic memory management through reference counting and cyclic garbage collection.
- **Duck Typing**: Object type is determined by its behavior rather than its explicit type annotation.
- **List/Dict Comprehensions**: Concise syntax for creating lists, dictionaries, and sets based on existing iterables.
- **Generators and Iterators**: Memory-efficient iteration patterns using yield statements and the iterator protocol.
- **Decorators**: Meta-programming pattern for modifying or extending function and class behavior.
- **Context Managers**: Protocol for resource management using the with statement for automatic cleanup.
- **Type Hints (3.5+)**: Optional static typing for improved code clarity, tooling support, and catch errors early.

## Code Examples

**Hello World and Basic Syntax:**
```python
def greet(name: str) -> str:
    """Return a greeting message for the given name."""
    return f"Hello, {name}!"

if __name__ == "__main__":
    message = greet("World")
    print(message)
```

**Data Processing with List Comprehensions and Generators:**
```python
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

squares = [n**2 for n in numbers if n % 2 == 0]
even_sum = sum(n for n in numbers if n > 0)

def fibonacci(n: int) -> list:
    """Generate Fibonacci sequence up to n terms."""
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

fib_gen = fibonacci(10)
print(list(fib_gen))
```

**Object-Oriented Programming:**
```python
from abc import ABC, abstractmethod
from typing import List

class Animal(ABC):
    def __init__(self, name: str) -> None:
        self.name = name
    
    @abstractmethod
    def speak(self) -> str:
        pass

class Dog(Animal):
    def speak(self) -> str:
        return f"{self.name} says Woof!"

class Cat(Animal):
    def speak(self) -> str:
        return f"{self.name} says Meow!"

animals: List[Animal] = [Dog("Buddy"), Cat("Whiskers")]
for animal in animals:
    print(animal.speak())
```

**Error Handling and Context Managers:**
```python
import contextlib

class FileProcessor:
    def __init__(self, filename: str) -> None:
        self.filename = filename
    
    def __enter__(self):
        self.file = open(self.filename, 'r')
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.file:
            self.file.close()
        return False

@contextlib.contextmanager
def database_connection():
    print("Connecting to database...")
    try:
        yield "db_connection"
    finally:
        print("Closing database connection...")

with FileProcessor("data.txt") as processor:
    content = processor.file.read()
    
with database_connection() as conn:
    print(f"Using connection: {conn}")
```

## Best Practices

1. **Follow PEP 8 Style Guide**: Use consistent naming conventions (snake_case for variables/functions, PascalCase for classes), 4 spaces for indentation, 79-character line limit for code, and meaningful variable names.
2. **Use Type Hints**: Add type annotations for function signatures and class attributes to improve code clarity and enable static analysis tools.
3. **Leverage Virtual Environments**: Use venv or conda to create isolated environments for each project to avoid dependency conflicts.
4. **Write Docstrings**: Document all public modules, functions, classes, and methods using either Google, NumPy, or reST docstring format.
5. **Use List/Dict Comprehensions Appropriately**: Prefer comprehensions for simple transformations, but use explicit loops for complex logic to maintain readability.
6. **Handle Exceptions Specifically**: Catch specific exceptions rather than using bare except clauses, and always clean up resources using try/finally or context managers.
7. **Prefer Composition over Inheritance**: Use composition and interfaces to create flexible, loosely-coupled designs rather than deep inheritance hierarchies.
8. **Use __name__ == "__main__" Guard**: Wrap main execution code in this guard to allow modules to be imported without executing side effects.
9. **Optimize Only When Needed**: Use profiling tools (cProfile, line_profiler) to identify bottlenecks before optimizing, and prefer algorithmic improvements over micro-optimizations.
10. **Write Tests**: Use pytest or unittest to write unit tests, aim for high coverage on critical paths, and use mocking for external dependencies.
