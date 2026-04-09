---
name: testing
description: Testing best practices and strategies
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: code-quality
---
## What I do
- Write effective unit tests
- Implement integration tests
- Use mocking and stubs appropriately
- Achieve good code coverage (aim for 80%+)
- Follow testing pyramid (many unit, fewer integration, few e2e)
- Use property-based testing
- Test edge cases and error conditions
- Maintain test isolation

## When to use me
When writing tests for any codebase.

## Testing Pyramid
```
        /\
       /E2E\        Few: End-to-end tests (Cypress, Playwright)
      /------\
     /Int'grt'n\   Some: Integration tests
    /------------\
   /   Unit       \ Many: Unit tests (pytest, Jest, Go testing)
  /----------------\
```

## Unit Testing Principles
```python
# GOOD: Focused tests with clear names
def test_user_creation_with_valid_email_succeeds():
    user = User(email="test@example.com", name="Test User")
    assert user.email == "test@example.com"
    assert user.is_active is True
    assert user.created_at is not None


def test_user_creation_with_invalid_email_raises_exception():
    with pytest.raises(ValidationError):
        User(email="invalid-email", name="Test")


# GOOD: Use descriptive test names
# BAD: test_create_user, test_user, test1

# Test one thing per test
def test_login_with_wrong_password_returns_error():
    # Arrange
    user = create_test_user()
    auth_service = AuthService(user_repository)

    # Act
    result = auth_service.login(user.email, "wrong_password")

    # Assert
    assert result.is_error()
    assert result.error_code == "INVALID_PASSWORD"
    assert result.token is None
```

## Mocking and Stubbing
```python
from unittest.mock import Mock, MagicMock, patch
import pytest


def test_user_service_sends_welcome_email():
    # Arrange
    user = create_test_user()
    email_service = Mock(spec=EmailService)
    user_service = UserService(
        user_repository=Mock(),
        email_service=email_service
    )

    # Act
    user_service.create(user)

    # Assert
    email_service.send_welcome_email.assert_called_once_with(user.email)


def test_user_repository_is_called_on_update():
    # Arrange
    user_repository = Mock(spec=UserRepository)
    service = UserService(user_repository=user_repository)
    user = User(id=1, name="Updated")

    # Act
    service.update(user)

    # Assert
    user_repository.update.assert_called_once_with(user)


def test_cache_is_checked_before_database():
    # Use patch for dependency injection
    with patch('myapp.services.get_cache') as mock_cache:
        mock_cache.return_value.get.return_value = None

        service = DataService()
        result = service.get_data("key")

        # Verify cache was checked
        mock_cache.return_value.get.assert_called_once_with("key")
        # Verify database was called
        # ... assertions
```

## Property-Based Testing
```python
from hypothesis import given, strategies as st


@given(
    st.integers(min_value=0),
    st.integers(min_value=1)
)
def test_addition_is_commutative(a, b):
    assert a + b == b + a


@given(
    email=strategy(
        st.text(min_size=1),
        st.from_regex(r'[a-z]+@[a-z]+\.[a-z]+')
    )
)
def test_email_normalization(email):
    normalized = normalize_email(email)
    assert "@" in normalized
    assert " " not in normalized
```

## Test Organization
```
tests/
├── __init__.py
├── conftest.py              # Shared fixtures
├── unit/
│   ├── __init__.py
│   ├── test_models.py
│   ├── test_services.py
│   └── test_utils.py
├── integration/
│   ├── __init__.py
│   ├── test_api.py
│   └── test_database.py
├── e2e/
│   ├── __init__.py
│   ├── test_auth_flow.py
│   └── test_checkout_flow.py
└── fixtures/
    ├── users.json
    └── products.json
```

## Test Fixtures
```python
import pytest
from myapp import create_app, db


@pytest.fixture
def app():
    app = create_app({
        "TESTING": True,
        "DATABASE_URL": "sqlite:///:memory:"
    })
    with app.app_context():
        db.create_all()
    yield app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def db_session(app):
    return db.session


@pytest.fixture
def test_user(db_session):
    user = User(email="test@example.com", name="Test")
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def auth_header(test_user):
    token = generate_token(test_user)
    return {"Authorization": f"Bearer {token}"}
```
