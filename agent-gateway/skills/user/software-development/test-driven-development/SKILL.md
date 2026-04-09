---
name: Test-Driven Development
description: Development methodology where tests drive design through short red-green-refactor cycles
category: software-development
---
# Test-Driven Development

## What I do

I guide developers through a disciplined approach where tests are written before production code. TDD follows a simple cycle: write a failing test (Red), write minimal code to pass the test (Green), then refactor to improve design (Refactor). This methodology produces well-tested, loosely coupled, highly cohesive code from the start. TDD is not about testing—it's about design that is testable and therefore maintainable.

## When to use me

Use TDD when building new features or modules, especially in critical systems where correctness matters. TDD excels when requirements are clear and stable, when you're working on complex business logic, or when you want to document expected behavior through tests. It's less suitable for exploratory coding, UI layout, or when dealing with legacy code that wasn't designed for testing.

## Core Concepts

- **Red-Green-Refactor**: The core TDD cycle
- **F.I.R.S.T. Tests**: Fast, Isolated, Repeatable, Self-validating, Timely
- **Test Pyramid**: Many unit tests, fewer integration tests, few E2E tests
- **Arrange-Act-Assert**: Standard test structure
- **Mocking**: Isolating units under test
- **Dependency Injection**: Making code testable
- **Code Coverage**: Metric for test thoroughness
- **Test Doubles**: Dummies, Stubs, Mocks, Spies, Fakes
- **Given-When-Then**: BDD-style test structure
- **Integration Points**: Testing how components work together

## Code Examples

### Basic TDD Cycle

```python
import unittest
from unittest.mock import patch

# RED: Write failing test first
class TestShoppingCart(unittest.TestCase):
    def test_add_item_increases_count(self):
        cart = ShoppingCart()
        cart.add_item("Apple", 1.00)
        self.assertEqual(cart.item_count, 1)
    
    def test_add_multiple_items_sums_prices(self):
        cart = ShoppingCart()
        cart.add_item("Apple", 1.00)
        cart.add_item("Banana", 0.50)
        self.assertAlmostEqual(cart.total, 1.50)
    
    def test_empty_cart_has_zero_total(self):
        cart = ShoppingCart()
        self.assertEqual(cart.total, 0)

# GREEN: Minimal code to pass tests
class ShoppingCart:
    def __init__(self):
        self.items: list[tuple[str, float]] = []
    
    @property
    def item_count(self) -> int:
        return len(self.items)
    
    @property
    def total(self) -> float:
        return sum(price for _, price in self.items)
    
    def add_item(self, name: str, price: float) -> None:
        self.items.append((name, price))

# REFACTOR: Improve design while keeping tests passing
class ShoppingCartRefactored:
    def __init__(self):
        self._items: list[CartItem] = []
    
    @property
    def item_count(self) -> int:
        return len(self._items)
    
    @property
    def total(self) -> float:
        return sum(item.price for item in self._items)
    
    def add_item(self, name: str, price: float) -> None:
        self._items.append(CartItem(name, price))

class CartItem:
    def __init__(self, name: str, price: float):
        self.name = name
        self.price = price
```

### Mocking Dependencies

```python
import unittest
from unittest.mock import Mock, patch
from dataclasses import dataclass

@dataclass
class User:
    id: int
    name: str
    email: str

class UserService:
    def __init__(self, user_repository, email_service):
        self.user_repository = user_repository
        self.email_service = email_service
    
    def create_user(self, name: str, email: str) -> User:
        user = User(
            id=self.user_repository.get_next_id(),
            name=name,
            email=email
        )
        self.user_repository.save(user)
        self.email_service.send_welcome_email(user)
        return user

class TestUserService(unittest.TestCase):
    def setUp(self):
        self.mock_repo = Mock()
        self.mock_email = Mock()
        self.service = UserService(self.mock_repo, self.mock_email)
    
    def test_creates_user_and_sends_email(self):
        self.mock_repo.get_next_id.return_value = 42
        
        user = self.service.create_user("Alice", "alice@example.com")
        
        self.assertEqual(user.id, 42)
        self.assertEqual(user.name, "Alice")
        self.assertEqual(user.email, "alice@example.com")
        self.mock_repo.save.assert_called_once()
        self.mock_email.send_welcome_email.assert_called_once_with(user)
    
    def test_repository_receives_correct_user(self):
        self.mock_repo.get_next_id.return_value = 100
        
        self.service.create_user("Bob", "bob@example.com")
        
        saved_user = self.mock_repo.save.call_args[0][0]
        self.assertEqual(saved_user.name, "Bob")
```

### Testing Edge Cases

```python
import unittest

class Stack:
    def __init__(self):
        self._items: list = []
    
    def push(self, item: object) -> None:
        self._items.append(item)
    
    def pop(self) -> object:
        if not self._items:
            raise IndexError("pop from empty stack")
        return self._items.pop()
    
    def peek(self) -> object:
        if not self._items:
            raise IndexError("peek from empty stack")
        return self._items[-1]
    
    def is_empty(self) -> bool:
        return len(self._items) == 0
    
    def __len__(self) -> int:
        return len(self._items)

class TestStack(unittest.TestCase):
    def setUp(self):
        self.stack = Stack()
    
    def test_push_pop_lifo(self):
        self.stack.push("first")
        self.stack.push("second")
        self.assertEqual(self.stack.pop(), "second")
        self.assertEqual(self.stack.pop(), "first")
    
    def test_peek_returns_without_removing(self):
        self.stack.push("item")
        self.assertEqual(self.stack.peek(), "item")
        self.assertEqual(len(self.stack), 1)
    
    def test_is_empty_on_new_stack(self):
        self.assertTrue(self.stack.is_empty())
    
    def test_pop_empty_raises_index_error(self):
        with self.assertRaises(IndexError):
            self.stack.pop()
    
    def test_peek_empty_raises_index_error(self):
        with self.assertRaises(IndexError):
            self.stack.peek()
    
    def test_multiple_operations(self):
        self.stack.push(1)
        self.stack.push(2)
        self.stack.push(3)
        self.assertEqual(len(self.stack), 3)
        self.assertEqual(self.stack.pop(), 3)
        self.assertFalse(self.stack.is_empty())
        self.assertEqual(self.stack.pop(), 2)
        self.assertEqual(self.stack.pop(), 1)
        self.assertTrue(self.stack.is_empty())
```

