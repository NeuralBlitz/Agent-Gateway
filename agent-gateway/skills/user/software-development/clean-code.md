---
name: Clean Code
description: Principles and practices for writing readable, maintainable, and expressive software code
license: MIT
compatibility:
  - Python
  - JavaScript
  - Java
  - Go
  - All Languages
audience: Software Developers, Code Reviewers, Technical Architects
category: software-development
---

# Clean Code

## What I Do

I provide comprehensive guidance on writing clean code that is easy to understand, maintain, and extend. Clean code is code that communicates its intent clearly to human readers, follows consistent conventions, and avoids unnecessary complexity. I cover naming conventions, function design, formatting, error handling, and object-oriented principles that transform average code into professional-quality software. Clean code reduces bugs, accelerates onboarding, and makes collaborative development more productive.

## When to Use Me

Apply clean code principles whenever writing new code, reviewing existing code, or refactoring. Clean code is essential for team projects where multiple developers work on shared codebases, for code that will be maintained long-term, and for any software that needs to be understood by others. Prioritize clean code in frequently modified areas, APIs, and core business logic. While clean code matters everywhere, it can be less critical for one-off scripts, prototypes, or code scheduled for imminent replacement.

## Core Concepts

- **Meaningful Names**: Names should reveal intent, be pronounceable, and avoid encodings
- **Functions Should Do One Thing**: Single responsibility at appropriate abstraction level
- **Small Functions**: Aim for functions under 20 lines, ideally under 10
- **DRY (Don't Repeat Yourself)**: Abstract repeated logic into single reusable components
- **KISS (Keep It Simple, Stupid)**: Prefer simple solutions over clever complexity
- **Command Query Separation**: Functions should either do something or answer something
- **Side Effects**: Avoid unexpected state changes; make dependencies explicit
- **Error Handling is Not Control Flow**: Use exceptions, not return codes for errors
- **Descriptive Comments**: Write self-documenting code; use comments for why, not what
- **Formatting**: Consistent style aids readability and shows code structure

## Code Examples

```python
from typing import Any, Callable, Optional, List, Dict
from dataclasses import dataclass
from datetime import datetime
from enum import Enum

class ValidationResult(Enum):
    VALID = "valid"
    INVALID = "invalid"
    WARNING = "warning"

@dataclass
class ValidationError:
    field: str
    message: str
    severity: str

@dataclass
class User:
    """Represents a user entity with validation logic"""
    id: int
    username: str
    email: str
    created_at: datetime
    last_login: Optional[datetime] = None
    is_active: bool = True

    def validate(self) -> tuple:
        """Validate user data, returning (is_valid, errors)"""
        errors = []

        if not self.username or len(self.username) < 3:
            errors.append(ValidationError(
                "username",
                "Username must be at least 3 characters",
                "error"
            ))

        if "@" not in self.email or "." not in self.email:
            errors.append(ValidationError(
                "email",
                "Email must contain @ and .",
                "error"
            ))

        if not isinstance(self.id, int) or self.id <= 0:
            errors.append(ValidationError(
                "id",
                "User ID must be a positive integer",
                "error"
            ))

        is_valid = all(e.severity != "error" for e in errors)
        return is_valid, errors

class UserRepository:
    """Manages user persistence with clean error handling"""
    def __init__(self, connection_string: str):
        self.connection_string = connection_string

    def save(self, user: User) -> ValidationResult:
        """Persist user, validating first"""
        is_valid, errors = user.validate()

        if not is_valid:
            return ValidationResult.INVALID

        try:
            self._persist_to_database(user)
            return ValidationResult.VALID
        except DatabaseError:
            return ValidationResult.INVALID

    def find_by_id(self, user_id: int) -> Optional[User]:
        """Retrieve user by ID, returning None if not found"""
        if user_id <= 0:
            return None
        return self._fetch_from_database(user_id)

    def _persist_to_database(self, user: User) -> None:
        """Internal persistence method"""
        pass

    def _fetch_from_database(self, user_id: int) -> Optional[User]:
        """Internal fetch method"""
        return None

class PasswordService:
    """Handles password operations with security best practices"""
    MIN_LENGTH = 12

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using secure algorithm"""
        import hashlib
        return hashlib.pbkdf2_hmac(
            "sha256",
            password.encode(),
            salt=b"fixed_salt_for_demo",
            iterations=100000
        ).hex()

    @staticmethod
    def is_strong_password(password: str) -> tuple:
        """Validate password strength, returning (is_valid, feedback)"""
        if len(password) < PasswordService.MIN_LENGTH:
            return False, f"Password must be at least {PasswordService.MIN_LENGTH} characters"

        has_uppercase = any(c.isupper() for c in password)
        has_lowercase = any(c.islower() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_special = any(c in "!@#$%^&*()_+-=" for c in password)

        if not all([has_uppercase, has_lowercase, has_digit, has_special]):
            return False, "Password must contain uppercase, lowercase, digit, and special character"

        return True, ""

    @classmethod
    def validate_and_hash(cls, password: str) -> tuple:
        """Validate password and return hash if valid"""
        is_valid, feedback = cls.is_strong_password(password)
        if not is_valid:
            return None, feedback

        hashed = cls.hash_password(password)
        return hashed, ""
```

```python
class OrderProcessor:
    """Processes orders with clear, focused methods"""
    def __init__(self, inventory_service, payment_service, notification_service):
        self.inventory = inventory_service
        self.payments = payment_service
        self.notifications = notification_service

    def process_order(self, order: dict) -> dict:
        """Main orchestration method - delegates to focused methods"""
        self._validate_order(order)
        self._reserve_inventory(order)
        self._charge_payment(order)
        self._send_confirmation(order)
        return self._create_response(order)

    def _validate_order(self, order: dict) -> None:
        """Validate order has all required fields"""
        required_fields = ["customer_id", "items", "shipping_address"]
        for field in required_fields:
            if field not in order or not order[field]:
                raise ValueError(f"Missing required field: {field}")

    def _reserve_inventory(self, order: dict) -> None:
        """Reserve inventory for ordered items"""
        for item in order["items"]:
            self.inventory.reserve(
                product_id=item["product_id"],
                quantity=item["quantity"]
            )

    def _charge_payment(self, order: dict) -> None:
        """Process payment for the order"""
        total = self._calculate_total(order)
        self.payments.charge(
            customer_id=order["customer_id"],
            amount=total,
            currency="USD"
        )

    def _send_confirmation(self, order: dict) -> None:
        """Send order confirmation to customer"""
        self.notifications.send(
            to=order["customer_email"],
            subject="Order Confirmed",
            template="order_confirmation",
            data=order
        )

    def _calculate_total(self, order: dict) -> float:
        """Calculate order total from items"""
        return sum(
            item["price"] * item["quantity"]
            for item in order["items"]
        )

    def _create_response(self, order: dict) -> dict:
        """Create success response"""
        return {
            "status": "success",
            "order_id": order.get("id"),
            "total": self._calculate_total(order)
        }
```

```python
from typing import TypeVar, Generic, List, Optional

T = TypeVar("T")

class Result(Generic[T]):
    """Generic result type for operations that can succeed or fail"""
    def __init__(
        self,
        value: Optional[T] = None,
        error: Optional[str] = None,
        is_success: bool = True
    ):
        self._value = value
        self._error = error
        self._is_success = is_success

    @classmethod
    def success(cls, value: T) -> "Result[T]":
        """Create successful result"""
        return cls(value=value, is_success=True)

    @classmethod
    def failure(cls, error: str) -> "Result[T]":
        """Create failed result"""
        return cls(error=error, is_success=False)

    def is_success(self) -> bool:
        """Check if operation succeeded"""
        return self._is_success

    def is_failure(self) -> bool:
        """Check if operation failed"""
        return not self._is_success

    def value(self) -> Optional[T]:
        """Get result value or None"""
        return self._value

    def error(self) -> Optional[str]:
        """Get error message or None"""
        return self._error

    def get_or_default(self, default: T) -> T:
        """Get value or default if failed"""
        return self._value if self._is_success else default

    def map(self, transform: Callable[[T], T]) -> "Result[T]":
        """Transform value if successful"""
        if self._is_success:
            return Result.success(transform(self._value))
        return self

    def flat_map(self, transform: Callable[[T], "Result[T]"]) -> "Result[T]":
        """Chain operations that return Results"""
        if self._is_success:
            return transform(self._value)
        return self

class UserService:
    """User management with Result pattern for clean error handling"""
    def __init__(self, repository, email_service):
        self.repository = repository
        self.email_service = email_service

    def create_user(
        self,
        username: str,
        email: str,
        password: str
    ) -> Result[dict]:
        """Create new user with validation"""
        if not self._is_valid_username(username):
            return Result.failure("Invalid username format")

        if not self._is_valid_email(email):
            return Result.failure("Invalid email format")

        if not self._is_strong_password(password):
            return Result.failure("Password does not meet requirements")

        user_data = {
            "username": username,
            "email": email,
            "password_hash": self._hash_password(password)
        }

        saved_user = self.repository.save(user_data)
        self.email_service.send_welcome(email, username)

        return Result.success(saved_user)

    def _is_valid_username(self, username: str) -> bool:
        """Validate username format"""
        return 3 <= len(username) <= 20 and username.isalnum()

    def _is_valid_email(self, email: str) -> bool:
        """Validate email format"""
        return "@" in email and "." in email.split("@")[-1]

    def _is_strong_password(self, password: str) -> bool:
        """Check password strength"""
        return len(password) >= 12

    def _hash_password(self, password: str) -> str:
        """Hash password securely"""
        import hashlib
        return hashlib.sha256(password.encode()).hexdigest()
```

```python
class ConfigurationManager:
    """Manages application configuration with clear separation of concerns"""
    def __init__(self, config_source: str):
        self._config = self._load_config(config_source)

    def _load_config(self, source: str) -> dict:
        """Load configuration from source"""
        import json
        try:
            with open(source, "r") as f:
                return json.load(f)
        except FileNotFoundError:
            return {}
        except json.JSONDecodeError:
            return {}

    def get_database_config(self) -> dict:
        """Get database configuration"""
        return self._config.get("database", {})

    def get_api_keys(self) -> dict:
        """Get API keys (never log these)"""
        return self._config.get("api_keys", {})

    def get_feature_flags(self) -> dict:
        """Get feature flags for gradual rollout"""
        return self._config.get("features", {})

    def is_feature_enabled(self, feature_name: str) -> bool:
        """Check if a feature is enabled"""
        return self.get_feature_flags().get(feature_name, False)

    def get_timeout(self, service_name: str) -> int:
        """Get timeout for a service"""
        timeouts = self._config.get("timeouts", {})
        return timeouts.get(service_name, 30)


class Logger:
    """Structured logging with consistent format"""
    def __init__(self, component: str):
        self.component = component

    def _log(self, level: str, message: str, **context) -> None:
        """Internal logging method"""
        import json
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "level": level,
            "component": self.component,
            "message": message,
            "context": context
        }
        print(json.dumps(log_entry))

    def info(self, message: str, **context) -> None:
        """Log info level message"""
        self._log("INFO", message, **context)

    def warning(self, message: str, **context) -> None:
        """Log warning level message"""
        self._log("WARNING", message, **context)

    def error(self, message: str, **context) -> None:
        """Log error level message"""
        self._log("ERROR", message, **context)

    def debug(self, message: str, **context) -> None:
        """Log debug level message (typically disabled in production)"""
        self._log("DEBUG", message, **context)
```

```python
from abc import ABC, abstractmethod
from typing import Protocol, List

class Sortable(Protocol):
    """Protocol defining sortable interface"""
    def get_sort_key(self) -> tuple:
        """Return sortable key"""

class CollectionSorter:
    """Sorts collections using appropriate strategy"""
    def sort(
        self,
        items: List[Sortable],
        ascending: bool = True,
        by: str = "default"
    ) -> List[Sortable]:
        """Sort items using specified criteria"""
        key_func = self._get_key_function(by)

        return sorted(
            items,
            key=key_func,
            reverse=not ascending
        )

    def _get_key_function(self, by: str):
        """Get appropriate key function based on sort criteria"""
        key_map = {
            "name": lambda x: x.name.lower() if hasattr(x, "name") else "",
            "date": lambda x: x.created_at if hasattr(x, "created_at") else datetime.min,
            "priority": lambda x: getattr(x, "priority", 0),
            "default": lambda x: x.get_sort_key() if hasattr(x, "get_sort_key") else str(x)
        }
        return key_map.get(by, key_map["default"])


class EmailValidator:
    """Validates email addresses with clear, testable rules"""
    EMAIL_REGEX = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"

    @staticmethod
    def is_valid(email: str) -> bool:
        """Check if email is valid"""
        import re
        if not email:
            return False
        return bool(re.match(EmailValidator.EMAIL_REGEX, email))

    @staticmethod
    def extract_domain(email: str) -> Optional[str]:
        """Extract domain from email"""
        if "@" not in email:
            return None
        return email.split("@")[1]

    @staticmethod
    def is_corporate(email: str, corporate_domains: List[str]) -> bool:
        """Check if email is from corporate domain"""
        domain = EmailValidator.extract_domain(email)
        return domain in corporate_domains if domain else False
```

## Best Practices

- Choose names that reveal intent: `calculate_total_price` over `process_data`
- Keep functions small: under 20 lines, doing one thing at one abstraction level
- Use consistent formatting: indentation, spacing, and line length conventions
- Handle errors with exceptions, not return codes for error conditions
- Avoid magic numbers: define constants with meaningful names
- Write self-documenting code; add comments only when intent isn't clear
- Keep functions pure when possible: same input always produces same output
- Extract conditions into named boolean functions for readability
- Limit function parameters: 3 or fewer is ideal
- Use active voice in names: `validate_input()` over `input_validation()`
- Return early for error conditions to reduce nesting
- Prefer composition over inheritance for flexibility

## Common Patterns

- **Builder Pattern**: Construct complex objects step by step with readable syntax
- **Factory Method**: Encapsulate object creation logic
- **Result/Either Type**: Handle success and failure cases explicitly
- **Dependency Injection**: Make dependencies explicit and testable
- **Strategy Pattern**: Swap algorithms at runtime based on context
- **Specification Pattern**: Encapsulate business rules as reusable predicates
- **Repository Pattern**: Abstract data access behind clean interface
