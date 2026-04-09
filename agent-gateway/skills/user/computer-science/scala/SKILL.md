---
name: Scala
description: Hybrid object-oriented and functional programming language that runs on the JVM with strong static typing.
license: Apache License 2.0
compatibility: Scala 2.13+, Scala 3.x
audience: Big data engineers, backend developers, functional programming enthusiasts
category: Programming Languages
---

# Scala

## What I do

I am a general-purpose programming language designed by Martin Odersky, first released in 2003. I run on the Java Virtual Machine (JVM), providing full interoperability with Java and access to the Java ecosystem. I combine object-oriented and functional programming paradigms, featuring immutable data structures, pattern matching, case classes, and powerful type inference. I am widely used in big data processing (Apache Spark), Akka for concurrent/distributed applications, and web frameworks (Play Framework).

## When to use me

Use Scala when building big data applications with Apache Spark, concurrent and distributed systems with Akka, web applications with Play Framework, enterprise applications requiring functional patterns, or when you need JVM compatibility with more expressive syntax than Java.

## Core Concepts

- **Object-Oriented + Functional**: Everything is an object, with functions as first-class citizens and immutable by default.
- **Case Classes**: Special classes for immutable data with automatic equality, hashing, and pattern matching.
- **Pattern Matching**: Powerful matching on data structures, types, and conditions with exhaustiveness checking.
- **Immutability**: Values (val) preferred over variables (var), immutable collections by default.
- **Type Inference**: Compiler infers types in most cases, reducing verbosity while maintaining safety.
- **Higher-Order Functions**: Functions taking functions as parameters (map, flatMap, filter, reduce).
- **Traits**: Like interfaces but can contain concrete methods and fields, supporting composition.
- **Implicit Parameters/Conversions**: Compiler-supplied parameters and type conversions for flexible APIs.
- **Lazy Evaluation**: lazy val for deferred initialization and computation when needed.
- **SBT Build Tool**: Scala Build Tool for compilation, testing, and dependency management.

## Code Examples

**Pattern Matching and Case Classes:**
```scala
sealed trait Message
case class Text(from: String, content: String) extends Message
case class Image(from: String, url: String, size: Int) extends Message
case class Video(from: String, url: String, duration: Int) extends Message
case class SystemMessage(content: String) extends Message

def processMessage(msg: Message): String = msg match {
  case Text(from, content) if content.length > 100 =>
    s"Long text from $from: ${content.take(50)}..."
  case Text(from, content) =>
    s"Text from $from: $content"
  case Image(from, url, size) =>
    s"Image from $from: $url (${size / 1024}KB)"
  case Video(from, url, duration) =>
    s"Video from $from: $url (${duration / 60}min)"
  case SystemMessage(content) =>
    s"SYSTEM: $content"
}

val messages: List[Message] = List(
  Text("Alice", "Hello!"),
  Text("Bob", "This is a very long message that exceeds one hundred characters in length for demonstration purposes."),
  Image("Charlie", "https://example.com/image.jpg", 102400),
  Video("Diana", "https://example.com/video.mp4", 300),
  SystemMessage("Welcome to the chat!")
)

messages.foreach { msg =>
  println(processMessage(msg))
}
```

**Higher-Order Functions and Collections:**
```scala
val numbers = List(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)

val doubled = numbers.map(_ * 2)
val evens = numbers.filter(_ % 2 == 0)
val sum = numbers.reduce(_ + _)
val product = numbers.fold(1)(_ * _)

println(s"Doubled: $doubled")
println(s"Evens: $evens")
println(s"Sum: $sum")
println(s"Product: $product")

val words = List("hello", "world", "scala", "programming", "functional")

val lengths = words.map(_.length)
val sortedByLength = words.sortBy(_.length)
val groupedByLength = words.groupBy(_.length)

println(s"Lengths: $lengths")
println(s"Sorted by length: $sortedByLength")
println(s"Grouped by length: $groupedByLength")

case class Person(name: String, age: Int, city: String)

val people = List(
  Person("Alice", 30, "NYC"),
  Person("Bob", 25, "LA"),
  Person("Charlie", 35, "NYC"),
  Person("Diana", 28, "Chicago")
)

val names = people.map(_.name)
val adults = people.filter(_.age >= 30)
val groupedByCity = people.groupBy(_.city)
val averageAge = people.map(_.age).sum / people.length

println(s"Names: $names")
println(s"Adults: $adults")
println(s"Grouped by city: $groupedByCity")
println(s"Average age: $averageAge")
```

**Futures and Concurrency:**
```scala
import scala.concurrent.{Future, Await}
import scala.concurrent.duration._
import scala.concurrent.ExecutionContext.Implicits.global

def fetchData(id: Int): Future[String] = Future {
  Thread.sleep(100)
  s"Data for $id"
}

def fetchMultiple(ids: List[Int]): Future[List[String]] = {
  Future.sequence(ids.map(fetchData))
}

val future1 = fetchData(1)
val future2 = fetchData(2)
val combined = for {
  data1 <- future1
  data2 <- future2
} yield s"$data1 and $data2"

val result = Await.result(combined, 1.second)
println(result)

val ids = (1 to 10).toList
val results = fetchMultiple(ids)

results.onComplete {
  case Success(data) => println(s"Success: ${data.mkString(", ")}")
  case Failure(ex) => println(s"Failed: ${ex.getMessage}")
}

Await.result(results, 2.seconds)
```

**Traits and Mixins:**
```scala
trait Loggable {
  def log(message: String): Unit = {
    println(s"[${java.time.LocalDateTime.now}] $message")
  }
}

trait Timestampable {
  def createdAt: java.time.LocalDateTime
  def updatedAt: java.time.LocalDateTime
}

abstract class Entity(val id: Long) extends Loggable {
  def save(): Boolean = {
    log(s"Saving entity $id")
    true
  }
}

class User(id: Long, val name: String, val email: String) 
    extends Entity(id) 
    with Timestampable {
  
  override val createdAt: java.time.LocalDateTime = java.time.LocalDateTime.now()
  override var updatedAt: java.time.LocalDateTime = java.time.LocalDateTime.now()
  
  def update(name: String, email: String): Unit = {
    this.name = name
    this.email = email
    this.updatedAt = java.time.LocalDateTime.now()
    log(s"Updated user $id")
  }
  
  override def toString: String = s"User($id, $name, $email)"
}

val user = new User(1, "Alice", "alice@example.com")
println(user)
user.update("Alice Smith", "alice.smith@example.com")
println(s"Created: ${user.createdAt}")
println(s"Updated: ${user.updatedAt}")
```

## Best Practices

1. **Prefer vals over vars**: Use immutable values by default; only use mutable variables when necessary.
2. **Use Case Classes for Immutable Data**: Case classes provide equals, hashCode, toString, and copy automatically.
3. **Use Option Instead of Null**: Return Option[T] instead of T | null to represent optional values.
4. **Use Try for Exception Handling**: Return Try[T] for operations that might throw exceptions.
5. **Prefer For Comprehensions Over Nested Maps/FlatMaps**: For comprehensions are more readable for nested operations.
6. **Use Sealed Traits for Enums**: sealed trait with case classes provides exhaustiveness checking in pattern matching.
7. **Keep Functions Small**: Functions should do one thing; use small, composable functions.
8. **Use Type Aliases for Complex Types**: Create type aliases for frequently used complex types.
9. **Run Scalafmt**: Use the standard Scala formatter for consistent code style.
10. **Write Tests with ScalaTest/Munit**: Use ScalaTest or Munit for unit and property-based testing.
