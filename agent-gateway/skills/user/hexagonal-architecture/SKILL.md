---
name: hexagonal-architecture
description: Hexagonal architecture patterns and implementation
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: architecture
---
## What I do
- Design ports and adapters architecture
- Implement domain-driven design
- Create dependency inversion layers
- Structure applications for testability
- Handle external dependencies
- Design clear boundaries
- Implement application services
- Manage domain models

## When to use me
When designing application architecture or refactoring to hexagonal architecture.

## Hexagonal Architecture Overview
```
┌─────────────────────────────────────────────────────────────────┐
│                     External Layers                              │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Web/API   │  │   CLI       │  │   Tests     │            │
│  │  Adapters   │  │  Adapter    │  │  Adapters   │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          │                                      │
│              ┌───────────▼───────────┐                          │
│              │      Adapters          │                          │
│              │  (Infrastructure)      │                          │
│              └───────────┬───────────┘                          │
│                          │                                       │
├──────────────────────────┼──────────────────────────────────────┤
│           Application    │    Domain Layer                       │
│                          │                                       │
│  ┌───────────────────────▼───────────────────────┐              │
│  │              Ports (Interfaces)               │              │
│  │                                              │              │
│  │  Inbound Ports:     │    Outbound Ports:      │              │
│  │  - Use Cases       │    - Repositories       │              │
│  │  - Services       │    - External Services   │              │
│  │                   │    - Event Publishers   │              │
│  └───────────────────┼─────────────────────────┘              │
│                      │                                          │
│       ┌──────────────▼──────────────┐                           │
│       │      Domain Models         │                            │
│       │                            │                            │
│       │  - Entities                │                            │
│       │  - Value Objects           │                            │
│       │  - Aggregates              │                            │
│       │  - Domain Events           │                            │
│       │  - Domain Services         │                            │
│       └────────────────────────────┘                            │
│                                                                  │
├────────────────────────────────────────────────────────────────┤
│                     External Systems                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Database   │  │   Cache     │  │   APIs      │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└────────────────────────────────────────────────────────────────┘
```

## Domain Layer
```python
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional
from abc import ABC, abstractmethod
import uuid


# Value Objects
@dataclass(frozen=True)
class Email:
    """Email value object."""
    value: str
    
    def __post_init__(self):
        if '@' not in self.value:
            raise ValueError(f"Invalid email: {self.value}")


@dataclass(frozen=True)
class Money:
    """Money value object with currency."""
    amount: float
    currency: str
    
    def __post_init__(self):
        if self.amount < 0:
            raise ValueError("Amount cannot be negative")
    
    def add(self, other: 'Money') -> 'Money':
        if self.currency != other.currency:
            raise ValueError("Cannot add different currencies")
        return Money(self.amount + other.amount, self.currency)


# Entities
class User:
    """User entity with identity and behavior."""
    
    def __init__(
        self,
        email: Email,
        name: str,
        id: str = None,
        created_at: datetime = None,
    ):
        self.id = id or str(uuid.uuid4())
        self._email = email
        self.name = name
        self.created_at = created_at or datetime.utcnow()
        self._events: List[DomainEvent] = []
    
    @property
    def email(self) -> Email:
        return self._email
    
    def change_email(self, new_email: Email) -> None:
        """Change email with validation."""
        if new_email == self._email:
            return
        
        self._email = new_email
        self._events.append(UserEmailChanged(self.id, new_email))
    
    def pull_events(self) -> List[DomainEvent]:
        """Get domain events."""
        events = self._events.copy()
        self._events.clear()
        return events


# Domain Events
class DomainEvent:
    """Base domain event."""
    
    def __init__(self, aggregate_id: str):
        self.aggregate_id = aggregate_id
        self.occurred_at = datetime.utcnow()


class UserCreated(DomainEvent):
    """User was created."""
    
    def __init__(self, user_id: str, email: Email, name: str):
        super().__init__(user_id)
        self.email = email
        self.name = name


class UserEmailChanged(DomainEvent):
    """User email was changed."""
    
    def __init__(self, user_id: str, new_email: Email):
        super().__init__(user_id)
        self.new_email = new_email


# Aggregates
class Order:
    """Order aggregate root."""
    
    def __init__(
        self,
        user: User,
        items: List['OrderItem'],
        id: str = None,
    ):
        self.id = id or str(uuid.uuid4())
        self.user = user
        self.items = items
        self.status = OrderStatus.DRAFT
        self.created_at = datetime.utcnow()
        self._events: List[DomainEvent] = []
    
    @property
    def total(self) -> Money:
        """Calculate order total."""
        total = sum(item.price.amount for item in self.items)
        return Money(total, 'USD')
    
    def submit(self) -> None:
        """Submit order."""
        if not self.items:
            raise ValueError("Cannot submit empty order")
        
        self.status = OrderStatus.SUBMITTED
        self._events.append(OrderSubmitted(self.id))
    
    def pull_events(self) -> List[DomainEvent]:
        events = self._events.copy()
        self._events.clear()
        return events


@dataclass
class OrderItem:
    """Order item value object."""
    product_id: str
    name: str
    quantity: int
    price: Money


class OrderStatus:
    """Order status enum."""
    DRAFT = "draft"
    SUBMITTED = "submitted"
    PAID = "paid"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
```

