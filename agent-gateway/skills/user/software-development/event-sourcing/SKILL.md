---
name: Event Sourcing
description: Architectural pattern storing state changes as immutable events for complete audit trail and temporal queries
category: software-development
---
# Event Sourcing

## What I do

I provide an architectural pattern where application state is stored as a sequence of events rather than as current state. Every state change is captured as an immutable event, creating a complete audit trail and enabling temporal queries. Event sourcing allows reconstructing any past state, provides full audit capability, and enables sophisticated event processing patterns. The event log becomes the source of truth.

## When to use me

Use event sourcing when you need a complete audit trail, when temporal queries are important, or when business rules depend on event history. It's valuable for domain models where state transitions are complex. Event sourcing excels in systems requiring eventual consistency, audit compliance, or the ability to replay events. Avoid for simple CRUD applications or when you need only current state efficiently.

## Core Concepts

- **Event**: Immutable record of something that happened
- **Event Store**: Specialized database for events
- **Aggregate**: Entity reconstructed from events
- **Snapshot**: Optimization to avoid replaying all events
- **Projection**: Building read models from events
- **Event Versioning**: Handling evolving event schemas
- **Replay**: Rebuilding state from event history
- **Append-Only**: Events are never modified or deleted
- **Domain Events**: Business events from domain model
- **Integration Events**: Events for external systems

## Code Examples

### Event Definitions

```python
from abc import ABC
from dataclasses import dataclass, field
from datetime import datetime
from typing import Generic, TypeVar, Protocol
from uuid import UUID, uuid4

T = TypeVar("T", bound='Event')

@dataclass
class Event:
    event_id: UUID
    aggregate_id: UUID
    event_type: str
    occurred_at: datetime
    version: int
    
    def to_dict(self) -> dict:
        return {
            "event_id": str(self.event_id),
            "aggregate_id": str(self.aggregate_id),
            "event_type": self.event_type,
            "occurred_at": self.occurred_at.isoformat(),
            "version": self.version
        }

@dataclass
class UserCreated(Event):
    email: str
    name: str
    
    def __init__(
        self,
        aggregate_id: UUID,
        email: str,
        name: str,
        version: int
    ):
        super().__init__(
            event_id=uuid4(),
            aggregate_id=aggregate_id,
            event_type="UserCreated",
            occurred_at=datetime.utcnow(),
            version=version
        )
        self.email = email
        self.name = name

@dataclass
class UserEmailChanged(Event):
    old_email: str
    new_email: str
    
    def __init__(
        self,
        aggregate_id: UUID,
        old_email: str,
        new_email: str,
        version: int
    ):
        super().__init__(
            event_id=uuid4(),
            aggregate_id=aggregate_id,
            event_type="UserEmailChanged",
            occurred_at=datetime.utcnow(),
            version=version
        )
        self.old_email = old_email
        self.new_email = new_email

@dataclass
class UserDeactivated(Event):
    reason: str
    
    def __init__(
        self,
        aggregate_id: UUID,
        reason: str,
        version: int
    ):
        super().__init__(
            event_id=uuid4(),
            aggregate_id=aggregate_id,
            event_type="UserDeactivated",
            occurred_at=datetime.utcnow(),
            version=version
        )
        self.reason = reason

@dataclass
class UserReactivated(Event):
    reason: str
    
    def __init__(
        self,
        aggregate_id: UUID,
        reason: str,
        version: int
    ):
        super().__init__(
            event_id=uuid4(),
            aggregate,
            event_type="UserReactivated_id=aggregate_id",
            occurred_at=datetime.utcnow(),
            version=version
        )
        self.reason = reason
```

### Aggregate Root with Event Sourcing

