---
name: clean-code
description: Clean code principles and best practices
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: code-quality
---
## What I do
- Write readable and maintainable code
- Apply SOLID principles
- Use meaningful names for variables, functions, and classes
- Keep functions small and focused
- Write proper comments and documentation
- Handle errors gracefully
- Remove dead code and duplication
- Follow DRY (Don't Repeat Yourself)

## When to use me
When writing or refactoring code for better quality and readability.

## Meaningful Names
```python
# BAD - unclear what these represent
d = 12
x = get_data()
tmp = calculate()

# GOOD - clear and descriptive
elapsed_days = 12
user_data = fetch_active_users()
temporary_cache = calculate_recent_stats()


# BAD - unclear function purpose
def process(x):
    if x > 10:
        return True
    return False


# GOOD - descriptive function name
def is_above_threshold(value: int, threshold: int = 10) -> bool:
    """Check if value exceeds the given threshold."""
    return value > threshold


# BAD - vague class name
class Handler:
    def handle(self):
        pass


# GOOD - specific class name
class OrderProcessor:
    def process_order(self, order: Order) -> None:
        """Process a single order through the pipeline."""
        self.validate_order(order)
        self.calculate_totals(order)
        self.apply_discounts(order)
        self.finalize_order(order)


# Constants should explain their purpose
# BAD
RATE = 0.5
LIMIT = 1000

# GOOD
DISCOUNT_RATE = 0.5
MAX_ITEMS_PER_ORDER = 1000
```

## Small Functions
```python
# BAD - function does too many things
def process_order(order_data: dict) -> Order:
    validate_input(order_data)
    calculate_prices(order_data)
    apply_discounts(order_data)
    save_to_database(order_data)
    send_confirmation_email(order_data)
    update_inventory(order_data)
    return order


# GOOD - each function has a single responsibility
def create_order(order_data: dict) -> Order:
    validated_data = validate_order_data(order_data)
    order = build_order(validated_data)
    order = apply_pricing_rules(order)
    order = save_order(order)
    send_order_confirmation(order)
    update_inventory_for(order)
    return order


def validate_order_data(data: dict) -> dict:
    required_fields = ['customer_id', 'items', 'shipping_address']
    for field in required_fields:
        if field not in data:
            raise ValidationError(f"Missing required field: {field}")
    return data


def build_order(data: dict) -> Order:
    return Order(
        customer_id=data['customer_id'],
        items=data['items'],
        shipping_address=data['shipping_address'],
    )
```

## Error Handling
```python
# BAD - unclear error handling
def get_user(id):
    try:
        return db.query(User).get(id)
    except Exception as e:
        log.error(e)
        return None


# GOOD - specific exceptions, proper handling
class UserNotFoundError(Exception):
    """Raised when a user cannot be found."""
    pass


def get_user_by_id(user_id: str) -> User:
    """
    Retrieve a user by their unique identifier.

    Args:
        user_id: The user's unique ID

    Returns:
        User instance

    Raises:
        UserNotFoundError: If user doesn't exist
        DatabaseError: On database connection issues
    """
    try:
        user = user_repository.find_by_id(user_id)
        if user is None:
            raise UserNotFoundError(f"User {user_id} not found")
        return user
    except DatabaseConnectionError:
        logger.error("Database connection failed")
        raise  # Re-raise for caller to handle
```

## Comments
```python
# BAD - comments that don't add value
# Increment i by 1
i += 1

# Get the user's name
name = user.get_name()


# GOOD - explain WHY, not WHAT
# Rate limit exceeded, user must wait before retrying
# This prevents API abuse while allowing legitimate traffic
if request_count >= MAX_REQUESTS:
    raise RateLimitExceededError()


# GOOD - complex logic explained
# Boyer-Moore majority vote algorithm
# Finds candidate with more than n/2 occurrences in O(n) time
def find_majority_candidate(elements: list) -> Optional[element]:
    if not elements:
        return None

    count = 0
    candidate = None

    for element in elements:
        if count == 0:
            candidate = element
            count = 1
        elif element == candidate:
            count += 1
        else:
            count -= 1

    return candidate


# GOOD - document public APIs
def calculate_shipping_cost(
    weight: float,
    destination: str,
    shipping_method: ShippingMethod = ShippingMethod.STANDARD,
) -> float:
    """
    Calculate shipping cost based on package weight and destination.

    Args:
        weight: Package weight in kilograms (min: 0.1, max: 100.0)
        destination: ISO 3166-1 alpha-2 country code
        shipping_method: Selected shipping speed option

    Returns:
        Shipping cost in the system's base currency

    Raises:
        ValueError: If weight is outside valid range
        UnsupportedDestinationError: If destination is not serviceable

    Example:
        >>> calculate_shipping_cost(2.5, 'US', ShippingMethod.EXPRESS)
        15.99
    """
```

## DRY Principle
```python
# BAD - code duplication
def create_user(name, email):
    validate_name(name)
    validate_email(email)
    user = User(name=name, email=email)
    db.save(user)
    send_welcome_email(email)
    return user


def create_admin(name, email):
    validate_name(name)
    validate_email(email)
    admin = Admin(name=name, email=email)
    db.save(admin)
    send_welcome_email(email)
    return admin


# GOOD - extract common logic
class BaseUserFactory:
    @staticmethod
    def validate_input(name: str, email: str):
        validate_name(name)
        validate_email(email)

    @staticmethod
    def send_welcome_notification(email: str):
        send_welcome_email(email)


class UserFactory(BaseUserFactory):
    def create(self, name: str, email: str) -> User:
        self.validate_input(name, email)
        user = User(name=name, email=email)
        db.save(user)
        self.send_welcome_notification(email)
        return user


class AdminFactory(BaseUserFactory):
    def create(self, name: str, email: str) -> Admin:
        self.validate_input(name, email)
        admin = Admin(name=name, email=email)
        db.save(admin)
        self.send_welcome_notification(email)
        return admin
```

## SOLID Principles
```python
# S - Single Responsibility
# O - Open/Closed
# L - Liskov Substitution
# I - Interface Segregation
# D - Dependency Inversion


# BAD - violates SRP and OCP
class ReportGenerator:
    def generate(self, data: list, format: str):
        if format == 'pdf':
            self._generate_pdf(data)
        elif format == 'excel':
            self._generate_excel(data)
        elif format == 'csv':
            self._generate_csv(data)


# GOOD - SRP + OCP with strategy pattern
from abc import ABC, abstractmethod


class ReportFormat(ABC):
    @abstractmethod
    def generate(self, data: list) -> bytes:
        pass


class PDFFormat(ReportFormat):
    def generate(self, data: list) -> bytes:
        # PDF generation logic
        return b'%PDF...'


class ExcelFormat(ReportFormat):
    def generate(self, data: list) -> bytes:
        # Excel generation logic
        return b'\x50\x4B...'  # XLSX magic bytes


class ReportGenerator:
    def __init__(self, format: ReportFormat) -> None:
        self.format = format

    def generate(self, data: list) -> bytes:
        return self.format.generate(data)


# Dependency Inversion - depend on abstractions
class UserRepository(Protocol):
    def find_by_id(self, id: str) -> User: ...
    def save(self, user: User) -> None: ...


class UserService:
    def __init__(self, repository: UserRepository) -> None:
        self.repository = repository
```
