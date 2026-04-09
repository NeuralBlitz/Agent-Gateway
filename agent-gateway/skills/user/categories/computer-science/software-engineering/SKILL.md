---
name: Software Engineering
description: Systematic application of engineering principles to software development including design patterns, architecture, testing methodologies, DevOps practices, and team collaboration
license: MIT
compatibility: universal
audience: Software Engineers, Architects, Technical Leads
category: Computer Science

---

# Software Engineering

## What I Do

I specialize in software engineering—the disciplined, systematic approach to developing and maintaining software systems. My expertise spans software architecture and design patterns, agile and iterative development methodologies, testing strategies (unit, integration, system), DevOps and CI/CD pipelines, code review practices, technical debt management, documentation, and team collaboration. I focus on producing maintainable, scalable, reliable software through proven engineering practices.

## When to Use Me

- Designing software architecture for new projects
- Implementing design patterns appropriately
- Setting up CI/CD pipelines
- Writing comprehensive test suites
- Refactoring legacy code
- Conducting code reviews
- Estimating and planning development work
- Improving team development processes

## Core Concepts

1. **Design Patterns**: Creational, structural, behavioral patterns for common problems
2. **SOLID Principles**: Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
3. **Architecture Styles**: Monolithic, microservices, event-driven, CQRS, hexagonal
4. **Testing Pyramid**: Unit, integration, end-to-end test distribution
5. **CI/CD**: Continuous integration, delivery, deployment practices
6. **Code Review**: Process, checklist, and constructive feedback
7. **Technical Debt**: Identification, measurement, and repayment strategies
8. **Refactoring**: Safe code transformations without changing behavior
9. **Documentation**: Code docs, architecture decision records, READMEs
10. **Team Practices**: Standups, retrospectives, pair programming, mob programming

## Code Examples

```python
# SOLID Principles Implementation

# Single Responsibility Principle
class User:
    def __init__(self, username: str, email: str):
        self.username = username
        self.email = email

class UserRepository:
    """Handles database operations - Single responsibility."""
    
    def __init__(self, db_connection):
        self.db = db_connection
    
    def save(self, user: User):
        # Save to database
        pass
    
    def find_by_username(self, username: str) -> User:
        # Query database
        pass

class EmailService:
    """Handles email sending - Separate from persistence."""
    
    def send_email(self, to: str, subject: str, body: str):
        # Send email
        pass

class UserService:
    """Orchestrates user operations."""
    
    def __init__(self, repo: UserRepository, email: EmailService):
        self.repo = repo
        self.email = email
    
    def register_user(self, user: User):
        self.repo.save(user)
        self.email.send_email(user.email, "Welcome!", "Welcome aboard!")

# Open-Closed Principle
from abc import ABC, abstractmethod
from typing import List

class DiscountStrategy(ABC):
    """Open for extension, closed for modification."""
    
    @abstractmethod
    def apply(self, price: float) -> float:
        pass

class NoDiscount(DiscountStrategy):
    def apply(self, price: float) -> float:
        return price

class PercentageDiscount(DiscountStrategy):
    def __init__(self, percentage: float):
        self.percentage = percentage
    
    def apply(self, price: float) -> float:
        return price * (1 - self.percentage / 100)

class SeasonalDiscount(DiscountStrategy):
    def apply(self, price: float) -> float:
        return price * 0.9  # 10% seasonal discount

class PriceCalculator:
    """Can add new discounts without modifying this class."""
    
    def __init__(self):
        self.discounts: List[DiscountStrategy] = []
    
    def add_discount(self, discount: DiscountStrategy):
        self.discounts.append(discount)
    
    def calculate(self, price: float) -> float:
        final_price = price
        for discount in self.discounts:
            final_price = discount.apply(final_price)
        return final_price

# Dependency Inversion Principle
class Database(ABC):
    @abstractmethod
    def connect(self):
        pass

class PostgreSQLDatabase(Database):
    def connect(self):
        return "PostgreSQL connected"

class MongoDatabase(Database):
    def connect(self):
        return "MongoDB connected"

class Application:
    """Depends on abstraction, not concretion."""
    
    def __init__(self, db: Database):
        self.db = db
    
    def run(self):
        return self.db.connect()

# Usage
app = Application(PostgreSQLDatabase())
print(app.run())

# Liskov Substitution Principle
class Bird:
    def fly(self):
        return "Flying"

class Sparrow(Bird):
    def fly(self):
        return "Sparrow flying"

class Penguin(Bird):
    # LSP: Penguin cannot fly, violating LSP if Bird.fly is part of contract
    # Solution: Separate interfaces
    pass

# Fixed with proper abstraction
class FlyingBird:
    def fly(self):
        pass

class NonFlyingBird:
    def walk(self):
        pass

class SparrowLSP(FlyingBird):
    def fly(self):
        return "Flying"

class PenguinLSP(NonFlyingBird):
    def walk(self):
        return "Waddling"
```

