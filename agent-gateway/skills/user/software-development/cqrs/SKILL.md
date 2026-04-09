---
name: CQRS
description: Command Query Responsibility Segregation - separating read and write operations for better scalability and flexibility
category: software-development
---
# CQRS

## What I do

I separate the responsibility of updating data (commands) from reading data (queries). CQRS allows independent scaling, optimization, and evolution of read and write models. Commands change system state; queries retrieve data without side effects. This separation enables different data models, databases, and scaling strategies for reads versus writes, leading to better performance, flexibility, and maintainability in complex systems.

## When to use me

Use CQRS when read and write workloads have different characteristics, when you need different data models for different use cases, or when scaling reads independently from writes is important. CQRS excels in event-driven systems, complex domain models, and systems requiring high read performance. It's valuable when the same data needs multiple optimized views. Avoid CQRS for simple CRUD applications with balanced read/write needs.

## Core Concepts

- **Command**: Operation that changes state (create, update, delete)
- **Query**: Operation that reads data without modification
- **Command Handler**: Processes commands and emits events
- **Query Handler**: Retrieves data from read models
- **Read Model**: Optimized representation for queries
- **Write Model**: Domain model for business logic
- **Event Sourcing**: Storing state changes as events
- **Synchronization**: Keeping read models updated
- **Projection**: Building read models from events
- **Eventual Consistency**: Read models may lag behind writes

## Code Examples

### Basic CQRS Implementation

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Protocol, Generic, TypeVar
from uuid import UUID, uuid4

T = TypeVar("T")

class Command(Protocol):
    pass

class Query(Protocol, Generic[T]):
    pass

@dataclass
class CreateUserCommand:
    email: str
    name: str

@dataclass
class UpdateUserCommand:
    user_id: UUID
    name: str

@dataclass
class DeleteUserCommand:
    user_id: UUID

@dataclass
class GetUserQuery:
    user_id: UUID

@dataclass
class ListUsersQuery:
    page: int = 1
    page_size: int = 10

@dataclass
class UserDTO:
    user_id: UUID
    email: str
    name: str
    created_at: datetime

class CommandHandler(ABC):
    @abstractmethod
    def handle(self, command: Command) -> None:
        pass

class QueryHandler(ABC, Generic[T]):
    @abstractmethod
    def handle(self, query: Query) -> T:
        pass

class InMemoryUserRepository:
    def __init__(self):
        self._users: dict[UUID, dict] = {}
    
    def save(self, user: dict) -> None:
        self._users[user["id"]] = user
    
    def get(self, user_id: UUID) -> dict | None:
        return self._users.get(user_id)
    
    def delete(self, user_id: UUID) -> None:
        self._users.pop(user_id, None)
    
    def list_all(self, page: int, page_size: int) -> list[dict]:
        users = list(self._users.values())
        start = (page - 1) * page_size
        return users[start:start + page_size]

class UserCommandHandler(CommandHandler):
    def __init__(self, repository: InMemoryUserRepository):
        self._repository = repository
    
    def handle(self, command: Command) -> None:
        if isinstance(command, CreateUserCommand):
            user_id = uuid4()
            user = {
                "id": user_id,
                "email": command.email,
                "name": command.name,
                "created_at": datetime.utcnow()
            }
            self._repository.save(user)
        
        elif isinstance(command, UpdateUserCommand):
            if user_id := self._repository.get(command.user_id):
                user_id["name"] = command.name
        
        elif isinstance(command, DeleteUserCommand):
            self._repository.delete(command.user_id)

class UserQueryHandler(QueryHandler[UserDTO | None]):
    def __init__(self, repository: InMemoryUserRepository):
        self._repository = repository
    
    def handle(self, query: GetUserQuery) -> UserDTO | None:
        if user := self._repository.get(query.user_id):
            return UserDTO(
                user_id=user["id"],
                email=user["email"],
                name=user["name"],
                created_at=user["created_at"]
            )
        return None
    
    def handle_list(self, query: ListUsersQuery) -> list[UserDTO]:
        users = self._repository.list_all(query.page, query.page_size)
        return [
            UserDTO(
                user_id=u["id"],
                email=u["email"],
                name=u["name"],
                created_at=u["created_at"]
            )
            for u in users
        ]

class UserFacade:
    def __init__(self):
        self._repository = InMemoryUserRepository()
        self._command_handler = UserCommandHandler(self._repository)
        self._query_handler = UserQueryHandler(self._repository)
    
    def execute(self, command: Command) -> None:
        self._command_handler.handle(command)
    
    def query_user(self, user_id: UUID) -> UserDTO | None:
        return self._query_handler.handle(GetUserQuery(user_id))
    
    def list_users(self, page: int = 1, page_size: int = 10) -> list[UserDTO]:
        return self._query_handler.handle_list(ListUsersQuery(page, page_size))
