---
name: Event-Driven Architecture
description: Software architecture pattern using events to trigger communication between decoupled services
category: software-development
---
# Event-Driven Architecture

## What I do

I provide a design pattern where system components communicate through the production and consumption of events. EDA enables loose coupling between services, allowing them to evolve independently. Events represent significant occurrences in the system—state changes, domain events, or integration signals. Services react to events asynchronously, enabling scalability, resilience, and real-time processing capabilities.

## When to use me

Use EDA when services need to communicate without tight coupling, when real-time processing is required, or when multiple consumers need the same information. It's ideal for microservices architectures, complex event processing, and systems requiring scalability. EDA shines when you have multiple independent components that need to stay synchronized. Avoid it for simple request-response workflows or when synchronous behavior is required.

## Core Concepts

- **Event**: Something that happened in the system
- **Event Producer**: Service that generates events
- **Event Consumer**: Service that processes events
- **Event Channel**: Transport mechanism for events
- **Event Broker**: Middleware managing event distribution
- **Pub/Sub Model**: Multiple consumers subscribe to event types
- **Event Sourcing**: Storing state changes as event sequence
- **CQRS**: Separating read and write models
- **Saga Pattern**: Managing distributed transactions
- **Idempotency**: Processing events safely multiple times
- **Event Ordering**: Maintaining sequence for related events

## Code Examples

### Basic Event System

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Protocol, TypeVar, Generic
from uuid import UUID, uuid4
import json

T = TypeVar("T")

@dataclass
class Event:
    event_id: UUID
    event_type: str
    occurred_at: datetime
    payload: dict

class EventPublisher(Protocol):
    def publish(self, event: Event) -> None:
        pass

class EventConsumer(Protocol):
    def handle(self, event: Event) -> None:
        pass

class InMemoryEventBus:
    def __init__(self):
        self._subscribers: dict[str, list[EventConsumer]] = {}
        self._events: list[Event] = []
    
    def subscribe(self, event_type: str, handler: EventConsumer) -> None:
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(handler)
    
    def publish(self, event: Event) -> None:
        self._events.append(event)
        event_type = event.event_type
        if event_type in self._subscribers:
            for handler in self._subscribers[event_type]:
                try:
                    handler.handle(event)
                except Exception as e:
                    print(f"Error handling {event_type}: {e}")

class DomainEvent(Event):
    def __init__(self, event_type: str, payload: dict):
        super().__init__(
            event_id=uuid4(),
            event_type=event_type,
            occurred_at=datetime.utcnow(),
            payload=payload
        )

class UserService:
    def __init__(self, publisher: EventPublisher):
        self._publisher = publisher
        self._users: dict[UUID, dict] = {}
    
    def create_user(self, name: str, email: str) -> UUID:
        user_id = uuid4()
        self._users[user_id] = {"id": user_id, "name": name, "email": email}
        
        event = DomainEvent(
            event_type="UserCreated",
            payload={"user_id": str(user_id), "email": email}
        )
        self._publisher.publish(event)
        return user_id
    
    def update_email(self, user_id: UUID, new_email: str) -> None:
        if user_id not in self._users:
            raise ValueError("User not found")
        old_email = self._users[user_id]["email"]
        self._users[user_id]["email"] = new_email
        
        event = DomainEvent(
            event_type="UserEmailChanged",
            payload={
                "user_id": str(user_id),
                "old_email": old_email,
                "new_email": new_email
            }
        )
        self._publisher.publish(event)

class NotificationHandler(EventConsumer):
    def handle(self, event: Event) -> None:
        if event.event_type == "UserCreated":
            print(f"Sending welcome email to {event.payload['email']}")
        elif event.event_type == "UserEmailChanged":
            print(f"Email changed from {event.payload['old_email']} to {event.payload['new_email']}")
```

### Message Broker with RabbitMQ

```python
import pika
import json
from dataclasses import asdict
from datetime import datetime
from typing import Callable
from uuid import uuid4

