---
name: Design Patterns
description: Reusable solutions to common software design problems with categorized pattern implementations
license: MIT
compatibility:
  - Python
  - JavaScript
  - Java
  - Go
  - All Languages
audience: Software Developers, System Architects, Technical Leads
category: software-development
---

# Design Patterns

## What I Do

I provide comprehensive guidance on design patterns, proven reusable solutions to recurring software design problems. Design patterns are not finished code but templates for solving problems in ways that have proven effective across many projects. I cover creational patterns for object creation, structural patterns for composing classes, and behavioral patterns for communication between objects. Understanding patterns helps developers communicate using shared vocabulary and makes code more flexible, maintainable, and professional.

## When to Use Me

Apply design patterns when you encounter common problems that others have solved before. Patterns help when you need to make classes work together flexibly, when you want to communicate design intent clearly to other developers, and when you're building systems that will evolve over time. Use patterns for library code, frameworks, and enterprise applications. Avoid forcing patterns into situations where they don't fit; not every problem needs a pattern. Recognize when simple code is better than pattern-based complexity.

## Core Concepts

- **Creational Patterns**: Handle object instantiation mechanisms (Factory, Builder, Singleton)
- **Structural Patterns**: Compose objects into larger structures (Adapter, Decorator, Facade)
- **Behavioral Patterns**: Handle communication between objects (Observer, Strategy, Command)
- **Factory Method**: Delegate instantiation to subclasses
- **Abstract Factory**: Create families of related objects
- **Builder**: Separate construction from representation
- **Singleton**: Ensure single instance with global access
- **Adapter**: Make incompatible interfaces work together
- **Decorator**: Add behavior dynamically
- **Observer**: Notify multiple objects of state changes

## Code Examples

```python
from abc import ABC, abstractmethod
from typing import Dict, Type, Optional
import threading

class Document(ABC):
    """Abstract product"""
    @abstractmethod
    def render(self) -> str:
        pass

class PDFDocument(Document):
    """Concrete PDF document"""
    def render(self) -> str:
        return "Rendering PDF document"

class WordDocument(Document):
    """Concrete Word document"""
    def render(self) -> str:
        return "Rendering Word document"

class HtmlDocument(Document):
    """Concrete HTML document"""
    def render(self) -> str:
        return "Rendering HTML document"

class DocumentCreator(ABC):
    """Abstract factory for creating documents"""
    @abstractmethod
    def create_document(self, name: str) -> Document:
        pass

class PDFDocumentFactory(DocumentCreator):
    """Concrete factory for PDF documents"""
    def create_document(self, name: str) -> Document:
        return PDFDocument()

class WordDocumentFactory(DocumentCreator):
    """Concrete factory for Word documents"""
    def create_document(self, name: str) -> Document:
        return WordDocument()

class DocumentFactoryProducer:
    """Producer that creates document factories"""
    _factories: Dict[str, Type[DocumentCreator]] = {
        "pdf": PDFDocumentFactory,
        "word": WordDocumentFactory,
        "html": HtmlDocumentFactory
    }

    @classmethod
    def get_factory(cls, doc_type: str) -> Optional[DocumentCreator]:
        factory_class = cls._factories.get(doc_type.lower())
        return factory_class() if factory_class else None

class HtmlDocumentFactory(DocumentCreator):
    """Concrete factory for HTML documents"""
    def create_document(self, name: str) -> Document:
        return HtmlDocument()

class Application:
    """Client using abstract factory"""
    def __init__(self, factory: DocumentCreator):
        self.document = factory.create_document("Report")

    def render(self) -> str:
        return self.document.render()
```