```python
# Design Patterns Implementation

# Factory Method
class Document(ABC):
    @abstractmethod
    def create_page(self):
        pass

class Resume(Document):
    def create_page(self):
        return "Resume Page"

class Report(Document):
    def create_page(self):
        return "Report Page"

class DocumentFactory:
    def create_document(self, doc_type: str) -> Document:
        if doc_type == "resume":
            return Resume()
        elif doc_type == "report":
            return Report()
        raise ValueError("Unknown document type")

# Singleton with thread safety
class Singleton:
    _instance = None
    _lock = __import__('threading').Lock()
    
    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
            return cls._instance

# Observer Pattern
class Subject:
    def __init__(self):
        self._observers = []
    
    def attach(self, observer):
        if observer not in self._observers:
            self._observers.append(observer)
    
    def detach(self, observer):
        self._observers.remove(observer)
    
    def notify(self):
        for observer in self._observers:
            observer.update()

class Observer(ABC):
    @abstractmethod
    def update(self):
        pass

# Strategy Pattern (already shown in SOLID)

# Command Pattern
class Command(ABC):
    @abstractmethod
    def execute(self):
        pass

class SaveCommand(Command):
    def __init__(self, document):
        self.document = document
    
    def execute(self):
        self.document.save()

class Invoker:
    def __init__(self):
        self._history = []
    
    def execute(self, command: Command):
        command.execute()
        self._history.append(command)

# Repository Pattern
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, List, Optional

T = TypeVar('T')
ID = TypeVar('ID')

class Repository(ABC, Generic[T, ID]):
    @abstractmethod
    def save(self, entity: T) -> T:
        pass
    
    @abstractmethod
    def find_by_id(self, id: ID) -> Optional[T]:
        pass
    
    @abstractmethod
    def find_all(self) -> List[T]:
        pass
    
    @abstractmethod
    def delete(self, entity: T):
        pass

class InMemoryRepository(Repository[T, ID]):
    def __init__(self):
        self._entities = {}
    
    def save(self, entity: T) -> T:
        # Assume entity has id attribute
        self._entities[entity.id] = entity
        return entity
    
    def find_by_id(self, id: ID) -> Optional[T]:
        return self._entities.get(id)
    
    def find_all(self) -> List[T]:
        return list(self._entities.values())
    
    def delete(self, entity: T):
        if entity.id in self._entities:
            del self._entities[entity.id]
```

