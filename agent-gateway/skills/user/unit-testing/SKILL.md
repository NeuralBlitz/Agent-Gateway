---
name: unit-testing
description: Unit testing best practices and patterns
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: testing
---
## What I do
- Write effective unit tests
- Structure test suites
- Use test doubles (mocks, stubs, fakes)
- Test edge cases and errors
- Achieve good coverage
- Use parameterized tests
- Write readable tests
- Follow testing best practices

## When to use me
When writing unit tests or improving test coverage.

## Unit Test Structure
```python
import pytest
from unittest.mock import Mock, patch, MagicMock
from dataclasses import dataclass


# Arrange-Act-Assert Pattern
class TestUserService:
    """Unit tests for UserService."""
    
    @pytest.fixture
    def user_repository(self):
        """Create mock user repository."""
        return Mock()
    
    @pytest.fixture
    def email_service(self):
        """Create mock email service."""
        return Mock()
    
    @pytest.fixture
    def service(self, user_repository, email_service):
        """Create service with dependencies."""
        return UserService(
            user_repository=user_repository,
            email_service=email_service,
        )
    
    def test_create_user_saves_and_sends_welcome_email(
        self,
        service: UserService,
        user_repository: Mock,
        email_service: Mock
    ):
        """Test creating a user saves to DB and sends email."""
        # Arrange
        email = "user@example.com"
        name = "Test User"
        
        user_repository.exists_by_email.return_value = False
        
        # Act
        result = service.create_user(email, name)
        
        # Assert
        # Verify repository calls
        user_repository.exists_by_email.assert_called_once_with(email)
        user_repository.save.assert_called_once()
        
        # Verify email was sent
        email_service.send_welcome_email.assert_called_once_with(
            email=email,
            name=name,
        )
        
        # Verify result
        assert result.email == email
        assert result.name == name
        assert result.id is not None
    
    def test_create_user_raises_error_for_duplicate_email(
        self,
        service: UserService,
        user_repository: Mock
    ):
        """Test that duplicate email raises error."""
        # Arrange
        email = "existing@example.com"
        user_repository.exists_by_email.return_value = True
        
        # Act & Assert
        with pytest.raises(DuplicateEmailError):
            service.create_user(email, "Test")
        
        # Verify save was never called
        user_repository.save.assert_not_called()
```

## Using Mocks Effectively
```python
from unittest.mock import Mock, patch, MagicMock
import pytest


class TestPaymentProcessor:
    """Test payment processor with mocks."""
    
    @patch('app.services.payment_gateway.PaymentGateway')
    def test_process_payment_success(
        self,
        mock_gateway_class
    ):
        """Test successful payment processing."""
        # Arrange
        mock_gateway = MagicMock()
        mock_gateway.process_payment.return_value = {
            "status": "success",
            "transaction_id": "tx_123"
        }
        mock_gateway_class.return_value = mock_gateway
        
        processor = PaymentProcessor(gateway=mock_gateway)
        
        # Act
        result = processor.process(
            amount=100.00,
            currency="USD",
            source="tok_visa"
        )
        
        # Assert
        mock_gateway.process_payment.assert_called_once_with(
            amount=100.00,
            currency="USD",
            source="tok_visa",
        )
        
        assert result.status == "success"
        assert result.transaction_id == "tx_123"
    
    @patch('app.services.payment_gateway.PaymentGateway')
    def test_process_payment_handles_error(
        self,
        mock_gateway_class
    ):
        """Test error handling in payment processing."""
        # Arrange
        mock_gateway = MagicMock()
        mock_gateway.process_payment.side_effect = PaymentError(
            "Card declined"
        )
        mock_gateway_class.return_value = mock_gateway
        
        processor = PaymentProcessor(gateway=mock_gateway)
        
        # Act & Assert
        with pytest.raises(PaymentProcessingError):
            processor.process(
                amount=100.00,
                currency="USD",
                source="tok_visa"
            )
```

