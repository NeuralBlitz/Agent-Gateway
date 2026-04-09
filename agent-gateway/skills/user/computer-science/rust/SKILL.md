---
name: Rust
description: Systems programming language focused on safety, performance, and concurrency without garbage collection.
license: MIT or Apache 2.0
compatibility: Rust 1.50+
audience: Systems programmers, WebAssembly developers, security-focused engineers
category: Programming Languages
---

# Rust

## What I do

I am a systems programming language designed by Graydon Hoare and sponsored by Mozilla, first released in 2010. I provide memory safety without garbage collection through compile-time ownership checking, fearless concurrency, and zero-cost abstractions. I combine low-level control with high-level ergonomics, making systems programming safer and more productive. I am widely used for WebAssembly, operating systems (Redox, Tock), browsers (Firefox's Servo), blockchain implementations, and performance-critical applications where memory safety is paramount.

## When to use me

Use Rust when building performance-critical applications, WebAssembly modules for web and edge computing, operating systems and drivers, blockchain and cryptocurrency implementations, CLI tools with safety guarantees, microservices requiring high performance and reliability, or when you need C/C++ level performance with memory safety guarantees.

## Core Concepts

- **Ownership and Borrowing**: Memory safety without GC through unique ownership, borrowing, and lifetimes checked at compile time.
- **Ownership Rules**: Each value has a single owner, data can be borrowed mutably once or immutably multiple times.
- **Lifetimes**: Compile-time annotations specifying how long references are valid, preventing dangling references.
- **Pattern Matching**: Powerful pattern matching with enums and match expressions for exhaustive control flow.
- **Error Handling**: Result<T, E> type for recoverable errors, panic! for unrecoverable errors.
- **Traits and Generics**: Typeclasses-like trait system for polymorphism, trait bounds for generic constraints.
- **Smart Pointers**: Box<T> for heap allocation, Rc<T> for reference counting, Arc<T> for atomic reference counting.
- **Concurrency without Data Races**: Fearless concurrency through ownership and type system preventing data races at compile time.
- **Zero-Cost Abstractions**: High-level features compile to efficient machine code with- **Unsafe Code**: Explicit no runtime overhead.
 unsafe blocks for low-level operations when necessary, clearly demarcated.

## Code Examples

**Ownership and Borrowing:**
```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1;  // s1 is moved to s2
    
    // println!("{}", s1);  // ERROR: s1 is no longer valid
    println!("{}", s2);
    
    let s3 = s2.clone();  // Explicit clone
    println!("{} and {}", s2, s3);
    
    let len = calculate_length(&s3);  // Borrow immutably
    println!("Length of '{}' is {}", s3, len);
    
    let mut s4 = String::from("mutable");
    change(&mut s4);  // Borrow mutably
    println!("{}", s4);
}

fn calculate_length(s: &String) -> usize {
    s.len()
}

fn change(s: &mut String) {
    s.push_str(" string");
}
```

**Pattern Matching and Error Handling:**
```rust
#[derive(Debug)]
enum MathError {
    DivisionByZero,
    NegativeRoot,
    LogOfNegative,
}

fn safe_divide(a: f64, b: f64) -> Result<f64, MathError> {
    if b == 0.0 {
        return Err(MathError::DivisionByZero);
    }
    Ok(a / b)
}

fn safe_sqrt(n: f64) -> Result<f64, MathError> {
    if n < 0.0 {
        return Err(MathError::NegativeRoot);
    }
    Ok(n.sqrt())
}

fn calculate(a: f64, b: f64) -> Result<f64, MathError> {
    let division = safe_divide(a, b)?;
    let sqrt = safe_sqrt(division)?;
    Ok(sqrt)
}

fn main() {
    match calculate(16.0, 4.0) {
        Ok(result) => println!("Result: {}", result),
        Err(e) => println!("Error: {:?}", e),
    }
    
    let values = [Ok(1), Ok(2), Err("error"), Ok(3)];
    let collected: Result<Vec<_>, _> = values.iter().cloned().collect();
    println!("{:?}", collected);
}
```

**Structs, Traits, and Generics:**
```rust
trait Describe {
    fn describe(&self) -> String;
}

#[derive(Debug, Clone)]
struct Person {
    name: String,
    age: u32,
}

impl Describe for Person {
    fn describe(&self) -> String {
        format!("{} is {} years old", self.name, self.age)
    }
}

impl Person {
    fn new(name: String, age: u32) -> Self {
        Person { name, age }
    }
    
    fn birthday(&mut self) {
        self.age += 1;
    }
}

struct Container<T: Clone> {
    items: Vec<T>,
}

impl<T: Clone> Container<T> {
    fn new() -> Self {
        Container { items: Vec::new() }
    }
    
    fn add(&mut self, item: T) {
        self.items.push(item);
    }
    
    fn get_all(&self) -> &[T] {
        &self.items
    }
}

fn main() {
    let mut alice = Person::new("Alice".to_string(), 30);
    println!("{}", alice.describe());
    alice.birthday();
    println!("{}", alice.describe());
    
    let mut container = Container::<String>::new();
    container.add("item1".to_string());
    container.add("item2".to_string());
    println!("{:?}", container.get_all());
}
```

**Concurrency with tokio:**
```rust
use tokio::task;
use std::time::Duration;

async fn fetch_data(id: i32) -> String {
    println!("Fetching data for {}", id);
    task::sleep(Duration::from_millis(100)).await;
    format!("Data for {}", id)
}

async fn concurrent_fetch() -> Vec<String> {
    let handles: Vec<_> = (1..=5)
        .map(|id| {
            task::spawn(async move {
                fetch_data(id).await
            })
        })
        .collect();
    
    let mut results = Vec::new();
    for handle in handles {
        results.push(handle.await.unwrap());
    }
    
    results
}

#[tokio::main]
async fn main() {
    println!("Starting concurrent operations...");
    
    let results = concurrent_fetch().await;
    
    for result in results {
        println!("Received: {}", result);
    }
    
    println!("All operations completed!");
}
```

## Best Practices

1. **Use the Compiler**: Leverage Rust's excellent compiler messages to guide you toward correct, safe code.
2. **Prefer Iterators Over Loops**: Iterator adapters (map, filter, fold) are optimized and idiomatic.
3. **Use Result for Error Handling**: Return Result<T, E> for functions that can fail, use ? for early returns.
4. **Derive Debug for Testing**: Derive Debug for types you need to print in tests or debug output.
5. **Clippy for Linting**: Run cargo clippy regularly to catch common mistakes and improve code quality.
6. **Use cargo fmt**: Format code consistently with rustfmt to maintain style across the codebase.
7. **Write Tests in the Same File**: Use #[cfg(test)] modules for unit tests near the code they test.
8. **Prefer Composition over Inheritance**: Use traits and trait bounds for polymorphism, not inheritance.
9. **Use Arc for Shared Ownership**: Use Arc<T> for shared immutable data, Mutex/RwLock for shared mutable data.
10. **Minimize Unsafe Code**: Keep unsafe blocks small and well-documented; most Rust code should be safe.
