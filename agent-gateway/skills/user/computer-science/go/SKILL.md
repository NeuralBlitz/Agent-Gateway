---
name: Go
description: Statically typed compiled language designed for simplicity, concurrency, and scalability with fast compilation.
license: BSD 3-Clause
compatibility: Go 1.18+
audience: Backend developers, cloud engineers, DevOps specialists
category: Programming Languages
---

# Go

## What I do

I am an open-source programming language developed by Robert Griesemer, Rob Pike, and Ken Thompson at Google, first released in 2009. I combine the ease of programming of an interpreted, dynamically typed language with the efficiency of a compiled, statically typed language. I feature built-in concurrency primitives (goroutines and channels), garbage collection, strong standard library, and fast compilation. I am widely used for cloud-native applications, Kubernetes and cloud infrastructure tools, microservices, CLI tools, and distributed systems.

## When to use me

Use Go when building cloud-native applications and microservices, Kubernetes operators and cloud infrastructure tools, CLI applications and DevOps tooling, high-concurrency network servers, distributed systems and microservices architecture, or when you need fast compilation, simple syntax, and excellent concurrency support.

## Core Concepts

- **Goroutines**: Lightweight threads managed by the Go runtime, started with go keyword, using minimal memory.
- **Channels**: Type-safe communication primitives between goroutines with <- operator for sending and receiving.
- **Interfaces**: Implicitly satisfied interfaces for polymorphism, focusing on behavior rather than concrete types.
- **Error Handling**: Errors as values, returning error types rather than exceptions, with idiomatic error checking.
- **Defer**: Stack-based resource cleanup with defer keyword, executing when surrounding function returns.
- **Slices and Maps**: Dynamic arrays (slices) and key-value stores (maps) as built-in reference types.
- **Methods on Any Type**: Define methods on any type, including built-in types, not just structs.
- **Composition over Inheritance**: Struct embedding for composition, avoiding traditional OOP hierarchies.
- **Garbage Collection**: Automatic memory management with concurrent mark-and-sweep GC.
- **First-Class Functions**: Functions as values, passed as arguments, and returned from other functions.

## Code Examples

**Basic Syntax and Control Flow:**
```go
package main

import (
    "fmt"
    "math"
)

func greet(name string) string {
    return fmt.Sprintf("Hello, %s!", name)
}

func fibonacci(n int) []int {
    fib := make([]int, n)
    if n > 0 {
        fib[0] = 0
    }
    if n > 1 {
        fib[1] = 1
    }
    for i := 2; i < n; i++ {
        fib[i] = fib[i-1] + fib[i-2]
    }
    return fib
}

func sqrt(n float64) (float64, error) {
    if n < 0 {
        return 0, fmt.Errorf("cannot calculate square root of negative number: %f", n)
    }
    return math.Sqrt(n), nil
}

func main() {
    fmt.Println(greet("World"))
    
    fibs := fibonacci(10)
    fmt.Printf("Fibonacci: %v\n", fibs)
    
    root, err := sqrt(16)
    if err != nil {
        fmt.Printf("Error: %v\n", err)
    } else {
        fmt.Printf("Square root of 16: %.2f\n", root)
    }
}
```

**Goroutines and Channels:**
```go
package main

import (
    "fmt"
    "sync"
    "time"
)

func worker(id int, jobs <-chan int, results chan<- int) {
    for j := range jobs {
        fmt.Printf("Worker %d started job %d\n", id, j)
        time.Sleep(time.Millisecond * 100)
        results <- j * 2
        fmt.Printf("Worker %d finished job %d\n", id, j)
    }
}

func main() {
    jobs := make(chan int, 100)
    results := make(chan int, 100)
    
    var wg sync.WaitGroup
    for w := 1; w <= 3; w++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            worker(id, jobs, results)
        }(w)
    }
    
    for j := 1; j <= 5; j++ {
        jobs <- j
    }
    close(jobs)
    
    go func() {
        wg.Wait()
        close(results)
    }()
    
    for r := range results {
        fmt.Printf("Result: %d\n", r)
    }
}
```

