---
name: Distributed Systems
description: Design and implementation of fault-tolerant, scalable distributed computing systems including consensus algorithms, distributed transactions, CAP theorem trade-offs, and node communication patterns
license: MIT
compatibility: universal
audience: Backend Engineers, Systems Architects, Infrastructure Engineers
category: Computer Science

---

# Distributed Systems

## What I Do

I specialize in the design, architecture, and implementation of distributed systems—software systems where components are located on networked computers that coordinate through message passing. My expertise spans consensus algorithms (Raft, Paxos), distributed transactions (two-phase commit, saga patterns), consistency models (eventual, strong, causal), fault tolerance strategies, and system scalability patterns. I work with distributed databases, message queues, service meshes, and microservices architectures, focusing on achieving reliability, availability, and partition tolerance while managing the inherent complexity of networked systems.

## When to Use Me

- Building distributed databases or key-value stores
- Implementing microservices with service discovery and load balancing
- Designing consensus-based systems (distributed locks, coordination)
- Creating event-driven architectures with message brokers
- Implementing distributed transactions across services
- Building fault-tolerant systems with redundancy and failover
- Scaling stateless services horizontally
- Designing systems that must handle network partitions gracefully

## Core Concepts

1. **CAP Theorem**: Trade-offs between Consistency, Availability, and Partition Tolerance in distributed design
2. **Consensus Algorithms**: Raft, Paxos, and Practical Byzantine Fault Tolerance for agreement
3. **Distributed Transactions**: Two-phase commit, three-phase commit, and saga patterns for atomic operations
4. **Consistency Models**: Strong, eventual, causal, and linearizable consistency guarantees
5. **Fault Tolerance**: Replication, redundancy, timeouts, retries, and circuit breakers
6. **Load Balancing**: Client-side, server-side, and DNS-based load distribution strategies
7. **Service Discovery**: Dynamic service registration, discovery, and health checking
8. **Message Passing**: gRPC, message queues (Kafka, RabbitMQ, Pulsar), and event streaming
9. **Distributed Tracing**: Request correlation, span tracking, and observability across services
10. **Clock Synchronization**: Logical clocks, vector clocks, and hybrid logical clocks

## Code Examples

