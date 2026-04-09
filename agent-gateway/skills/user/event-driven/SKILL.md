---
name: event-driven
description: Event-driven architecture patterns and best practices
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: architecture
---
## What I do
- Design event-driven systems
- Implement event sourcing
- Handle event ordering and deduplication
- Design event schemas
- Implement saga patterns
- Handle eventual consistency
- Monitor event processing
- Handle failures and retries

## When to use me
When designing event-driven architectures or implementing event systems.

## Event-Driven Architecture
```
┌─────────────────────────────────────────────────────────────────────┐
│                         Event Producers                              │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐          │
│  │ Service │    │ Service │    │ Service │    │ Service │          │
│  │    A    │───►│    B    │───►│    C    │───►│    D    │          │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘          │
│       │              │              │              │                │
│       └──────────────┴──────────────┴──────────────┘                │
│                              │                                        │
│                    ┌────────▼────────┐                               │
│                    │   Event Bus     │                              │
│                    │ (Kafka/Rabbit)  │                              │
│                    └────────┬────────┘                               │
│                             │                                        │
│         ┌───────────────────┼───────────────────┐                    │
│         │                   │                   │                    │
│         ▼                   ▼                   ▼                    │
│    ┌─────────┐         ┌─────────┐         ┌─────────┐              │
│    │Consumer │         │Consumer │         │Consumer │              │
│    │    1    │         │    2    │         │    3    │              │
│    └─────────┘         └─────────┘         └─────────┘              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Event Schema Design
```python
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict
import json
import uuid


@dataclass
class Event:
    """Base event structure."""
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str = ""
    aggregate_id: str = ""
    aggregate_type: str = ""
    occurred_at: datetime = field(default_factory=datetime.utcnow)
    payload: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> dict:
        return {
            "event_id": self.event_id,
            "event_type": self.event_type,
            "aggregate_id": self.aggregate_id,
            "aggregate_type": self.aggregate_type,
            "occurred_at": self.occurred_at.isoformat(),
            "payload": self.payload,
            "metadata": self.metadata,
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'Event':
        data["occurred_at"] = datetime.fromisoformat(data["occurred_at"])
        return cls(**data)
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict())
    
    @classmethod
    def from_json(cls, json_str: str) -> 'Event':
        return cls.from_dict(json.loads(json_str))


@dataclass
class UserCreatedEvent(Event):
    """User was created."""
    event_type: str = "user.created"
    
    payload: Dict[str, Any] = field(default_factory=dict)


@dataclass
class OrderPlacedEvent(Event):
    """Order was placed."""
    event_type: str = "order.placed"
    
    payload: Dict[str, Any] = field(default_factory=dict)


class EventSerializer:
    """Serialize and deserialize events."""
    
    TYPE_MAPPING = {
        "user.created": UserCreatedEvent,
        "order.placed": OrderPlacedEvent,
    }
    
    @classmethod
    def deserialize(cls, data: dict) -> Event:
        event_type = data.get("event_type")
        
        if event_type in cls.TYPE_MAPPING:
            event_cls = cls.TYPE_MAPPING[event_type]
            return event_cls.from_dict(data)
        
        return Event.from_dict(data)
```

## Event Sourcing
```python
from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import datetime


class Aggregate(ABC):
    """Base aggregate with event sourcing."""
    
    def __init__(self, aggregate_id: str) -> None:
        self.id = aggregate_id
        self._events: List[Event] = []
        self._version: int = 0
    
    def apply(self, event: Event) -> None:
        """Apply event to aggregate."""
        self._events.append(event)
        self._version += 1
        self._handle_event(event)
    
    @abstractmethod
    def _handle_event(self, event: Event) -> None:
        """Handle event (to be implemented by subclass)."""
        pass
    
    def get_pending_events(self) -> List[Event]:
        """Get events not yet persisted."""
        return self._events
    
    def clear_pending_events(self) -> None:
        """Clear pending events after persistence."""
        self._events = []
    
    @classmethod
    def from_events(cls, aggregate_id: str, events: List[Event]) -> 'Aggregate':
        """Reconstruct aggregate from events."""
        aggregate = cls(aggregate_id)
        
        for event in events:
            aggregate.apply(event)
        
        return aggregate


class UserAggregate(Aggregate):
    """User aggregate with event sourcing."""
    
    def __init__(self, user_id: str) -> None:
        super().__init__(user_id)
        self.email: Optional[str] = None
        self.name: Optional[str] = None
        self.created_at: Optional[datetime] = None
        self.updated_at: Optional[datetime] = None
    
    def create_user(self, email: str, name: str) -> None:
        """Create user (generates event)."""
        event = UserCreatedEvent(
            aggregate_id=self.id,
            aggregate_type="user",
            payload={
                "email": email,
                "name": name,
            },
        )
        self.apply(event)
    
    def _handle_event(self, event: Event) -> None:
        """Apply event to state."""
        if isinstance(event, UserCreatedEvent):
            self.email = event.payload["email"]
            self.name = event.payload["name"]
            self.created_at = event.occurred_at
```

## Saga Pattern
```python
from dataclasses import dataclass
from typing import Dict, Any, Callable
from enum import Enum
import asyncio


class SagaStepStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    COMPENSATING = "compensating"


