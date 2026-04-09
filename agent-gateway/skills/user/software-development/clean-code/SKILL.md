---
name: Clean Code
description: Principles and practices for writing readable, maintainable, and expressive code
category: software-development
---
# Clean Code

## What I do

I help developers write code that is easy to understand, maintain, and extend. Clean code is about respecting both machines and humans—code that works correctly today and can be understood and modified by other developers (or your future self) tomorrow. I encompass naming conventions, function design, formatting, error handling, and overall code organization that prioritizes clarity over cleverness.

## When to use me

Apply clean code principles to all production code that will be maintained over time. Clean code matters most in collaborative environments where multiple developers read and modify the same codebase. Use these practices when writing new features, during code reviews, when debugging, or when refactoring legacy code. Avoid over-engineering one-off scripts or exploratory code where maintainability is not a concern.

## Core Concepts

- **Meaningful Names**: Names should reveal intent, be pronounceable, and be searchable
- **Functions**: Functions should do one thing, do it well, and be small
- **Comments**: Code should explain itself; comments should explain "why", not "what"
- **Formatting**: Consistent formatting improves readability and shows respect for code
- **Error Handling**: Handle errors gracefully without masking bugs
- **Objects vs Data Structures**: Use objects to hide data, expose behavior
- **Boundaries**: Keep external APIs clean and minimize dependencies
- **Unit Tests**: Clean tests that are readable and fast
- **Refactoring**: Continuous improvement of existing code
- **Emergent Design**: Good architecture emerges from simple, well-designed parts

## Code Examples

### Meaningful Naming

```python
from datetime import datetime, timedelta

# Bad
def get_things(a, b):
    lst = []
    for i in range(a):
        for x in lst:
            if x.status == 1:
                x.status = 2
    return lst

# Good
class Task:
    def __init__(self, task_id: int, title: str):
        self.task_id = task_id
        self.title = title
        self.status: TaskStatus = TaskStatus.PENDING

class TaskStatus:
    PENDING = 1
    IN_PROGRESS = 2
    COMPLETED = 3

def activate_pending_tasks(
    tasks: list[Task],
    days_ago: int = 30
) -> list[Task]:
    cutoff_date = datetime.now() - timedelta(days=days_ago)
    activated_tasks: list[Task] = []
    
    for task in tasks:
        if task.status == TaskStatus.PENDING:
            task.status = TaskStatus.IN_PROGRESS
            activated_tasks.append(task)
    
    return activated_tasks
```

### Small Functions

```python
from decimal import Decimal
from typing import Optional

# Bad - One function doing too much
def process_order(order_data: dict) -> dict:
    validate_order(order_data)
    calculate_totals(order_data)
    apply_discounts(order_data)
    save_order(order_data)
    send_confirmation(order_data)
    update_inventory(order_data)
    return order_data

# Good - Each function does one thing
def validate_order(order_data: dict) -> None:
    required_fields = ["customer_id", "items", "shipping_address"]
    for field in required_fields:
        if field not in order_data:
            raise ValueError(f"Missing required field: {field}")

def calculate_order_totals(order: dict) -> None:
    subtotal = sum(item["price"] * item["quantity"] for item in order["items"])
    tax = subtotal * Decimal("0.08")
    order["subtotal"] = subtotal
    order["tax"] = tax
    order["total"] = subtotal + tax

def apply_discounts(order: dict, discount_code: Optional[str] = None) -> None:
    if discount_code == "SAVE10":
        order["total"] *= Decimal("0.9")
        order["discount_applied"] = True

def process_order(order_data: dict, discount_code: Optional[str] = None) -> dict:
    validate_order(order_data)
    calculate_order_totals(order_data)
    apply_discounts(order_data, discount_code)
    saved_order = save_order(order_data)
    send_confirmation(saved_order)
    update_inventory(saved_order)
    return saved_order
```

### Proper Error Handling

