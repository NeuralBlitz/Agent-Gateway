---
name: message-queues
description: Message queue best practices and patterns
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: architecture
---
## What I do
- Implement reliable message publishing and consuming
- Handle message ordering and deduplication
- Use dead letter queues for failed messages
- Implement retry with exponential backoff
- Use topic exchanges for pub/sub patterns
- Handle consumer groups and load balancing
- Design for at-least-once or exactly-once semantics
- Monitor queue health and lag

## When to use me
When implementing message queue systems (RabbitMQ, Kafka, SQS).

## RabbitMQ Patterns
```python
import pika
import json
from typing import Callable
from dataclasses import dataclass
from datetime import datetime


@dataclass
class Message:
    id: str
    type: str
    payload: dict
    timestamp: datetime
    retry_count: int = 0


class RabbitMQPublisher:
    def __init__(
        self,
        host: str = "localhost",
        port: int = 5672,
        username: str = "guest",
        password: str = "guest",
    ) -> None:
        self.host = host
        self.port = port
        self.credentials = pika.PlainCredentials(username, password)
        self.connection = None
        self.channel = None

    def connect(self):
        self.connection = pika.BlockingConnection(
            pika.ConnectionParameters(
                host=self.host,
                port=self.port,
                credentials=self.credentials,
                heartbeat=600,
                blocked_connection_timeout=300,
            )
        )
        self.channel = self.connection.channel()

        # Declare exchanges
        self.channel.exchange_declare(
            exchange='events',
            exchange_type='topic',
            durable=True
        )

        # Declare dead letter exchange
        self.channel.exchange_declare(
            exchange='events.dlx',
            exchange_type='direct',
            durable=True
        )

    def publish(
        self,
        routing_key: str,
        message: Message,
        exchange: str = 'events'
    ) -> None:
        if not self.connection or self.connection.is_closed:
            self.connect()

        properties = pika.BasicProperties(
            delivery_mode=2,  # Persistent
            content_type='application/json',
            message_id=message.id,
            timestamp=int(message.timestamp.timestamp()),
            headers={
                'retry_count': message.retry_count,
                'x-dead-letter-exchange': 'events.dlx',
                'x-dead-letter-routing-key': f'{routing_key}.dlq',
            }
        )

        self.channel.basic_publish(
            exchange=exchange,
            routing_key=routing_key,
            body=json.dumps(message.__dict__),
            properties=properties,
        )

    def close(self):
        if self.connection and not self.connection.is_closed:
            self.connection.close()


class RabbitMQConsumer:
    def __init__(
        self,
        queue_name: str,
        handler: Callable[[Message], bool],
        prefetch_count: int = 10,
    ) -> None:
        self.queue_name = queue_name
        self.handler = handler
        self.prefetch_count = prefetch_count

    def start(self):
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host='localhost')
        )
        channel = connection.channel()

        # Declare queue with dead letter config
        channel.queue_declare(
            queue=self.queue_name,
            durable=True,
            arguments={
                'x-dead-letter-exchange': 'events.dlx',
                'x-dead-letter-routing-key': f'{self.queue_name}.dlq',
                'x-message-ttl': 86400000,  # 24 hours
            }
        )

        # Dead letter queue
        channel.queue_declare(
            queue=f'{self.queue_name}.dlq',
            durable=True,
        )

        channel.basic_qos(prefetch_count=self.prefetch_count)
        channel.basic_consume(
            queue=self.queue_name,
            on_message_callback=self._handle_message,
        )

        print(f'Consumer started on queue: {self.queue_name}')
        channel.start_consuming()

    def _handle_message(self, channel, method, properties, body):
        try:
            message = Message(**json.loads(body))

            success = self.handler(message)

            if success:
                channel.basic_ack(delivery_tag=method.delivery_tag)
            else:
                # Requeue for retry
                channel.basic_nack(
                    delivery_tag=method.delivery_tag,
                    requeue=False,
                )

        except Exception as e:
            print(f"Error processing message: {e}")
            channel.basic_nack(
                delivery_tag=method.delivery_tag,
                requeue=False,
            )
```

## Kafka Patterns
```python
from kafka import KafkaProducer, KafkaConsumer
from kafka.errors import KafkaError
import json


class KafkaPublisher:
    def __init__(self, bootstrap_servers: list) -> None:
        self.producer = KafkaProducer(
            bootstrap_servers=bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            key_serializer=lambda k: k.encode('utf-8') if k else None,
            acks='all',  # Wait for all replicas
            retries=3,
            retry_backoff_ms=500,
            linger_ms=10,  # Batch messages
            batch_size=16384,
        )

    def publish(
        self,
        topic: str,
        key: str,
        value: dict,
        partition_key: str = None
    ) -> None:
        try:
            future = self.producer.send(
                topic,
                key=key,
                value=value,
                timestamp_ms=int(datetime.utcnow().timestamp() * 1000),
            )

            # Wait for confirmation
            record_metadata = future.get(timeout=10)
            print(f"Message sent to {record_metadata.topic}[{record_metadata.partition}]")

        except KafkaError as e:
            print(f"Failed to send message: {e}")
            raise


class KafkaConsumer:
    def __init__(
        self,
        bootstrap_servers: list,
        group_id: str,
        topics: list,
        auto_offset_reset: str = 'earliest',
    ) -> None:
        self.consumer = KafkaConsumer(
            *topics,
            bootstrap_servers=bootstrap_servers,
            group_id=group_id,
            auto_offset_reset=auto_offset_reset,
            enable_auto_commit=False,
            value_deserializer=lambda v: json.loads(v.decode('utf-8')),
            key_deserializer=lambda k: k.decode('utf-8') if k else None,
        )

    def consume(self, handler: callable):
        for message in self.consumer:
            try:
                handler(
                    topic=message.topic,
                    partition=message.partition,
                    offset=message.offset,
                    key=message.key,
                    value=message.value,
                )

                # Manual commit after successful processing
                self.consumer.commit()

            except Exception as e:
                print(f"Error processing message: {e}")
                # Implement retry logic or dead letter
```

## Retry with Exponential Backoff
```python
import time
from functools import wraps


def retry_with_backoff(
    max_retries: int = 3,
    initial_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            retries = 0
            delay = initial_delay

            while True:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if retries >= max_retries:
                        raise

                    retries += 1

                    time.sleep(delay)
                    delay = min(delay * exponential_base, max_delay)

                    print(f"Retry {retries}/{max_retries} after {delay:.2f}s")

        return wrapper
    return decorator
```

## SQS with Lambda
```python
import boto3
import json
from datetime import datetime


sqs = boto3.client('sqs')
queue_url = 'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue'


def send_message(message: dict, delay_seconds: int = 0) -> str:
    response = sqs.send_message(
        QueueUrl=queue_url,
        MessageBody=json.dumps(message),
        DelaySeconds=delay_seconds,
        MessageAttributes={
            'timestamp': {
                'StringValue': datetime.utcnow().isoformat(),
                'DataType': 'String',
            }
        }
    )
    return response['MessageId']


def receive_messages(max_messages: int = 10) -> list:
    response = sqs.receive_message(
        QueueUrl=queue_url,
        MaxNumberOfMessages=max_messages,
        WaitTimeSeconds=20,
        MessageAttributeNames=['All'],
    )
    return response.get('Messages', [])


def delete_message(receipt_handle: str):
    sqs.delete_message(
        QueueUrl=queue_url,
        ReceiptHandle=receipt_handle,
    )
```
