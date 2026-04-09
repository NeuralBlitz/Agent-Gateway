---
name: dependency-injection
description: Dependency injection patterns and implementation
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: patterns
---
## What I do
- Implement dependency injection
- Design loosely coupled systems
- Create inversion of control containers
- Manage service lifetimes
- Handle circular dependencies
- Configure dependency scopes
- Implement constructor injection
- Use DI for testing

## When to use me
When implementing dependency injection or improving testability.

## Dependency Injection Basics
```python
from abc import ABC, abstractmethod
from typing import Type, TypeVar, Generic, Dict, Any


T = TypeVar('T')


class DependencyContainer:
    """Simple dependency injection container."""
    
    def __init__(self):
        self._services: Dict[Type, Any] = {}
        self._singletons: Dict[Type, Any] = {}
    
    def register(
        self,
        interface: Type[T],
        implementation: Type[T],
        singleton: bool = False
    ) -> None:
        """Register a dependency."""
        self._services[interface] = (implementation, singleton)
    
    def resolve(self, interface: Type[T]) -> T:
        """Resolve a dependency."""
        if interface not in self._services:
            raise DependencyNotFoundError(interface)
        
        implementation, is_singleton = self._services[interface]
        
        if is_singleton:
            if interface not in self._singletons:
                self._singletons[interface] = implementation()
            return self._singletons[interface]
        
        return implementation()


# Example: Before (tight coupling)
class UserService:
    def __init__(self):
        self.repository = UserRepository()
        self.logger = Logger()
        self.cache = RedisCache()


# Example: After (dependency injection)
class UserService:
    def __init__(
        self,
        repository: UserRepositoryInterface,
        logger: LoggerInterface,
        cache: CacheInterface
    ):
        self.repository = repository
        self.logger = logger
        self.cache = cache
```

## Interface-Based Design
```python
from abc import ABC, abstractmethod
from typing import Protocol, runtimeruntime_checkable
_checkable


@class UserRepositoryProtocol(Protocol):
    """Protocol for user repository."""
    
    @abstractmethod
    def get_by_id(self, user_id: str) -> 'User':
        pass
    
    @abstractmethod
    def get_by_email(self, email: str) -> 'User':
        pass
    
    @abstractmethod
    def save(self, user: 'User') -> None:
        pass


class UserRepository(UserRepositoryProtocol):
    """Concrete implementation of user repository."""
    
    def __init__(self, db_session):
        self.session = db_session
    
    def get_by_id(self, user_id: str) -> 'User':
        return self.session.query(User).get(user_id)
    
    def get_by_email(self, email: str) -> 'User':
        return self.session.query(User).filter_by(email=email).first()
    
    def save(self, user: 'User') -> None:
        self.session.add(user)
        self.session.commit()


class LoggerProtocol(Protocol):
    """Protocol for logging."""
    
    @abstractmethod
    def info(self, message: str) -> None:
        pass
    
    @abstractmethod
    def error(self, message: str) -> None:
        pass


class StdOutLogger:
    """Stdout logger implementation."""
    
    def info(self, message: str) -> None:
        print(f"[INFO] {message}")
    
    def error(self, message: str) -> None:
        print(f"[ERROR] {message}")
```

## Constructor Injection
```python
from dataclasses import dataclass


@dataclass
class CreateUserInput:
    """Input for creating a user."""
    email: str
    name: str
    password: str


class UserApplicationService:
    """Application service with dependencies."""
    
    def __init__(
        self,
        user_repository: UserRepositoryProtocol,
        email_service: 'EmailServiceProtocol',
        password_hasher: 'PasswordHasherProtocol',
        logger: LoggerProtocol,
    ):
        self.user_repository = user_repository
        self.email_service = email_service
        self.password_hasher = password_hasher
        self.logger = logger
    
    def create_user(self, input: CreateUserInput) -> 'User':
        """Create a new user."""
        # Validate
        if self.user_repository.get_by_email(input.email):
            raise UserAlreadyExistsError(input.email)
        
        # Hash password
        hashed_password = self.password_hasher.hash(input.password)
        
        # Create user
        user = User(
            email=input.email,
            name=input.name,
            password_hash=hashed_password,
        )
        
        # Persist
        self.user_repository.save(user)
        
        # Send welcome email
        self.email_service.send_welcome(input.email, input.name)
        
        # Log
        self.logger.info(f"User created: {user.id}")
        
        return user
    
    def get_user(self, user_id: str) -> 'User':
        """Get user by ID."""
        user = self.user_repository.get_by_id(user_id)
        
        if not user:
            raise UserNotFoundError(user_id)
        
        return user
```