```python
# Raft Consensus Algorithm - Leader Election
import threading
import time
import random
from enum import Enum
from dataclasses import dataclass
from typing import Optional, List

class NodeState(Enum):
    FOLLOWER = "follower"
    CANDIDATE = "candidate"
    LEADER = "leader"

@dataclass
class LogEntry:
    term: int
    index: int
    command: str

class RaftNode:
    def __init__(self, node_id: int, peers: List['RaftNode']):
        self.node_id = node_id
        self.peers = peers
        self.state = NodeState.FOLLOWER
        self.current_term = 0
        self.voted_for: Optional[int] = None
        self.log: List[LogEntry] = []
        
        self.votes_received = 0
        self.election_timeout = random.uniform(150, 300)  # ms
        self.last_heartbeat = time.time()
        
        self.commit_index = -1
        self.last_applied = -1
        
        self.lock = threading.Lock()
        self.election_timer: Optional[threading.Timer] = None
    
    def start_election(self):
        with self.lock:
            if self.state == NodeState.LEADER:
                return
            
            self.state = NodeState.CANDIDATE
            self.current_term += 1
            self.voted_for = self.node_id
            self.votes_received = 1
    
    def request_votes(self) -> bool:
        """Request votes from all peers. Returns True if majority won."""
        votes = 1  # Vote for self
        
        for peer in self.peers:
            if peer.vote_response(self.current_term, self.node_id):
                votes += 1
        
        majority = len(self.peers) // 2 + 1
        return votes >= majority
    
    def vote_response(self, candidate_term: int, candidate_id: int) -> bool:
        """Respond to a vote request."""
        if candidate_term < self.current_term:
            return False
        
        if candidate_term == self.current_term:
            if self.voted_for is None or self.voted_for == candidate_id:
                self.voted_for = candidate_id
                self.last_heartbeat = time.time()
                return True
        
        return False
    
    def append_entries(self, leader_id: int, term: int, 
                       entries: List[LogEntry], 
                       leader_commit: int) -> bool:
        """Handle heartbeat or log replication from leader."""
        if term < self.current_term:
            return False
        
        self.last_heartbeat = time.time()
        
        if self.state == NodeState.CANDIDATE:
            self.state = NodeState.FOLLOWER
        
        if term > self.current_term:
            self.current_term = term
        
        # Append entries if any
        if entries:
            self.log.extend(entries)
        
        if leader_commit > self.commit_index:
            self.commit_index = min(leader_commit, len(self.log) - 1)
        
        return True
    
    def become_leader(self):
        with self.lock:
            self.state = NodeState.LEADER
            # Initialize nextIndex for each peer
            self.next_index = {peer.node_id: len(self.log) for peer in self.peers}
            self.match_index = {peer.node_id: -1 for peer in self.peers}
    
    def start_heartbeat_loop(self):
        """Leader sends heartbeats to all followers."""
        while self.state == NodeState.LEADER:
            for peer in self.peers:
                entries = self.log[self.next_index.get(peer.node_id, 0):]
                peer.append_entries(self.node_id, self.current_term, 
                                   entries, self.commit_index)
            time.sleep(50 / 1000)  # 50ms heartbeat interval
    
    def run_election_loop(self):
        """Follower/Candidate election logic."""
        while True:
            time_since_heartbeat = time.time() - self.last_heartbeat
            
            if self.state == NodeState.FOLLOWER and \
               time_since_heartbeat > self.election_timeout:
                self.start_election()
            
            elif self.state == NodeState.CANDIDATE:
                if self.request_votes():
                    self.become_leader()
                    self.start_heartbeat_loop()
                
                time_since_heartbeat = time.time() - self.last_heartbeat
                if time_since_heartbeat > 2 * self.election_timeout:
                    self.start_election()  # Election timed out, restart
```

```python
# Distributed Key-Value Store with Consistent Hashing
import hashlib
import bisect
from typing import Dict, Optional, List, Tuple
from dataclasses import dataclass
import threading

@dataclass
class Node:
    node_id: str
    address: str
    port: int

class ConsistentHash:
    def __init__(self, replicas: int = 3):
        self.replicas = replicas
        self.hash_ring: Dict[int, str] = {}
        self.sorted_hashes: List[int] = []
        self.lock = threading.Lock()
    
    def _hash(self, key: str) -> int:
        """Generate hash for a key."""
        return int(hashlib.md5(key.encode()).hexdigest(), 16)
    
    def add_node(self, node: Node):
        """Add a node to the hash ring."""
        with self.lock:
            for i in range(self.replicas):
                hash_val = self._hash(f"{node.node_id}:{i}")
                self.hash_ring[hash_val] = node.node_id
                bisect.insort(self.sorted_hashes, hash_val)
    
    def remove_node(self, node: Node):
        """Remove a node from the hash ring."""
        with self.lock:
            for i in range(self.replicas):
                hash_val = self._hash(f"{node.node_id}:{i}")
                self.hash_ring.pop(hash_val, None)
                idx = bisect.bisect_left(self.sorted_hashes, hash_val)
                if idx < len(self.sorted_hashes) and self.sorted_hashes[idx] == hash_val:
                    self.sorted_hashes.pop(idx)
    
    def get_node(self, key: str) -> Optional[str]:
        """Get the node responsible for a key."""
        if not self.sorted_hashes:
            return None
        
        with self.lock:
            hash_val = self._hash(key)
            idx = bisect.bisect_left(self.sorted_hashes, hash_val)
            if idx == len(self.sorted_hashes):
                idx = 0
            return self.hash_ring[self.sorted_hashes[idx]]

class DistributedKVStore:
    def __init__(self, replicas: int = 3):
        self.hash_ring = ConsistentHash(replicas)
        self.nodes: Dict[str, Dict[str, str]] = {}
        self.lock = threading.Lock()
    
    def add_node(self, node: Node):
        self.nodes[node.node_id] = {}
        self.hash_ring.add_node(node)
    
    def put(self, key: str, value: str):
        """Put a key-value pair."""
        node_id = self.hash_ring.get_node(key)
        if not node_id:
            raise Exception("No nodes available")
        
        with self.lock:
            self.nodes[node_id][key] = value
        
        # Replicate to next N nodes
        self._replicate(key, value)
    
    def get(self, key: str) -> Optional[str]:
        """Get a value by key."""
        node_id = self.hash_ring.get_node(key)
        if not node_id:
            return None
        
        with self.lock:
            return self.nodes[node_id].get(key)
    
    def _replicate(self, key: str, value: str):
        """Replicate write to other nodes."""
        all_nodes = list(self.nodes.keys())
        if len(all_nodes) <= 1:
            return
        
        primary_node = self.hash_ring.get_node(key)
        primary_idx = all_nodes.index(primary_node)
        
        # Replicate to next 2 nodes
        for i in range(1, 3):
            replica_idx = (primary_idx + i) % len(all_nodes)
            replica_node = all_nodes[replica_idx]
            self.nodes[replica_node][key] = value
    
    def _get_replicas(self, key: str) -> List[str]:
        """Get all nodes that should have this key."""
        node_id = self.hash_ring.get_node(key)
        all_nodes = list(self.nodes.keys())
        if not all_nodes:
            return []
        
        idx = all_nodes.index(node_id)
        return [all_nodes[(idx + i) % len(all_nodes)] for i in range(3)]
```