```python
# Testing Best Practices with pytest

import pytest
from unittest.mock import Mock, patch
from typing import List

class TestUserService:
    @pytest.fixture
    def mock_repo(self):
        return Mock()
    
    @pytest.fixture
    def mock_email(self):
        return Mock()
    
    @pytest.fixture
    def user_service(self, mock_repo, mock_email):
        from user_service import UserService  # Assuming module exists
        return UserService(mock_repo, mock_email)
    
    def test_register_user_saves_and_sends_email(self, user_service, mock_repo, mock_email):
        user = Mock()
        user.username = "testuser"
        user.email = "test@example.com"
        
        user_service.register_user(user)
        
        mock_repo.save.assert_called_once_with(user)
        mock_email.send_email.assert_called_once_with(
            "test@example.com", 
            "Welcome!",
            pytest.any(str)
        )
    
    def test_register_user_handles_repo_failure(self, user_service, mock_repo):
        user = Mock()
        mock_repo.save.side_effect = Exception("DB error")
        
        with pytest.raises(Exception):
            user_service.register_user(user)
    
    def test_register_user_does_not_send_email_on_failure(self, user_service, mock_repo, mock_email):
        user = Mock()
        mock_repo.save.side_effect = Exception("DB error")
        
        with pytest.raises(Exception):
            user_service.register_user(user)
        
        mock_email.send_email.assert_not_called()

# Property-based testing with hypothesis
from hypothesis import given, strategies as st

@given(st.lists(st.integers(min_value=1, max_value=100)))
def test_sort_preserves_elements(unsorted_list):
    sorted_list = sorted(unsorted_list)
    assert sorted(unsorted_list) == sorted_list

@given(st.text())
def test_uppercase_preserves_ascii_letters(text):
    result = text.upper()
    for char in result:
        if char.isalpha():
            assert char.isupper()

# Integration test example
class TestAPI:
    @pytest.fixture
    def client(self):
        from app import create_app
        app = create_app()
        app.config['TESTING'] = True
        with app.test_client() as client:
            yield client
    
    def test_create_user(self, client):
        response = client.post('/api/users', json={
            'username': 'testuser',
            'email': 'test@example.com'
        })
        
        assert response.status_code == 201
        data = response.get_json()
        assert 'id' in data
        assert data['username'] == 'testuser'
    
    def test_get_user(self, client):
        # First create a user
        create_response = client.post('/api/users', json={
            'username': 'existinguser',
            'email': 'existing@example.com'
        })
        user_id = create_response.get_json()['id']
        
        # Then retrieve
        response = client.get(f'/api/users/{user_id}')
        
        assert response.status_code == 200
        assert response.get_json()['username'] == 'existinguser'

# Test coverage configuration (pytest.ini or pyproject.toml)
"""
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = "-v --tb=short --cov=src --cov-report=html"
"""

# Mocking external dependencies
class WeatherService:
    def get_temperature(self, city: str) -> float:
        # Would make HTTP call in real implementation
        pass

class WeatherReporter:
    def __init__(self, weather_service: WeatherService):
        self.weather_service = weather_service
    
    def report(self, city: str) -> str:
        temp = self.weather_service.get_temperature(city)
        return f"Weather in {city}: {temp}°C"

# Fixture with mocking
@pytest.fixture
def mock_weather_service():
    service = Mock(spec=WeatherService)
    service.get_temperature.return_value = 25.0
    return service

@pytest.fixture
def reporter(mock_weather_service):
    return WeatherReporter(mock_weather_service)

def test_weather_reporter(reporter):
    result = reporter.report("London")
    assert "London" in result
    assert "25" in result
```

## Best Practices

1. **Write Tests First**: TDD leads to better design and test coverage
2. **Test Behavior, Not Implementation**: Focus on interfaces, not internals
3. **Use Mocks Appropriately**: Isolate units, don't overmock
4. **Aim for High Coverage**: But prioritize critical paths
5. **Automate Everything**: CI/CD for all tests on every commit
6. **Code Review Everyone**: Even senior engineers need review
7. **Keep PRs Small**: Easier to review, fewer bugs
8. **Document Decisions**: Architecture Decision Records (ADRs)
9. **Manage Technical Debt**: Track and repay systematically
10. **Iterate and Improve**: Continuous refinement of code and process
