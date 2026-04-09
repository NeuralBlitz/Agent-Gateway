---
name: Java
description: Object-oriented, class-based programming language designed to have as few implementation dependencies as possible, running on the Java Virtual Machine (JVM).
license: GNU General Public License v2 with Classpath Exception
compatibility: Java 8+ ( LTS versions: 8, 11, 17, 21)
audience: Enterprise developers, Android developers, backend engineers
category: Programming Languages
---

# Java

## What I do

I am an object-oriented, class-based programming language originally developed by James Gosling at Sun Microsystems in 1995. I run on the Java Virtual Machine (JVM), which provides platform independence through "write once, run anywhere" capability. I am statically typed, compiled to bytecode that runs on the JVM, and designed to be robust, secure, and portable. I excel in enterprise applications, Android development, large-scale systems, microservices architecture, and financial services. My strong typing, automatic memory management (garbage collection), and rich ecosystem make me a cornerstone of modern software development.

## When to use me

Use Java when building enterprise-scale applications and microservices, Android mobile applications, large-scale web applications and APIs, financial and trading systems, distributed systems and cloud-native applications, microservices with Spring Boot/Micronaut, or when you need strong backward compatibility and long-term support.

## Core Concepts

- **Object-Oriented Programming**: Everything is an object (except primitives), supporting encapsulation, inheritance, polymorphism, and abstraction.
- **JVM bytecode**: Java code is compiled to bytecode that runs on the JVM, enabling platform independence and JIT compilation.
- **Automatic Memory Management**: Garbage collection automatically reclaims memory from unreachable objects.
- **Strong Static Typing**: Variable types are checked at compile-time, catching many errors before runtime.
- **Generics**: Type-safe containers and methods that work with different data types while maintaining type safety at compile time.
- **Multithreading and Concurrency**: Built-in support for concurrent programming through Thread class, ExecutorService, and modern concurrency utilities.
- **Functional Programming (Java 8+)**: Lambda expressions, Stream API, and method references for functional-style operations on collections.
- **Exception Handling**: Robust exception handling with checked exceptions, unchecked exceptions, and finally blocks for resource cleanup.
- **Interface and Abstract Classes**: Contracts for classes to implement, with default methods (Java 8+) allowing interface evolution.
- **Module System (Java 9+)**: Official module system for strong encapsulation and explicit dependencies between components.

## Code Examples

**Basic Class and Object:**
```java
public class Person {
    private String name;
    private int age;
    
    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    public String greet() {
        return "Hello, I'm " + name + " and I'm " + age + " years old.";
    }
    
    public static void main(String[] args) {
        Person person = new Person("Alice", 30);
        System.out.println(person.greet());
    }
}
```

**Generics and Collections:**
```java
import java.util.*;
import java.util.stream.*;

public class CollectionExample {
    public static void main(String[] args) {
        List<String> names = new ArrayList<>();
        names.add("Alice");
        names.add("Bob");
        names.add("Charlie");
        
        Map<String, Integer> nameLengths = new HashMap<>();
        nameLengths.put("Alice", 5);
        nameLengths.put("Bob", 3);
        
        List<Integer> lengths = names.stream()
            .map(String::length)
            .sorted()
            .collect(Collectors.toList());
        
        System.out.println(lengths);
    }
}
```

**Functional Programming with Streams:**
```java
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

public class StreamExample {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
        
        int sum = numbers.stream()
            .filter(n -> n % 2 == 0)
            .mapToInt(n -> n * n)
            .sum();
        
        Optional<Integer> max = numbers.stream()
            .max(Integer::compareTo);
        
        System.out.println("Sum of even squares: " + sum);
        System.out.println("Max: " + max.orElse(0));
    }
}
```

**Concurrency with ExecutorService:**
```java
import java.util.concurrent.*;

public class ConcurrencyExample {
    public static void main(String[] args) throws InterruptedException {
        ExecutorService executor = Executors.newFixedThreadPool(4);
        
        for (int i = 0; i < 10; i++) {
            final int taskId = i;
            executor.submit(() -> {
                System.out.println("Task " + taskId + " executing on " + 
                    Thread.currentThread().getName());
                return taskId * 2;
            });
        }
        
        executor.shutdown();
        executor.awaitTermination(1, TimeUnit.MINUTES);
        System.out.println("All tasks completed");
    }
}
```

## Best Practices

1. **Follow Naming Conventions**: Classes use PascalCase, methods and variables use camelCase, constants use UPPER_SNAKE_CASE, and packages use lowercase with dots.
2. **Prefer Composition over Inheritance**: Use interfaces and composition to create flexible designs rather than deep inheritance chains.
3. **Use Effective Final Variables**: In lambda expressions, use effectively final variables to avoid compilation errors and improve clarity.
4. **Handle Nulls Safely**: Use Optional (Java 8+) to represent nullable values and avoid NullPointerException.
5. **Use Try-with-Resources**: Automatically close resources implementing AutoCloseable interface, replacing traditional try-finally blocks.
6. **Prefer Immutable Objects**: Create immutable classes whenever possible for thread safety and simpler reasoning about code.
7. **Write Unit Tests**: Use JUnit 5 and Mockito for testing, follow AAA pattern (Arrange, Act, Assert), and achieve high code coverage on critical paths.
8. **Use Streams Appropriately**: Prefer loops for simple iterations and side effects, use streams for transformations and aggregations.
9. **Leverage Modern Java Features**: Use records (Java 16+) for data carriers, sealed classes for controlled inheritance, and pattern matching (Java 16+).
10. **Optimize JVM Arguments**: Tune garbage collection, heap size, and JIT compiler settings based on application characteristics.
