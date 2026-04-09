---
name: Domain-Driven Design
description: Software design approach focusing on core domain logic and close collaboration with domain experts
category: software-development
---
# Domain-Driven Design

## What I do

I provide a comprehensive approach to software design that emphasizes collaboration between technical and domain experts. DDD focuses on modeling the core domain—the area of expertise that provides the business with competitive advantage. It involves creating a shared model that accurately represents domain knowledge, separating complex domain logic from infrastructure concerns, and building a flexible architecture that can evolve with changing business requirements.

## When to use me

Use DDD for complex domains where business rules are critical and evolving. It's ideal when you have domain experts available for collaboration, when technical staff struggle to understand domain concepts, or when projects require long-term maintainability. DDD is overkill for simple CRUD applications, utility software, or projects with trivial domain logic that can be adequately expressed in data models.

## Core Concepts

- **Ubiquitous Language**: Shared vocabulary used consistently across all team communication
- **Bounded Context**: Explicit boundary where a particular model applies
- **Aggregate**: Cluster of related objects treated as a single unit
- **Entity**: Objects with distinct identity that persists over time
- **Value Object**: Objects defined by their attributes, not identity
- **Domain Event**: Something significant that happened in the domain
- **Repository**: Abstraction for accessing aggregates
- **Service**: Operation that doesn't naturally belong to an entity
- **Factory**: Responsible for creating complex objects and aggregates
- **Anti-Corruption Layer**: Translation layer between bounded contexts
- **Shared Kernel**: Small model shared between contexts

## Code Examples

### Entities and Value Objects

```python
from abc import ABC
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID, uuid4

class CustomerId:
    def __init__(self, value: UUID):
        self._value = value
    
    @classmethod
    def create(cls) -> 'CustomerId':
        return cls(uuid4())
    
    @property
    def value(self) -> UUID:
        return self._value

class Email:
    def __init__(self, address: str):
        if "@" not in address:
            raise ValueError(f"Invalid email: {address}")
        self._address = address.lower()
    
    @property
    def address(self) -> str:
        return self._address

class CustomerName:
    def __init__(self, first: str, last: str):
        if not first or not last:
            raise ValueError("First and last name required")
        self._first = first
        self._last = last
    
    @property
    def full_name(self) -> str:
        return f"{self._first} {self._last}"
    
    @property
    def first(self) -> str:
        return self._first
    
    @property
    def last(self) -> str:
        return self._last

class Address(ValueObject):
    def __init__(self, street: str, city: str, state: str, zip_code: str):
        self._street = street
        self._city = city
        self._state = state
        self._zip_code = zip_code
    
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Address):
            return False
        return (
            self._street == other._street and
            self._city == other._city and
            self._state == other._state and
            self._zip_code == other._zip_code
        )

class Customer(Entity):
    def __init__(self, customer_id: CustomerId, name: CustomerName, email: Email):
        self._id = customer_id
        self._name = name
        self._email = email
        self._addresses: list[Address] = []
        self._created_at = datetime.now()
        self._is_active = True
    
    @property
    def id(self) -> CustomerId:
        return self._id
    
    def add_address(self, address: Address) -> None:
        self._addresses.append(address)
    
    def change_email(self, new_email: Email) -> None:
        self._email = new_email
    
    def deactivate(self) -> None:
        self._is_active = False
```

### Aggregate Root

```python
from abc import ABC
from dataclasses import field
from datetime import datetime
from uuid import UUID, uuid4

class OrderId:
    def __init__(self, value: UUID):
        self._value = value
    
    @classmethod
    def create(cls) -> 'OrderId':
        return cls(uuid4())

class OrderLine:
    def __init__(self, product_id: str, product_name: str, quantity: int, unit_price: float):
        self._product_id = product_id
        self._product_name = product_name
        self._quantity = quantity
        self._unit_price = unit_price
    
    @property
    def line_total(self) -> float:
        return self._quantity * self._unit_price

class OrderStatus:
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class Order(ABC):
    def __init__(self, order_id: OrderId, customer_id: UUID):
        self._id = order_id
        self._customer_id = customer_id
        self._order_lines: list[OrderLine] = []
        self._status = OrderStatus.PENDING
        self._created_at = datetime.now()
        self._shipped_at: datetime | None = None
    
    @property
    def id(self) -> OrderId:
        return self._id
    
    @property
    def total(self) -> float:
        return sum(line.line_total for line in self._order_lines)
    
    def add_line(self, product_id: str, product_name: str, quantity: int, unit_price: float) -> None:
        line = OrderLine(product_id, product_name, quantity, unit_price)
        self._order_lines.append(line)
    
    def confirm(self) -> None:
        if self._status == OrderStatus.PENDING:
            self._status = OrderStatus.CONFIRMED
    
    def ship(self) -> None:
        if self._status == OrderStatus.CONFIRMED:
            self._status = OrderStatus.SHIPPED
            self._shipped_at = datetime.now()
    
    def cancel(self) -> None:
        if self._status not in [OrderStatus.SHIPPED, OrderStatus.DELIVERED]:
            self._status = OrderStatus.CANCELLED
    
    def is_shippable(self) -> bool:
        return self._status == OrderStatus.CONFIRMED
```