```python
from contextlib import contextmanager
from typing import Generator

class InsufficientFundsError(Exception):
    def __init__(self, balance: float, withdrawal: float):
        self.balance = balance
        self.withdrawal = withdrawal
        super().__init__(f"Insufficient funds: {balance} < {withdrawal}")

class AccountClosedError(Exception):
    pass

class BankAccount:
    def __init__(self, account_id: str, initial_balance: float = 0):
        self.account_id = account_id
        self._balance = Decimal(str(initial_balance))
        self._is_active = True
    
    @property
    def balance(self) -> float:
        return float(self._balance)
    
    def deposit(self, amount: float) -> None:
        if amount <= 0:
            raise ValueError("Deposit amount must be positive")
        if not self._is_active:
            raise AccountClosedError(self.account_id)
        self._balance += Decimal(str(amount))
    
    def withdraw(self, amount: float) -> None:
        if amount <= 0:
            raise ValueError("Withdrawal amount must be positive")
        if not self._is_active:
            raise AccountClosedError(self.account_id)
        if amount > self._balance:
            raise InsufficientFundsError(float(self._balance), amount)
        self._balance -= Decimal(str(amount))

@contextmanager
def managed_account(account: BankAccount) -> Generator[BankAccount, None, None]:
    try:
        yield account
    except Exception as e:
        print(f"Error managing account {account.account_id}: {e}")
        raise
```

### Writing Self-Documenting Code

```python
from datetime import datetime
from typing import NamedTuple

class UserCredentials(NamedTuple):
    username: str
    password_hash: str
    salt: str

class AuthenticationResult(NamedTuple):
    success: bool
    user_id: int | None = None
    error_message: str | None = None

class PasswordHasher:
    @staticmethod
    def hash(password: str, salt: str) -> str:
        import hashlib
        return hashlib.sha256(f"{password}{salt}".encode()).hexdigest()
    
    @staticmethod
    def verify(
        password: str,
        salt: str,
        expected_hash: str
    ) -> bool:
        return PasswordHasher.hash(password, salt) == expected_hash

def authenticate_user(
    credentials: UserCredentials,
    stored_credentials: dict[str, UserCredentials]
) -> AuthenticationResult:
    if credentials.username not in stored_credentials:
        return AuthenticationResult(success=False)
    
    stored = stored_credentials[credentials.username]
    if not PasswordHasher.verify(
        credentials.password,
        stored.salt,
        stored.password_hash
    ):
        return AuthenticationResult(success=False)
    
    return AuthenticationResult(success=True, user_id=hash(credentials.username))
```

### Type Hints and Structure

```python
from dataclasses import dataclass
from enum import Enum
from typing import Protocol, runtime_checkable

class OrderStatus(Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

@dataclass(frozen=True)
class OrderItem:
    product_id: str
    quantity: int
    unit_price: float
    
    @property
    def total_price(self) -> float:
        return self.quantity * self.unit_price

@dataclass
class ShippingAddress:
    street: str
    city: str
    state: str
    zip_code: str
    country: str

@dataclass
class Order:
    order_id: str
    customer_id: str
    items: list[OrderItem]
    shipping_address: ShippingAddress
    status: OrderStatus = OrderStatus.PENDING
    created_at: datetime = None
    
    @property
    def total_amount(self) -> float:
        return sum(item.total_price for item in self.items)

@runtime_checkable
class OrderRepository(Protocol):
    def save(self, order: Order) -> None:
        pass
    
    def find_by_id(self, order_id: str) -> Order | None:
        pass
```

## Best Practices

1. **Name Variables Meaningfully**: Use descriptive names that reveal intent
2. **Functions Should Do One Thing**: Each function should have a single responsibility
3. **Keep Functions Small**: Functions should rarely exceed 20 lines
4. **Avoid Magic Numbers**: Use named constants instead of literal numbers
5. **Use Type Hints**: Make expected types explicit
6. **Write Self-Documenting Code**: Code should explain itself
7. **Handle Errors Explicitly**: Don't swallow exceptions silently
8. **Comment Why, Not What**: Explain intent, not implementation
9. **Format Consistently**: Use automated formatters
10. **Refactor Ruthlessly**: Continuous improvement prevents technical debt
11. **Delete Dead Code**: Unused code confuses and bloats
12. **Tests Document Behavior**: Tests serve as documentation