**Interfaces and Composition:**
```go
package main

import "fmt"

type Speaker interface {
    Speak() string
}

type Dog struct {
    Name string
}

func (d Dog) Speak() string {
    return fmt.Sprintf("%s says Woof!", d.Name)
}

type Cat struct {
    Name string
}

func (c Cat) Speak() string {
    return fmt.Sprintf("%s says Meow!", c.Name)
}

func makeSpeak(s Speaker) {
    fmt.Println(s.Speak())
}

type MultilingualSpeaker struct {
    Name string
}

func (m MultilingualSpeaker) SpeakEnglish() string {
    return fmt.Sprintf("%s says Hello!", m.Name)
}

func (m MultilingualSpeaker) SpeakSpanish() string {
    return fmt.Sprintf("%s says Hola!", m.Name)
}

type EnglishSpeaker interface {
    SpeakEnglish() string
}

func poly(speaker interface{}) {
    fmt.Printf("Type: %T, Value: %v\n", speaker, speaker)
}

func main() {
    dog := Dog{Name: "Buddy"}
    cat := Cat{Name: "Whiskers"}
    
    makeSpeak(dog)
    makeSpeak(cat)
    
    speakers := []Speaker{dog, cat}
    for _, s := range speakers {
        fmt.Println(s.Speak())
    }
    
    poly(dog)
    poly(cat)
}
```

**Error Handling and Defer:**
```go
package main

import (
    "errors"
    "fmt"
    "os"
)

func readFile(filename string) ([]byte, error) {
    f, err := os.Open(filename)
    if err != nil {
        return nil, fmt.Errorf("failed to open file: %w", err)
    }
    defer f.Close()
    
    info, err := f.Stat()
    if err != nil {
        return nil, fmt.Errorf("failed to get file info: %w", err)
    }
    
    data := make([]byte, info.Size())
    _, err = f.Read(data)
    if err != nil {
        return nil, fmt.Errorf("failed to read file: %w", err)
    }
    
    return data, nil
}

func validateInput(value int) error {
    if value < 0 {
        return errors.New("value must be non-negative")
    }
    if value > 100 {
        return errors.New("value must be at most 100")
    }
    return nil
}

func processWithRecovery() (result int, err error) {
    defer func() {
        if r := recover(); r != nil {
            fmt.Printf("Recovered from panic: %v\n", r)
            err = fmt.Errorf("panic occurred: %v", r)
        }
    }()
    
    for i := 0; i < 5; i++ {
        if i == 3 {
            panic("something went wrong")
        }
        result += i
    }
    
    return result, nil
}

func main() {
    if err := validateInput(50); err != nil {
        fmt.Printf("Validation error: %v\n", err)
    }
    
    result, err := processWithRecovery()
    fmt.Printf("Result: %d, Error: %v\n", result, err)
}
```

## Best Practices

1. **Follow Effective Go Guidelines**: Read and follow official guidelines for idiomatic Go code style and patterns.
2. **Use Interfaces Early**: Define interfaces based on behavior you need, not concrete implementations.
3. **Prefer Returns Over Out Parameters**: Return values directly rather than using pointers for output parameters.
4. **Use defer for Cleanup**: Always use defer for closing files, unlocking mutexes, and other cleanup operations.
5. **Handle Errors Explicitly**: Don't ignore errors with _; check and handle errors at each call site.
6. **Use gofmt for Formatting**: Run gofmt on your code or configure your IDE to auto-format on save.
7. **Keep Functions Short**: Functions should do one thing and do it well; short functions are easier to test.
8. **Use Constants for Magic Numbers**: Define constants for values that have meaning beyond their literal value.
9. **Document Public APIs**: Add doc comments for exported types, functions, and constants.
10. **Run Tests with Coverage**: Use go test -cover to ensure your code is well-tested, aim for high coverage.