```python
# Circuit Breaker Pattern Implementation
import time
from enum import Enum
from threading import Lock
from typing import Callable, TypeVar, Generic
from dataclasses import dataclass

T = TypeVar('T')

class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

@dataclass
class CircuitBreakerConfig:
    failure_threshold: int = 5
    success_threshold: int = 3
    timeout_seconds: float = 60.0

class CircuitBreaker:
    def __init__(self, name: str, config: CircuitBreakerConfig = None):
        self.name = name
        self.config = config or CircuitBreakerConfig()
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: float = 0
        self.lock = Lock()
    
    def call(self, func: Callable[..., T], *args, **kwargs) -> T:
        """Execute a function with circuit breaker protection."""
        if not self._is_call_allowed():
            raise CircuitBreakerOpenError(f"Circuit breaker {self.name} is open")
        
        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise
    
    def _is_call_allowed(self) -> bool:
        with self.lock:
            if self.state == CircuitState.CLOSED:
                return True
            
            if self.state == CircuitState.OPEN:
                if time.time() - self.last_failure_time > self.config.timeout_seconds:
                    self.state = CircuitState.HALF_OPEN
                    return True
                return False
            
            if self.state == CircuitState.HALF_OPEN:
                return True
            
            return False
    
    def _on_success(self):
        with self.lock:
            if self.state == CircuitState.HALF_OPEN:
                self.success_count += 1
                if self.success_count >= self.config.success_threshold:
                    self._reset()
            else:
                self.failure_count = 0
    
    def _on_failure(self):
        with self.lock:
            self.last_failure_time = time.time()
            
            if self.state == CircuitState.HALF_OPEN:
                self.state = CircuitState.OPEN
                self.success_count = 0
            else:
                self.failure_count += 1
                if self.failure_count >= self.config.failure_threshold:
                    self.state = CircuitState.OPEN
    
    def _reset(self):
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = 0

class CircuitBreakerOpenError(Exception):
    pass

# Usage example
breaker = CircuitBreaker("database", CircuitBreakerConfig(failure_threshold=3))

def query_database():
    # Database operation
    pass

try:
    result = breaker.call(query_database)
except CircuitBreakerOpenError:
    # Fallback to cache or degraded service
    result = get_from_cache()
```

