---
name: SOLID Principles
description: Five object-oriented design principles for writing maintainable, scalable software
license: MIT
compatibility:
  - Python
  - JavaScript
  - Java
  - Go
  - All OOP Languages
audience: Software Developers, System Architects, Technical Leads
category: software-development
---

# SOLID Principles

## What I Do

I provide comprehensive guidance on SOLID, the five fundamental principles of object-oriented design that create flexible, maintainable software. SOLID helps developers create systems that are easy to understand, extend, and refactor. Each principle addresses specific design problems: Single Responsibility prevents god objects, Open/Closed allows extension without modification, Liskov Substitution ensures polymorphic correctness, Interface Segregation keeps interfaces focused, and Dependency Inversion depends on abstractions. Together they form the foundation of professional object-oriented design.

## When to Use Me

Apply SOLID principles when designing new classes, interfaces, and modules. They are essential for enterprise applications that will evolve over time, for library and framework code used by many consumers, and for team projects where code is maintained by multiple developers. Prioritize SOLID in core domain logic, public APIs, and frequently modified areas. Avoid over-engineering with SOLID for simple data classes, one-off scripts, or prototypes where the cost of abstraction outweighs benefits. Balance principles with pragmatism.

## Core Concepts

- **Single Responsibility Principle (SRP)**: A class should have only one reason to change
- **Open/Closed Principle (OCP)**: Software entities should be open for extension, closed for modification
- **Liskov Substitution Principle (LSP)**: Objects of superclass should be replaceable with subclass objects
- **Interface Segregation Principle (ISP)**: Clients should not depend on methods they don't use
- **Dependency Inversion Principle (DIP)**: Depend on abstractions, not concretions
- **Cohesion**: Measure of how closely related a class's responsibilities are
- **Coupling**: Degree of interdependence between software units
- **Abstraction**: Hiding implementation details behind well-defined interfaces
- **Polymorphism**: Objects of different types responding to same interface
- **Inversion of Control**: Framework controls program flow, not application code

## Code Examples

```python
from abc import ABC, abstractmethod
from typing import List, Dict, Optional
from datetime import datetime
from dataclasses import dataclass

@dataclass
class User:
    id: int
    username: str
    email: str

class UserRepository(ABC):
    """Abstraction for user data persistence"""
    @abstractmethod
    def save(self, user: User) -> None:
        pass

    @abstractmethod
    def find_by_id(self, user_id: int) -> Optional[User]:
        pass

    @abstractmethod
    def find_by_email(self, email: str) -> Optional[User]:
        pass

class SqlUserRepository(UserRepository):
    """SQL implementation of user repository"""
    def __init__(self, connection_string: str):
        self.connection_string = connection_string

    def save(self, user: User) -> None:
        print(f"INSERT INTO users VALUES ({user.id}, '{user.username}')")

    def find_by_id(self, user_id: int) -> Optional[User]:
        print(f"SELECT * FROM users WHERE id = {user_id}")
        return None

    def find_by_email(self, email: str) -> Optional[User]:
        print(f"SELECT * FROM users WHERE email = '{email}'")
        return None

class InMemoryUserRepository(UserRepository):
    """In-memory implementation for testing"""
    def __init__(self):
        self.users: Dict[int, User] = {}

    def save(self, user: User) -> None:
        self.users[user.id] = user

    def find_by_id(self, user_id: int) -> Optional[User]:
        return self.users.get(user_id)

    def find_by_email(self, email: str) -> Optional[User]:
        for user in self.users.values():
            if user.email == email:
                return user
        return None
```