```python
from typing import Any, List, Callable

class Subject:
    """Observable subject that notifies observers"""
    def __init__(self):
        self._observers: List[Callable] = []
        self._state: Dict[str, Any] = {}

    def attach(self, observer: Callable) -> None:
        """Add observer to notify list"""
        if observer not in self._observers:
            self._observers.append(observer)

    def detach(self, observer: Callable) -> None:
        """Remove observer from notify list"""
        if observer in self._observers:
            self._observers.remove(observer)

    def notify(self) -> None:
        """Notify all observers of state change"""
        for observer in self._observers:
            observer(self._state)

    @property
    def state(self) -> Dict[str, Any]:
        """Get current state"""
        return self._state.copy()

    @state.setter
    def state(self, value: Dict[str, Any]) -> None:
        """Update state and notify observers"""
        self._state = value
        self.notify()

class DataAnalyzer:
    """Observer that analyzes data changes"""
    def __init__(self, name: str):
        self.name = name
        self.last_value: Any = None

    def __call__(self, state: Dict[str, Any]) -> None:
        """Handle state change notification"""
        print(f"[{self.name}] Data updated: {state}")
        self.last_value = state

class DataDashboard:
    """Observer that displays data"""
    def __init__(self, name: str):
        self.name = name

    def __call__(self, state: Dict[str, Any]) -> None:
        """Handle state change notification"""
        print(f"[{self.name}] Dashboard showing: {list(state.keys())}")

class StockMarket:
    """Real-world example: stock price tracker"""
    def __init__(self):
        self._observers: List[Callable] = []
        self._prices: Dict[str, float] = {}

    def subscribe(self, observer: Callable) -> None:
        """Subscribe to price updates"""
        self._observers.append(observer)

    def unsubscribe(self, observer: Callable) -> None:
        """Unsubscribe from price updates"""
        if observer in self._observers:
            self._observers.remove(observer)

    def update_price(self, symbol: str, price: float) -> None:
        """Update price and notify subscribers"""
        self._prices[symbol] = price
        self._notify()

    def _notify(self) -> None:
        """Notify all subscribers"""
        for observer in self._observers:
            observer(self._prices.copy())
```

```python
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

class Strategy(ABC):
    """Abstract strategy interface"""
    @abstractmethod
    def execute(self, data: Any) -> Any:
        pass

class ConcreteStrategyA(Strategy):
    """Concrete strategy A"""
    def execute(self, data: Any) -> Any:
        return f"Strategy A processed: {data}"

class ConcreteStrategyB(Strategy):
    """Concrete strategy B"""
    def execute(self, data: Any) -> Any:
        return f"Strategy B processed: {data.upper()}"

class ConcreteStrategyC(Strategy):
    """Concrete strategy C"""
    def execute(self, data: Any) -> Any:
        return f"Strategy C processed: {len(data)}"

class Context:
    """Context that uses a strategy"""
    def __init__(self, strategy: Strategy = None):
        self._strategy = strategy

    def set_strategy(self, strategy: Strategy) -> None:
        """Change strategy at runtime"""
        self._strategy = strategy

    def execute_strategy(self, data: Any) -> Any:
        """Execute current strategy"""
        if self._strategy:
            return self._strategy.execute(data)
        return "No strategy set"

class PaymentProcessor:
    """Strategy pattern for payment methods"""
    def __init__(self):
        self._strategies: Dict[str, Strategy] = {}

    def register_strategy(self, name: str, strategy: Strategy) -> None:
        """Register a payment strategy"""
        self._strategies[name] = strategy

    def process_payment(
        self,
        amount: float,
        strategy_name: str = "credit_card"
    ) -> str:
        """Process payment using specified strategy"""
        strategy = self._strategies.get(strategy_name)
        if not strategy:
            return f"Unknown payment method: {strategy_name}"
        return strategy.execute(amount)

class CreditCardStrategy(Strategy):
    """Credit card payment strategy"""
    def execute(self, amount: float) -> str:
        return f"Charging ${amount:.2f} to credit card"

class PayPalStrategy(Strategy):
    """PayPal payment strategy"""
    def execute(self, amount: float) -> str:
        return f"Processing ${amount:.2f} via PayPal"

class CryptoStrategy(Strategy):
    """Cryptocurrency payment strategy"""
    def __init__(self, wallet: str):
        self.wallet = wallet

    def execute(self, amount: float) -> str:
        return f"Sending {amount * 0.00001} BTC to {self.wallet}"
```

