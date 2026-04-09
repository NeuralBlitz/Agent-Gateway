---
name: Refactoring
description: Systematic improvement of existing code without changing external behavior
category: software-development
---
# Refactoring

## What I do

I provide techniques for improving the structure of existing code while preserving its functionality. Refactoring is the art of transforming code into a better version of itself—cleaner, simpler, more maintainable—without altering what the code does. I help identify code smells, apply transformation patterns, and ensure that improvements don't introduce regressions.

## When to use me

Refactor when adding new features, fixing bugs, or during code reviews when you notice opportunities for improvement. Apply the "Rule of Three" — code can be copied once, but the third time needs refactoring. Refactor when code is hard to understand, when tests are difficult to write, or when you see duplication. Never refactor without tests that verify behavior. Avoid refactoring production code without proper safeguards.

## Core Concepts

- **Code Smells**: Indicators of deeper problems in code
- **Composition over Inheritance**: Favor flexible object composition
- **Extract Method**: Moving code into well-named functions
- **Rename Variable**: Giving variables meaningful names
- **Inline Method**: Simplifying overly abstracted code
- **Replace Conditional with Polymorphism**: Using objects instead of switches
- **Introduce Parameter Object**: Grouping related parameters
- **Replace Magic Numbers**: Using named constants
- **Move Method/Field**: Placing functionality in appropriate classes
- **Tease Apart Inheritance**: Separating responsibilities in class hierarchies

## Code Examples

### Extract Method Refactoring

```python
# Before: Long method doing multiple things
def process_order(order_data: dict) -> dict:
    # Validate order
    if "customer_id" not in order_data:
        raise ValueError("Missing customer_id")
    if "items" not in order_data or not order_data["items"]:
        raise ValueError("Order must have items")
    
    # Calculate prices
    subtotal = 0
    for item in order_data["items"]:
        subtotal += item["price"] * item["quantity"]
    tax = subtotal * 0.08
    total = subtotal + tax
    
    # Apply discounts
    if "discount_code" in order_data:
        discount = 0.1 if order_data["discount_code"] == "SAVE10" else 0
        total *= (1 - discount)
    
    # Save order
    order_data["order_id"] = generate_order_id()
    order_data["subtotal"] = subtotal
    order_data["tax"] = tax
    order_data["total"] = total
    order_data["status"] = "processed"
    
    # Send notification
    send_email(order_data["customer_id"], "Order processed", order_data)
    
    return order_data

# After: Each method does one thing
def process_order(order_data: dict) -> dict:
    validate_order(order_data)
    calculate_order_prices(order_data)
    apply_discounts(order_data)
    finalize_order(order_data)
    send_order_notification(order_data)
    return order_data

def validate_order(order_data: dict) -> None:
    if "customer_id" not in order_data:
        raise ValueError("Missing customer_id")
    if "items" not in order_data or not order_data["items"]:
        raise ValueError("Order must have items")

def calculate_order_prices(order_data: dict) -> None:
    subtotal = sum(item["price"] * item["quantity"] for item in order_data["items"])
    order_data["subtotal"] = subtotal
    order_data["tax"] = subtotal * 0.08
    order_data["total"] = subtotal * 1.08

def apply_discounts(order_data: dict) -> None:
    if "discount_code" in order_data and order_data["discount_code"] == "SAVE10":
        order_data["total"] *= 0.9
        order_data["discount_applied"] = True

def finalize_order(order_data: dict) -> None:
    order_data["order_id"] = generate_order_id()
    order_data["status"] = "processed"

def send_order_notification(order_data: dict) -> None:
    send_email(order_data["customer_id"], "Order processed", order_data)

def generate_order_id() -> str:
    import uuid
    return str(uuid.uuid4())[:8]
```

### Replace Conditional with Polymorphism

```python
from abc import ABC, abstractmethod
from datetime import datetime

# Before: Long switch statement
class Employee:
    def __init__(self, name: str, employee_type: str, salary: float = 0):
        self.name = name
        self.employee_type = employee_type
        self.base_salary = salary
    
    def calculate_pay(self, hours_worked: float) -> float:
        if self.employee_type == "hourly":
            return hours_worked * self.base_salary
        elif self.employee_type == "salaried":
            return self.base_salary / 12
        elif self.employee_type == "commission":
            return self.base_salary * 0.1

# After: Polymorphic approach
class Employee(ABC):
    def __init__(self, name: str):
        self.name = name
    
    @abstractmethod
    def calculate_pay(self, hours_worked: float) -> float:
        pass

class HourlyEmployee(Employee):
    def __init__(self, name: str, hourly_rate: float):
        super().__init__(name)
        self.hourly_rate = hourly_rate
    
    def calculate_pay(self, hours_worked: float) -> float:
        return hours_worked * self.hourly_rate

class SalariedEmployee(Employee):
    def __init__(self, name: str, annual_salary: float):
        super().__init__(name)
        self.annual_salary = annual_salary
    
    def calculate_pay(self, hours_worked: float) -> float:
        return self.annual_salary / 12

class CommissionEmployee(Employee):
    def __init__(self, name: str, base_salary: float):
        super().__init__(name)
        self.base_salary = base_salary
    
    def calculate_pay(self, hours_worked: float) -> float:
        return self.base_salary * 0.1
```

