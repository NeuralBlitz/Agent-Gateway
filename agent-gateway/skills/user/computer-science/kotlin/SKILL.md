---
name: Kotlin
description: Modern, statically-typed programming language that runs on the JVM and targets Android development with full Java interoperability.
license: Apache License 2.0
compatibility: Kotlin 1.8+
audience: Android developers, backend developers, full-stack developers
category: Programming Languages
---

# Kotlin

## What I do

I am a modern, statically-typed programming language developed by JetBrains, first released in 2011. I run on the JVM, Android, and JavaScript (Kotlin/JS), providing full interoperability with existing Java codebases. I offer concise syntax, null safety, extension functions, data classes, coroutines for asynchronous programming, and smart type inference. I am the officially supported language for Android development and widely used for backend development with Ktor, Spring Boot, and other frameworks.

## When to use me

Use Kotlin when building Android applications, backend APIs with Ktor/Spring Boot, multi-platform applications (JVM, JS, Native), when you need Java interoperability with modern language features, or when building applications with coroutine-based concurrency.

## Core Concepts

- **Null Safety**: Types are non-nullable by default, nullable types use ? suffix, safe calls with ?., Elvis operator ?:
- **Data Classes**: Classes with automatically generated equals, hashCode, toString, and copy methods.
- **Extension Functions**: Add methods to existing classes without modifying source code or inheritance.
- **Lambda Expressions**: Concise syntax for anonymous functions, used extensively in collections.
- **Smart Casts**: Type checks automatically cast within conditional blocks.
- **Sealed Classes**: Restricted class hierarchies for representing restricted type hierarchies.
- **Coroutines**: Asynchronous programming with suspend functions, async/await patterns.
- **Delegation**: Composition over inheritance with by keyword for property delegation.
- **Type Inference**: Compiler infers types in most situations, reducing verbosity.
- **Interoperability**: 100% interoperable with Java, can call Java code and vice versa.

## Code Examples

**Null Safety and Smart Casts:**
```kotlin
fun main() {
    val name: String? = null
    val length: Int = name?.length ?: 0
    println("Length: $length")
    
    val items: List<String?> = listOf("hello", null, "world")
    
    items.forEach { item ->
        item?.let {
            println("Item: ${it.uppercase()}")
        }
    }
    
    val result = items.mapNotNull { it?.uppercase() }
    println("Result: $result")
    
    fun printLength(str: String?) {
        if (str != null) {
            println("Length: ${str.length}")  // Smart cast to String
        } else {
            println("String is null")
        }
    }
    
    printLength("Kotlin")
    printLength(null)
    
    val value: Any = "Hello"
    if (value is String) {
        println("Length: ${value.length}")  // Smart cast
    }
    
    val message: String? = null
    val nonNullMessage: String = message ?: throw IllegalArgumentException("Message required")
    println("Message: $nonNullMessage")
}
```

**Data Classes and Destructuring:**
```kotlin
data class User(
    val id: Long,
    val name: String,
    val email: String,
    val age: Int = 0
)

fun main() {
    val user = User(1, "Alice", "alice@example.com", 30)
    
    println(user)
    println("Name: ${user.name}")
    println("Copy with new email: ${user.copy(email = "new@example.com")}")
    
    val (id, name, email, age) = user
    println("Destructured: $id, $name, $email, $age")
    
    val users = listOf(
        User(1, "Alice", "alice@example.com", 30),
        User(2, "Bob", "bob@example.com", 25),
        User(3, "Charlie", "charlie@example.com", 35)
    )
    
    users.forEach { (id, name) ->
        println("User $id: $name")
    }
    
    val updatedUsers = users.map { it.copy(age = it.age + 1) }
    val sortedByAge = users.sortedByDescending { it.age }
    val groupedByAge = users.groupBy { it.age / 10 * 10 }
    
    println("Grouped: $groupedByAge")
    
    data class Point(val x: Int, val y: Int)
    
    operator fun Point.plus(other: Point) = Point(x + other.x, y + other.y)
    val p1 = Point(1, 2)
    val p2 = Point(3, 4)
    val p3 = p1 + p2
    println("Point: $p3")
}
```

