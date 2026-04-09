---
name: Testing
description: Comprehensive software testing practices including unit, integration, and end-to-end testing strategies
license: MIT
compatibility:
  - Python (pytest, unittest)
  - JavaScript (Jest, Mocha)
  - Java (JUnit)
  - Go (testing package)
  - All Languages
audience: Software Developers, QA Engineers, Test Automation Engineers
category: software-development
---

# Testing

## What I Do

I provide comprehensive guidance on software testing practices that ensure code correctness, prevent regressions, and enable confident refactoring. Testing is the safety net that allows developers to modify code without fear of breaking existing functionality. I cover unit testing, integration testing, test organization, mocking strategies, test-driven development, and test automation patterns. Effective testing is essential for maintaining code quality in production systems and enables the confidence needed for continuous delivery.

## When to Use Me

Apply testing practices whenever writing new code that needs to work correctly and continue working over time. Write tests before implementing features (TDD) or immediately after to verify behavior. Test critical paths, complex logic, and frequently modified code thoroughly. Test edge cases and error handling paths. Avoid testing trivial code, one-off scripts, or code scheduled for removal. Balance test coverage with maintenance cost; 100% coverage isn't always the goal, but critical paths should be well-covered.

## Core Concepts

- **Unit Test**: Tests single functions/methods in isolation with mocked dependencies
- **Integration Test**: Tests multiple components working together
- **End-to-End (E2E) Test**: Tests complete user flows through the application
- **Test Pyramid**: Many unit tests, fewer integration tests, even fewer E2E tests
- **Arrange-Act-Assert (AAA)**: Standard test structure pattern
- **Test Fixture**: Setup code that prepares test environment
- **Mock/Stub/Spy**: Test doubles for isolating code under test
- **Code Coverage**: Percentage of code exercised by tests
- **Test-Driven Development (TDD)**: Write tests before implementation
- **Behavior-Driven Development (BDD)**: Tests written in natural language format

## Code Examples

```python
import pytest
from typing import List, Dict, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class User:
    id: int
    username: str
    email: str
    is_active: bool = True
    created_at: datetime = None

class UserValidator:
    """Validates user data"""
    def validate_username(self, username: str) -> tuple:
        """Returns (is_valid, error_message)"""
        if not username:
            return False, "Username is required"
        if len(username) < 3:
            return False, "Username must be at least 3 characters"
        if len(username) > 20:
            return False, "Username cannot exceed 20 characters"
        if not username.isalnum():
            return False, "Username must be alphanumeric"
        return True, ""

    def validate_email(self, email: str) -> tuple:
        """Returns (is_valid, error_message)"""
        if not email:
            return False, "Email is required"
        if "@" not in email:
            return False, "Email must contain @"
        local, domain = email.split("@", 1)
        if not local:
            return False, "Email local part is required"
        if "." not in domain:
            return False, "Email domain is required"
        return True, ""

    def validate(self, user: User) -> List[str]:
        """Validate user and return list of errors"""
        errors = []

        is_valid, error = self.validate_username(user.username)
        if not is_valid:
            errors.append(error)

        is_valid, error = self.validate_email(user.email)
        if not is_valid:
            errors.append(error)

        return errors

class TestUserValidator:
    """Unit tests for UserValidator"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.validator = UserValidator()

    def test_valid_username_passes(self):
        """Valid username should pass validation"""
        is_valid, error = self.validator.validate_username("john_doe")
        assert is_valid is True
        assert error == ""

    def test_empty_username_fails(self):
        """Empty username should fail with specific error"""
        is_valid, error = self.validator.validate_username("")
        assert is_valid is False
        assert error == "Username is required"

    def test_username_too_short_fails(self):
        """Username under 3 characters should fail"""
        is_valid, error = self.validator.validate_username("ab")
        assert is_valid is False
        assert "at least 3 characters" in error

    def test_username_with_special_chars_fails(self):
        """Username with special characters should fail"""
        is_valid, error = self.validator.validate_username("john@doe")
        assert is_valid is False
        assert "alphanumeric" in error

    @pytest.mark.parametrize("username", [
        "a" * 21,
        "user@example.com",
        "user-name",
        "user name",
    ])
    def test_invalid_usernames(self, username: str):
        """Various invalid username formats"""
        is_valid, error = self.validator.validate_username(username)
        assert is_valid is False
        assert error != ""

    def test_valid_email_passes(self):
        """Valid email should pass validation"""
        is_valid, error = self.validator.validate_email("user@example.com")
        assert is_valid is True

    def test_email_without_at_symbol_fails(self):
        """Email without @ should fail"""
        is_valid, error = self.validator.validate_email("userexample.com")
        assert is_valid is False
        assert "@" in error

    def test_full_user_validation_with_valid_user(self):
        """Complete user validation with valid data"""
        user = User(
            id=1,
            username="johndoe",
            email="john@example.com"
        )
        errors = self.validator.validate(user)
        assert len(errors) == 0

    def test_full_user_validation_with_multiple_errors(self):
        """User with multiple validation errors"""
        user = User(
            id=1,
            username="",  
            email=""
        )
        errors = self.validator.validate(user)
        assert len(errors) == 2
```