```python
# Saga Pattern for Distributed Transactions
from typing import Dict, List, Callable, Any, Optional
from dataclasses import dataclass
from enum import Enum
import logging

class SagaStepStatus(Enum):
    PENDING = "pending"
    EXECUTING = "executing"
    COMPLETED = "completed"
    FAILED = "failed"
    COMPENSATING = "compensating"
    ROLLED_BACK = "rolled_back"

@dataclass
class SagaStep:
    name: str
    forward: Callable[[], Any]
    backward: Optional[Callable[[], None]] = None
    status: SagaStepStatus = SagaStepStatus.PENDING

class Saga:
    def __init__(self, name: str):
        self.name = name
        self.steps: List[SagaStep] = []
        self.current_step = 0
        self.logger = logging.getLogger(f"saga.{name}")
    
    def add_step(self, step: SagaStep):
        self.steps.append(step)
        return self
    
    def execute(self) -> bool:
        """Execute the saga. Returns True if successful, False if rolled back."""
        executed = []
        
        try:
            for step in self.steps:
                self.logger.info(f"Executing step: {step.name}")
                step.status = SagaStepStatus.EXECUTING
                
                result = step.forward()
                step.status = SagaStepStatus.COMPLETED
                executed.append(step)
                self.logger.info(f"Step {step.name} completed")
            
            self.logger.info(f"Saga {self.name} completed successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Saga {self.name} failed at step {step.name}: {e}")
            self._rollback(executed)
            return False
    
    def _rollback(self, executed_steps: List[SagaStep]):
        """Rollback all executed steps in reverse order."""
        for step in reversed(executed_steps):
            if step.backward:
                self.logger.info(f"Compensating step: {step.name}")
                step.status = SagaStepStatus.COMPENSATING
                try:
                    step.backward()
                    step.status = SagaStepStatus.ROLLED_BACK
                    self.logger.info(f"Step {step.name} compensated")
                except Exception as e:
                    self.logger.error(f"Compensation failed for {step.name}: {e}")
                    # In production, may need manual intervention

# Example usage - Order Processing Saga
def reserve_inventory(order_id: str):
    # Reserve inventory for order
    return {"order_id": order_id, "status": "reserved"}

def reserve_inventory_rollback(order_id: str):
    # Release reserved inventory
    pass

def process_payment(order_id: str):
    # Process payment
    return {"order_id": order_id, "payment_id": "PAY123"}

def process_payment_rollback(order_id: str):
    # Refund payment
    pass

def ship_order(order_id: str):
    # Create shipping label
    return {"order_id": order_id, "tracking": "TRK456"}

def ship_order_rollback(order_id: str):
    # Cancel shipping
    pass

# Build and execute saga
saga = Saga("order-processing")
saga.add_step(SagaStep("reserve_inventory", 
                        lambda: reserve_inventory("ORD123"),
                        lambda: reserve_inventory_rollback("ORD123")))
saga.add_step(SagaStep("process_payment",
                        lambda: process_payment("ORD123"),
                        lambda: process_payment_rollback("ORD123")))
saga.add_step(SagaStep("ship_order",
                        lambda: ship_order("ORD123"),
                        lambda: ship_order_rollback("ORD123")))

success = saga.execute()
```

## Best Practices

1. **Design for Failure**: Assume any component can fail at any time
2. **Idempotency**: Make all operations idempotent to handle duplicate requests safely
3. **Timeout Everything**: Set appropriate timeouts for all network operations
4. **Graceful Degradation**: Implement fallback behaviors when services are unavailable
5. **Observability**: Comprehensive logging, metrics, and distributed tracing
6. **Avoid Distributed Transactions**: Prefer sagas and eventual consistency
7. **Rate Limiting**: Protect services from thundering herds and cascading failures
8. **Versioning**: Support backward compatibility during service upgrades
9. **Quorum-Based Writes**: Use majority quorums for fault-tolerant replication
10. **Document Failure Modes**: Explicitly document all possible failure scenarios and recovery procedures
