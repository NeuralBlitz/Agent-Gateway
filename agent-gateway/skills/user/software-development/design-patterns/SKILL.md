---
name: Design Patterns
description: Reusable solutions to common software design problems using established architectural patterns
category: software-development
---
# Design Patterns

## What I do

I provide proven, reusable solutions to recurring software design problems. Design patterns are not finished code but templates for how to solve a problem in a way that is reusable and maintainable. They represent best practices evolved over time by experienced developers facing similar challenges. I help you identify appropriate patterns for your specific context, implement them correctly, and combine them effectively to build robust software architectures.

## When to use me

Use design patterns when you encounter common architectural problems that have known solutions. Patterns are most valuable when you have a team because they provide a shared vocabulary and standard approach to solving problems. Apply patterns when building complex systems that need to be extensible, when you need to communicate design intent clearly to other developers, or when you want to leverage battle-tested solutions rather than reinventing solutions. Avoid over-engineering simple applications with unnecessary patterns.

## Core Concepts

- **Creational Patterns**: Factory Method, Abstract Factory, Builder, Singleton, Prototype
- **Structural Patterns**: Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy
- **Behavioral Patterns**: Chain of Responsibility, Command, Interpreter, Iterator, Mediator, Memento, Observer, State, Strategy, Template Method, Visitor
- **Pattern Intent**: The core problem each pattern solves
- **Participants**: The classes and objects involved in a pattern
- **Collaborations**: How participants work together
- **Consequences**: Trade-offs of using a pattern
- **Implementation**: Practical considerations for code
- **Related Patterns**: Connections between patterns

## Code Examples

### Factory Method Pattern

```python
from abc import ABC, abstractmethod
from typing import Optional

class Document(ABC):
    @abstractmethod
    def create_page(self) -> str:
        pass

class Resume(Document):
    def create_page(self) -> str:
        return "Resume page with personal info, experience, education"

class Report(Document):
    def create_page(self) -> str:
        return "Report page with title, author, sections"

class DocumentFactory:
    _registry: dict[str, type[Document]] = {}
    
    @classmethod
    def register(cls, doc_type: str, doc_class: type[Document]) -> None:
        cls._registry[doc_type] = doc_class
    
    @classmethod
    def create(cls, doc_type: str) -> Document:
        if doc_type not in cls._registry:
            raise ValueError(f"Unknown document type: {doc_type}")
        return cls._registry[doc_type]()

DocumentFactory.register("resume", Resume)
DocumentFactory.register("report", Report)

resume = DocumentFactory.create("resume")
print(resume.create_page())
```

### Strategy Pattern

```python
from abc import ABC, abstractmethod
from typing import Protocol

class PaymentStrategy(Protocol):
    def pay(self, amount: float) -> bool:
        ...

class CreditCardPayment:
    def __init__(self, card_number: str, expiry: str, cvv: str):
        self.card_number = card_number
        self.expiry = expiry
        self.cvv = cvv
    
    def pay(self, amount: float) -> bool:
        print(f"Processing credit card payment of ${amount}")
        return True

class PayPalPayment:
    def __init__(self, email: str):
        self.email = email
    
    def pay(self, amount: float) -> bool:
        print(f"Processing PayPal payment of ${amount} for {self.email}")
        return True

class ShoppingCart:
    def __init__(self):
        self.items: list[tuple[str, float]] = []
        self._payment_strategy: Optional[PaymentStrategy] = None
    
    def add_item(self, name: str, price: float) -> None:
        self.items.append((name, price))
    
    def set_payment_strategy(self, strategy: PaymentStrategy) -> None:
        self._payment_strategy = strategy
    
    def checkout(self) -> bool:
        total = sum(price for _, price in self.items)
        if not self._payment_strategy:
            raise ValueError("No payment strategy set")
        return self._payment_strategy.pay(total)

cart = ShoppingCart()
cart.add_item("Book", 29.99)
cart.set_payment_strategy(CreditCardPayment("1234", "12/25", "123"))
cart.checkout()
```

