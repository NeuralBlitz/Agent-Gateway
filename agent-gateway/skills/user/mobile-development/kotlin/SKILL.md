---
name: kotlin
description: Modern, statically typed programming language for Android and beyond
tags: [kotlin, android, jvm, jetbrains, programming-language]
---

# Kotlin Programming

## What I do

I provide guidance for programming in Kotlin, a modern JVM language developed by JetBrains. I cover language fundamentals, coroutines for asynchronous programming, extension functions and properties, delegation, DSL creation, and Kotlin Multiplatform for cross-platform development.

## When to use me

Use me when developing Android applications with modern language features, building server-side applications with Ktor or Spring Boot, creating multiplatform projects sharing code between platforms, or leveraging Kotlin's null safety and expressive syntax.

## Core Concepts

Kotlin null safety with nullable types and safe call operators. Coroutines with suspend functions, channels, and flow for async programming. Extension functions and properties for adding functionality to existing types. Data classes with automatic equals, hashCode, toString, and copy. Sealed classes for modeling restricted hierarchies. Inline functions with reified types for generic programming. Delegation pattern using the by keyword. DSL builders using receiver functions and operator overloading.

## Code Examples

Coroutines with Flow for reactive data streams:

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import java.time.LocalDateTime

data class User(val id: Long, val name: String, val email: String)

class UserRepository(
    private val api: UserApi,
    private val localCache: UserCache
) {
    fun getUsers(): Flow<List<User>> = flow {
        emit(localCache.getCachedUsers())
        try {
            val freshData = api.fetchUsers()
            localCache.cacheUsers(freshData)
            emit(freshData)
        } catch (e: NetworkException) {
            // Already emitted cached data, just log
            println("Using cached data due to: ${e.message}")
        }
    }.flowOn(Dispatchers.IO)

    fun observeUser(userId: Long): Flow<User?> = localCache.observeUser(userId)
        .combine(flow { emit(api.fetchUser(userId)) }) { cached, fresh ->
            fresh ?: cached
        }
        .flowOn(Dispatchers.IO)
}

class UserUseCase(
    private val repository: UserRepository,
    private val logger: Logger
) {
    operator fun invoke(): Flow<UiState<List<User>>> = repository.getUsers()
        .map<List<User>, UiState<List<User>>> { users ->
            UiState.Success(users.sortedBy { it.name })
        }
        .catch { e ->
            emit(UiState.Error(e.message ?: "Unknown error"))
            logger.error("Failed to load users", e)
        }
        .onStart { emit(UiState.Loading) }

    fun searchUsers(query: String): Flow<List<User>> = repository.getUsers()
        .map { users -> users.filter { it.name.contains(query, ignoreCase = true) } }
}

sealed class UiState<out T> {
    data object Loading : UiState<Nothing>()
    data class Success<T>(val data: T) : UiState<T>()
    data class Error(val message: String) : UiState<Nothing>()
}
```

DSL builder for HTML-like markup:

```kotlin
@DslMarker
annotation class HtmlMarker

@HtmlMarker
abstract class Tag(val name: String) {
    private val children = mutableListOf<Tag>()
    
    protected fun <T : Tag> initTag(tag: T, init: T.() -> Unit): T {
        tag.initTag()
        children.add(tag)
        return tag
    }
    
    override fun toString(): String {
        return "<$name>${children.joinToString("")}</$name>"
    }
}

class Div : Tag("div") {
    fun text(content: String) = initTag(TextTag(content))
    fun p(init: P.() -> Unit) = initTag(P(), init)
    fun div(init: Div.() -> Unit) = initTag(Div(), init)
    fun span(init: Span.() -> Unit) = initTag(Span(), init)
}

class P : Tag("p")
class Span : Tag("span")
class TextTag(private val content: String) : Tag("text") {
    override fun toString() = content
}

fun html(init: Html.() -> Unit): Html {
    return Html().apply(init)
}

class Html : Tag("html") {
    fun head(init: Head.() -> Unit) = initTag(Head(), init)
    fun body(init: Body.() -> Unit) = initTag(Body(), init)
}

class Head : Tag("head")
class Body : Div()

fun main() {
    val page = html {
        head { }
        body {
            div {
                p { text("Hello, Kotlin DSL!") }
                div {
                    span { text("Nested content") }
                }
            }
        }
    }
    println(page)
}
```

## Best Practices

Prefer data classes and sealed classes over enums for type-safe hierarchies. Use coroutines with structured concurrency for cancellation and error propagation. Leverage extension functions to keep code organized. Use the by keyword for delegation. Create DSLs for complex configuration or markup. Use typealiases for improving readability. Prefer composition over inheritance. Use inline functions for performance-critical code.

## Common Patterns

Builder pattern with receiver functions for fluent APIs. Extension functions for adding utility methods. Delegation using by keyword for composition. Sealed classes for representing state and events. Lambda with receiver pattern for DSL creation. Coroutines flow pattern for reactive streams. Property delegation with lazy, observable, and vetoable.
