---
name: Hexagonal Architecture
description: Port and adapter pattern for separating core business logic from external concerns
category: software-development
---
# Hexagonal Architecture

## What I do

I provide a layered architecture that separates application core from external dependencies. Hexagonal architecture (Ports and Adapters) puts business logic at the center, with ports defining interfaces for incoming and outgoing interactions. Adapters implement these ports, translating between external formats and internal domain objects. This creates a system that is flexible, testable, and independent of frameworks, databases, or external services.

## When to use me

Use hexagonal architecture for applications that need to be flexible about their dependencies, when you want to isolate business logic from infrastructure, or when different adapters might be needed for different deployment scenarios. It's ideal for long-lived applications where frameworks or databases might change. Perfect for testing scenarios where you want to mock external dependencies completely. Avoid for simple scripts or throwaway prototypes.

## Core Concepts

- **Domain/Core**: Pure business logic with no dependencies
- **Ports**: Interfaces defining inbound/outbound contracts
- **Adapters**: Implementations of ports for specific technologies
- **Primary/Driving Adapters**: Initiate actions (HTTP, CLI, GUI)
- **Secondary/Driven Adapters**: Handle outputs (DB, email, external APIs)
- **Dependency Inversion**: Core depends on abstractions, not implementations
- **Application Services**: Use cases coordinating domain objects
- **Domain Services**: Business logic spanning multiple entities
- **DTOs**: Data transfer objects for adapter boundaries
- **Mappers**: Convert between DTOs and domain objects

## Code Examples

### Core Domain

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Protocol
from uuid import UUID, uuid4

class User:
    def __init__(self, user_id: UUID, email: str, name: str):
        self._id = user_id
        self._email = email
        self._name = name
        self._created_at = datetime.utcnow()
        self._is_active = True
    
    @property
    def id(self) -> UUID:
        return self._id
    
    @property
    def email(self) -> str:
        return self._email
    
    @property
    def name(self) -> str:
        return self._name
    
    @property
    def is_active(self) -> bool:
        return self._is_active
    
    def activate(self) -> None:
        self._is_active = True
    
    def deactivate(self) -> None:
        self._is_active = False

class UserRepository(Protocol):
    @abstractmethod
    def save(self, user: User) -> None:
        pass
    
    @abstractmethod
    def find_by_id(self, user_id: UUID) -> User | None:
        pass
    
    @abstractmethod
    def find_by_email(self, email: str) -> User | None:
        pass
    
    @abstractmethod
    def find_all_active(self) -> list[User]:
        pass

class UserService:
    def __init__(self, user_repository: UserRepository):
        self._repository = user_repository
    
    def create_user(self, email: str, name: str) -> User:
        if self._repository.find_by_email(email):
            raise ValueError(f"Email {email} already exists")
        
        user = User(user_id=uuid4(), email=email, name=name)
        self._repository.save(user)
        return user
    
    def activate_user(self, user_id: UUID) -> User:
        user = self._repository.find_by_id(user_id)
        if not user:
            raise ValueError(f"User {user_id} not found")
        user.activate()
        self._repository.save(user)
        return user
    
    def get_active_users(self) -> list[User]:
        return self._repository.find_all_active()
```

### Ports (Interfaces)

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Protocol
from uuid import UUID

# Inbound Ports (Application Services)
class CreateUserUseCase(Protocol):
    def execute(self, command: 'CreateUserCommand') -> 'UserResponse':
        pass

class GetUserUseCase(Protocol):
    def execute(self, user_id: UUID) -> 'UserResponse | None':
        pass

class ListUsersUseCase(Protocol):
    def execute(self) -> list['UserResponse']:
        pass

# Outbound Ports (Infrastructure Contracts)
class UserPersistencePort(Protocol):
    @abstractmethod
    def save(self, user: User) -> None:
        pass
    
    @abstractmethod
    def find_by_id(self, user_id: UUID) -> User | None:
        pass
    
    @abstractmethod
    def find_by_email(self, email: str) -> User | None:
        pass
    
    @abstractmethod
    def find_all_active(self) -> list[User]:
        pass

class EmailNotificationPort(Protocol):
    @abstractmethod
    def send_welcome_email(self, user: User) -> None:
        pass
    
    @abstractmethod
    def send_activation_email(self, user: User) -> None:
        pass

# DTOs
@dataclass
class CreateUserCommand:
    email: str
    name: str
    send_welcome_email: bool = True

@dataclass
class UserResponse:
    user_id: UUID
    email: str
    name: str
    created_at: datetime
    is_active: bool
```