## Method and Property Injection
```python
class OrderProcessor:
    """Order processor with method injection."""
    
    def __init__(self):
        self._logger = None
    
    def inject_logger(self, logger: LoggerProtocol) -> None:
        """Method injection for logger."""
        self._logger = logger
    
    @property
    def logger(self) -> LoggerProtocol:
        """Property with lazy initialization."""
        if self._logger is None:
            self._logger = DefaultLogger()
        return self._logger
    
    def process_order(self, order: 'Order') -> None:
        """Process order."""
        self.logger.info(f"Processing order: {order.id}")
        # Process logic...


# Context manager injection
class ServiceScope:
    """Context manager for dependency scope."""
    
    def __init__(self, container: DependencyContainer):
        self.container = container
        self._overrides = {}
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        pass
    
    def register_override(self, interface: Type, instance: Any) -> 'ServiceScope':
        """Register override for scope."""
        self._overrides[interface] = instance
        return self
    
    def resolve(self, interface: Type[T]) -> T:
        """Resolve with overrides."""
        if interface in self._overrides:
            return self._overrides[interface]
        return self.container.resolve(interface)


# Usage
with ServiceScope(container) as scope:
    mock_logger = MockLogger()
    
    scope.register_override(LoggerProtocol, mock_logger)
    
    processor = scope.resolve(OrderProcessor)
```

## Advanced Patterns
```python
from typing import Callable, TypeVar, Generic


T = TypeVar('T')


class Factory:
    """Factory pattern for creating instances."""
    
    def __init__(self, container: DependencyContainer):
        self.container = container
    
    def create_user_repository(self) -> UserRepository:
        """Factory method."""
        return UserRepository(
            db_session=self.container.resolve(DatabaseSession)
        )


class LazyProxy(Generic[T]):
    """Lazy proxy for deferred dependency resolution."""
    
    def __init__(self, interface: Type[T]):
        self._interface = interface
        _resolved: T = None
        _instance: T = None
    
    def _get_instance(self) -> T:
        if self._instance is None:
            self._instance = container.resolve(self._interface)
        return self._instance
    
    def __getattr__(self, name: str) -> Any:
        return getattr(self._get_instance(), name)
    
    def __call__(self, *args, **kwargs) -> Any:
        return self._get_instance()(*args, **kwargs)


# Decorator-based injection
def inject(interface: Type[T]) -> Callable:
    """Decorator to inject dependency."""
    def decorator(func: Callable) -> Callable:
        def wrapper(*args, **kwargs):
            # Get container from context
            container = get_container()
            
            # Resolve dependency
            instance = container.resolve(interface)
            
            # Call function with injected instance
            return func(instance, *args, **kwargs)
        
        return wrapper
    return decorator


# Usage
@inject(LoggerProtocol)
def process_order(order: Order, logger: LoggerProtocol):
    """Function with injected logger."""
    logger.info(f"Processing order: {order.id}")
```