```python
from unittest.mock import Mock, MagicMock, patch
from typing import Optional

class PaymentProcessor:
    """Payment processing service with external dependencies"""
    def __init__(self, payment_gateway, logger):
        self.gateway = payment_gateway
        self.logger = logger

    def process_payment(
        self,
        user_id: int,
        amount: float,
        currency: str = "USD"
    ) -> dict:
        """Process payment through gateway"""
        if amount <= 0:
            self.logger.log(f"Invalid amount: {amount}")
            return {"success": False, "error": "Invalid amount"}

        self.logger.log(f"Processing ${amount} for user {user_id}")
        
        result = self.gateway.charge(
            user_id=user_id,
            amount=amount,
            currency=currency
        )

        if result["success"]:
            self.logger.log(f"Payment successful: {result['transaction_id']}")
        else:
            self.logger.log(f"Payment failed: {result['error']}")

        return result

class TestPaymentProcessor:
    """Unit tests for PaymentProcessor with mocks"""
    
    def setup_method(self):
        """Create mock dependencies for each test"""
        self.mock_gateway = Mock()
        self.mock_logger = Mock()
        self.processor = PaymentProcessor(
            payment_gateway=self.mock_gateway,
            logger=self.mock_logger
        )

    def test_process_payment_success(self):
        """Successful payment should return success"""
        self.mock_gateway.charge.return_value = {
            "success": True,
            "transaction_id": "TXN123"
        }

        result = self.processor.process_payment(
            user_id=1,
            amount=100.0
        )

        assert result["success"] is True
        assert result["transaction_id"] == "TXN123"
        self.mock_gateway.charge.assert_called_once_with(
            user_id=1,
            amount=100.0,
            currency="USD"
        )

    def test_process_payment_with_zero_amount_fails(self):
        """Zero amount should fail without calling gateway"""
        result = self.processor.process_payment(
            user_id=1,
            amount=0
        )

        assert result["success"] is False
        assert "Invalid amount" in result["error"]
        self.mock_gateway.charge.assert_not_called()

    def test_process_payment_negative_amount_fails(self):
        """Negative amount should fail"""
        result = self.processor.process_payment(
            user_id=1,
            amount=-50.0
        )

        assert result["success"] is False
        self.mock_gateway.charge.assert_not_called()

    def test_process_payment_gateway_failure(self):
        """Gateway failure should return error"""
        self.mock_gateway.charge.return_value = {
            "success": False,
            "error": "Card declined"
        }

        result = self.processor.process_payment(
            user_id=1,
            amount=100.0
        )

        assert result["success"] is False
        assert result["error"] == "Card declined"

    def test_process_payment_with_different_currency(self):
        """Different currency should be passed to gateway"""
        self.mock_gateway.charge.return_value = {
            "success": True,
            "transaction_id": "TXN456"
        }

        self.processor.process_payment(
            user_id=1,
            amount=85.0,
            currency="EUR"
        )

        self.mock_gateway.charge.assert_called_once()
        call_kwargs = self.mock_gateway.charge.call_args[1]
        assert call_kwargs["currency"] == "EUR"

    def test_logger_is_called_on_success(self):
        """Logger should be called on successful payment"""
        self.mock_gateway.charge.return_value = {
            "success": True,
            "transaction_id": "TXN789"
        }

        self.processor.process_payment(user_id=1, amount=50.0)

        assert self.mock_logger.log.call_count == 2
```

