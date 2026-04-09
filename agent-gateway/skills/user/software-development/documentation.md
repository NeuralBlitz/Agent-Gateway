---
name: Documentation
description: Best practices and tools for creating clear, maintainable technical documentation
license: MIT
compatibility:
  - Python (Sphinx, MkDocs)
  - JavaScript (JSDoc, TypeDoc)
  - Java (Javadoc)
  - Go (godoc)
  - All Languages
audience: Software Developers, Technical Writers, Documentation Engineers
category: software-development
---

# Documentation

## What I Do

I provide comprehensive guidance on creating and maintaining technical documentation that enables developers to understand, use, and contribute to software effectively. Good documentation reduces onboarding time, decreases support burden, and serves as a knowledge repository. I cover API documentation, code comments, README files, architecture docs, and user guides. I also address documentation-as-code practices that keep docs synchronized with evolving software.

## When to Use Me

Apply documentation practices when creating new APIs, libraries, or components. Write documentation before or alongside implementation to capture design decisions while fresh. Update documentation when APIs change. Prioritize docs for public interfaces, complex concepts, and frequently asked questions. Skip extensive documentation for trivial code, obvious implementations, or temporary solutions. Documentation should provide value; document for the audience that will use it.

## Core Concepts

- **API Documentation**: Reference docs for public interfaces, parameters, and behavior
- **README**: Quick-start guide explaining what, why, and how to get started
- **Code Comments**: In-code explanations for complex or non-obvious logic
- **Docstrings**: Function/class documentation accessible at runtime
- **Architecture Decision Records (ADRs)**: Documents capturing design decisions
- **Changelog**: Record of changes, features, and fixes over time
- **Style Guide**: Consistent documentation format and conventions
- **Documentation Tests**: Executable examples that verify documentation accuracy
- **Versioning**: Managing docs for multiple software versions
- **Searchability**: Making docs easy to navigate and find information

## Code Examples

```python
"""
Example module demonstrating comprehensive docstring patterns.

This module provides example classes and functions showing
different documentation styles and best practices.
"""

from typing import List, Dict, Optional, Any
from dataclasses import dataclass
from datetime import datetime

class UserService:
    """
    Service for managing user operations.
    
    This class provides functionality for user CRUD operations,
    authentication, and profile management. It integrates with
    the user repository for persistence.
    
    Example:
        >>> service = UserService(repository)
        >>> user = service.get_user(123)
        >>> print(user.username)
        'john_doe'
    
    Attributes:
        repository: User data persistence layer
        max_login_attempts: Maximum failed login attempts before lockout
    
    Raises:
        UserNotFoundError: When requested user doesn't exist
        AuthenticationError: When credentials are invalid
    """
    
    MAX_LOGIN_ATTEMPTS = 5
    
    def __init__(self, repository, max_attempts: int = None):
        """
        Initialize UserService with required dependencies.
        
        Args:
            repository: UserRepository instance for data access
            max_attempts: Optional override for max login attempts
        """
        self.repository = repository
        self.max_attempts = max_attempts or self.MAX_LOGIN_ATTEMPTS

    def get_user(self, user_id: int) -> Optional[Dict[str, Any]]:
        """
        Retrieve user by ID.
        
        Retrieves a user from the repository using their unique
        identifier. Returns None if no user exists with that ID.
        
        Args:
            user_id: Unique integer identifier for the user
            
        Returns:
            User dictionary or None if not found
            
        Example:
            >>> service.get_user(123)
            {'id': 123, 'username': 'john', 'email': 'john@example.com'}
        
        Raises:
            ValueError: If user_id is not positive
        """
        if user_id <= 0:
            raise ValueError("user_id must be positive")
        
        return self.repository.find_by_id(user_id)

    def authenticate(self, username: str, password: str) -> str:
        """
        Authenticate user with username and password.
        
        Validates credentials and returns a JWT token on success.
        Tracks failed attempts and locks account after maximum
        exceeded attempts.
        
        Args:
            username: User's username
            password: User's password
            
        Returns:
            JWT authentication token
            
        Raises:
            AuthenticationError: If credentials are invalid
            AccountLockedError: If account is locked due to failed attempts
        
        Note:
            This method is rate-limited to prevent brute force attacks.
            Successful authentication resets the failed attempt counter.
        """
        pass

@dataclass
class Order:
    """
    Represents a customer order.
    
    An Order contains items, customer information, and
    status tracking for fulfillment.
    
    Attributes:
        id: Unique order identifier
        items: List of ordered products
        customer_id: ID of customer who placed the order
        status: Current order status
        created_at: Timestamp when order was created
    
    Examples:
        >>> order = Order(
        ...     id=1,
        ...     items=[{"product_id": 1, "quantity": 2}],
        ...     customer_id=100
        ... )
        >>> order.status
        'pending'
    """
    id: int
    items: List[Dict[str, Any]]
    customer_id: int
    status: str = "pending"
    created_at: datetime = None

    def calculate_total(self) -> float:
        """Calculate total price of all items in order."""
        return sum(item["price"] * item["quantity"] for item in self.items)

    def add_item(self, product_id: int, quantity: int, price: float) -> None:
        """
        Add item to order.
        
        Args:
            product_id: ID of product being ordered
            quantity: Number of items
            price: Unit price at time of ordering
        """
        self.items.append({
            "product_id": product_id,
            "quantity": quantity,
            "price": price
        })
```