### Application Services

```python
class UserApplicationService:
    def __init__(
        self,
        user_repository: UserPersistencePort,
        email_service: EmailNotificationPort
    ):
        self._repository = user_repository
        self._email = email_service
    
    def create_user(self, command: CreateUserCommand) -> UserResponse:
        if self._repository.find_by_email(command.email):
            raise ValueError(f"Email {command.email} already exists")
        
        user = User(
            user_id=uuid4(),
            email=command.email,
            name=command.name
        )
        self._repository.save(user)
        
        if command.send_welcome_email:
            self._email.send_welcome_email(user)
        
        return self._to_response(user)
    
    def get_user(self, user_id: UUID) -> UserResponse | None:
        user = self._repository.find_by_id(user_id)
        if not user:
            return None
        return self._to_response(user)
    
    def list_users(self) -> list[UserResponse]:
        users = self._repository.find_all_active()
        return [self._to_response(u) for u in users]
    
    def activate_user(self, user_id: UUID) -> UserResponse:
        user = self._repository.find_by_id(user_id)
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        user.activate()
        self._repository.save(user)
        self._email.send_activation_email(user)
        
        return self._to_response(user)
    
    def _to_response(self, user: User) -> UserResponse:
        return UserResponse(
            user_id=user.id,
            email=user.email,
            name=user.name,
            created_at=user._created_at,
            is_active=user.is_active
        )
```

### Adapters (Infrastructure)

```python
from dataclasses import dataclass
from datetime import datetime
from typing import Protocol, Optional
from uuid import UUID, uuid4

# In-Memory Adapter
class InMemoryUserRepository(UserPersistencePort):
    def __init__(self):
        self._users: dict[UUID, User] = {}
    
    def save(self, user: User) -> None:
        self._users[user.id] = user
    
    def find_by_id(self, user_id: UUID) -> Optional[User]:
        return self._users.get(user_id)
    
    def find_by_email(self, email: str) -> Optional[User]:
        for user in self._users.values():
            if user.email == email:
                return user
        return None
    
    def find_all_active(self) -> list[User]:
        return [u for u in self._users.values() if u.is_active]

# Email Adapter
class ConsoleEmailAdapter(EmailNotificationPort):
    def send_welcome_email(self, user: User) -> None:
        print(f"[EMAIL] Welcome to {user.email}!")
    
    def send_activation_email(self, user: User) -> None:
        print(f"[EMAIL] Account activated for {user.email}")

# SQL Adapter (Example)
class SQLUserRepository(UserPersistencePort):
    def __init__(self, session_factory):
        self._session_factory = session_factory
    
    def save(self, user: User) -> None:
        session = self._session_factory()
        session.add(self._to_orm(user))
        session.commit()
    
    def find_by_id(self, user_id: UUID) -> Optional[User]:
        session = self._session_factory()
        orm_user = session.query(UserORM).filter_by(id=user_id).first()
        return self._from_orm(orm_user) if orm_user else None
    
    def find_by_email(self, email: str) -> Optional[User]:
        session = self._session_factory()
        orm_user = session.query(UserORM).filter_by(email=email).first()
        return self._from_orm(orm_user) if orm_user else None
    
    def find_all_active(self) -> list[User]:
        session = self._session_factory()
        orm_users = session.query(UserORM).filter_by(is_active=True).all()
        return [self._from_orm(u) for u in orm_users]
    
    def _to_orm(self, user: User) -> 'UserORM':
        return UserORM(
            id=user.id,
            email=user.email,
            name=user.name,
            is_active=user.is_active
        )
    
    def _from_orm(self, orm_user: 'UserORM') -> User:
        return User(
            user_id=orm_user.id,
            email=orm_user.email,
            name=orm_user.name
        )

@dataclass
class UserORM:
    id: UUID
    email: str
    name: str
    is_active: bool
```