```python
class DiscountCalculator:
    """Calculates discounts - single responsibility for pricing logic"""
    def __init__(self, customer_repository, product_repository):
        self.customers = customer_repository
        self.products = product_repository

    def calculate_discount(
        self,
        customer_id: int,
        product_id: int,
        quantity: int
    ) -> float:
        """Calculate total discount based on customer and product rules"""
        customer = self.customers.find_by_id(customer_id)
        product = self.products.find_by_id(product_id)

        if not customer or not product:
            return 0.0

        total_discount = 0.0

        tier_discount = self._apply_tier_discount(customer)
        total_discount += tier_discount

        if self._is_bulk_order(quantity):
            total_discount += self._apply_bulk_discount(product, quantity)

        if self._is_seasonal_promotion():
            total_discount += self._apply_seasonal_discount(product)

        return total_discount

    def _apply_tier_discount(self, customer) -> float:
        """Apply discount based on customer tier"""
        tier_discounts = {"gold": 0.15, "silver": 0.10, "bronze": 0.05}
        return tier_discounts.get(customer.tier, 0.0)

    def _apply_bulk_discount(self, product, quantity: int) -> float:
        """Apply bulk order discount"""
        if quantity >= 100:
            return 0.10
        elif quantity >= 50:
            return 0.05
        return 0.0

    def _apply_seasonal_discount(self, product) -> float:
        """Apply seasonal promotion discount"""
        return 0.05

    def _is_bulk_order(self, quantity: int) -> bool:
        """Check if order qualifies for bulk discount"""
        return quantity >= 50

    def _is_seasonal_promotion(self) -> bool:
        """Check if seasonal promotion is active"""
        return datetime.now().month in [11, 12]

class OrderPrinter:
    """Handles order printing - separate from order logic"""
    def print_order(self, order: dict) -> None:
        print(f"Order #{order['id']}")
        print(f"Customer: {order['customer_name']}")
        for item in order['items']:
            print(f"  - {item['name']}: ${item['price']}")
        print(f"Total: ${order['total']}")

class OrderValidator:
    """Validates orders - separate concern from business logic"""
    def validate(self, order: dict) -> tuple:
        errors = []

        if not order.get('customer_id'):
            errors.append("Customer ID is required")

        if not order.get('items'):
            errors.append("Order must have at least one item")

        for item in order.get('items', []):
            if item.get('quantity', 0) <= 0:
                errors.append(f"Invalid quantity for item {item.get('id')}")

        return len(errors) == 0, errors
```

```python
class Shape(ABC):
    """Abstract base class for shapes - defines interface"""
    @abstractmethod
    def area(self) -> float:
        pass

    @abstractmethod
    def perimeter(self) -> float:
        pass

class Rectangle(Shape):
    """Rectangle implementation"""
    def __init__(self, width: float, height: float):
        self.width = width
        self.height = height

    def area(self) -> float:
        return self.width * self.height

    def perimeter(self) -> float:
        return 2 * (self.width + self.height)

class Circle(Shape):
    """Circle implementation"""
    def __init__(self, radius: float):
        self.radius = radius

    def area(self) -> float:
        return 3.14159 * self.radius ** 2

    def perimeter(self) -> float:
        return 2 * 3.14159 * self.radius

class Triangle(Shape):
    """Triangle implementation"""
    def __init__(self, base: float, height: float, side_a: float, side_b: float):
        self.base = base
        self.height = height
        self.side_a = side_a
        self.side_b = side_b

    def area(self) -> float:
        return 0.5 * self.base * self.height

    def perimeter(self) -> float:
        return self.base + self.side_a + self.side_b

class AreaCalculator:
    """Demonstrates LSP - works with any Shape"""
    def __init__(self, shapes: List[Shape]):
        self.shapes = shapes

    def total_area(self) -> float:
        return sum(shape.area() for shape in self.shapes)

    def largest_shape(self) -> Shape:
        return max(self.shapes, key=lambda s: s.area())

    def shapes_by_area(self) -> Dict[float, List[Shape]]:
        grouped = {}
        for shape in self.shapes:
            area = round(shape.area(), 2)
            if area not in grouped:
                grouped[area] = []
            grouped[area].append(shape)
        return grouped
```