```python
from abc import ABC, abstractmethod
from typing import Any, Dict

class Command(ABC):
    """Abstract command interface"""
    @abstractmethod
    def execute(self) -> Any:
        pass

    @abstractmethod
    def undo(self) -> None:
        pass

class Light:
    """Receiver class"""
    def __init__(self, location: str):
        self.location = location
        self.is_on = False

    def on(self) -> str:
        self.is_on = True
        return f"{self.location} light is ON"

    def off(self) -> str:
        self.is_on = False
        return f"{self.location} light is OFF"

class LightOnCommand(Command):
    """Concrete command for turning light on"""
    def __init__(self, light: Light):
        self.light = light

    def execute(self) -> str:
        return self.light.on()

    def undo(self) -> str:
        return self.light.off()

class LightOffCommand(Command):
    """Concrete command for turning light off"""
    def __init__(self, light: Light):
        self.light = light

    def execute(self) -> str:
        return self.light.off()

    def undo(self) -> str:
        return self.light.on()

class RemoteControl:
    """Invoker that executes commands"""
    def __init__(self):
        self._commands: Dict[str, Command] = {}
        self._history: List[Command] = []

    def set_command(self, slot: str, command: Command) -> None:
        """Assign command to slot"""
        self._commands[slot] = command

    def press_button(self, slot: str) -> str:
        """Execute command for slot"""
        if slot in self._commands:
            command = self._commands[slot]
            result = command.execute()
            self._history.append(command)
            return result
        return f"No command for slot: {slot}"

    def press_undo(self) -> str:
        """Undo last command"""
        if self._history:
            last_command = self._history.pop()
            return last_command.undo()
        return "Nothing to undo"

class MacroCommand(Command):
    """Command that executes multiple commands"""
    def __init__(self, commands: List[Command]):
        self.commands = commands

    def execute(self) -> str:
        results = [cmd.execute() for cmd in self.commands]
        return f"Macro executed: {len(results)} commands"

    def undo(self) -> str:
        results = [cmd.undo() for cmd in reversed(self.commands)]
        return f"Macro undone: {len(results)} commands"
```

```python
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

class Pizza:
    """Product class"""
    def __init__(self):
        self.dough = ""
        self.sauce = ""
        self.toppings: List[str] = []
        self.cooking_time = 0

    def __str__(self) -> str:
        return f"Pizza with {self.dough} dough, {self.sauce}, toppings: {', '.join(self.toppings)}"

class PizzaBuilder:
    """Builder for creating pizzas step by step"""
    def __init__(self):
        self.pizza = Pizza()

    def set_dough(self, dough: str) -> "PizzaBuilder":
        self.pizza.dough = dough
        return self

    def set_sauce(self, sauce: str) -> "PizzaBuilder":
        self.pizza.sauce = sauce
        return self

    def add_topping(self, topping: str) -> "PizzaBuilder":
        self.pizza.toppings.append(topping)
        return self

    def set_cooking_time(self, minutes: int) -> "PizzaBuilder":
        self.pizza.cooking_time = minutes
        return self

    def build(self) -> Pizza:
        """Return built pizza"""
        return self.pizza

class Director:
    """Director that uses builder to construct"""
    def __init__(self, builder: PizzaBuilder):
        self.builder = builder

    def build_margherita(self) -> Pizza:
        """Build margherita pizza"""
        return (
            self.builder
            .set_dough("thin")
            .set_sauce("tomato")
            .add_topping("mozzarella")
            .add_topping("basil")
            .set_cooking_time(12)
            .build()
        )

    def build_pepperoni(self) -> Pizza:
        """Build pepperoni pizza"""
        return (
            self.builder
            .set_dough("thick")
            .set_sauce("tomato")
            .add_topping("pepperoni")
            .add_topping("cheese")
            .set_cooking_time(15)
            .build()
        )

class PizzaBuilderFluent:
    """Alternative fluent builder with method chaining"""
    def __init__(self):
        self._pizza = {}

    def with_dough(self, dough: str) -> "PizzaBuilderFluent":
        self._pizza["dough"] = dough
        return self

    def with_sauce(self, sauce: str) -> "PizzaBuilderFluent":
        self._pizza["sauce"] = sauce
        return self

    def with_toppings(self, toppings: List[str]) -> "PizzaBuilderFluent":
        self._pizza["toppings"] = toppings
        return self

    def cook(self, minutes: int) -> Dict[str, Any]:
        self._pizza["cooking_time"] = minutes
        return self._pizza.copy()
```