### Observer Pattern

```python
from abc import ABC, abstractmethod
from typing import Protocol

class StockObserver(Protocol):
    def update(self, symbol: str, price: float) -> None:
        ...

class StockMarket:
    def __init__(self):
        self._observers: list[StockObserver] = []
        self._stock_prices: dict[str, float] = {}
    
    def register(self, observer: StockObserver) -> None:
        self._observers.append(observer)
    
    def unregister(self, observer: StockObserver) -> None:
        self._observers.remove(observer)
    
    def set_price(self, symbol: str, price: float) -> None:
        self._stock_prices[symbol] = price
        self._notify(symbol, price)
    
    def _notify(self, symbol: str, price: float) -> None:
        for observer in self._observers:
            observer.update(symbol, price)

class Investor:
    def __init__(self, name: str):
        self.name = name
    
    def update(self, symbol: str, price: float) -> None:
        print(f"Investor {self.name}: {symbol} is now ${price:.2f}")

market = StockMarket()
market.register(Investor("Alice"))
market.register(Investor("Bob"))
market.set_price("AAPL", 150.00)
```

### Decorator Pattern

```python
from abc import ABC, abstractmethod
from typing import Protocol

class Coffee(Protocol):
    def get_description(self) -> str:
        pass
    
    def get_cost(self) -> float:
        pass

class Espresso:
    def get_description(self) -> str:
        return "Espresso"
    
    def get_cost(self) -> float:
        return 2.00

class CoffeeDecorator(Coffee):
    def __init__(self, coffee: Coffee):
        self._coffee = coffee
    
    def get_description(self) -> str:
        return self._coffee.get_description()
    
    def get_cost(self) -> float:
        return self._coffee.get_cost()

class Milk(CoffeeDecorator):
    def get_description(self) -> str:
        return self._coffee.get_description() + ", Milk"
    
    def get_cost(self) -> float:
        return self._coffee.get_cost() + 0.50

class Sugar(CoffeeDecorator):
    def get_description(self) -> str:
        return self._coffee.get_description() + ", Sugar"
    
    def get_cost(self) -> float:
        return self._coffee.get_cost() + 0.25

coffee = Sugar(Milk(Espresso()))
print(f"{coffee.get_description()}: ${coffee.get_cost():.2f}")
```

### Singleton Pattern

```python
class DatabaseConnection:
    _instance: 'DatabaseConnection | None' = None
    _connection: str | None = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def connect(self, db_name: str) -> None:
        if self._connection:
            raise RuntimeError("Already connected")
        self._connection = f"Connection to {db_name}"
        print(f"Connected to {db_name}")
    
    def query(self, sql: str) -> list[dict]:
        if not self._connection:
            raise RuntimeError("Not connected")
        print(f"Executing: {sql}")
        return [{"id": 1, "name": "Sample"}]

db1 = DatabaseConnection()
db1.connect("production_db")
db2 = DatabaseConnection()
print(db1 is db2)
db2.connect("another_db")
```

## Best Practices

1. **Start Simple**: Don't apply patterns prematurely; solve problems with simple code first
2. **Know the Trade-offs**: Every pattern has benefits and costs; understand both before applying
3. **Prefer Composition**: Favor object composition over class inheritance when possible
4. **Avoid God Objects**: Don't let one class know too much or do too much
5. **Keep Cohesion High**: Related functionality should be grouped together
6. **Minimize Coupling**: Reduce dependencies between modules
7. **Open/Closed Principle**: Software should be open for extension, closed for modification
8. **Use Patterns as Vocabulary**: Share pattern names to communicate intent clearly
9. **Refactor to Patterns**: Apply patterns during refactoring, not initial design
10. **Combine Patterns Wisely**: Multiple patterns often work together; understand their interactions
