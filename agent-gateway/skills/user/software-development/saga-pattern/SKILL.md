---
name: Saga Pattern
description: Managing distributed transactions through coordinated sequences of local transactions with compensating actions
category: software-development
---
# Saga Pattern

## What I do

I provide a pattern for managing distributed transactions across multiple services without traditional two-phase commit. Sagas coordinate a sequence of local transactions, where each transaction updates data and publishes an event to trigger the next step. If a step fails, compensating transactions undo previous steps, maintaining data consistency across services. This enables long-running business processes while preserving eventual consistency.

## When to use me

Use sagas when you need to coordinate actions across multiple microservices or bounded contexts, especially when traditional distributed transactions are impractical. Sagas are ideal for long-running business workflows, order processing, booking systems, or any multi-step process spanning services. Avoid sagas when ACID transactions within a single service are sufficient, or when strict immediate consistency is required across all steps.

## Core Concepts

- **Saga**: Sequence of local transactions with compensating actions
- **Local Transaction**: Single service operation with its own database
- **Compensating Transaction**: Action that undoes a local transaction
- **Choreography**: Distributed coordination via events
- **Orchestration**: Central coordinator managing saga flow
- **Saga State**: Tracking progress and handling failures
- **Idempotency**: Safe to execute steps multiple times
- **Retry Strategies**: Handling transient failures
- **Timeout Management**: Preventing hung sagas
- **Checkpointing**: Saving saga state for recovery

## Code Examples

### Choreography-Based Saga

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Protocol, Callable
from uuid import UUID, uuid4

@dataclass
class OrderCreated:
    order_id: UUID
    customer_id: UUID
    items: list[dict]
    total: float
    timestamp: datetime = datetime.utcnow()

@dataclass
class PaymentProcessed:
    order_id: UUID
    payment_id: UUID
    amount: float
    timestamp: datetime = datetime.utcnow()

@dataclass
class InventoryReserved:
    order_id: UUID
    reservation_id: UUID
    items: list[dict]
    timestamp: datetime = datetime.utcnow()

@dataclass
class OrderShipped:
    order_id: UUID
    tracking_number: str
    carrier: str
    timestamp: datetime = datetime.utcnow()

@dataclass
class OrderCancelled:
    order_id: UUID
    reason: str
    timestamp: datetime = datetime.utcnow()

class EventBus(Protocol):
    def publish(self, event: object) -> None:
        pass

class OrderService:
    def __init__(self, event_bus: EventBus):
        self._event_bus = event_bus
        self._orders: dict[UUID, dict] = {}
    
    def create_order(self, customer_id: UUID, items: list[dict]) -> OrderCreated:
        order_id = uuid4()
        total = sum(item["price"] * item["quantity"] for item in items)
        
        order = {
            "order_id": order_id,
            "customer_id": customer_id,
            "items": items,
            "total": total,
            "status": "created"
        }
        self._orders[order_id] = order
        
        event = OrderCreated(
            order_id=order_id,
            customer_id=customer_id,
            items=items,
            total=total
        )
        self._event_bus.publish(event)
        return event

class PaymentService:
    def __init__(self, event_bus: EventBus):
        self._event_bus = event_bus
        self._payments: dict[UUID, dict] = {}
    
    def handle_order_created(self, event: OrderCreated) -> None:
        payment_id = uuid4()
        payment = {
            "payment_id": payment_id,
            "order_id": event.order_id,
            "amount": event.total,
            "status": "processing"
        }
        self._payments[payment_id] = payment
        
        payment_event = PaymentProcessed(
            order_id=event.order_id,
            payment_id=payment_id,
            amount=event.total
        )
        self._event_bus.publish(payment_event)
    
    def refund(self, order_id: UUID) -> None:
        for payment in self._payments.values():
            if payment["order_id"] == order_id:
                payment["status"] = "refunded"

