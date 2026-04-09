---
name: C
description: Low-level programming language providing direct memory access and hardware control, serving as the foundation for operating systems and embedded systems.
license: BSD License (reference implementation)
compatibility: C11/C17 standard
audience: Systems programmers, embedded developers, OS developers
category: Programming Languages
---

# C

## What I do

I am a low-level, imperative programming language developed by Dennis Ritchie at Bell Labs in 1972. I provide direct access to memory through pointers, close-to-hardware operations, and minimal runtime overhead. I am the foundation for Unix-like operating systems, embedded systems, device drivers, and high-performance applications. I compile directly to machine code, offering unmatched control over system resources and performance. My influence extends to C++, Java, Python, and many other languages that adopted my syntax and paradigms.

## When to use me

Use C when building operating systems and kernels, embedded systems with limited resources, device drivers and firmware, high-performance computing applications, compilers and interpreters, or when you need complete control over memory and hardware.

## Core Concepts

- **Pointers and Memory Addresses**: Direct manipulation of memory addresses enabling efficient data structures and system-level programming.
- **Manual Memory Management**: Explicit allocation (malloc) and deallocation (free) requiring careful memory lifecycle management.
- **Preprocessor Directives**: Text substitution before compilation for macros, conditional compilation, and file inclusion.
- **Static Typing with Weak Enforcement**: Types are checked but can be casted, requiring careful attention to type compatibility.
- **Function and Control Flow**: Structured programming with if/else, switch, while, for, and do-while constructs.
- **Structures and Unions**: Compound data types for grouping variables and memory-efficient variant types.
- **Bit Manipulation**: Direct operations on individual bits using bitwise operators for flags, masks, and hardware registers.
- **Header Files and Linking**: Separate declaration (header files) from definition (source files) with compilation and linking phases.
- **Standard Library**: Rich standard library for I/O, string manipulation, memory allocation, and mathematical operations.
- **Variable Scope and Lifetime**: Block scope, function scope, file scope, and dynamic storage duration.

## Code Examples

**Pointers and Memory Management:**
```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    char name[50];
    int age;
    float score;
} Student;

Student* create_student(const char* name, int age, float score) {
    Student* s = (Student*)malloc(sizeof(Student));
    if (s == NULL) {
        fprintf(stderr, "Memory allocation failed\n");
        return NULL;
    }
    strncpy(s->name, name, sizeof(s->name) - 1);
    s->name[sizeof(s->name) - 1] = '\0';
    s->age = age;
    s->score = score;
    return s;
}

void free_student(Student* s) {
    free(s);
}

int main() {
    Student* students[3];
    const char* names[] = {"Alice", "Bob", "Charlie"};
    int ages[] = {20, 21, 22};
    float scores[] = {85.5, 90.0, 78.5};
    
    for (int i = 0; i < 3; i++) {
        students[i] = create_student(names[i], ages[i], scores[i]);
    }
    
    for (int i = 0; i < 3; i++) {
        printf("Student %d: %s, Age: %d, Score: %.1f\n", 
               i + 1, students[i]->name, students[i]->age, students[i]->score);
    }
    
    for (int i = 0; i < 3; i++) {
        free_student(students[i]);
    }
    
    return 0;
}
```

**Pointers and Arrays:**
```c
#include <stdio.h>

void reverse_array(int* arr, size_t size) {
    int* start = arr;
    int* end = arr + size - 1;
    
    while (start < end) {
        int temp = *start;
        *start = *end;
        *end = temp;
        start++;
        end--;
    }
}

void print_array(const int* arr, size_t size) {
    for (size_t i = 0; i < size; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");
}

int main() {
    int numbers[] = {1, 2, 3, 4, 5};
    size_t size = sizeof(numbers) / sizeof(numbers[0]);
    
    printf("Original array: ");
    print_array(numbers, size);
    
    reverse_array(numbers, size);
    
    printf("Reversed array: ");
    print_array(numbers, size);
    
    return 0;
}
```

**Function Pointers and Callbacks:**
```c
#include <stdio.h>
#include <stdlib.h>

typedef int (*compare_fn)(const void*, const void*);

int compare_ints(const void* a, const void* b) {
    int val_a = *(const int*)a;
    int val_b = *(const int*)b;
    return (val_a > val_b) - (val_a < val_b);
}

void bubble_sort(void* arr, size_t n, size_t size, compare_fn cmp) {
    char* base = (char*)arr;
    
    for (size_t i = 0; i < n - 1; i++) {
        for (size_t j = 0; j < n - i - 1; j++) {
            char* a = base + j * size;
            char* b = base + (j + 1) * size;
            if (cmp(a, b) > 0) {
                char temp[64];
                memcpy(temp, a, size);
                memcpy(a, b, size);
                memcpy(b, temp, size);
            }
        }
    }
}

int main() {
    int arr[] = {64, 34, 25, 12, 22, 11, 90};
    size_t n = sizeof(arr) / sizeof(arr[0]);
    
    qsort(arr, n, sizeof(int), compare_ints);
    
    printf("Sorted array: ");
    for (size_t i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");
    
    return 0;
}
```

## Best Practices

1. **Always Initialize Variables**: Uninitialized variables contain garbage values; always initialize pointers and variables before use.
2. **Check malloc Return Values**: Always check if malloc/calloc/realloc returned NULL before using the allocated memory.
3. **Match malloc and free**: Every allocation must have exactly one corresponding free to prevent memory leaks.
4. **Use sizeof for Portability**: Use sizeof(type) or sizeof(variable) instead of hardcoded sizes.
5. **Prefer size_t for Sizes**: Use size_t for sizes, counts, and indices to avoid signed/unsigned comparison warnings.
6. **Use const Correctness**: Mark function parameters as const when they shouldn't be modified.
7. **Beware of Integer Overflow**: Check for overflow in calculations, especially with user-controlled input.
8. **Use Restrict Keyword**: Use restrict pointers to tell compiler objects don't overlap, enabling optimizations.
9. **Write Portable Code**: Avoid compiler-specific extensions and platform-dependent assumptions.
10. **Use Static Analysis Tools**: Run valgrind, AddressSanitizer, and static analyzers to catch memory errors and undefined behavior.