```python
import pytest
from typing import List
from dataclasses import dataclass

@dataclass
class Order:
    id: int
    items: List[dict]
    customer_id: int

class OrderCalculator:
    """Calculates order totals and discounts"""
    TAX_RATE = 0.08

    def __init__(self, discount_service=None):
        self.discount_service = discount_service

    def calculate_subtotal(self, order: Order) -> float:
        """Calculate order subtotal"""
        return sum(item["price"] * item["quantity"] for item in order["items"])

    def calculate_discount(self, order: Order, subtotal: float) -> float:
        """Calculate discount for order"""
        if self.discount_service:
            return self.discount_service.get_discount(order.customer_id, subtotal)
        return 0.0

    def calculate_tax(self, amount: float) -> float:
        """Calculate tax on amount"""
        return amount * self.TAX_RATE

    def calculate_total(self, order: Order) -> dict:
        """Calculate complete order total"""
        subtotal = self.calculate_subtotal(order)
        discount = self.calculate_discount(order, subtotal)
        taxable = subtotal - discount
        tax = self.calculate_tax(taxable)

        return {
            "subtotal": subtotal,
            "discount": discount,
            "tax": tax,
            "total": subtotal - discount + tax
        }

class TestOrderCalculator:
    """Unit tests for OrderCalculator"""
    
    @pytest.fixture
    def sample_order(self) -> Order:
        """Create sample order for testing"""
        return Order(
            id=1,
            items=[
                {"name": "Widget", "price": 10.0, "quantity": 2},
                {"name": "Gadget", "price": 25.0, "quantity": 1}
            ],
            customer_id=1
        )

    @pytest.fixture
    def calculator(self) -> OrderCalculator:
        """Create calculator without discount service"""
        return OrderCalculator()

    def test_calculate_subtotal(self, calculator, sample_order):
        """Subtotal should be sum of item prices times quantities"""
        subtotal = calculator.calculate_subtotal(sample_order)
        expected = (10.0 * 2) + (25.0 * 1)
        assert subtotal == expected

    def test_calculate_total_basic(self, calculator, sample_order):
        """Total should include subtotal, discount, and tax"""
        result = calculator.calculate_total(sample_order)
        
        assert result["subtotal"] == 45.0
        assert result["discount"] == 0
        assert result["tax"] == 45.0 * 0.08
        assert result["total"] == 45.0 + (45.0 * 0.08)

    def test_calculate_total_with_discount(self):
        """Total should reflect applied discounts"""
        mock_discount = Mock()
        mock_discount.get_discount.return_value = 10.0
        
        calculator = OrderCalculator(discount_service=mock_discount)
        result = calculator.calculate_total(sample_order)

        assert result["discount"] == 10.0
        assert result["tax"] == (45.0 - 10.0) * 0.08

    def test_empty_order_has_zero_total(self, calculator):
        """Empty order should have zero total"""
        empty_order = Order(
            id=2,
            items=[],
            customer_id=1
        )
        result = calculator.calculate_total(empty_order)
        
        assert result["subtotal"] == 0
        assert result["discount"] == 0
        assert result["tax"] == 0
        assert result["total"] == 0
```