### Parameterized Tests

```python
import unittest
from parameterized import parameterized

class Calculator:
    def add(self, a: float, b: float) -> float:
        return a + b
    
    def subtract(self, a: float, b: float) -> float:
        return a - b
    
    def multiply(self, a: float, b: float) -> float:
        return a * b
    
    def divide(self, a: float, b: float) -> float:
        if b == 0:
            raise ValueError("Division by zero")
        return a / b

class TestCalculator(unittest.TestCase):
    def setUp(self):
        self.calc = Calculator()
    
    @parameterized.expand([
        (2, 3, 5),
        (0, 0, 0),
        (-1, 1, 0),
        (100, 200, 300),
        (-5, -3, -8),
    ])
    def test_add(self, a: float, b: float, expected: float):
        self.assertEqual(self.calc.add(a, b), expected)
    
    @parameterized.expand([
        (10, 3, 7),
        (5, 5, 0),
        (0, 5, -5),
        (-5, -3, -2),
    ])
    def test_subtract(self, a: float, b: float, expected: float):
        self.assertEqual(self.calc.subtract(a, b), expected)
    
    @parameterized.expand([
        (5, 3, 15),
        (0, 100, 0),
        (-2, 4, -8),
        (-3, -3, 9),
    ])
    def test_multiply(self, a: float, b: float, expected: float):
        self.assertEqual(self.calc.multiply(a, b), expected)
    
    @parameterized.expand([
        (10, 2, 5),
        (9, 3, 3),
        (7, 1, 7),
        (-10, 2, -5),
    ])
    def test_divide(self, a: float, b: float, expected: float):
        self.assertEqual(self.calc.divide(a, b), expected)
    
    def test_divide_by_zero_raises_error(self):
        with self.assertRaises(ValueError):
            self.calc.divide(10, 0)
```

### Testing with Fixtures

```python
import unittest
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class Order:
    order_id: str
    customer_id: str
    items: list[dict]
    created_at: datetime
    status: str = "pending"

class OrderProcessor:
    def __init__(self, discount_rules: dict, tax_rate: float):
        self.discount_rules = discount_rules
        self.tax_rate = tax_rate
    
    def calculate_total(self, order: Order) -> float:
        subtotal = sum(item["price"] * item["quantity"] for item in order["items"])
        discount = self._calculate_discount(subtotal, order["customer_id"])
        tax = (subtotal - discount) * self.tax_rate
        return subtotal - discount + tax
    
    def _calculate_discount(self, subtotal: float, customer_id: str) -> float:
        if customer_id in self.discount_rules.get("vip", []):
            return subtotal * 0.1
        return 0

class TestOrderProcessor(unittest.TestCase):
    FIXTURE_VIP_CUSTOMERS = ["vip1", "vip2"]
    FIXTURE_DISCOUNT_RULES = {"vip": self.FIXTURE_VIP_CUSTOMERS}
    FIXTURE_TAX_RATE = 0.08
    
    def setUp(self):
        self.processor = OrderProcessor(
            self.FIXTURE_DISCOUNT_RULES,
            self.FIXTURE_TAX_RATE
        )
        self.base_order = Order(
            order_id="123",
            customer_id="regular",
            items=[
                {"product_id": "p1", "quantity": 2, "price": 10.00},
                {"product_id": "p2", "quantity": 1, "price": 25.00},
            ],
            created_at=datetime.now()
        )
    
    def test_calculates_correct_subtotal(self):
        order = self.base_order
        total = self.processor.calculate_total(order)
        self.assertAlmostEqual(total, 45.00 * 1.08)
    
    def test_applies_vip_discount(self):
        vip_order = Order(
            order_id="124",
            customer_id="vip1",
            items=[{"product_id": "p1", "quantity": 1, "price": 100.00}],
            created_at=datetime.now()
        )
        total = self.processor.calculate_total(vip_order)
        self.assertAlmostEqual(total, 100.00 * 0.9 * 1.08)
```

## Best Practices

1. **Write Failing Tests First**: Start with a test that describes desired behavior
2. **Write Minimal Code**: Pass the test with the simplest implementation
3. **Refactor After Each Test**: Improve design while tests protect you
4. **Test One Thing**: Each test should verify a single behavior
5. **Use Descriptive Names**: Test method names should describe what's tested
6. **Fast Tests**: Unit tests should run in milliseconds
7. **Isolate Tests**: Each test should be independent
8. **Avoid Logic in Tests**: No conditionals or loops in test bodies
9. **Test Edge Cases**: Empty, null, boundary conditions
10. **Use Test Doubles**: Mocks, stubs, fakes for isolation
11. **Follow FIRST**: Fast, Isolated, Repeatable, Self-validating, Timely
12. **Aim for High Coverage**: But remember 100% coverage doesn't mean good tests