## Parameterized Tests
```python
import pytest
from hypothesis import given, strategies as st


class TestValidator:
    """Tests for input validator."""
    
    @pytest.mark.parametrize("email,is_valid", [
        ("user@example.com", True),
        ("user.name@example.com", True),
        ("user+tag@example.com", True),
        ("invalid", False),
        ("@example.com", False),
        ("user@", False),
        ("user@.com", False),
    ])
    def test_email_validation(self, email: str, is_valid: bool):
        """Test email validation with various inputs."""
        validator = EmailValidator()
        
        result = validator.is_valid_email(email)
        
        assert result == is_valid
    
    @pytest.mark.parametrize("password,expected", [
        ("Short1!", False),  # Too short
        ("lowercase1!", False),  # No uppercase
        ("UPPERCASE1!", False),  # No lowercase
        ("NoNumbers!", False),  # No numbers
        ("ValidPass1!", True),
    ])
    def test_password_strength(
        self,
        password: str,
        expected: bool
    ):
        """Test password strength validation."""
        validator = PasswordValidator()
        
        result = validator.is_strong(password)
        
        assert result == expected


# Property-based testing with Hypothesis
class TestMathOperations:
    """Property-based tests for math operations."""
    
    @given(st.integers(), st.integers())
    def test_addition_is_commutative(self, a: int, b: int):
        """Addition should be commutative: a + b == b + a."""
        assert a + b == b + a
    
    @given(st.integers(min_value=1))
    def test_multiplication_by_one(self, a: int):
        """Multiplication by one should return same number."""
        assert a * 1 == a
    
    @given(st.lists(st.integers(), min_size=1))
    def test_sum_is_at_least_max(self, numbers: list):
        """Sum of list should be at least the max value."""
        assert sum(numbers) >= max(numbers)
    
    @given(st.text(min_size=1))
    def test_string_reversal_length(self, s: str):
        """Reversed string should have same length."""
        assert len(s[::-1]) == len(s)
```

## Testing Edge Cases
```python
import pytest
from unittest.mock import Mock, patch


class TestOrderProcessor:
    """Test order processor with edge cases."""
    
    def test_empty_cart_raises_error(self):
        """Test that empty cart raises error."""
        repository = Mock()
        processor = OrderProcessor(repository)
        
        with pytest.raises(EmptyCartError):
            processor.process_order(user_id="123", cart_items=[])
    
    def test_single_item_order(self):
        """Test order with single item."""
        repository = Mock()
        repository.save.return_value = Mock(id="order_123")
        
        processor = OrderProcessor(repository)
        
        result = processor.process_order(
            user_id="123",
            cart_items=[CartItem(product_id="p1", quantity=1)]
        )
        
        assert result.id == "order_123"
        repository.save.assert_called_once()
    
    def test_multiple_items_order(self):
        """Test order with multiple items."""
        repository = Mock()
        repository.save.return_value = Mock(id="order_123")
        
        processor = OrderProcessor(repository)
        
        items = [
            CartItem(product_id="p1", quantity=2),
            CartItem(product_id="p2", quantity=1),
        ]
        
        result = processor.process_order("123", items)
        
        # Verify order was saved
        assert repository.save.called
        
        # Get the order that was saved
        saved_order = repository.save.call_args[0][0]
        assert len(saved_order.items) == 2
    
    def test_handles_repository_error(self):
        """Test error handling when repository fails."""
        repository = Mock()
        repository.save.side_effect = DatabaseConnectionError()
        
        processor = OrderProcessor(repository)
        
        with pytest.raises(OrderProcessingError):
            processor.process_order("123", [CartItem("p1", 1)])
    
    def test_calculates_correct_total(self):
        """Test that order total is calculated correctly."""
        repository = Mock()
        processor = OrderProcessor(repository)
        
        items = [
            CartItem(product_id="p1", quantity=2, price=10.00),
            CartItem(product_id="p2", quantity=3, price=15.00),
        ]
        
        order = processor.process_order("123", items)
        
        # Total: (2 * 10) + (3 * 15) = 20 + 45 = 65
        assert order.total == 65.00
    
    @pytest.mark.parametrize("quantity", [-1, 0])
    def test_invalid_quantity_raises_error(self, quantity: int):
        """Test that invalid quantity raises error."""
        repository = Mock()
        processor = OrderProcessor(repository)
        
        with pytest.raises(InvalidQuantityError):
            processor.process_order(
                "123",
                [CartItem("p1", quantity)]
            )
```