```python
import pytest
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class Product:
    id: int
    name: str
    price: float
    category: str
    in_stock: bool = True
    quantity: int = 0

class InventoryService:
    """Inventory management service"""
    def __init__(self):
        self.products: Dict[int, Product] = {}

    def add_product(self, product: Product) -> None:
        """Add product to inventory"""
        self.products[product.id] = product

    def get_product(self, product_id: int) -> Optional[Product]:
        """Get product by ID"""
        return self.products.get(product_id)

    def update_quantity(self, product_id: int, quantity: int) -> bool:
        """Update product quantity"""
        if product_id not in self.products:
            return False
        
        product = self.products[product_id]
        product.quantity = quantity
        product.in_stock = quantity > 0
        return True

    def is_available(self, product_id: int, quantity: int = 1) -> bool:
        """Check if product is available in requested quantity"""
        product = self.get_product(product_id)
        if not product:
            return False
        return product.in_stock and product.quantity >= quantity

    def reserve_inventory(
        self,
        reservations: Dict[int, int]
    ) -> tuple:
        """
        Reserve inventory for multiple products.
        Returns (success, failed_products)
        """
        failed = []
        
        for product_id, quantity in reservations.items():
            if not self.is_available(product_id, quantity):
                failed.append(product_id)
                continue
            
            self.update_quantity(product_id, self.products[product_id].quantity - quantity)

        return len(failed) == 0, failed

class TestInventoryService:
    """Integration tests for InventoryService"""
    
    @pytest.fixture
    def inventory(self):
        """Create fresh inventory for each test"""
        service = InventoryService()
        service.add_product(Product(1, "Widget", 10.0, "tools", True, 100))
        service.add_product(Product(2, "Gadget", 25.0, "electronics", True, 50))
        service.add_product(Product(3, "Gizmo", 15.0, "tools", False, 0))
        return service

    def test_get_existing_product(self, inventory):
        """Should return product when it exists"""
        product = inventory.get_product(1)
        assert product is not None
        assert product.name == "Widget"

    def test_get_nonexistent_product(self, inventory):
        """Should return None for missing product"""
        product = inventory.get_product(999)
        assert product is None

    def test_update_quantity_changes_stock(self, inventory):
        """Updating quantity should update in_stock status"""
        assert inventory.update_quantity(1, 0) is True
        assert inventory.products[1].in_stock is False

    def test_is_available_for_in_stock_product(self, inventory):
        """Available product should return True"""
        assert inventory.is_available(1, 10) is True

    def test_is_available_for_out_of_stock_product(self, inventory):
        """Out of stock product should return False"""
        assert inventory.is_available(3, 1) is False

    def test_is_available_insufficient_quantity(self, inventory):
        """Product with insufficient quantity should return False"""
        assert inventory.is_available(1, 1000) is False

    def test_reserve_inventory_success(self, inventory):
        """Successful reservation should decrease inventory"""
        success, failed = inventory.reserve_inventory({1: 10, 2: 5})
        
        assert success is True
        assert failed == []
        assert inventory.products[1].quantity == 90
        assert inventory.products[2].quantity == 45

    def test_reserve_inventory_partial_failure(self, inventory):
        """Partial failure should return failed product IDs"""
        success, failed = inventory.reserve_inventory({1: 10, 3: 5})
        
        assert success is False
        assert failed == [3]
```