```python
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

class Logger(ABC):
    """Component interface"""
    @abstractmethod
    def log(self, message: str) -> None:
        pass

class ConsoleLogger(Logger):
    """Concrete component"""
    def log(self, message: str) -> None:
        print(f"[CONSOLE] {message}")

class TimestampLogger(Logger):
    """Concrete decorator adding timestamps"""
    def __init__(self, logger: Logger):
        self._logger = logger

    def log(self, message: str) -> None:
        from datetime import datetime
        timestamped = f"[{datetime.now().isoformat()}] {message}"
        self._logger.log(timestamped)

class UppercaseLogger(Logger):
    """Concrete decorator converting to uppercase"""
    def __init__(self, logger: Logger):
        self._logger = logger

    def log(self, message: str) -> None:
        self._logger.log(message.upper())

class PrefixLogger(Logger):
    """Concrete decorator adding prefix"""
    def __init__(self, logger: Logger, prefix: str):
        self._logger = logger
        self.prefix = prefix

    def log(self, message: str) -> None:
        self._logger.log(f"[{self.prefix}] {message}")

class SecureLogger(Logger):
    """Decorator that redacts sensitive data"""
    def __init__(self, logger: Logger):
        self._logger = logger
        self._sensitive_patterns = ["password", "credit_card", "ssn"]

    def log(self, message: str) -> None:
        import re
        for pattern in self._sensitive_patterns:
            message = re.sub(
                rf'{pattern}[:=]\S+',
                f'{pattern}:[REDACTED]',
                message,
                flags=re.IGNORECASE
            )
        self._logger.log(message)

class APIRateLimiter:
    """Decorator adding rate limiting"""
    def __init__(self, logger: Logger, max_requests: int = 10):
        self._logger = logger
        self._max_requests = max_requests
        self._request_count = 0

    def log(self, message: str) -> None:
        if self._request_count < self._max_requests:
            self._logger.log(message)
            self._request_count += 1
        else:
            self._logger.log("Rate limit exceeded")

class FileLogger(Logger):
    """Concrete component writing to file"""
    def __init__(self, filename: str):
        self.filename = filename

    def log(self, message: str) -> None:
        with open(self.filename, "a") as f:
            f.write(f"{message}\n")
```

## Best Practices

- Learn patterns before trying to apply them; understanding the problem is key
- Don't force patterns into problems where they don't fit
- Start with simple code and refactor toward patterns when needed
- Use pattern names in comments to communicate intent to other developers
- Patterns are starting points, not rigid prescriptions; adapt to context
- Combine patterns thoughtfully; many solutions use multiple patterns
- Consider the consequences: patterns add abstraction that affects performance
- Recognize when a pattern solution has become over-engineered
- Patterns encode proven solutions; leverage collective wisdom
- Prefer composition over inheritance when implementing patterns

## Common Patterns

- **Factory Method**: Delegate object creation to subclasses
- **Abstract Factory**: Create families of related objects
- **Builder**: Separate construction from representation for complex objects
- **Singleton**: Ensure single instance with controlled access
- **Adapter**: Make incompatible interfaces work together
- **Decorator**: Add responsibilities dynamically
- **Facade**: Provide simplified interface to complex subsystem
- **Observer**: Implement distributed event handling
- **Strategy**: Encapsulate interchangeable algorithms
- **Command**: Encapsulate requests as objects with undo capability
