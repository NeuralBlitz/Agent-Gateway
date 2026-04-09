# Multi-Shell Distributed System

A comprehensive multi-shell distributed system for parallel execution, inter-shell messaging, and coordination.

## Commands

### Start System
```
/multishell start
```
Start all multi-shell services (task workers, chat, job queue, log aggregator, load balancer, pub/sub, file watcher).

### Stop System
```
/multishell stop
```
Stop all running services.

### Status
```
/multishell status
```
Show running services, queues, sockets, and active workers.

### Submit Task
```
/multishell task submit <command> [priority]
```
Submit a task to the parallel execution queue. Priority: high, normal, low.

### List Tasks
```
/multishell task list
```
Show pending tasks in queue.

### Join Chat
```
/multishell chat join <username>
```
Join the inter-shell chat system.

### Send Chat Message
```
/multishell chat send <username> <message>
```
Send a message to another user.

### Submit Job
```
/multishell job submit <type> <data> [priority]
```
Submit a job to the distributed job queue.

### Register Worker
```
/multishell worker register <id> [capacity]
```
Register a worker with the load balancer.

### Subscribe to Topic
```
/multishell pubsub subscribe <id> <topic>
```
Subscribe to a pub/sub topic.

### Publish Message
```
/multishell pubsub publish <id> <topic> <message>
```
Publish a message to a topic.

### Add File Watch
```
/multishell watch add <path> <pattern> <command>
```
Watch a file/directory for changes and trigger an action.

### Cleanup
```
/multishell cleanup
```
Stop all services and clean up all resources.

## Examples

```
/multishell start
/multishell task submit "ls -la" high
/multishell chat join myuser
/multishell worker register worker1 10
/multishell status
/multishell stop
```