```python
import pytest
from typing import List, Dict
from dataclasses import dataclass

@dataclass
class ApiResponse:
    status_code: int
    data: dict
    headers: dict

class APIError(Exception):
    """Custom API error"""
    def __init__(self, message: str, status_code: int):
        super().__init__(message)
        self.status_code = status_code

class APIClient:
    """REST API client with error handling"""
    def __init__(self, base_url: str, timeout: int = 30):
        self.base_url = base_url
        self.timeout = timeout

    def get(self, endpoint: str, params: Dict = None) -> ApiResponse:
        """GET request to API"""
        import requests
        try:
            response = requests.get(
                f"{self.base_url}{endpoint}",
                params=params,
                timeout=self.timeout
            )
            return ApiResponse(
                status_code=response.status_code,
                data=response.json(),
                headers=dict(response.headers)
            )
        except requests.exceptions.Timeout:
            raise APIError("Request timed out", 408)
        except requests.exceptions.RequestException as e:
            raise APIError(str(e), 500)

    def post(self, endpoint: str, data: Dict) -> ApiResponse:
        """POST request to API"""
        import requests
        try:
            response = requests.post(
                f"{self.base_url}{endpoint}",
                json=data,
                timeout=self.timeout
            )
            return ApiResponse(
                status_code=response.status_code,
                data=response.json(),
                headers=dict(response.headers)
            )
        except requests.exceptions.Timeout:
            raise APIError("Request timed out", 408)
        except requests.exceptions.RequestException as e:
            raise APIError(str(e), 500)

class UserService:
    """User service using API client"""
    def __init__(self, client: APIClient):
        self.client = client

    def get_user(self, user_id: int) -> dict:
        """Get user by ID"""
        response = self.client.get(f"/users/{user_id}")
        if response.status_code == 404:
            return None
        return response.data

    def create_user(self, user_data: dict) -> dict:
        """Create new user"""
        response = self.client.post("/users", user_data)
        return response.data

    def list_users(self, page: int = 1, limit: int = 10) -> List[dict]:
        """List users with pagination"""
        response = self.client.get("/users", {"page": page, "limit": limit})
        return response.data.get("users", [])

class TestAPIClient:
    """Tests for API client"""
    
    @pytest.fixture
    def mock_requests(self):
        """Create mock for requests module"""
        with patch("requests.get") as mock_get, \
             patch("requests.post") as mock_post:
            yield {"get": mock_get, "post": mock_post}

    def test_get_success(self, mock_requests):
        """Successful GET should return response"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"id": 1, "name": "John"}
        mock_response.headers = {"Content-Type": "application/json"}
        mock_requests["get"].return_value = mock_response

        client = APIClient("https://api.example.com")
        response = client.get("/users/1")

        assert response.status_code == 200
        assert response.data["name"] == "John"

    def test_get_timeout_raises_error(self, mock_requests):
        """Timeout should raise APIError with 408 status"""
        import requests
        mock_requests["get"].side_effect = requests.exceptions.Timeout()

        client = APIClient("https://api.example.com")
        
        with pytest.raises(APIError) as exc_info:
            client.get("/users/1")
        
        assert exc_info.value.status_code == 408

    def test_get_404_returns_none(self, mock_requests):
        """404 response should be handled gracefully"""
        mock_response = Mock()
        mock_response.status_code = 404
        mock_requests["get"].return_value = mock_response

        client = APIClient("https://api.example.com")
        user_service = UserService(client)
        
        user = user_service.get_user(999)
        assert user is None
```

## Best Practices

- Write tests that are fast, repeatable, and independent of each other
- Follow Arrange-Act-Assert structure for clear test organization
- Use descriptive test names that explain what is being tested and why
- Mock external dependencies to isolate code under test
- Aim for meaningful coverage of critical paths, not just high percentages
- Run tests frequently during development; don't let failures accumulate
- Use test fixtures to avoid duplicating setup code across tests
- Parameterize tests for similar cases to reduce code duplication
- Test edge cases, error conditions, and boundary values
- Keep tests simple and readable; tests are documentation too

## Common Patterns

- **Arrange-Act-Assert**: Standard structure for test organization
- **Test Fixture**: Reusable setup for multiple tests
- **Parametrized Tests**: Run same test logic with different inputs
- **Mock Objects**: Replace external dependencies for isolation
- **Snapshot Testing**: Compare output against saved reference
- **Property-Based Testing**: Test properties that should always hold
- **Test Pyramid**: Many unit tests, fewer integration, minimal E2E
- **Shared Test Setup**: Common initialization code across test suites
- **Assertion Libraries**: Expressive assertions beyond basic equality