```python
from abc import ABC, abstractmethod
from typing import TypeVar, Generic

E = TypeVar("E", bound=Event)

class AggregateRoot(ABC, Generic[E]):
    def __init__(self, aggregate_id: UUID):
        self._id = aggregate_id
        self._version = 0
        self._events: list[E] = []
    
    @property
    def id(self) -> UUID:
        return self._id
    
    @property
    def version(self) -> int:
        return self._version
    
    @property
    def uncommitted_events(self) -> list[E]:
        return self._events.copy()
    
    def clear_uncommitted_events(self) -> None:
        self._events.clear()
    
    def _apply(self, event: E) -> None:
        self._version += 1
        self._events.append(event)
        self._apply_event(event)
    
    @abstractmethod
    def _apply_event(self, event: E) -> None:
        pass

class UserAggregate(AggregateRoot[Event]):
    def __init__(self, user_id: UUID):
        super().__init__(user_id)
        self._email: str | None = None
        self._name: str | None = None
        self._is_active: bool = True
        self._email_history: list[str] = []
    
    @classmethod
    def create(
        cls,
        email: str,
        name: str
    ) -> 'UserAggregate':
        aggregate = cls(uuid4())
        event = UserCreated(
            aggregate_id=aggregate._id,
            email=email,
            name=name,
            version=1
        )
        aggregate._apply(event)
        return aggregate
    
    def change_email(self, new_email: str) -> None:
        if not self._is_active:
            raise ValueError("Cannot change email for inactive user")
        if new_email == self._email:
            return
        
        event = UserEmailChanged(
            aggregate_id=self._id,
            old_email=self._email or "",
            new_email=new_email,
            version=self._version + 1
        )
        self._apply(event)
    
    def deactivate(self, reason: str) -> None:
        if not self._is_active:
            raise ValueError("User already deactivated")
        
        event = UserDeactivated(
            aggregate_id=self._id,
            reason=reason,
            version=self._version + 1
        )
        self._apply(event)
    
    def reactivate(self, reason: str) -> None:
        if self._is_active:
            raise ValueError("User already active")
        
        event = UserReactivated(
            aggregate_id=self._id,
            reason=reason,
            version=self._version + 1
        )
        self._apply(event)
    
    def _apply_event(self, event: Event) -> None:
        if isinstance(event, UserCreated):
            self._email = event.email
            self._name = event.name
            self._is_active = True
            self._email_history = [event.email]
        
        elif isinstance(event, UserEmailChanged):
            self._email = event.new_email
            self._email_history.append(event.new_email)
        
        elif isinstance(event, UserDeactivated):
            self._is_active = False
        
        elif isinstance(event, UserReactivated):
            self._is_active = True
    
    @property
    def email(self) -> str | None:
        return self._email
    
    @property
    def name(self) -> str | None:
        return self._name
    
    @property
    def is_active(self) -> bool:
        return self._is_active
    
    @property
    def email_history(self) -> list[str]:
        return self._email_history.copy()
```

### Event Store

```python
from abc import ABC, abstractmethod
from typing import Protocol, TypeVar

E = TypeVar("E", bound=Event)

class EventStore(Protocol[E]):
    @abstractmethod
    def append(self, event: E) -> None:
        pass
    
    @abstractmethod
    def get_events(self, aggregate_id: UUID) -> list[E]:
        pass
    
    @abstractmethod
    def get_all_events(self, from_version: int = 0) -> list[E]:
        pass

class InMemoryEventStore(EventStore[Event]):
    def __init__(self):
        self._events: list[Event] = []
        self._by_aggregate: dict[UUID, list[Event]] = {}
    
    def append(self, event: Event) -> None:
        self._events.append(event)
        if event.aggregate_id not in self._by_aggregate:
            self._by_aggregate[event.aggregate_id] = []
        self._by_aggregate[event.aggregate_id].append(event)
    
    def get_events(self, aggregate_id: UUID) -> list[Event]:
        return self._by_aggregate.get(aggregate_id, []).copy()
    
    def get_all_events(self, from_version: int = 0) -> list[Event]:
        return [e for e in self._events if e.version > from_version]

class SnapshotStore:
    def __init__(self):
        self._snapshots: dict[UUID, dict] = {}
    
    def save_snapshot(self, aggregate_id: UUID, version: int, state: dict) -> None:
        self._snapshots[aggregate_id] = {
            "version": version,
            "state": state
        }
    
    def get_snapshot(self, aggregate_id: UUID) -> dict | None:
        return self._snapshots.get(aggregate_id)
```

### Repository with Snapshots

```python
class UserRepository:
    def __init__(
        self,
        event_store: EventStore[Event],
        snapshot_store: SnapshotStore | None = None,
        snapshot_threshold: int = 10
    ):
        self._event_store = event_store
        self._snapshot_store = snapshot_store
        self._snapshot_threshold = snapshot_threshold
    
    def save(self, aggregate: UserAggregate) -> None:
        for event in aggregate.uncommitted_events:
            self._event_store.append(event)
        aggregate.clear_uncommitted_events()
        
        if self._snapshot_store and self._should_snapshot(aggregate):
            self._save_snapshot(aggregate)
    
    def load(self, aggregate_id: UUID) -> UserAggregate:
        snapshot = None
        if self._snapshot_store:
            snapshot = self._snapshot_store.get_snapshot(aggregate_id)
        
        if snapshot:
            events = self._event_store.get_events(aggregate_id)
            events_after_snapshot = [
                e for e in events
                if e.version > snapshot["version"]
            ]
            aggregate = self._reconstitute(snapshot["state"])
            for event in events_after_snapshot:
                aggregate._apply(event)
            return aggregate
        
        events = self._event_store.get_events(aggregate_id)
        return self._reconstitute_from_events(events)
    
    def _should_snapshot(self, aggregate: UserAggregate) -> bool:
        return (
            self._snapshot_store and
            aggregate.version % self._snapshot_threshold == 0
        )
    
    def _save_snapshot(self, aggregate: UserAggregate) -> None:
        state = {
            "email": aggregate.email,
            "name": aggregate.name,
            "is_active": aggregate.is_active,
            "email_history": aggregate.email_history
        }
        self._snapshot_store.save_snapshot(
            aggregate.id,
            aggregate.version,
            state
        )
    
    def _reconstitute(self, state: dict) -> UserAggregate:
        aggregate = UserAggregate(uuid4())
        aggregate._email = state["email"]
        aggregate._name = state["name"]
        aggregate._is_active = state["is_active"]
        aggregate._email_history = state["email_history"]
        return aggregate
    
    def _reconstitute_from_events(self, events: list[Event]) -> UserAggregate:
        aggregate = UserAggregate(uuid4())
        for event in events:
            aggregate._apply(event)
        return aggregate
```