```markdown
# Project Documentation Template

## Project Name

Brief description of what this project does and why it exists.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

## Installation

### Prerequisites

- Python 3.8+
- PostgreSQL 13+
- Redis 6+

### Steps

```bash
# Clone the repository
git clone https://github.com/username/project.git
cd project

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
python manage.py migrate

# Start the development server
python manage.py runserver
```

## Usage

### Quick Start

```python
from project import Client

client = Client(api_key="your-api-key")
result = client.fetch_data()
print(result)
```

### Configuration

Environment variables:

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| API_KEY | Yes | Your API key | - |
| DEBUG | No | Enable debug mode | false |
| LOG_LEVEL | No | Logging level | INFO |

## API Reference

### Endpoints

#### GET /api/users

Returns list of users.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| page | int | No | Page number |
| limit | int | No | Items per page |

**Response:**

```json
{
  "data": [
    {"id": 1, "name": "John"},
    {"id": 2, "name": "Jane"}
  ],
  "total": 100,
  "page": 1
}
```

#### POST /api/users

Create a new user.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style

- Follow PEP 8 for Python code
- Use type hints for all functions
- Write docstrings for public functions
- Add tests for new features

## License

MIT License - see LICENSE file for details.
```

```python
"""
API client module with docstrings and examples.

This module provides a simple HTTP client for interacting
with REST APIs. It handles authentication, retries, and
error responses automatically.
"""

import requests
from typing import Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import time

@dataclass
class RateLimitInfo:
    """Information about API rate limits."""
    limit: int
    remaining: int
    reset_at: datetime

class APIError(Exception):
    """Base exception for API errors."""
    def __init__(self, message: str, status_code: int, response: Dict = None):
        super().__init__(message)
        self.status_code = status_code
        self.response = response or {}

class APIClient:
    """
    Simple REST API client with automatic retry and rate limiting.
    
    This client provides a convenient interface for making HTTP
    requests to REST APIs with built-in error handling and retries.
    
    Usage:
        >>> client = APIClient(base_url="https://api.example.com")
        >>> client.set_auth("your-api-key")
        >>> data = client.get("/users")
        >>> print(data)
        {'users': [...]}
    
    Features:
        - Automatic JSON parsing
        - Retry on transient failures
        - Rate limit handling
        - Configurable timeouts
    """
    
    DEFAULT_TIMEOUT = 30
    MAX_RETRIES = 3
    BACKOFF_FACTOR = 0.5
    
    def __init__(
        self,
        base_url: str,
        timeout: int = None,
        max_retries: int = None
    ):
        """
        Initialize API client.
        
        Args:
            base_url: Base URL for all API requests
            timeout: Request timeout in seconds
            max_retries: Maximum retry attempts on failure
        """
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout or self.DEFAULT_TIMEOUT
        self.max_retries = max_retries or self.MAX_RETRIES
        self._auth_token: Optional[str] = None
        self._session = requests.Session()
        
        if self._auth_token:
            self._session.headers.update({"Authorization": f"Bearer {self._auth_token}"})

    def set_auth(self, token: str) -> None:
        """
        Set authentication token for API requests.
        
        Sets a Bearer token that will be included in all
        subsequent requests.
        
        Args:
            token: Authentication token provided by API
            
        Example:
            >>> client.set_auth("abc123xyz")
            >>> # All future requests include auth header
        """
        self._auth_token = token
        self._session.headers.update({"Authorization": f"Bearer {token}"})

    def get(
        self,
        endpoint: str,
        params: Dict = None,
        retries: int = None
    ) -> Dict[str, Any]:
        """
        Make GET request to API endpoint.
        
        Makes a GET request with automatic retry on failure.
        Raises APIError for non-success status codes.
        
        Args:
            endpoint: API endpoint (appended to base_url)
            params: Query parameters
            retries: Override max retries for this request
            
        Returns:
            Parsed JSON response as dictionary
            
        Raises:
            APIError: On HTTP error or max retries exceeded
        
        Example:
            >>> client.get("/users", {"page": 1})
            {'data': [{'id': 1, 'name': 'John'}]}
        """
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        retries = retries if retries is not None else self.max_retries
        
        for attempt in range(retries + 1):
            try:
                response = self._session.get(
                    url,
                    params=params,
                    timeout=self.timeout
                )
                response.raise_for_status()
                return response.json()
            except requests.exceptions.RequestException as e:
                if attempt == retries:
                    raise APIError(
                        str(e),
                        getattr(response, 'status_code', 500)
                    )
                time.sleep(self.BACKOFF_FACTOR * (2 ** attempt))
        
        raise APIError("Max retries exceeded", 500)

    def post(
        self,
        endpoint: str,
        data: Dict = None
    ) -> Dict[str, Any]:
        """
        Make POST request to API endpoint.
        
        Sends JSON data and returns parsed JSON response.
        
        Args:
            endpoint: API endpoint
            data: Request body data
            
        Returns:
            Parsed JSON response
            
        Raises:
            APIError: On HTTP error
        """
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        response = self._session.post(
            url,
            json=data,
            timeout=self.timeout
        )
        response.raise_for_status()
        return response.json()

    def __enter__(self) -> "APIClient":
        """Context manager entry."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        """Context manager exit - closes session."""
        self._session.close()
```

