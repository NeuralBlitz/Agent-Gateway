---
name: architecture
description: Software architecture patterns and best practices
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: architecture
---
## What I do
- Apply SOLID principles
- Implement clean architecture layers
- Use dependency injection
- Design for scalability and maintainability
- Choose appropriate patterns (CQRS, Event Sourcing, etc.)
- Handle cross-cutting concerns
- Design APIs and contracts
- Manage complexity through modularization

## When to use me
When designing system architecture or making architectural decisions.

## Clean Architecture Layers
```
┌─────────────────────────────────────────┐
│           Application Layer             │
│    (Use Cases, Services, Interactors)    │
├─────────────────────────────────────────┤
│           Domain Layer                  │
│      (Entities, Value Objects,         │
│       Domain Services, Aggregates)      │
├─────────────────────────────────────────┤
│         Infrastructure Layer            │
│    (Database, External Services,        │
│     File System, HTTP Clients)         │
├─────────────────────────────────────────┤
│           Presentation Layer            │
│    (API Controllers, CLI, Web UI)       │
└─────────────────────────────────────────┘

Dependency Rule: Outer layers depend on inner layers,
but inner layers know nothing about outer layers.
```

## Dependency Injection
```python
from abc import ABC, abstractmethod
from typing import Protocol


# Define contracts in inner layers
class UserRepository(Protocol):
    def find_by_id(self, id: str) -> User | None: ...
    def find_by_email(self, email: str) -> User | None: ...
    def save(self, user: User) -> None: ...


class EmailService(Protocol):
    def send(self, to: str, subject: str, body: str) -> None: ...


# Domain layer (inner) - depends on abstractions
class CreateUserUseCase:
    def __init__(
        self,
        user_repository: UserRepository,
        email_service: EmailService,
    ) -> None:
        self.user_repository = user_repository
        self.email_service = email_service

    def execute(self, input: CreateUserInput) -> User:
        existing = self.user_repository.find_by_email(input.email)
        if existing:
            raise UserAlreadyExistsError(input.email)

        user = User(
            email=input.email,
            name=input.name,
        )
        self.user_repository.save(user)

        self.email_service.send(
            to=user.email,
            subject="Welcome!",
            body=f"Hi {user.name}, welcome to our platform!",
        )

        return user


# Infrastructure layer (outer) - implements abstractions
class PostgresUserRepository:
    def __init__(self, db: Connection) -> None:
        self.db = db

    def find_by_id(self, id: str) -> User | None:
        row = self.db.execute(
            "SELECT * FROM users WHERE id = ?",
            (id,)
        ).fetchone()
        return User.from_row(row) if row else None


class SMTPEmailService:
    def send(self, to: str, subject: str, body: str) -> None:
        # Send email via SMTP
        pass


# Composition root
def create_container() -> Container:
    return Container(
        user_repository=PostgresUserRepository(db),
        email_service=SMTPEmailService(),
    )
```

## CQRS Pattern
```python
# Commands (Write)
class CreateUserCommand:
    def __init__(self, email: str, name: str) -> None:
        self.email = email
        self.name = name


class CreateUserCommandHandler:
    def __init__(self, user_repository: UserRepository) -> None:
        self.user_repository = user_repository

    def handle(self, command: CreateUserCommand) -> User:
        user = User(email=command.email, name=command.name)
        self.user_repository.save(user)
        return user


# Queries (Read)
class GetUserQuery:
    def __init__(self, user_id: str) -> None:
        self.user_id = user_id


class GetUserQueryHandler:
    def __init__(self, user_read_model: UserReadRepository) -> None:
        self.user_read_model = user_read_model

    def handle(self, query: GetUserQuery) -> UserDTO:
        return self.user_read_model.find_by_id(query.user_id)


# Dispatcher
class CommandDispatcher:
    def __init__(self, container: Container) -> None:
        self.handlers: dict[type, Callable] = {}

    def register(self, command_type: type, handler: Callable) -> None:
        self.handlers[command_type] = handler

    def dispatch(self, command: Command) -> Any:
        handler = self.handlers[type(command)]
        return handler(command)
```

## Event Sourcing
```python
# Events
class UserEvent:
    def __init__(self, user_id: str, timestamp: datetime) -> None:
        self.user_id = user_id
        self.timestamp = timestamp


class UserCreatedEvent(UserEvent):
    def __init__(self, user_id: str, email: str, name: str) -> None:
        super().__init__(user_id, datetime.now())
        self.email = email
        self.name = name


class UserEmailChangedEvent(UserEvent):
    def __init__(self, user_id: str, old_email: str, new_email: str) -> None:
        super().__init__(user_id, datetime.now())
        self.old_email = old_email
        self.new_email = new_email


# Aggregate
class UserAggregate:
    def __init__(self, user_id: str) -> None:
        self.user_id = user_id
        self._events: list[UserEvent] = []
        self._version = 0

    def create(self, email: str, name: str) -> None:
        self._events.append(
            UserCreatedEvent(self.user_id, email, name)
        )

    def change_email(self, new_email: str) -> None:
        old_email = getattr(self, '_email', None)
        self._events.append(
            UserEmailChangedEvent(self.user_id, old_email, new_email)
        )

    def apply(self, event: UserEvent) -> None:
        # Apply event to state
        self._version += 1
        if isinstance(event, UserCreatedEvent):
            self._email = event.email
            self._name = event.name
        elif isinstance(event, UserEmailChangedEvent):
            self._email = event.new_email

    def get_events(self) -> list[UserEvent]:
        return self._events.copy()


# Event Store
class EventStore:
    def append(self, event: UserEvent) -> None:
        db.events.insert(event.to_dict())

    def get_events(self, aggregate_id: str) -> list[UserEvent]:
        rows = db.events.find(aggregate_id=aggregate_id)
        return [UserEvent.from_row(row) for row in rows]
```