```python
class MultiFunctionPrinter(ABC):
    """Fat interface - violates ISP"""
    @abstractmethod
    def print(self, document: str) -> None:
        pass

    @abstractmethod
    def scan(self, document: str) -> None:
        pass

    @abstractmethod
    def fax(self, document: str) -> None:
        pass

    @abstractmethod
    def copy(self, document: str) -> None:
        pass

class OldPrinter(MultiFunctionPrinter):
    """Old printer that only prints - forced to implement unused methods"""
    def print(self, document: str) -> None:
        print(f"Printing: {document}")

    def scan(self, document: str) -> None:
        raise NotImplementedError("Scan not supported")

    def fax(self, document: str) -> None:
        raise NotImplementedError("Fax not supported")

    def copy(self, document: str) -> None:
        raise NotImplementedError("Copy not supported")


class PrinterInterface(ABC):
    """Segregated interface - only print"""
    @abstractmethod
    def print(self, document: str) -> None:
        pass

class ScannerInterface(ABC):
    """Segregated interface - only scan"""
    @abstractmethod
    def scan(self, document: str) -> None:
        pass

class FaxInterface(ABC):
    """Segregated interface - only fax"""
    @abstractmethod
    def fax(self, document: str) -> None:
        pass

class SimplePrinter(PrinterInterface):
    """Simple printer implements only what it needs"""
    def print(self, document: str) -> None:
        print(f"Printing: {document}")

class AdvancedPrinter(PrinterInterface, ScannerInterface):
    """Advanced printer implements multiple interfaces"""
    def print(self, document: str) -> None:
        print(f"Printing: {document}")

    def scan(self, document: str) -> None:
        print(f"Scanning: {document}")

class AllInOnePrinter(PrinterInterface, ScannerInterface, FaxInterface):
    """Full-featured printer"""
    def print(self, document: str) -> None:
        print(f"Printing: {document}")

    def scan(self, document: str) -> None:
        print(f"Scanning: {document}")

    def fax(self, document: str) -> None:
        print(f"Faxing: {document}")
```

```python
from abc import ABC, abstractmethod
from typing import Protocol, runtime_checkable

class NotificationSender(Protocol):
    """Abstraction for notification services"""
    @abstractmethod
    def send(self, to: str, message: str) -> bool:
        pass

class EmailService:
    """Concrete email implementation"""
    def send(self, to: str, message: str) -> bool:
        print(f"Email sent to {to}: {message}")
        return True

class SmsService:
    """Concrete SMS implementation"""
    def send(self, to: str, message: str) -> bool:
        print(f"SMS sent to {to}: {message}")
        return True

class PushNotificationService:
    """Concrete push notification implementation"""
    def send(self, to: str, message: str) -> bool:
        print(f"Push sent to {to}: {message}")
        return True

class UserNotifier:
    """Depends on abstraction, not concrete implementations"""
    def __init__(self, notification_service: NotificationSender):
        self.notification_service = notification_service

    def notify_user(self, user: dict, message: str) -> bool:
        """Send notification through configured channel"""
        channel = user.get("notification_channel", "email")
        address = user.get(f"{channel}_address", "")

        return self.notification_service.send(address, message)

class UserNotifierWithFactory:
    """Uses factory to create appropriate notification service"""
    def __init__(self, service_factory):
        self.factory = service_factory

    def notify_user(self, user: dict, message: str) -> bool:
        """Get service from factory and send notification"""
        service = self.factory.create_service(user.get("notification_channel"))
        if service:
            return service.send(user.get("email", ""), message)
        return False

class NotificationServiceFactory:
    """Factory for creating notification services"""
    _services = {
        "email": EmailService,
        "sms": SmsService,
        "push": PushNotificationService
    }

    @classmethod
    def create_service(cls, channel: str) -> Optional[NotificationSender]:
        """Create service based on channel type"""
        service_class = cls._services.get(channel)
        if service_class:
            return service_class()
        return None
```

## Best Practices

- Start with single responsibility; extract until each class has one clear purpose
- Design for extension: use polymorphism instead of modifying existing code
- LSP violations often indicate flawed inheritance hierarchies; reconsider design
- Keep interfaces small and focused; fat interfaces create unnecessary coupling
- Inject dependencies rather than hardcoding implementations
- Prefer composition over inheritance for flexibility
- Apply principles gradually; don't abstract prematurely
- Consider SOLID violations as warning signs, not absolute rules
- Refactor toward SOLID when code becomes hard to change
- Use abstract base classes and protocols for clear abstractions

## Common Patterns

- **Strategy Pattern**: Encapsulate algorithms, interchangeable at runtime
- **Factory Pattern**: Centralize object creation logic
- **Decorator Pattern**: Add behavior without modifying class
- **Observer Pattern**: Event-driven communication between objects
- **Command Pattern**: Encapsulate requests as objects
- **Dependency Injection Container**: Manage object dependencies automatically
- **Repository Pattern**: Abstract data access behind clean interface