### Projections for Read Models

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Generic, TypeVar, Protocol

P = TypeVar("P", bound='Projection')

@dataclass
class UserView:
    user_id: UUID
    email: str
    name: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    version: int

class Projection(ABC):
    @abstractmethod
    def apply(self, event: Event) -> None:
        pass

class UserProjection(Projection):
    def __init__(self):
        self._users: dict[UUID, UserView] = {}
    
    @property
    def users(self) -> dict[UUID, UserView]:
        return self._users.copy()
    
    def get_user(self, user_id: UUID) -> UserView | None:
        return self._users.get(user_id)
    
    def get_active_users(self) -> list[UserView]:
        return [u for u in self._users.values() if u.is_active]
    
    def apply(self, event: Event) -> None:
        if isinstance(event, UserCreated):
            self._users[event.aggregate_id] = UserView(
                user_id=event.aggregate_id,
                email=event.email,
                name=event.name,
                is_active=True,
                created_at=event.occurred_at,
                updated_at=event.occurred_at,
                version=event.version
            )
        
        elif isinstance(event, UserEmailChanged):
            if user := self._users.get(event.aggregate_id):
                user.email = event.new_email
                user.updated_at = event.occurred_at
                user.version = event.version
        
        elif isinstance(event, UserDeactivated):
            if user := self._users.get(event.aggregate_id):
                user.is_active = False
                user.updated_at = event.occurred_at
                user.version = event.version

class ProjectionManager:
    def __init__(self):
        self._projections: list[Projection] = []
    
    def add(self, projection: Projection) -> None:
        self._projections.append(projection)
    
    def apply(self, event: Event) -> None:
        for projection in self._projections:
            try:
                projection.apply(event)
            except Exception as e:
                print(f"Projection failed: {e}")

class AsyncProjector:
    def __init__(self, event_store: EventStore[Event]):
        self._event_store = event_store
        self._projection_manager = ProjectionManager()
        self._last_processed_version: dict[str, int] = {}
    
    def add_projection(self, projection: Projection, name: str) -> None:
        self._projection_manager.add(projection)
    
    def start(self) -> None:
        import threading
        def process():
            while True:
                for event in self._event_store.get_all_events(0):
                    self._projection_manager.apply(event)
        threading.Thread(target=process, daemon=True).start()
```

### Event Versioning

```python
from abc import ABC, abstractmethod
from datetime import datetime
from typing import dict

class EventUpgrader(ABC):
    @abstractmethod
    def can_upgrade(self, event_type: str, version: int) -> bool:
        pass
    
    @abstractmethod
    def upgrade(self, event: dict) -> dict:
        pass

class UserEventUpgrader(EventUpgrader):
    V1_TO_V2_MAPPING = {
        "email": "contact_email"
    }
    
    def can_upgrade(self, event_type: str, version: int) -> bool:
        return event_type == "UserCreated" and version == 1
    
    def upgrade(self, event: dict) -> dict:
        upgraded = event.copy()
        upgraded["version"] = 2
        for old_field, new_field in self.V1_TO_V2_MAPPING.items():
            if old_field in upgraded:
                upgraded[new_field] = upgraded.pop(old_field)
        upgraded["metadata"] = {
            "upgraded_from_version": 1,
            "upgraded_at": datetime.utcnow().isoformat()
        }
        return upgraded

class EventUpgraderChain:
    def __init__(self):
        self._upgraders: list[EventUpgrader] = []
    
    def add_upgrader(self, upgrader: EventUpgrader) -> None:
        self._upgraders.append(upgrader)
    
    def upgrade(self, event: dict) -> dict:
        current = event
        for upgrader in self._upgraders:
            if upgrader.can_upgrade(
                current["event_type"],
                current["version"]
            ):
                current = upgrader.upgrade(current)
        return current

class VersionedEventStore:
    def __init__(self, base_store: EventStore[Event]):
        self._store = base_store
        self._upgrader_chain = EventUpgraderChain()
        self._upgrader_chain.add_upgrader(UserEventUpgrader())
    
    def append(self, event: Event) -> None:
        self._store.append(event)
    
    def get_events(self, aggregate_id: UUID) -> list[dict]:
        events = self._store.get_events(aggregate_id)
        return [self._upgrader_chain.upgrade(e.to_dict()) for e in events]
```

## Best Practices

1. **Immutable Events**: Never modify or delete events
2. **Idempotent Appends**: Handle duplicate event writes safely
3. **Version Events**: Plan for event schema evolution
4. **Use Snapshots**: Optimize loading large event histories
5. **Atomic Writes**: Save events in transactions
6. **Compensating Events**: For undo actions, emit inverse events
7. **Projection Async**: Projections should not block writes
8. **Event Ordering**: Preserve order within aggregates
9. **Backwards Compatibility**: New code should read old events
10. **Testing**: Test aggregates through their event history
11. **Governance**: Document event schemas thoroughly
12. **Performance**: Index events by aggregate ID and type
