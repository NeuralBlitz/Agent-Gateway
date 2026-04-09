---
name: SOLID Principles
description: Five design principles for writing maintainable, extensible object-oriented software
category: software-development
---
# SOLID Principles

## What I do

I provide five fundamental design principles that help software developers create systems that are easy to maintain, understand, and extend. SOLID is an acronym representing Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion. These principles guide object-oriented design toward more flexible, robust code that can evolve over time without requiring constant rewrites.

## When to use me

Apply SOLID principles when designing new classes, refactoring existing code, or reviewing object-oriented architectures. They are especially valuable in large codebases with multiple developers, where consistent design standards prevent chaos. Use them when you need your code to be testable, when requirements change frequently, or when building frameworks/libraries that other code will depend on. Avoid applying them dogatically to trivial code or one-off scripts.

## Core Concepts

- **S**: Single Responsibility - Each class should have one reason to change
- **O**: Open/Closed - Software should be open for extension, closed for modification
- **L**: Liskov Substitution - Subtypes must be substitutable for their base types
- **I**: Interface Segregation - Many specific interfaces are better than one general one
- **D**: Dependency Inversion - Depend on abstractions, not concretions
- **Cohesion**: How strongly related a class's responsibilities are
- **Coupling**: The degree of interdependence between modules
- **Abstraction**: Representing essential features without implementation details
- **Polymorphism**: Objects of different types responding to the same interface
- **Inversion of Control**: Framework controlling program flow, not application

## Code Examples

### Single Responsibility Principle

```python
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Protocol

class JournalEntry:
    def __init__(self, title: str, content: str):
        self.title = title
        self.content = content
        self.created_at = datetime.now()
        self.entries: list['JournalEntry'] = []
    
    def add_entry(self, entry: 'JournalEntry') -> None:
        self.entries.append(entry)

class Persistence(Protocol):
    @abstractmethod
    def save(self, filename: str) -> None:
        pass

class FilePersistence:
    def save(self, journal: JournalEntry, filename: str) -> None:
        with open(filename, 'w') as f:
            f.write(f"{journal.title}\n{journal.content}")

class DatabasePersistence:
    def save(self, journal: JournalEntry) -> None:
        print(f"Saving journal to database: {journal.title}")

class Journal:
    def __init__(self):
        self.entries: list[JournalEntry] = []
        self.persister: Persistence | None = None
    
    def add_entry(self, title: str, content: str) -> JournalEntry:
        entry = JournalEntry(title, content)
        self.entries.append(entry)
        return entry
    
    def save(self, filename: str = "default.txt") -> None:
        if self.persister:
            self.persister.save(self, filename)
```

### Open/Closed Principle

```python
from abc import ABC, abstractmethod
from typing import Protocol

class DiscountStrategy(Protocol):
    @abstractmethod
    def calculate(self, price: float) -> float:
        pass

class RegularDiscount:
    def calculate(self, price: float) -> float:
        return price * 0.9

class SilverDiscount:
    def calculate(self, price: float) -> float:
        return price * 0.85

class GoldDiscount:
    def calculate(self, price: float) -> float:
        return price * 0.8

class PriceCalculator:
    def __init__(self, discount: DiscountStrategy):
        self.discount = discount
    
    def calculate_final_price(self, price: float) -> float:
        return self.discount.calculate(price)

calculator = PriceCalculator(GoldDiscount())
print(f"Final price: ${calculator.calculate_final_price(100):.2f}")
```

### Liskov Substitution Principle

```python
from abc import ABC, abstractmethod
from typing import Protocol

class Bird(Protocol):
    @abstractmethod
    def fly(self) -> None:
        pass
    
    @abstractmethod
    def eat(self) -> None:
        pass

class Sparrow:
    def fly(self) -> None:
        print("Sparrow flying")
    
    def eat(self) -> None:
        print("Sparrow eating")

class Ostrich:
    def eat(self) -> None:
        print("Ostrich eating")
    
    def run(self) -> None:
        print("Ostrich running")

class FlightfulBird(ABC):
    @abstractmethod
    def fly(self) -> None:
        pass

class FlightlessBird(ABC):
    @abstractmethod
    def run(self) -> None:
        pass

class Eagle(FlightfulBird):
    def fly(self) -> None:
        print("Eagle soaring")
    
    def eat(self) -> None:
        print("Eagle eating")

def make_bird_fly(bird: FlightfulBird) -> None:
    bird.fly()

make_bird_fly(Eagle())
```

### Interface Segregation Principle

```python
from abc import ABC, abstractmethod
from typing import Protocol

class Printer(Protocol):
    @abstractmethod
    def print(self, document: str) -> None:
        pass

class Scanner(Protocol):
    @abstractmethod
    def scan(self, document: str) -> None:
        pass

class Fax(Protocol):
    @abstractmethod
    def fax(self, document: str) -> None:
        pass

class OldPrinter:
    def print(self, document: str) -> None:
        print(f"Printing: {document}")

class ModernPrinter:
    def print(self, document: str) -> None:
        print(f"Printing: {document}")
    
    def scan(self, document: str) -> None:
        print(f"Scanning: {document}")
    
    def fax(self, document: str) -> None:
        print(f"Faxing: {document}")

class MultiFunctionPrinter:
    def __init__(self, printer: Printer, scanner: Scanner):
        self.printer = printer
        self.scanner = scanner
    
    def print_document(self, doc: str) -> None:
        self.printer.print(doc)
    
    def scan_document(self, doc: str) -> None:
        self.scanner.scan(doc)
```

### Dependency Inversion Principle

```python
from abc import ABC, abstractmethod
from typing import Protocol

class MessageSender(Protocol):
    @abstractmethod
    def send(self, message: str, recipient: str) -> bool:
        pass

class EmailSender:
    def send(self, message: str, recipient: str) -> bool:
        print(f"Sending email to {recipient}: {message}")
        return True

class SMSender:
    def send(self, message: str, recipient: str) -> bool:
        print(f"Sending SMS to {recipient}: {message}")
        return True

class NotificationService:
    def __init__(self, sender: MessageSender):
        self.sender = sender
    
    def send_notification(self, message: str, recipient: str) -> bool:
        return self.sender.send(message, recipient)

class User:
    def __init__(self, name: str, email: str, phone: str):
        self.name = name
        self.email = email
        self.phone = phone

email_service = EmailSender()
notification = NotificationService(email_service)
notification.send_notification("Hello!", "user@example.com")
```

## Best Practices

1. **Aim for High Cohesion**: Each class should have tightly related responsibilities
2. **Reduce Coupling**: Minimize dependencies between components
3. **Design to Interfaces**: Define contracts before implementations
4. **Composition over Inheritance**: Prefer flexible object composition
5. **Inject Dependencies**: Pass dependencies rather than hard-coding them
6. **Refactor Regularly**: Apply SOLID principles during code reviews
7. **Testability**: SOLID code is inherently more testable
8. **Avoid God Classes**: Split large classes into focused components
9. **Abstract Frameworks**: Depend on abstractions, not concrete implementations
10. **YAGNI**: Don't over-engineer; apply principles pragmatically
