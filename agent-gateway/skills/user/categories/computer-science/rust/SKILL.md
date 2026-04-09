---
name: rust
description: Rust programming language best practices and patterns
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: programming
---
## What I do
- Write idiomatic Rust code following the Rust book and effective Rust guidelines
- Handle errors with Result and Option types properly
- Use borrowing and lifetimes correctly
- Write unit and integration tests
- Use traits for polymorphism
- Implement proper error handling with thiserror and anyhow
- Use iterators efficiently
- Follow cargo workflow

## When to use me
When writing or reviewing Rust code. Rust requires careful attention to ownership and borrowing.

## Error Handling
```rust
use anyhow::{Context, Result};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum MyError {
    #[error("Invalid input: {0}")]
    InvalidInput(String),
    #[error("Resource not found: {resource}")]
    NotFound { resource: String },
    #[error(transparent)]
    IoError(#[from] std::io::Error),
}

fn read_config(path: &Path) -> Result<Config> {
    let content = std::fs::read_to_string(path)
        .with_context(|| format!("Failed to read config from {:?}", path))?;
    
    let config: Config = toml::from_str(&content)
        .context("Failed to parse config file")?;
    
    Ok(config)
}
```

## Traits and Generics
```rust
pub trait Processor {
    type Input;
    type Output;

    fn process(&self, input: Self::Input) -> Self::Output;
    fn name(&self) -> &'static str;
}

impl<T, U> Processor for Fn(T) -> U
where
    T: Send + 'static,
    U: Send + 'static,
{
    type Input = T;
    type Output = U;

    fn process(&self, input: T) -> U {
        self(input)
    }

    fn name(&self) -> &'static str {
        "closure_processor"
    }
}
```

## Ownership and Borrowing
```rust
struct Processor {
    name: String,
    threshold: f64,
}

impl Processor {
    // &self borrows immutably, can have multiple
    fn process(&self, value: f64) -> bool {
        value > self.threshold
    }

    // &mut self borrows mutably, only one at a time
    fn set_threshold(&mut self, threshold: f64) {
        self.threshold = threshold;
    }

    // self takes ownership, destroys on drop
    fn into_name(self) -> String {
        self.name
    }
}
```

## Iterators
```rust
fn process_items(items: &[i32]) -> Vec<i32> {
    items
        .iter()
        .filter(|&&x| x > 0)
        .map(|&x| x * 2)
        .take(10)
        .collect()
}
```

## Testing
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_process_positive_values() {
        let processor = Processor::new(10.0);
        assert!(processor.process(15.0));
        assert!(!processor.process(5.0));
    }

    #[test]
    fn test_process_edge_cases() -> Result<()> {
        let processor = Processor::new(0.0);
        ensure!(processor.process(1.0), "Positive values should pass");
        Ok(())
    }
}
```