## Ports (Interfaces)
```python
from abc import ABC
from typing import List, Optional


# Inbound Ports (Application Services)
class UserServicePort(ABC):
    """Inbound port for user operations."""
    
    @abstractmethod
    def create_user(self, email: str, name: str) -> User:
        """Create a new user."""
        pass
    
    @abstractmethod
    def get_user(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        pass
    
    @abstractmethod
    def change_user_email(
        self,
        user_id: str,
        new_email: str
    ) -> User:
        """Change user email."""
        pass


# Outbound Ports (Repositories)
class UserRepositoryPort(ABC):
    """Outbound port for user persistence."""
    
    @abstractmethod
    def save(self, user: User) -> User:
        """Save user."""
        pass
    
    @abstractmethod
    def find_by_id(self, user_id: str) -> Optional[User]:
        """Find user by ID."""
        pass
    
    @abstractmethod
    def exists_by_email(self, email: Email) -> bool:
        """Check if email exists."""
        pass


# Outbound Ports (External Services)
class EmailServicePort(ABC):
    """Outbound port for sending emails."""
    
    @abstractmethod
    def send_email(
        self,
        to: Email,
        subject: str,
        body: str
    ) -> None:
        """Send email."""
        pass


# Outbound Ports (Event Publishing)
class EventPublisherPort(ABC):
    """Outbound port for publishing domain events."""
    
    @abstractmethod
    def publish(self, event: DomainEvent) -> None:
        """Publish domain event."""
        pass
    
    @abstractmethod
    def publish_all(self, events: List[DomainEvent]) -> None:
        """Publish multiple events."""
        pass
```

## Application Service
```python
from dataclasses import dataclass


@dataclass
class CreateUserInput:
    """Input for creating a user."""
    email: str
    name: str


@dataclass
class ChangeEmailInput:
    """Input for changing email."""
    user_id: str
    new_email: str


class UserApplicationService:
    """
    Application service implementing UserServicePort.
    
    Coordinates between inbound ports (use cases) and 
    outbound ports (infrastructure).
    """
    
    def __init__(
        self,
        user_repository: UserRepositoryPort,
        email_service: EmailServicePort,
        event_publisher: EventPublisherPort,
    ):
        self.user_repository = user_repository
        self.email_service = email_service
        self.event_publisher = event_publisher
    
    def create_user(self, input: CreateUserInput) -> User:
        """Create a new user."""
        # Validate email doesn't exist
        email = Email(input.email)
        if self.user_repository.exists_by_email(email):
            raise ValueError(f"Email already exists: {input.email}")
        
        # Create user (domain logic)
        user = User(
            email=email,
            name=input.name,
        )
        
        # Save to persistence (through port)
        saved_user = self.user_repository.save(user)
        
        # Get domain events
        events = saved_user.pull_events()
        
        # Publish events (through port)
        self.event_publisher.publish_all(events)
        
        # Send welcome email (through port)
        self.email_service.send_email(
            to=email,
            subject="Welcome!",
            body=f"Hi {input.name}, welcome to our platform!"
        )
        
        return saved_user
    
    def change_user_email(
        self,
        input: ChangeEmailInput
    ) -> User:
        """Change user email."""
        # Get user
        user = self.user_repository.find_by_id(input.user_id)
        if not user:
            raise ValueError(f"User not found: {input.user_id}")
        
        # Validate new email
        new_email = Email(input.new_email)
        if self.user_repository.exists_by_email(new_email):
            raise ValueError(f"Email already exists: {input.new_email}")
        
        # Change email (domain logic)
        user.change_email(new_email)
        
        # Save
        saved_user = self.user_repository.save(user)
        
        # Publish events
        events = saved_user.pull_events()
        self.event_publisher.publish_all(events)
        
        return saved_user
    
    def get_user(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        return self.user_repository.find_by_id(user_id)
```