class InventoryService:
    def __init__(self, event_bus: EventBus):
        self._event_bus = event_bus
        self._reservations: dict[UUID, dict] = {}
        self._inventory: dict[str, int] = {"P001": 100, "P002": 50}
    
    def handle_order_created(self, event: OrderCreated) -> None:
        reservation_id = uuid4()
        reserved_items = []
        
        for item in event.items:
            product_id = item["product_id"]
            if self._inventory.get(product_id, 0) >= item["quantity"]:
                self._inventory[product_id] -= item["quantity"]
                reserved_items.append(item)
        
        reservation = {
            "reservation_id": reservation_id,
            "order_id": event.order_id,
            "items": reserved_items,
            "status": "reserved"
        }
        self._reservations[reservation_id] = reservation
        
        self._event_bus.publish(InventoryReserved(
            order_id=event.order_id,
            reservation_id=reservation_id,
            items=reserved_items
        ))
    
    def release(self, order_id: UUID) -> None:
        for reservation in self._reservations.values():
            if reservation["order_id"] == order_id:
                for item in reservation["items"]:
                    self._inventory[item["product_id"]] += item["quantity"]
                reservation["status"] = "released"

class ShippingService:
    def __init__(self, event_bus: EventBus):
        self._event_bus = event_bus
        self._shipments: dict[UUID, dict] = {}
    
    def handle_inventory_reserved(self, event: InventoryReserved) -> None:
        shipment_id = uuid4()
        tracking = f"TRK-{uuid4().hex[:8].upper()}"
        
        shipment = {
            "shipment_id": shipment_id,
            "order_id": event.order_id,
            "tracking_number": tracking,
            "status": "shipped"
        }
        self._shipments[shipment_id] = shipment
        
        self._event_bus.publish(OrderShipped(
            order_id=event.order_id,
            tracking_number=tracking,
            carrier="FEDEX"
        ))
```

### Orchestration-Based Saga

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Protocol, Optional
from uuid import UUID, uuid4

@dataclass
class SagaContext:
    saga_id: UUID
    order_id: UUID
    customer_id: UUID
    items: list[dict]
    total: float
    step_results: dict[str, dict] = field(default_factory=dict)
    current_step: str = ""
    is_completed: bool = False
    is_compensating: bool = False

class SagaStep(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        pass
    
    @abstractmethod
    def execute(self, context: SagaContext) -> dict:
        pass
    
    @abstractmethod
    def compensate(self, context: SagaContext, step_result: dict) -> None:
        pass

class CreateOrderStep(SagaStep):
    @property
    def name(self) -> str:
        return "create_order"
    
    def execute(self, context: SagaContext) -> dict:
        return {"order_id": str(context.order_id), "status": "created"}
    
    def compensate(self, context: SagaContext, step_result: dict) -> None:
        print(f"Compensating: Order {step_result['order_id']} cancelled")

class ProcessPaymentStep(SagaStep):
    @property
    def name(self) -> str:
        return "process_payment"
    
    def execute(self, context: SagaContext) -> dict:
        return {"payment_id": str(uuid4()), "amount": context.total}
    
    def compensate(self, context: SagaContext, step_result: dict) -> None:
        print(f"Compensating: Refunding payment {step_result['payment_id']}")

class ReserveInventoryStep(SagaStep):
    @property
    def name(self) -> str:
        return "reserve_inventory"
    
    def execute(self, context: SagaContext) -> dict:
        return {"reservation_id": str(uuid4()), "items": context.items}
    
    def compensate(self, context: SagaContext, step_result: dict) -> None:
        print(f"Compensating: Releasing inventory {step_result['reservation_id']}")

class ShipOrderStep(SagaStep):
    @property
    def name(self) -> str:
        return "ship_order"
    
    def execute(self, context: SagaContext) -> dict:
        return {"tracking_number": f"TRK-{uuid4().hex[:8].upper()}"}
    
    def compensate(self, context: SagaContext, step_result: dict) -> None:
        print(f"Compensating: Canceling shipment {step_result['tracking_number']}")

class OrderProcessingSaga:
    def __init__(self):
        self._steps: list[SagaStep] = [
            CreateOrderStep(),
            ProcessPaymentStep(),
            ReserveInventoryStep(),
            ShipOrderStep()
        ]
    
    def execute(self, context: SagaContext) -> bool:
        try:
            for step in self._steps:
                context.current_step = step.name
                result = step.execute(context)
                context.step_results[step.name] = result
            
            context.is_completed = True
            return True
        
        except Exception as e:
            print(f"Saga failed at step {context.current_step}: {e}")
            self._compensate(context)
            return False
    
    def _compensate(self, context: SagaContext) -> None:
        context.is_compensating = True
        completed_steps = [
            name for name in self._steps
            if name in context.step_results
        ]
        
        for step_name in reversed(completed_steps):
            step = next(s for s in self._steps if s.name == step_name)
            result = context.step_results[step_name]
            try:
                step.compensate(context, result)
            except Exception as e:
                print(f"Compensation failed for {step_name}: {e}")

class SagaOrchestrator:
    def __init__(self):
        self._saga_store: dict[UUID, SagaContext] = {}
        self._saga_factories: dict[str, callable] = {
            "order": lambda: OrderProcessingSaga()
        }
    
    def start_saga(
        self,
        saga_type: str,
        order_id: UUID,
        customer_id: UUID,
        items: list[dict],
        total: float
    ) -> UUID:
        saga_id = uuid4()
        context = SagaContext(
            saga_id=saga_id,
            order_id=order_id,
            customer_id=customer_id,
            items=items,
            total=total
        )
        self._saga_store[saga_id] = context
        
        saga_factory = self._saga_factories.get(saga_type)
        if not saga_factory:
            raise ValueError(f"Unknown saga type: {saga_type}")
        
        saga = saga_factory()
        success = saga.execute(context)
        
        if success:
            print(f"Saga {saga_id} completed successfully")
        else:
            print(f"Saga {saga_id} failed and compensated")
        
        return saga_id
```