class RabbitMQEventBus:
    def __init__(
        self,
        host: str = "localhost",
        queue_prefix: str = "events_"
    ):
        self.host = host
        self.queue_prefix = queue_prefix
        self._connection: pika.BlockingConnection | None = None
        self._channel: pika.channel.Channel | None = None
        self._handlers: dict[str, list[Callable]] = {}
    
    def connect(self) -> None:
        credentials = pika.PlainCredentials("guest", "guest")
        parameters = pika.ConnectionParameters(
            host=self.host,
            credentials=credentials
        )
        self._connection = pika.BlockingConnection(parameters)
        self._channel = self._connection.channel()
    
    def publish(self, exchange: str, routing_key: str, message: dict) -> None:
        if self._connection is None or self._connection.is_closed:
            self.connect()
        
        self._channel.basic_publish(
            exchange=exchange,
            routing_key=routing_key,
            body=json.dumps(message),
            properties=pika.BasicProperties(
                delivery_mode=2,
                content_type="application/json",
                timestamp=int(datetime.utcnow().timestamp())
            )
        )
    
    def subscribe(
        self,
        exchange: str,
        queue: str,
        routing_key: str,
        handler: Callable
    ) -> None:
        if self._connection is None or self._connection.is_closed:
            self.connect()
        
        self._channel.exchange_declare(
            exchange=exchange,
            exchange_type="topic",
            durable=True
        )
        
        full_queue = f"{self.queue_prefix}{queue}"
        self._channel.queue_declare(queue=full_queue, durable=True)
        self._channel.queue_bind(
            exchange=exchange,
            queue=full_queue,
            routing_key=routing_key
        )
        
        def on_message(channel, method, properties, body):
            try:
                message = json.loads(body)
                handler(message)
                channel.basic_ack(delivery_tag=method.delivery_tag)
            except Exception as e:
                print(f"Error: {e}")
                channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
        
        self._channel.basic_consume(
            queue=full_queue,
            on_message_callback=on_message
        )
    
    def start_consuming(self) -> None:
        if self._channel:
            self._channel.start_consuming()
    
    def close(self) -> None:
        if self._connection and not self._connection.is_closed:
            self._connection.close()

class OrderEventPublisher:
    def __init__(self, bus: RabbitMQEventBus):
        self.bus = bus
        self.exchange = "orders"
    
    def publish_order_created(self, order_id: str, customer_id: str, total: float) -> None:
        message = {
            "event_type": "OrderCreated",
            "order_id": order_id,
            "customer_id": customer_id,
            "total": total,
            "timestamp": datetime.utcnow().isoformat()
        }
        self.bus.publish(
            exchange=self.exchange,
            routing_key="order.created",
            message=message
        )
    
    def publish_order_shipped(self, order_id: str, tracking: str) -> None:
        message = {
            "event_type": "OrderShipped",
            "order_id": order_id,
            "tracking_number": tracking,
            "timestamp": datetime.utcnow().isoformat()
        }
        self.bus.publish(
            exchange=self.exchange,
            routing_key="order.shipped",
            message=message
        )
```

### Async Processing with Kafka

```python
from kafka import KafkaProducer, KafkaConsumer
from kafka.errors import KafkaError
import json
from datetime import datetime
from typing import Optional

class KafkaEventProducer:
    def __init__(self, bootstrap_servers: list[str]):
        self.producer = KafkaProducer(
            bootstrap_servers=bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            key_serializer=lambda k: k.encode("utf-8") if k else None
        )
    
    def send(
        self,
        topic: str,
        key: str,
        value: dict,
        partition: Optional[int] = None
    ) -> None:
        future = self.producer.send(
            topic,
            key=key,
            value=value,
            partition=partition
        )
        try:
            record_metadata = future.get(timeout=10)
            print(f"Sent to {record_metadata.topic}[{record_metadata.partition}]")
        except KafkaError as e:
            print(f"Error sending: {e}")
    
    def send_event(
        self,
        topic: str,
        event_type: str,
        payload: dict
    ) -> None:
        event = {
            "event_type": event_type,
            "payload": payload,
            "timestamp": datetime.utcnow().isoformat()
        }
        self.send(topic, key=event_type, value=event)
    
    def close(self) -> None:
        self.producer.flush()
        self.producer.close()

class KafkaEventConsumer:
    def __init__(
        self,
        bootstrap_servers: list[str],
        group_id: str,
        topics: list[str]
    ):
        self.consumer = KafkaConsumer(
            *topics,
            bootstrap_servers=bootstrap_servers,
            group_id=group_id,
            value_deserializer=lambda v: json.loads(v.decode("utf-8")),
            auto_offset_reset="earliest",
            enable_auto_commit=True
        )
    
    def consume(self, handler: callable, timeout_seconds: float = 1.0) -> None:
        for message in self.consumer:
            try:
                handler(message.topic, message.value)
            except Exception as e:
                print(f"Error processing: {e}")
    
    def close(self) -> None:
        self.consumer.close()

class InventoryEventHandler:
    def handle_order_created(self, order_data: dict) -> None:
        for item in order_data.get("items", []):
            self._reserve_inventory(
                product_id=item["product_id"],
                quantity=item["quantity"],
                order_id=order_data["order_id"]
            )
    
    def _reserve_inventory(
        self,
        product_id: str,
        quantity: int,
        order_id: str
    ) -> None:
        print(f"Reserving {quantity} of {product_id} for order {order_id}")
