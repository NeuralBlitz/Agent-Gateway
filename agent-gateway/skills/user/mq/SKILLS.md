# Message Queue Skill

Message queue management (RabbitMQ, Kafka, SQS).

## Commands

### List Queues
```
/mq list
```
List all queues.

### Create Queue
```
/mq create <name>
```
Create new queue.

### Delete Queue
```
/mq delete <queue>
```
Delete queue.

### Queue Info
```
/mq info <queue>
```
Show queue details.

### Messages
```
/mq messages <queue>
```
Show queue messages.

### Purge Queue
```
/mq purge <queue>
```
Clear all messages.

### Publish
```
/mq publish <queue> <message>
```
Publish message to queue.

### Consume
```
/mq consume <queue>
```
Consume messages from queue.

### List Topics
```
/mq topics
```
List topics (Kafka).

### Create Topic
```
/mq create-topic <name>
```
Create topic.

### Delete Topic
```
/mq delete-topic <name>
```
Delete topic.

### Consumer Groups
```
/mq groups
```
List consumer groups.

### Offsets
```
/mq offsets <topic>
```
Show topic offsets.

### Connections
```
/mq connections
```
Show active connections.

### Stats
```
/mq stats
```
Show queue statistics.

## Examples

```
/mq list
/mq create my-queue
/mq delete old-queue
/mq info tasks
/mq messages my-queue
/mq purge notifications
/mq publish my-queue "Hello World"
/mq consume my-queue
/mq topics
/mq create-topic events
/mq consumer-groups
/mq offsets user-events
/mq stats
```