### Domain Events

```python
from abc import ABC
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

@dataclass
class DomainEvent:
    event_id: UUID
    occurred_at: datetime
    event_type: str

@dataclass
class OrderCreated(DomainEvent):
    order_id: UUID
    customer_id: UUID
    total: float
    
    def __init__(self, order_id: UUID, customer_id: UUID, total: float):
        super().__init__(
            event_id=uuid4(),
            occurred_at=datetime.now(),
            event_type="OrderCreated"
        )
        self.order_id = order_id
        self.customer_id = customer_id
        self.total = total

@dataclass
class OrderShipped(DomainEvent):
    order_id: UUID
    tracking_number: str
    carrier: str
    
    def __init__(self, order_id: UUID, tracking_number: str, carrier: str):
        super().__init__(
            event_id=uuid4(),
            occurred_at=datetime.now(),
            event_type="OrderShipped"
        )
        self.order_id = order_id
        self.tracking_number = tracking_number
        self.carrier = carrier

class EventPublisher:
    def __init__(self):
        self._handlers: dict[str, list] = {}
    
    def subscribe(self, event_type: str, handler: callable) -> None:
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)
    
    def publish(self, event: DomainEvent) -> None:
        event_type = event.event_type
        if event_type in self._handlers:
            for handler in self._handlers[event_type]:
                handler(event)

class OrderService:
    def __init__(self, event_publisher: EventPublisher):
        self._events = event_publisher
    
    def create_order(self, customer_id: UUID, total: float) -> UUID:
        order_id = uuid4()
        event = OrderCreated(order_id, customer_id, total)
        self._events.publish(event)
        return order_id
```

### Repository Pattern

```python
from abc import ABC, abstractmethod
from datetime import datetime
from uuid import UUID

class CustomerRepository(ABC):
    @abstractmethod
    def save(self, customer: 'Customer') -> None:
        pass
    
    @abstractmethod
    def find_by_id(self, customer_id: UUID) -> 'Customer | None':
        pass
    
    @abstractmethod
    def find_by_email(self, email: str) -> 'Customer | None':
        pass
    
    @abstractmethod
    def find_all_active(self) -> list['Customer']:
        pass

class InMemoryCustomerRepository(CustomerRepository):
    def __init__(self):
        self._customers: dict[UUID, 'Customer'] = {}
    
    def save(self, customer: 'Customer') -> None:
        self._customers[customer.id.value] = customer
    
    def find_by_id(self, customer_id: UUID) -> 'Customer | None':
        return self._customers.get(customer_id)
    
    def find_by_email(self, email: str) -> 'Customer | None':
        for customer in self._customers.values():
            if customer._email.address == email:
                return customer
        return None
    
    def find_all_active(self) -> list['Customer']:
        return [c for c in self._customers.values() if c._is_active]
```

### Anti-Corruption Layer

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class ExternalOrderDTO:
    external_id: str
    customer_name: str
    order_date: str
    items: list[dict]
    total_amount: float

class OrderTranslator:
    @staticmethod
    def to_internal(dto: ExternalOrderDTO) -> 'InternalOrder':
        return InternalOrder(
            external_reference=dto.external_id,
            customer_name=dto.customer_name,
            order_date=datetime.fromisoformat(dto.order_date),
            items=[
                TranslatedItem(
                    sku=item["sku"],
                    description=item["desc"],
                    qty=item["quantity"],
                    price=item["unit_price"]
                )
                for item in dto.items
            ],
            total=dto.total_amount
        )

class ExternalOrderServiceAdapter:
    def __init__(self, acl: OrderTranslator, external_client):
        self._acl = acl
        self._external = external_client
    
    def get_order(self, order_id: str) -> Optional[InternalOrder]:
        dto = self._external.fetch_order(order_id)
        if dto is None:
            return None
        return self._acl.to_internal(dto)

class InternalOrder:
    def __init__(
        self,
        external_reference: str,
        customer_name: str,
        order_date: datetime,
        items: list['TranslatedItem'],
        total: float
    ):
        self.external_reference = external_reference
        self.customer_name = customer_name
        self.order_date = order_date
        self.items = items
        self.total = total

class TranslatedItem:
    def __init__(self, sku: str, description: str, qty: int, price: float):
        self.sku = sku
        self.description = description
        self.quantity = qty
        self.price = price
```

## Best Practices

1. **Model the Domain**: Deep understanding leads to better models
2. **Use Ubiquitous Language**: Speak the domain expert's language everywhere
3. **Define Bounded Contexts**: Clear boundaries prevent model pollution
4. **Keep Aggregates Small**: Only include objects that must change together
5. **Design Events First**: Start with domain events for complex workflows
6. **Separate Core Domain**: Focus effort on what makes the business unique
7. **Collaborate with Domain Experts**: They know the business rules
8. **Apply Strategic DDD First**: Context mapping before tactical patterns
9. **Refactor Towards Deeper Insight**: Models evolve with understanding
10. **Use Value Objects**: Replace primitives with meaningful domain concepts
11. **Avoid Anemic Domain Models**: Domain objects should have behavior
12. **Preserve Aggregate Invariants**: Keep consistency within boundaries