## Adapters
```python
from sqlalchemy.orm import Session


# Database Adapter (Implements UserRepositoryPort)
class SQLUserRepository(UserRepositoryPort):
    """SQLAlchemy implementation of user repository."""
    
    def __init__(self, session: Session):
        self.session = session
    
    def save(self, user: User) -> User:
        """Save user to database."""
        from infrastructure.persistence.user_entity import UserEntity
        
        # Convert domain to entity
        entity = UserEntity.from_domain(user)
        
        self.session.add(entity)
        self.session.commit()
        self.session.refresh(entity)
        
        return entity.to_domain()
    
    def find_by_id(self, user_id: str) -> Optional[User]:
        """Find user by ID."""
        from infrastructure.persistence.user_entity import UserEntity
        
        entity = self.session.query(UserEntity).filter(
            UserEntity.id == user_id
        ).first()
        
        return entity.to_domain() if entity else None
    
    def exists_by_email(self, email: Email) -> bool:
        """Check if email exists."""
        from infrastructure.persistence.user_entity import UserEntity
        
        count = self.session.query(UserEntity).filter(
            UserEntity.email == email.value
        ).count()
        
        return count > 0


# Email Adapter (Implements EmailServicePort)
class SMTPEmailService(EmailServicePort):
    """SMTP implementation of email service."""
    
    def __init__(self, smtp_host: str, smtp_port: int):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
    
    def send_email(
        self,
        to: Email,
        subject: str,
        body: str
    ) -> None:
        """Send email via SMTP."""
        import smtplib
        from email.mime.text import MIMEText
        
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = "noreply@example.com"
        msg['To'] = to.value
        
        with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
            server.send_message(msg)


# HTTP Adapter (Inbound Adapter)
from fastapi import FastAPI, Depends


app = FastAPI()


def get_user_service() -> UserApplicationService:
    """Get user service from DI container."""
    # In production, use proper DI container
    from main import container
    return container.resolve(UserApplicationService)


@app.post("/users")
def create_user(
    input: CreateUserInput,
    service: UserApplicationService = Depends(get_user_service)
):
    """Create user via HTTP."""
    try:
        user = service.create_user(input)
        return {"id": user.id, "email": user.email.value}
    except ValueError as e:
        return {"error": str(e)}, 400
```

## Dependency Injection Setup
```python
from dependency_injector import containers, providers


class Container(containers.DeclarativeContainer):
    """DI container for the application."""
    
    # Configuration
    config = providers.Configuration()
    
    # Database
    database_session = providers.Singleton(
        create_database_session,
        url=config.database.url,
    )
    
    # Repositories
    user_repository = providers.Factory(
        SQLUserRepository,
        session=database_session,
    )
    
    # Services
    email_service = providers.Singleton(
        SMTPEmailService,
        smtp_host=config.email.smtp_host,
        smtp_port=config.email.smtp_port,
    )
    
    event_publisher = providers.Singleton(
        KafkaEventPublisher,
        bootstrap_servers=config.kafka.servers,
    )
    
    # Application Services
    user_service = providers.Factory(
        UserApplicationService,
        user_repository=user_repository,
        email_service=email_service,
        event_publisher=event_publisher,
    )


# Bootstrap
def create_container() -> Container:
    container = Container()
    container.config.from_yaml("config.yaml")
    return container
```

## Best Practices
```
1. Keep domain pure
   No dependencies on infrastructure
   No I/O in domain models

2. Define clear ports
   Separate inbound (use cases) from outbound (persistence)

3. Invert dependencies
   Domain depends on abstractions
   Infrastructure depends on domain

4. Aggregate design
   One aggregate root per transaction
   References by ID only

5. Domain events
   Capture state changes as events
   Decouple through events

6. Application services
   Orchestrate domain objects
   Handle transactions

7. Testability
   Mock all outbound ports
   Test domain logic in isolation

8. Single responsibility
   Each port has one purpose
   Each adapter implements one port
```