```markdown
# Architecture Decision Record: API Versioning Strategy

## Status

Accepted

## Context

Our API needs to evolve while maintaining backward compatibility for existing clients.
Different clients (web, mobile, third-party) upgrade at different rates.

## Decision

We will use URL path versioning (`/api/v1/resource`) for major API versions.

### Why URL Path Versioning?

- **Clear visibility**: Version is visible in every request
- **Cache-friendly**: Different versions can be cached separately
- **Simple**: Easy to understand and implement
- **GitOps-friendly**: Versioned docs match versioned APIs

### Alternatives Considered

| Approach | Pros | Cons |
|----------|------|------|
| Header versioning | Keeps URL clean | Harder to test/debug |
| Query param | Easy to change | Can be accidentally cached |
| Media types (Accept) | Standards-based | Complex tooling |

## Consequences

### Positive

- Clear separation between API versions
- Easy to support multiple versions simultaneously
- Simple to document and test

### Negative

- URL changes require client updates
- More endpoints to maintain
- Potential duplication of code

## Implementation

```
/api/v1/users      # Current version
/api/v2/users      # New version with breaking changes
```

Deprecation timeline:
- v1 supported for 12 months after v2 release
- Deprecation warnings in response headers
- Migration guide provided
```

```python
"""
README.py - Main entry point for the application.

This module sets up and runs the Flask application.
See README.md for full documentation.
"""

from flask import Flask
from config import config

def create_app(config_name: str = "default") -> Flask:
    """
    Application factory for creating Flask app.
    
    Creates and configures the Flask application with all
    necessary extensions and blueprints.
    
    Args:
        config_name: Configuration environment to use
        
    Returns:
        Configured Flask application instance
        
    Example:
        >>> app = create_app("development")
        >>> app.run()
    """
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    from extensions import db, migrate, login_manager
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    
    # Register blueprints
    from routes.api import api_bp
    from routes.web import web_bp
    app.register_blueprint(api_bp, url_prefix="/api/v1")
    app.register_blueprint(web_bp)
    
    return app

if __name__ == "__main__":
    app = create_app("development")
    app.run(host="0.0.0.0", port=5000)
```

## Best Practices

- Write documentation for humans, not just for completeness
- Keep documentation near the code it describes (docstrings, READMEs)
- Use consistent structure and formatting across all documentation
- Include practical examples showing real usage
- Document the "why" behind design decisions, not just the "what"
- Update documentation when code changes; treat docs like code
- Make documentation searchable and easy to navigate
- Use diagrams for complex architectures and relationships
- Version documentation alongside software versions
- Get feedback on documentation from actual users

## Common Patterns

- **README.md**: Project landing page with quick start
- **Docstrings**: In-code documentation accessible via help()
- **API Documentation**: Swagger/OpenAPI for REST endpoints
- **Architecture Decision Records**: Documenting design choices
- **Changelog**: Tracking changes over time
- **Code Examples**: Executable documentation proving correctness
- **Documentation Tests**: Doctests ensuring examples work
- **Architecture Diagrams**: Visualizing system structure
