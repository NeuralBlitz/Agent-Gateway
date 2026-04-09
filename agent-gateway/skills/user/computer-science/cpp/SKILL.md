---
name: C++
description: High-performance compiled language supporting procedural, object-oriented, and generic programming with direct hardware access capabilities.
license: MIT License
compatibility: C++17/C++20 standard
audience: Systems programmers, game developers, high-performance computing engineers
category: Programming Languages
---

# C++

## What I do

I am a general-purpose programming language created by Bjarne Stroustrup in 1979 as an extension of C. I provide high performance with low-level memory control, support for multiple programming paradigms (procedural, object-oriented, generic, functional), and direct hardware manipulation. I am widely used in game development, high-frequency trading, operating systems, browsers, databases, and performance-critical applications. I offer zero-overhead abstractions, RAII for automatic resource management, and template metaprogramming for compile-time computations.

## When to use me

Use C++ when building high-performance applications (games, trading systems), operating systems and drivers, embedded systems with performance requirements, game engines (Unreal Engine), browsers (Chrome, Firefox), database systems, or when you need both performance and abstraction.

## Core Concepts

- **RAII (Resource Acquisition Is Initialization)**: Automatic resource management through object lifetimes, preventing resource leaks.
- **Templates and Generic Programming**: Type-agnostic programming with compile-time polymorphism through templates.
- **STL (Standard Template Library)**: Containers, algorithms, and iterators for common data structures and operations.
- **Smart Pointers (C++11+)**: Automatic memory management with unique_ptr, shared_ptr, and weak_ptr.
- **Move Semantics (C++11+)**: Efficient resource transfer without copying using move constructors and move assignment.
- **Lambda Expressions (C++11+)**: Anonymous function objects for concise callbacks and algorithm customization.
- **RAII Lock Guards**: Automatic mutex locking/unlocking for thread-safe resource access.
- **constexpr and consteval**: Compile-time computation with constexpr functions and consteval for immediate evaluation.
- **Virtual Functions and Polymorphism**: Runtime polymorphism through virtual function tables and dynamic dispatch.
- **Modules (C++20)**: Modern alternative to header files with improved compilation times and namespace management.

## Code Examples

**RAII and Smart Pointers:**
```cpp
#include <iostream>
#include <memory>
#include <vector>

class Resource {
public:
    Resource() { std::cout << "Resource acquired\n"; }
    ~Resource() { std::cout << "Resource released\n"; }
    
    void use() { std::cout << "Using resource\n"; }
};

void process() {
    auto resource = std::make_unique<Resource>();
    resource->use();
    
    std::vector<std::shared_ptr<Resource>> resources;
    resources.push_back(resource);
    
    std::cout << "Vector size: " << resources.size() << "\n";
    std::cout << "Resource still alive: " << resource.use_count() << "\n";
}

int main() {
    process();
    std::cout << "After function call\n";
    return 0;
}
```

**Templates and STL:**
```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>

template<typename T>
class Stack {
private:
    std::vector<T> data;
public:
    void push(const T& item) { data.push_back(item); }
    void pop() { 
        if (!data.empty()) data.pop_back(); 
    }
    T& top() { return data.back(); }
    bool empty() const { return data.empty(); }
    size_t size() const { return data.size(); }
};

template<typename Container>
void print(const Container& c) {
    for (const auto& elem : c) {
        std::cout << elem << " ";
    }
    std::cout << "\n";
}

int main() {
    Stack<int> stack;
    stack.push(10);
    stack.push(20);
    stack.push(30);
    
    std::cout << "Top: " << stack.top() << "\n";
    
    std::vector<int> v = {1, 2, 3, 4, 5};
    std::reverse(v.begin(), v.end());
    print(v);
    
    int sum = std::accumulate(v.begin(), v.end(), 0);
    std::cout << "Sum: " << sum << "\n";
    
    return 0;
}
```

**Lambda Expressions and Algorithms:**
```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <functional>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    
    int multiplier = 2;
    
    auto transform_lambda = [multiplier](int x) {
        return x * multiplier;
    };
    
    std::vector<int> transformed;
    std::transform(numbers.begin(), numbers.end(), 
                   std::back_inserter(transformed),
                   transform_lambda);
    
    int threshold = 10;
    
    auto count_lambda = [threshold](int x) {
        return x > threshold;
    };
    
    auto count = std::count_if(transformed.begin(), transformed.end(), count_lambda);
    
    std::cout << "Transformed: ";
    for (auto n : transformed) std::cout << n << " ";
    std::cout << "\n";
    std::cout << "Count > " << threshold << ": " << count << "\n";
    
    std::sort(transformed.begin(), transformed.end(),
              [](int a, int b) { return a > b; });
    
    int product = 1;
    std::for_each(transformed.begin(), transformed.end(),
                  [&product](int x) { product *= x; });
    
    std::cout << "Product: " << product << "\n";
    
    return 0;
}
```

**Move Semantics:**
```cpp
#include <iostream>
#include <vector>
#include <utility>

class HeavyObject {
private:
    std::vector<int> data;
    int id;
public:
    HeavyObject(int id, size_t size) : id(id), data(size, id) {
        std::cout << "HeavyObject " << id << " constructed\n";
    }
    
    HeavyObject(const HeavyObject& other) : id(other.id), data(other.data) {
        std::cout << "HeavyObject " << id << " copied\n";
    }
    
    HeavyObject(HeavyObject&& other) noexcept 
        : id(other.id), data(std::move(other.data)) {
        std::cout << "HeavyObject " << id << " moved\n";
    }
    
    HeavyObject& operator=(const HeavyObject& other) {
        if (this != &other) {
            id = other.id;
            data = other.data;
        }
        std::cout << "HeavyObject " << id << " copy assigned\n";
        return *this;
    }
    
    HeavyObject& operator=(HeavyObject&& other) noexcept {
        if (this != &other) {
            id = other.id;
            data = std::move(other.data);
        }
        std::cout << "HeavyObject " << id << " move assigned\n";
        return *this;
    }
};

int main() {
    std::vector<HeavyObject> objects;
    objects.reserve(3);
    
    std::cout << "--- Adding objects ---\n";
    objects.push_back(HeavyObject(1, 1000));
    objects.push_back(HeavyObject(2, 2000));
    
    std::cout << "--- Moving objects ---\n";
    HeavyObject obj(3, 3000);
    objects.push_back(std::move(obj));
    
    return 0;
}
```

## Best Practices

1. **Prefer RAII over Manual Memory Management**: Use smart pointers and containers instead of raw new/delete.
2. **Use std::unique_ptr by Default**: Prefer unique_ptr for exclusive ownership, shared_ptr only when shared ownership is needed.
3. **Follow RAII for All Resources**: Apply RAII pattern not just to memory but to files, sockets, mutexes, and handles.
4. **Use const Correctness**: Mark member functions as const when they don't modify object state.
5. **Prefer pass-by-value or pass-by-const-reference**: Pass small objects by value, large objects by const reference.
6. **Use Range-Based for Loops**: Prefer range-based for loops over iterators for cleaner, less error-prone code.
7. **Leverage constexpr for Compile-Time Computation**: Use constexpr functions for values known at compile time.
8. **Avoid Raw Loops When STL Algorithms Exist**: Use std::transform, std::accumulate, std::find_if instead of raw loops.
9. **Mark Functions noexcept When Appropriate**: Declare functions as noexcept when they don't throw exceptions.
10. **Use Static Analysis and Sanitizers**: Run clang-tidy, cppcheck, AddressSanitizer, and ThreadSanitizer regularly.