```

### Event Processing Pipeline

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Callable
from uuid import uuid4

@dataclass
class ProcessedEvent:
    event_id: str
    event_type: str
    processed_at: datetime
    result: dict

class EventProcessor(ABC):
    @abstractmethod
    def can_process(self, event_type: str) -> bool:
        pass
    
    @abstractmethod
    def process(self, event: dict) -> ProcessedEvent:
        pass

class EnrichmentProcessor(EventProcessor):
    def __init__(self, enrichment_service):
        self._service = enrichment_service
    
    def can_process(self, event_type: str) -> bool:
        return event_type == "OrderCreated"
    
    def process(self, event: dict) -> ProcessedEvent:
        enriched = self._service.enrich_order(event)
        return ProcessedEvent(
            event_id=str(uuid4()),
            event_type=event["event_type"],
            processed_at=datetime.utcnow(),
            result=enriched
        )

class ValidationProcessor(EventProcessor):
    def can_process(self, event_type: str) -> bool:
        return event_type in ["OrderCreated", "OrderUpdated"]
    
    def process(self, event: dict) -> ProcessedEvent:
        errors = self._validate(event)
        if errors:
            raise ValueError(f"Validation failed: {errors}")
        return ProcessedEvent(
            event_id=str(uuid4()),
            event_type=event["event_type"],
            processed_at=datetime.utcnow(),
            result={"status": "valid"}
        )
    
    def _validate(self, event: dict) -> list[str]:
        errors = []
        if not event.get("order_id"):
            errors.append("Missing order_id")
        if not event.get("items"):
            errors.append("Order must have items")
        return errors

class EventPipeline:
    def __init__(self):
        self._processors: list[EventProcessor] = []
    
    def add_processor(self, processor: EventProcessor) -> None:
        self._processors.append(processor)
    
    def process(self, event: dict) -> list[ProcessedEvent]:
        event_type = event.get("event_type", "unknown")
        results = []
        
        for processor in self._processors:
            if processor.can_process(event_type):
                try:
                    result = processor.process(event)
                    results.append(result)
                except Exception as e:
                    print(f"Processor failed: {e}")
        
        return results
```

### Saga Implementation

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum
from typing import Protocol
from uuid import uuid4

class SagaStepStatus(Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    COMPENSATING = "compensating"

@dataclass
class SagaContext:
    saga_id: str
    data: dict
    completed_steps: list[str] = []

class Saga(ABC):
    def __init__(self):
        self.saga_id = str(uuid4())
        self.context: SagaContext | None = None
    
    @abstractmethod
    def get_steps(self) -> list['SagaStep']:
        pass
    
    def execute(self, initial_data: dict) -> bool:
        self.context = SagaContext(
            saga_id=self.saga_id,
            data=initial_data
        )
        
        for step in self.get_steps():
            try:
                step.execute(self.context)
                self.context.completed_steps.append(step.name)
            except Exception as e:
                print(f"Step {step.name} failed: {e}")
                self._compensate(step.name)
                return False
        
        return True
    
    def _compensate(self, failed_step_name: str) -> None:
        steps = self.get_steps()
        for step in reversed(steps):
            if step.name == failed_step_name:
                break
            if step.name in self.context.completed_steps:
                try:
                    step.compensate(self.context)
                except Exception as e:
                    print(f"Compensation failed for {step.name}: {e}")

class SagaStep(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        pass
    
    @abstractmethod
    def execute(self, context: SagaContext) -> None:
        pass
    
    @abstractmethod
    def compensate(self, context: SagaContext) -> None:
        pass

class OrderSaga(Saga):
    def get_steps(self) -> list[SagaStep]:
        return [
            ValidateOrderStep(),
            ReserveInventoryStep(),
            ProcessPaymentStep(),
            CreateShipmentStep()
        ]

class ValidateOrderStep(SagaStep):
    @property
    def name(self) -> str:
        return "validate_order"
    
    def execute(self, context: SagaContext) -> None:
        print(f"Validating order {context.data.get('order_id')}")
        context.data["validated"] = True
    
    def compensate(self, context: SagaContext) -> None:
        print("No compensation needed for validation")

class ReserveInventoryStep(SagaStep):
    @property
    def name(self) -> str:
        return "reserve_inventory"
    
    def execute(self, context: SagaContext) -> None:
        print(f"Reserving inventory for order")
        context.data["inventory_reserved"] = True
    
    def compensate(self, context: SagaContext) -> None:
        print("Releasing inventory reservation")
        context.data["inventory_reserved"] = False
```

## Best Practices

1. **Design for Failure**: Expect and handle event processing failures
2. **Idempotency**: Handle duplicate events safely
3. **Event Ordering**: Use partitioning for ordering guarantees
4. **Schema Management**: Use event schemas (Avro, Protobuf)
5. **Dead Letter Queues**: Capture unprocessable events
6. **Monitoring**: Track event processing latency and errors
7. **Testing**: Test event consumers in isolation
8. **Versioning**: Support multiple event schema versions
9. **Consumer Groups**: Scale consumers horizontally
10. **Replayability**: Support event replay for debugging
11. **CQRS Consideration**: Use EDA naturally with CQRS
12. **Saga Management**: Implement distributed transactions carefully