@dataclass
class SagaContext:
    """Context passed through saga steps."""
    data: Dict[str, Any] = None
    status: SagaStepStatus = SagaStepStatus.PENDING
    compensating: bool = False
    
    def __post_init__(self):
        if self.data is None:
            self.data = {}


class Saga:
    """Base saga with compensation support."""
    
    def __init__(self, saga_id: str) -> None:
        self.saga_id = saga_id
        self.steps: List[Callable] = []
        self.compensation_steps: List[Callable] = []
        self.context = SagaContext()
    
    def add_step(
        self,
        forward: Callable[[SagaContext], bool],
        backward: Callable[[SagaContext], bool]
    ) -> None:
        """Add a step with compensation."""
        self.steps.append(forward)
        self.compensation_steps.append(backward)
    
    async def execute(self) -> bool:
        """Execute saga with compensation if needed."""
        executed_steps = []
        
        try:
            for step in self.steps:
                success = step(self.context)
                if not success:
                    raise SagaStepFailed()
                executed_steps.append(step)
            
            self.context.status = SagaStepStatus.COMPLETED
            return True
            
        except SagaStepFailed:
            # Compensate in reverse order
            self.context.status = SagaStepStatus.COMPENSATING
            self.context.compensating = True
            
            for step in reversed(executed_steps):
                index = self.steps.index(step)
                compensation = self.compensation_steps[index]
                compensation(self.context)
            
            return False


class OrderPlacementSaga(Saga):
    """Saga for placing an order."""
    
    def __init__(self, order_id: str) -> None:
        super().__init__(order_id)
        
        # Add saga steps
        self.add_step(
            self.reserve_inventory,
            self.release_inventory
        )
        self.add_step(
            self.process_payment,
            self.refund_payment
        )
        self.add_step(
            self.create_shipment,
            self.cancel_shipment
        )
    
    def reserve_inventory(self, ctx: SagaContext) -> bool:
        """Reserve inventory for order."""
        ctx.data["inventory_reserved"] = True
        ctx.data["inventory_id"] = "INV-123"
        return True
    
    def release_inventory(self, ctx: SagaContext) -> bool:
        """Release reserved inventory."""
        if ctx.data.get("inventory_reserved"):
            # Release logic here
            ctx.data["inventory_reserved"] = False
        return True
    
    def process_payment(self, ctx: SagaContext) -> bool:
        """Process payment."""
        ctx.data["payment_processed"] = True
        ctx.data["transaction_id"] = "TXN-456"
        return True
    
    def refund_payment(self, ctx: SagaContext) -> bool:
        """Refund payment if needed."""
        if ctx.data.get("payment_processed"):
            # Refund logic here
            ctx.data["payment_processed"] = False
        return True
```

## Event Processing
```python
from abc import ABC, abstractmethod
from typing import List, Optional
import asyncio


class EventConsumer(ABC):
    """Base event consumer."""
    
    def __init__(self, consumer_group: str) -> None:
        self.consumer_group = consumer_group
        self.running = False
    
    @abstractmethod
    async def handle_event(self, event: Event) -> bool:
        """Handle single event. Return True if processed successfully."""
        pass
    
    async def process_batch(self, events: List[Event]) -> int:
        """Process batch of events."""
        processed = 0
        
        for event in events:
            try:
                success = await self.handle_event(event)
                if success:
                    processed += 1
            except Exception as e:
                print(f"Error processing event: {e}")
        
        return processed


class DeadLetterQueue:
    """Handle events that fail processing."""
    
    def __init__(self, max_retries: int = 3) -> None:
        self.max_retries = max_retries
        self.dead_letter_queue = []
    
    async def handle_failed_event(
        self,
        event: Event,
        error: Exception
    ) -> None:
        """Move failed event to DLQ."""
        event.metadata["retry_count"] = event.metadata.get("retry_count", 0) + 1
        
        if event.metadata["retry_count"] < self.max_retries:
            # Schedule retry
            await self.schedule_retry(event)
        else:
            # Move to DLQ
            self.dead_letter_queue.append({
                "event": event,
                "error": str(error),
                "failed_at": datetime.utcnow().isoformat(),
            })
    
    async def schedule_retry(self, event: Event) -> None:
        """Schedule event for retry."""
        delay = min(2 ** event.metadata["retry_count"], 300)
        # Schedule with delay
```

## Event Ordering
```python
# Ordering guarantees

# Per-partition ordering (Kafka)
# - Events with same key go to same partition
# - Consumer processes in order

# Global ordering
# - Single partition (lower throughput)
# - Or accept eventual ordering


# Key-based partitioning
def get_partition_key(event: Event) -> str:
    """Get partition key for event."""
    return f"{event.aggregate_type}:{event.aggregate_id}"
```

## Best Practices
```
1. Design events as facts
   - Immutable, never modify
   - Past tense naming: UserCreated, not CreateUser

2. Include enough context
   - Sufficient data for consumers
   - Avoid frequent lookups

3. Version your events
   - Backward compatibility
   - Schema evolution

4. Handle idempotency
   - Deduplicate events
   - Process exactly once

5. Monitor lag
   - Track consumer lag
   - Alert on delays

6. Test thoroughly
   - Event handlers
   - Saga rollbacks

7. Document event flow
   - Event catalog
   - Consumer dependencies
```