## Lifecycle Management
```python
from enum import Enum
from dataclasses import dataclass
from typing import Any, Callable


class ServiceLifetime(Enum):
    """Service lifetime options."""
    TRANSIENT = "transient"      # New instance each time
    SCOPED = "scoped"             # One instance per scope
    SINGLETON = "singleton"       # One instance globally


@dataclass
class ServiceDescriptor:
    """Service registration descriptor."""
    interface: Type
    implementation: Type
    lifetime: ServiceLifetime


class ServiceCollection:
    """Service registration collection."""
    
    def __init__(self):
        self._descriptors: list[ServiceDescriptor] = []
    
    def add(
        self,
        interface: Type[T],
        implementation: Type[T],
        lifetime: ServiceLifetime = ServiceLifetime.TRANSIENT
    ) -> 'ServiceCollection':
        """Add service registration."""
        self._descriptors.append(
            ServiceDescriptor(interface, implementation, lifetime)
        )
        return self
    
    def add_transient(
        self,
        interface: Type[T],
        implementation: Type[T]
    ) -> 'ServiceCollection':
        """Add transient service."""
        return self.add(interface, implementation, ServiceLifetime.TRANSIENT)
    
    def add_scoped(
        self,
        interface: Type[T],
        implementation: Type[T]
    ) -> 'ServiceCollection':
        """Add scoped service."""
        return self.add(interface, implementation, ServiceLifetime.SCOPED)
    
    def add_singleton(
        self,
        interface: Type[T],
        implementation: Type[T]
    ) -> 'ServiceCollection':
        """Add singleton service."""
        return self.add(interface, implementation, ServiceLifetime.SINGLETON)


class ServiceProvider:
    """Service provider for resolving services."""
    
    def __init__(self, collection: ServiceCollection):
        self.collection = collection
        self._singletons: Dict[Type, Any] = {}
        self._scoped: Dict[str, Dict[Type, Any]] = {}
        self._current_scope_id = None
    
    def create_scope(self) -> 'ServiceScope':
        """Create new service scope."""
        scope_id = str(id(self))
        self._scoped[scope_id] = {}
        
        return ServiceScope(self, scope_id)
    
    def resolve(self, interface: Type[T]) -> T:
        """Resolve service instance."""
        descriptor = self._find_descriptor(interface)
        
        if not descriptor:
            raise DependencyNotFoundError(interface)
        
        return self._create_instance(descriptor)
    
    def _find_descriptor(self, interface: Type) -> ServiceDescriptor:
        """Find service descriptor."""
        for desc in self._descriptors:
            if desc.interface == interface:
                return desc
        return None
    
    def _create_instance(self, descriptor: ServiceDescriptor) -> Any:
        """Create service instance based on lifetime."""
        if descriptor.lifetime == ServiceLifetime.SINGLETON:
            return self._get_singleton(descriptor)
        elif descriptor.lifetime == ServiceLifetime.SCOPED:
            return self._get_scoped(descriptor)
        else:  # TRANSIENT
            return self._create_impl(descriptor.implementation)
    
    def _get_singleton(self, descriptor: ServiceDescriptor) -> Any:
        """Get or create singleton."""
        if descriptor.interface not in self._singletons:
            self._singletons[descriptor.interface] = (
                self._create_impl(descriptor.implementation)
            )
        return self._singletons[descriptor.interface]
    
    def _get_scoped(self, descriptor: ServiceDescriptor) -> Any:
        """Get or create scoped instance."""
        if self._current_scope_id is None:
            raise NoActiveScopeError()
        
        scope = self._scoped[self._current_scope_id]
        
        if descriptor.interface not in scope:
            scope[descriptor.interface] = (
                self._create_impl(descriptor.implementation)
            )
        return scope[descriptor.interface]
    
    def _create_impl(self, implementation: Type) -> Any:
        """Create implementation instance."""
        # Get constructor
        constructor = implementation.__init__
        
        # Get parameter types
        import inspect
        sig = inspect.signature(constructor)
        
        # Resolve dependencies
        args = []
        for param_name, param in sig.parameters.items():
            if param_name == 'self':
                continue
            if param.annotation != param.empty:
                instance = self.resolve(param.annotation)
                args.append(instance)
            elif param.default == param.empty:
                raise MissingDependencyError(param_name)
        
        return constructor(*args)
```

## Best Practices
```
Dependency Injection Best Practices:

1. Use constructor injection
   Most common pattern
   Makes dependencies explicit

2. Program to interfaces
   Define contracts
   Don't depend on implementations

3. Use appropriate lifetime
   Singleton for stateless services
   Scoped for user-specific
   Transient for stateless operations

4. Avoid service locator
   Don't use container as service locator
   Makes dependencies implicit

5. Handle disposal
   Implement IDisposable when needed
   Clean up resources

6. Avoid circular dependencies
   Refactor to break cycles
   Use property injection

7. Use DI container
   Don't roll your own in production
   Use established frameworks

8. Test with mocks
   Easy to substitute implementations
   Improves testability

9. Configure at composition root
   Configure once at startup
   Keep composition simple

10. Consider lazy initialization
     Defer expensive creation
     Use lazy<T> when appropriate
```