```

### Read Model Projections

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Protocol

class UserEvent(Protocol):
    event_type: str
    user_id: UUID
    timestamp: datetime

@dataclass
class UserCreated:
    event_type: str = "UserCreated"
    user_id: UUID = None
    email: str = ""
    name: str = ""
    timestamp: datetime = None

@dataclass
class UserEmailChanged:
    event_type: str = "UserEmailChanged"
    user_id: UUID = None
    old_email: str = ""
    new_email: str = ""
    timestamp: datetime = None

class ReadModelProjector(ABC):
    @abstractmethod
    def project(self, event: UserEvent) -> None:
        pass

class UserDetailsReadModel:
    def __init__(self):
        self._data: dict[UUID, dict] = {}
    
    def get(self, user_id: UUID) -> dict | None:
        return self._data.get(user_id)
    
    def apply_user_created(self, event: UserCreated) -> None:
        self._data[event.user_id] = {
            "user_id": event.user_id,
            "email": event.email,
            "name": event.name,
            "created_at": event.timestamp,
            "email_history": [event.email]
        }
    
    def apply_email_changed(self, event: UserEmailChanged) -> None:
        if user := self._data.get(event.user_id):
            user["email"] = event.new_email
            user["email_history"].append(event.new_email)

class UserProfileReadModel:
    def __init__(self):
        self._data: dict[str, dict] = {}
    
    def by_email(self, email: str) -> dict | None:
        return self._data.get(email)
    
    def apply_user_created(self, event: UserCreated) -> None:
        self._data[event.email] = {
            "user_id": event.user_id,
            "email": event.email,
            "display_name": event.name
        }

class ProjectionManager:
    def __init__(self):
        self._projectors: list[ReadModelProjector] = []
    
    def register(self, projector: ReadModelProjector) -> None:
        self._projectors.append(projector)
    
    def project(self, event: UserEvent) -> None:
        for projector in self._projectors:
            projector.project(event)

class EventProcessor:
    def __init__(self, projection_manager: ProjectionManager):
        self._projection_manager = projection_manager
    
    def process(self, event: UserEvent) -> None:
        self._projection_manager.project(event)
```

### Different Read Models for Different Needs

```python
from dataclasses import dataclass
from datetime import datetime
from typing import Protocol

class OrderReadRepository(Protocol):
    pass

class OrderDetailsRepository(OrderReadRepository):
    def get_order_details(self, order_id: str) -> dict | None:
        pass
    
    def get_order_with_items(self, order_id: str) -> dict | None:
        pass

class OrderSummaryRepository(OrderReadRepository):
    def get_order_summary(self, order_id: str) -> dict | None:
        pass
    
    def get_customer_order_history(self, customer_id: str) -> list[dict]:
        pass

class SalesAnalyticsRepository(OrderReadRepository):
    def get_daily_sales(self, date: datetime) -> dict:
        pass
    
    def get_top_products(self, limit: int) -> list[dict]:
        pass

@dataclass
class OrderDetailsDTO:
    order_id: str
    customer: dict
    items: list[dict]
    shipping: dict
    payment: dict
    status: str

@dataclass
class OrderSummaryDTO:
    order_id: str
    customer_id: str
    total: float
    item_count: int
    status: str
    created_at: datetime

@dataclass
class SalesSummaryDTO:
    date: datetime
    total_orders: int
    total_revenue: float
    average_order_value: float

class OptimizedOrderRepository:
    def __init__(self, session):
        self.session = session
    
    def get_details_model(self) -> OrderDetailsRepository:
        return DetailsReadModel(self.session)
    
    def get_summary_model(self) -> OrderSummaryRepository:
        return SummaryReadModel(self.session)
    
    def get_analytics_model(self) -> SalesAnalyticsRepository:
        return AnalyticsReadModel(self.session)
```

### Command Dispatching

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Type, TypeVar, Generic
from uuid import UUID

C = TypeVar("C", bound=Command)
H = TypeVar("H", bound=CommandHandler)

@dataclass
class Command:
    pass

@dataclass
class CommandResult:
    success: bool
    errors: list[str] = []
    data: dict | None = None

class CommandBus:
    def __init__(self):
        self._handlers: dict[Type[Command], CommandHandler] = {}
    
    def register(self, command_type: Type[Command], handler: CommandHandler) -> None:
        self._handlers[command_type] = handler
    
    def execute(self, command: Command) -> CommandResult:
        handler = self._handlers.get(type(command))
        if not handler:
            raise ValueError(f"No handler for {type(command)}")
        
        try:
            handler.handle(command)
            return CommandResult(success=True)
        except ValidationError as e:
            return CommandResult(success=False, errors=[str(e)])
        except Exception as e:
            return CommandResult(success=False, errors=[f"Unexpected error: {e}"])

class CommandValidator(ABC):
    @abstractmethod
    def validate(self, command: Command) -> list[str]:
        pass

class ValidationError(Exception):
    pass