### Saga with Retry and Timeout

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Protocol
from uuid import UUID

@dataclass
class SagaStepResult:
    step_name: str
    success: bool
    result: dict | None = None
    error: str | None = None
    retry_count: int = 0

class RetryableStep(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        pass
    
    @property
    @abstractmethod
    def max_retries(self) -> int:
        pass
    
    @property
    @abstractmethod
    def retry_delay_seconds(self) -> int:
        pass
    
    @abstractmethod
    def execute_with_retry(self, context: 'SagaContext') -> SagaStepResult:
        pass

class ResilientSagaOrchestrator:
    def __init__(self):
        self._active_sagas: dict[UUID, 'SagaContext'] = {}
        self._timeout_minutes: int = 30
    
    def execute_step(
        self,
        context: 'SagaContext',
        step: RetryableStep
    ) -> SagaStepResult:
        result = SagaStepResult(step.name, False)
        
        for attempt in range(step.max_retries + 1):
            try:
                result = SagaStepResult(
                    step_name=step.name,
                    success=True,
                    result=step.execute_with_retry(context),
                    retry_count=attempt
                )
                break
            
            except TransientError as e:
                result.error = str(e)
                result.retry_count = attempt
                if attempt < step.max_retries:
                    import time
                    time.sleep(step.retry_delay_seconds)
        
        return result
    
    def start_with_timeout(self, context: 'SagaContext') -> None:
        self._active_sagas[context.saga_id] = context
        import threading
        timer = threading.Timer(
            self._timeout_minutes * 60,
            self._handle_timeout,
            args=[context.saga_id]
        )
        timer.start()
    
    def _handle_timeout(self, saga_id: UUID) -> None:
        if saga_id in self._active_sagas:
            context = self._active_sagas[saga_id]
            print(f"Saga {saga_id} timed out, initiating compensation")
            self._compensate_all(context)
            del self._active_sagas[saga_id]
    
    def _compensate_all(self, context: 'SagaContext') -> None:
        pass

class TransientError(Exception):
    pass
```

### Saga Persistence and Recovery

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Protocol
from uuid import UUID

@dataclass
class SagaState:
    saga_id: UUID
    saga_type: str
    status: str
    current_step: str
    step_results: dict
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None

class SagaStore(Protocol):
    @abstractmethod
    def save(self, state: SagaState) -> None:
        pass
    
    @abstractmethod
    def load(self, saga_id: UUID) -> SagaState | None:
        pass
    
    @abstractmethod
    def update_status(self, saga_id: UUID, status: str, current_step: str) -> None:
        pass
    
    @abstractmethod
    def get_pending_sagas(self) -> list[SagaState]:
        pass

class PersistentSagaOrchestrator:
    def __init__(self, saga_store: SagaStore):
        self._store = saga_store
        self._active_sagas: dict[UUID, 'SagaContext'] = {}
    
    def start_saga(
        self,
        saga_type: str,
        saga_id: UUID,
        initial_data: dict
    ) -> None:
        context = SagaContext(
            saga_id=saga_id,
            order_id=initial_data.get("order_id", uuid4()),
            customer_id=initial_data.get("customer_id", uuid4()),
            items=initial_data.get("items", []),
            total=initial_data.get("total", 0)
        )
        
        self._active_sagas[saga_id] = context
        
        state = SagaState(
            saga_id=saga_id,
            saga_type=saga_type,
            status="running",
            current_step="",
            step_results={},
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        self._store.save(state)
    
    def recover_sagas(self) -> None:
        pending = self._store.get_pending_sagas()
        for state in pending:
            self._resume_saga(state)
    
    def _resume_saga(self, state: SagaState) -> None:
        if state.saga_id not in self._active_sagas:
            print(f"Resuming saga {state.saga_id}")
        
        context = self._active_sagas.get(state.saga_id)
        if context:
            context.step_results = state.step_results
    
    def record_step_start(self, saga_id: UUID, step_name: str) -> None:
        self._store.update_status(saga_id, "running", step_name)
    
    def record_step_complete(
        self,
        saga_id: UUID,
        step_name: str,
        result: dict
    ) -> None:
        if saga_id in self._active_sagas:
            self._active_sagas[saga_id].step_results[step_name] = result
        self._store.save(SagaState(
            saga_id=saga_id,
            saga_type="",
            status="running",
            current_step=step_name,
            step_results={},
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        ))
```

### Distributed Saga with Compensation

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Protocol

@dataclass
class BookingRequest:
    hotel_id: str
    flight_id: str
    customer_id: str
    start_date: str
    end_date: str

@dataclass
class HotelBooking:
    confirmation_number: str

@dataclass
class FlightBooking:
    reservation_code: str

class HotelService(Protocol):
    def book(self, request: BookingRequest) -> HotelBooking:
        pass
    
    def cancel(self, confirmation_number: str) -> None:
        pass

class FlightService(Protocol):
    def book(self, request: BookingRequest) -> FlightBooking:
        pass
    
    def cancel(self, reservation_code: str) -> None:
        pass

class TripBookingSaga:
    def __init__(
        self,
        hotel_service: HotelService,
        flight_service: FlightService
    ):
        self._hotel = hotel_service
        self._flight = flight_service
        self._completed_steps: list[str] = []
    
    def execute(self, request: BookingRequest) -> dict:
        try:
            hotel_booking = self._hotel.book(request)
            self._completed_steps.append("hotel")
            
            flight_booking = self._flight.book(request)
            self._completed_steps.append("flight")
            
            return {
                "status": "success",
                "hotel_confirmation": hotel_booking.confirmation_number,
                "flight_reservation": flight_booking.reservation_code
            }
        
        except Exception as e:
            print(f"Trip booking failed: {e}")
            self._compensate()
            raise
    
    def _compensate(self) -> None:
        for step in reversed(self._completed_steps):
            if step == "flight":
                for booking in self._flight_bookings:
                    self._flight.cancel(booking.reservation_code)
            elif step == "hotel":
                for booking in self._hotel_bookings:
                    self._hotel.cancel(booking.confirmation_number)
        self._completed_steps.clear()
    
    @property
    def _flight_bookings(self) -> list[FlightBooking]:
        return []
    
    @property
    def _hotel_bookings(self) -> list[HotelBooking]:
        return []
```

## Best Practices

1. **Keep Sagas Short**: Limit the number of steps
2. **Idempotent Steps**: Handle retries safely
3. **Compensating Logic**: Each step must have undo logic
4. **Timeout Handling**: Prevent hung sagas
5. **Saga State Persistence**: Recover from crashes
6. **Avoid Cross-Dependencies**: Steps should be independent
7. **Eventual Consistency**: Accept intermediate states
8. **Testing**: Test happy path and all failure scenarios
9. **Monitoring**: Track saga execution times
10. **Documentation**: Document saga flows clearly
11. **Choreography vs Orchestration**: Choose based on complexity
12. **Retry Strategies**: Handle transient failures with backoff