### Introduce Parameter Object

```python
from dataclasses import dataclass
from typing import NamedTuple

# Before: Long parameter lists
def create_report(
    title: str,
    author: str,
    date_created: str,
    start_date: str,
    end_date: str,
    include_charts: bool,
    include_summary: bool,
    format: str,
    template: str,
    output_path: str
) -> None:
    print(f"Creating report: {title}")
    # Implementation...

# After: Grouped parameters
class ReportConfig(NamedTuple):
    title: str
    author: str
    date_created: str

class DateRange(NamedTuple):
    start_date: str
    end_date: str

class ReportOptions(NamedTuple):
    include_charts: bool = True
    include_summary: bool = True
    format: str = "pdf"
    template: str = "default"

class OutputSettings(NamedTuple):
    output_path: str

def create_report(
    config: ReportConfig,
    date_range: DateRange,
    options: ReportOptions,
    output: OutputSettings
) -> None:
    print(f"Creating report: {config.title}")
    # Implementation...
```

### Replace Magic Numbers with Constants

```python
# Before: Magic numbers everywhere
class Order:
    def __init__(self, items: list):
        self.items = items
    
    def calculate_discount(self, order_value: float, customer_age: int) -> float:
        if order_value > 100:
            discount = 0.1
        elif order_value > 50:
            discount = 0.05
        else:
            discount = 0
        
        if customer_age > 65:
            discount += 0.05
        
        return order_value * discount
    
    def is_expired(self, order_date: str) -> bool:
        from datetime import datetime, timedelta
        date = datetime.strptime(order_date, "%Y-%m-%d")
        return datetime.now() - date > timedelta(30)

# After: Named constants
class Order:
    FREE_SHIPPING_THRESHOLD = 100.0
    STANDARD_DISCOUNT_RATE = 0.05
    PREMIUM_DISCOUNT_RATE = 0.1
    SENIOR_DISCOUNT_RATE = 0.05
    ORDER_EXPIRY_DAYS = 30
    
    def __init__(self, items: list):
        self.items = items
    
    def calculate_discount(self, order_value: float, customer_age: int) -> float:
        if order_value >= self.FREE_SHIPPING_THRESHOLD:
            discount_rate = self.PREMIUM_DISCOUNT_RATE
        elif order_value >= self.FREE_SHIPPING_THRESHOLD / 2:
            discount_rate = self.STANDARD_DISCOUNT_RATE
        else:
            discount_rate = 0
        
        if customer_age >= 65:
            discount_rate += self.SENIOR_DISCOUNT_RATE
        
        return order_value * discount_rate
    
    def is_expired(self, order_date: str) -> bool:
        from datetime import datetime, timedelta
        date = datetime.strptime(order_date, "%Y-%m-%d")
        return datetime.now() - date > timedelta(self.ORDER_EXPIRY_DAYS)
```

### Inline Method and Rename

```python
# Before: Poorly named methods
class Account:
    def __init__(self, balance: float):
        self.balance = balance
    
    def x(self) -> bool:
        return self.balance > 100
    
    def do_stuff(self, amount: float) -> None:
        if self.x():
            self.balance -= amount

# After: Clear names, inline when appropriate
class Account:
    MINIMUM_BALANCE = 100.0
    
    def __init__(self, balance: float):
        self.balance = balance
    
    def has_minimum_balance(self) -> bool:
        return self.balance >= self.MINIMUM_BALANCE
    
    def withdraw(self, amount: float) -> None:
        if self.has_minimum_balance():
            self.balance -= amount
```

## Best Practices

1. **Have Tests First**: Never refactor without tests that verify behavior
2. **Small Steps**: Make small changes and run tests frequently
3. **One Change at a Time**: Focus on one refactoring per iteration
4. **Use IDE Tools**: Leverage automated refactoring tools
5. **Don't Change Behavior**: Refactor structure, not functionality
6. **Watch for Code Smells**: Duplication, long methods, large classes
7. **Follow the Rule of Three**: Third time you copy, refactor
8. **Refactor When Adding Features**: Clean code makes adding features easier
9. **Review Changes**: Use pull requests for refactoring work
10. **Document Intent**: Why something was refactored matters
11. **Prefer Composition**: Move toward flexible object composition
12. **Keep Functions Small**: Extract logic into named methods