class CreateOrderValidator(CommandValidator):
    def validate(self, command: 'CreateOrderCommand') -> list[str]:
        errors = []
        if not command.customer_id:
            errors.append("Customer ID required")
        if not command.items:
            errors.append("Order must have items")
        if command.total <= 0:
            errors.append("Total must be positive")
        return errors

class CreateOrderCommand(Command):
    def __init__(self, customer_id: UUID, items: list[dict], total: float):
        self.customer_id = customer_id
        self.items = items
        self.total = total

class CreateOrderHandler(CommandHandler):
    def __init__(self, repository, event_bus, validator: CommandValidator):
        self.repository = repository
        self.event_bus = event_bus
        self.validator = validator
    
    def handle(self, command: CreateOrderCommand) -> None:
        errors = self.validator.validate(command)
        if errors:
            raise ValidationError(errors)
        
        order_id = self.repository.create(command)
        self.event_bus.publish(OrderCreatedEvent(order_id))
```

### Event Sourcing with CQRS

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Generic, TypeVar, Protocol
from uuid import uuid4, UUID

E = TypeVar("E", bound='Event')

class Event(Protocol):
    @property
    def aggregate_id(self) -> UUID:
        pass

@dataclass
class OrderEvent:
    event_id: UUID
    aggregate_id: UUID
    event_type: str
    timestamp: datetime
    version: int

class EventStore(Protocol):
    def save(self, events: list[Event]) -> None:
        pass
    
    def get_events(self, aggregate_id: UUID) -> list[Event]:
        pass

class AggregateRoot:
    def __init__(self, aggregate_id: UUID):
        self._id = aggregate_id
        self._version = 0
        self._events: list[Event] = []
    
    def _apply(self, event: Event) -> None:
        self._version += 1
        self._events.append(event)
    
    def get_uncommitted_events(self) -> list[Event]:
        return self._events.copy()
    
    def clear_uncommitted_events(self) -> None:
        self._events.clear()

class OrderAggregate(AggregateRoot):
    def __init__(self, order_id: UUID):
        super().__init__(order_id)
        self._customer_id: UUID | None = None
        self._status: str = "draft"
        self._items: list[dict] = []
    
    @classmethod
    def reconstitute(cls, events: list[Event]) -> 'OrderAggregate':
        aggregate = cls(UUID(uuid4()))
        for event in events:
            aggregate._apply_event(event)
        return aggregate
    
    def _apply_event(self, event: Event) -> None:
        if hasattr(self, f"_apply_{event.event_type}"):
            getattr(self, f"_apply_{event.event_type}")(event)
    
    def create_order(self, customer_id: UUID) -> None:
        event = OrderCreatedEvent(self._id, customer_id, datetime.utcnow())
        self._apply(event)
    
    def _apply_OrderCreated(self, event: 'OrderCreatedEvent') -> None:
        self._customer_id = event.customer_id
        self._status = "created"
    
    def add_item(self, product_id: str, quantity: int, price: float) -> None:
        event = OrderItemAddedEvent(
            self._id,
            {"product_id": product_id, "quantity": quantity, "price": price},
            datetime.utcnow()
        )
        self._apply(event)

@dataclass
class OrderCreatedEvent(OrderEvent):
    def __init__(self, aggregate_id: UUID, customer_id: UUID, timestamp: datetime):
        super().__init__(
            event_id=uuid4(),
            aggregate_id=aggregate_id,
            event_type="OrderCreated",
            timestamp=timestamp,
            version=1
        )
        self.customer_id = customer_id

@dataclass
class OrderItemAddedEvent(OrderEvent):
    item_data: dict
    
    def __init__(self, aggregate_id: UUID, item_data: dict, timestamp: datetime):
        super().__init__(
            event_id=uuid4(),
            aggregate_id=aggregate_id,
            event_type="OrderItemAdded",
            timestamp=timestamp,
            version=2
        )
        self.item_data = item_data

class OrderRepository:
    def __init__(self, event_store: EventStore):
        self._event_store = event_store
    
    def save(self, aggregate: OrderAggregate) -> None:
        events = aggregate.get_uncommitted_events()
        self._event_store.save(events)
        aggregate.clear_uncommitted_events()
    
    def load(self, order_id: UUID) -> OrderAggregate:
        events = self._event_store.get_events(order_id)
        return OrderAggregate.reconstitute(events)
```

## Best Practices

1. **Start Simple**: Don't implement full CQRS unless you need it
2. **Separate Models**: Keep read and write models independent
3. **Eventual Consistency**: Accept lag between writes and reads
4. **Use Events**: Events make state changes explicit
5. **Multiple Projections**: Different views for different queries
6. **Idempotency**: Handle duplicate commands safely
7. **Validation**: Validate commands before processing
8. **Sagas for Workflows**: Use sagas for multi-step commands
9. **Testing**: Test commands and queries separately
10. **Documentation**: Document command and query contracts
11. **Performance**: Optimize hot paths in read or write models
12. **Monitoring**: Track command processing times and query performance