**Coroutines and Async Programming:**
```kotlin
import kotlinx.coroutines.*
import kotlin.system.measureTimeMillis

suspend fun fetchData(id: Int): String {
    delay(100)
    return "Data for $id"
}

suspend fun fetchMultiple(ids: List<Int>): List<String> = coroutineScope {
    ids.map { id ->
        async { fetchData(id) }
    }.awaitAll()
}

fun main() = runBlocking {
    val time = measureTimeMillis {
        val result = fetchMultiple(listOf(1, 2, 3, 4, 5))
        println("Result: $result")
    }
    println("Time: ${time}ms")
    
    launch {
        for (i in 1..5) {
            delay(100)
            println("Coroutine: $i")
        }
    }
    
    val job = launch {
        try {
            repeat(10) { i ->
                delay(50)
                if (i == 3) throw CancellationException()
                println("Task: $i")
            }
        } finally {
            println("Cleanup")
        }
    }
    
    job.join()
    
    withTimeoutOrNull(200) {
        repeat(10) { i ->
            delay(30)
            println("Timeout task: $i")
        }
    } ?: println("Timed out")
    
    val asyncResult = async {
        delay(100)
        "Async result"
    }
    println("Result: ${asyncResult.await()}")
}
```

**Extension Functions and Interfaces:**
```kotlin
fun String.uppercaseFirst(): String {
    return if (isNotEmpty()) {
        this[0].uppercaseChar().toString() + substring(1)
    } else {
        this
    }
}

fun <T> List<T>.second(): T? = getOrNull(1)

fun Int.isEven(): Boolean = this % 2 == 0

fun ClosedRange<Int>.random(): Int = (this.first..this.last).random()

interface Logger {
    fun log(message: String)
}

class ConsoleLogger : Logger {
    override fun log(message: String) {
        println("[${java.time.LocalDateTime.now()}] $message")
    }
}

class User(
    val id: Long,
    val name: String
) {
    private val logger: Logger by lazy { ConsoleLogger() }
    
    fun save() {
        logger.log("Saving user $id")
    }
}

interface Repository<T> {
    fun findById(id: Long): T?
    fun save(entity: T): T
}

class InMemoryRepository<T : HasId> : Repository<T> {
    private val map = mutableMapOf<Long, T>()
    
    override fun findById(id: Long): T? = map[id]
    
    override fun save(entity: T): T {
        map[entity.id] = entity
        return entity
    }
}

interface HasId {
    val id: Long
}

fun main() {
    println("hello".uppercaseFirst())
    println(listOf(1, 2, 3).second())
    println(4.isEven())
    println((1..10).random())
    
    val user = User(1, "Alice")
    user.save()
}
```

## Best Practices

1. **Use val by Default**: Use val for immutable properties, var only when reassignment is necessary.
2. **Prefer Data Classes Over Lombok**: Use Kotlin data classes instead of Lombok annotations for cleaner code.
3. **Use Extension Functions Wisely**: Use extensions to add utility methods without modifying original classes.
4. **Leverage Default Arguments**: Use default arguments instead of function overloads.
5. **Use Coroutines for Async**: Prefer coroutines and suspend functions over callbacks and threads.
6. **Use sealed Classes for State**: Use sealed classes to represent UI states or state machines.
7. **Use lateinit for late Initialization**: Use lateinit for properties initialized after construction.
8. **Prefer apply/let/run**: Use appropriate scope functions (apply, let, run, with, also) for cleaner code.
9. **Use Type Aliases for Readability**: Create type aliases for frequently used function types.
10. **Write Tests with JUnit 5/Kotest**: Use JUnit 5 or Kotest for unit and property-based testing.