## Testing Async Code
```python
import pytest
import asyncio
from unittest.mock import AsyncMock, patch


class TestAsyncUserService:
    """Test async user service."""
    
    @pytest.fixture
    def mock_repository(self):
        """Create async mock repository."""
        return AsyncMock()
    
    @pytest.fixture
    def mock_cache(self):
        """Create async mock cache."""
        return AsyncMock()
    
    @pytest.fixture
    async def service(self, mock_repository, mock_cache):
        """Create async service."""
        return AsyncUserService(
            repository=mock_repository,
            cache=mock_cache,
        )
    
    @pytest.mark.asyncio
    async def test_get_user_caches_result(
        self,
        service: AsyncUserService,
        mock_repository: AsyncMock,
        mock_cache: AsyncMock
    ):
        """Test that get_user caches results."""
        mock_cache.get.return_value = None
        mock_repository.find_by_id.return_value = Mock(
            id="123",
            name="Test User"
        )
        
        # Act
        result = await service.get_user("123")
        
        # Assert
        mock_cache.get.assert_called_once_with("user_123")
        mock_repository.find_by_id.assert_called_once_with("123")
        mock_cache.set.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_returns_cached_user(
        self,
        service: AsyncUserService,
        mock_repository: AsyncMock,
        mock_cache: AsyncMock
    ):
        """Test that cached user is returned."""
        cached_user = Mock(id="123", name="Cached User")
        mock_cache.get.return_value = cached_user
        
        result = await service.get_user("123")
        
        # Should not call repository
        mock_repository.find_by_id.assert_not_called()
        assert result == cached_user
    
    @pytest.mark.asyncio
    async def test_handles_not_found(self):
        """Test handling of user not found."""
        mock_repository = AsyncMock()
        mock_repository.find_by_id.return_value = None
        mock_cache = AsyncMock()
        
        service = AsyncUserService(mock_repository, mock_cache)
        
        result = await service.get_user("nonexistent")
        
        assert result is None
```

## Test Fixtures
```python
import pytest
from typing import Generator
from dataclasses import dataclass


@dataclass
class TestUser:
    """Test user fixture."""
    email: str = "test@example.com"
    name: str = "Test User"
    password: str = "SecurePass123!"


@pytest.fixture
def test_user() -> TestUser:
    """Create test user."""
    return TestUser()


@pytest.fixture
def new_user(test_user) -> dict:
    """Create user data dict."""
    return {
        "email": test_user.email,
        "name": test_user.name,
        "password": test_user.password,
    }


@pytest.fixture
def authenticated_client(client, test_user):
    """Create authenticated API client."""
    token = generate_test_token(test_user.email)
    client.headers["Authorization"] = f"Bearer {token}"
    return client


@pytest.fixture(scope="session")
def database():
    """Create test database (session-scoped)."""
    db = create_test_database()
    yield db
    db.close()


@pytest.fixture
def db_session(database):
    """Create database session for test."""
    session = database.new_session()
    yield session
    session.rollback()
    session.close()


@pytest.fixture(autouse=True)
def cleanup_after_test(db_session):
    """Automatically clean up after each test."""
    yield
    # Rollback any uncommitted changes
    db_session.rollback()


@pytest.fixture
def sample_orders() -> list:
    """Create sample orders for testing."""
    return [
        {"id": "1", "status": "pending", "total": 100.00},
        {"id": "2", "status": "completed", "total": 200.00},
        {"id": "3", "status": "pending", "total": 50.00},
    ]
```

## Best Practices
```
1. Test one thing per test
   Each test should have one assertion

2. Use descriptive names
   test_user_creation_success
   test_should_raise_error_for_negative_quantity

3. Follow AAA pattern
   Arrange, Act, Assert

4. Don't test framework code
   Test your business logic

5. Use proper isolation
   Mock external dependencies

6. Test edge cases
   Empty inputs, nulls, boundaries

7. Parameterize repetitive tests
   Use @pytest.mark.parametrize

8. Use property-based testing
   Find edge cases automatically

9. Keep tests fast
   Fast tests run frequently

10. Make tests readable
    Clear intent, good names
```