### HTTP Adapter (FastAPI)

```python
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import list
from uuid import UUID

app = FastAPI(title="User Service API")

class CreateUserRequest(BaseModel):
    email: EmailStr
    name: str
    send_welcome_email: bool = True

class UserResponse(BaseModel):
    user_id: UUID
    email: EmailStr
    name: str
    is_active: bool

def get_user_service():
    from main import container
    return container.resolve(UserApplicationService)

@app.post("/users", response_model=UserResponse)
async def create_user(
    request: CreateUserRequest,
    service=Depends(get_user_service)
):
    try:
        command = CreateUserCommand(
            email=request.email,
            name=request.name,
            send_welcome_email=request.send_welcome_email
        )
        return service.create_user(command)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    service=Depends(get_user_service)
):
    user = service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/users", response_model=list[UserResponse])
async def list_users(service=Depends(get_user_service)):
    return service.list_users()

@app.post("/users/{user_id}/activate", response_model=UserResponse)
async def activate_user(
    user_id: UUID,
    service=Depends(get_user_service)
):
    try:
        return service.activate_user(user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
```

### Dependency Injection Container

```python
from typing import Protocol, Type, TypeVar, get_origin, get_args

T = TypeVar("T")

class Container:
    def __init__(self):
        self._bindings: dict[Type, object] = {}
        self._singletons: dict[Type, object] = {}
    
    def bind(self, abstract: Type[T], concrete: Type[T]) -> None:
        self._bindings[abstract] = concrete
    
    def singleton(self, abstract: Type[T], concrete: Type[T]) -> None:
        self._singletons[abstract] = None
        self._bindings[abstract] = concrete
    
    def resolve(self, abstract: Type[T]) -> T:
        if abstract in self._singletons:
            if self._singletons[abstract] is None:
                self._singletons[abstract] = self._build(abstract)
            return self._singletons[abstract]
        return self._build(abstract)
    
    def _build(self, abstract: Type[T]) -> T:
        if abstract not in self._bindings:
            if not isinstance(abstract, type):
                return abstract
            raise ValueError(f"No binding for {abstract}")
        
        concrete = self._bindings[abstract]
        
        if hasattr(concrete, '__init__'):
            params = self._get_init_params(concrete)
            deps = {param: self.resolve(param_type) for param, param_type in params.items()}
            return concrete(**deps)
        
        return concrete
    
    def _get_init_params(self, cls: Type) -> dict[str, Type]:
        import inspect
        sig = inspect.signature(cls.__init__)
        return {
            name: param.annotation
            for name, param in sig.parameters.items()
            if name != 'self' and param.annotation != inspect.Parameter.empty
        }

# Setup container
container = Container()
container.singleton(UserPersistencePort, InMemoryUserRepository)
container.singleton(EmailNotificationPort, ConsoleEmailAdapter)
container.singleton(UserApplicationService, UserApplicationService)

# For HTTP adapter
def get_container():
    return container

def get_service():
    return container.resolve(UserApplicationService)
```

## Best Practices

1. **Keep Core Pure**: Domain should have no external dependencies
2. **Define Clear Ports**: Interfaces should be focused and small
3. **Adapter per Concern**: Separate adapters for different technologies
4. **Use Dependency Injection**: Let framework assemble components
5. **Test Core in Isolation**: Mock all ports for domain tests
6. **Test Adapters Separately**: Integration tests for each adapter
7. **Configure in Entry Point**: Setup bindings in main/application
8. **Avoid Leaking Abstractions**: Ports should be in core, not adapters
9. **Multiple Implementations**: Support different environments (dev/test/prod)
10. **Clean Boundaries**: DTOs for all external communication
11. **Frameagnostic Core**: Core should not import framework code
12. **Evolve Ports Carefully**: Changing ports affects all adapters
