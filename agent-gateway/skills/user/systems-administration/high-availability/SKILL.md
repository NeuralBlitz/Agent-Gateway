---
name: high-availability
description: High availability architecture and implementation for fault-tolerant distributed systems
license: MIT
compatibility: opencode
metadata:
  audience: architects
  category: systems-administration
---

## What I do
- Design high availability architectures
- Implement load balancing strategies
- Configure failover clustering
- Set up database replication
- Design multi-region deployments
- Implement circuit breakers
- Create health checks and redundancy
- Configure session and state management
- Design for horizontal scaling
- Implement chaos engineering

## When to use me
When designing fault-tolerant systems, implementing high availability infrastructure, or architecting for uptime requirements.

## Core Concepts
- Active-active and active-passive configurations
- Load balancing algorithms and strategies
- Failover mechanisms and detection
- Database replication (master-slave, multi-master)
- Consensus algorithms (Raft, Paxos)
- Circuit breaker patterns
- Service mesh architectures
- DNS-based failover
- CDN and edge caching
- Disaster recovery vs high availability

## Code Examples

### Load Balancer Configuration
```nginx
# Nginx HA configuration
upstream backend {
    least_conn;
    
    server 10.0.1.10:8080 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:8080 max_fails=3 fail_timeout=30s;
    server 10.0.1.12:8080 max_fails=3 fail_timeout=30s backup;
    
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name app.example.com;
    
    ssl_certificate /etc/ssl/certs/app.crt;
    ssl_certificate_key /etc/ssl/private/app.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # Health check endpoint
    location /health {
        proxy_pass http://backend;
        proxy_connect_timeout 5s;
        proxy_read_timeout 10s;
        health_check interval=5 passes=2 fails=3;
    }
    
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Circuit breaker
        proxy_next_upstream error timeout http_503 http_504;
        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;
    
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://backend;
    }
}
```

```haproxy
# haproxy.cfg
global
    log 127.0.0.1 local0
    maxconn 4096
    daemon
    tune.ssl.default-dh-param 2048

defaults
    log global
    mode http
    option httplog
    option dontlognull
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms
    retries 3

frontend http-in
    bind *:80
    bind *:443 ssl crt /etc/ssl/certs/
    
    acl is-health-check src 10.0.0.0/8
    use_backend health if is-health-check
    
    default_backend app-servers

backend app-servers
    balance roundrobin
    option httpchk GET /health
    http-check expect status 200
    
    server app1 10.0.1.10:8080 check inter 5s rise 2 fall 3
    server app2 10.0.1.11:8080 check inter 5s rise 2 fall 3
    server app3 10.0.1.12:8080 check inter 5s rise 2 fall 3 backup
    
    # Stickiness
    stick-table type ip size 200k expire 30m
    stick on src
    
    # Circuit breaker
    http-request track-sc0 src
    acl conn_fail sc1_conn_fail gt 3
    acl mark_remove sc1_marked_remove lt 1
    http-request silent-drop if conn_fail mark_remove

backend health
    server health1 10.0.0.1:9090 check
```

### Database HA Configuration
```yaml
# PostgreSQL Patroni configuration
restapi:
  listen: 0.0.0.0:8008
  connect_address: 10.0.1.10:8008
  authentication:
    username: admin
    password: ${PATRONI_PASSWORD}

etcd:
  host: 10.0.1.20:2379
  protocols: http
  cacert: /etc/ssl/certs/ca.crt
  key: /etc/ssl/private/patroni.key
  cert: /etc/ssl/certs/patroni.crt

bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    maximum_lag_on_failover: 1048576
    master_start_timeout: 300
    synchronous_mode: false

  pg_hba:
    - host replication replicator 10.0.1.0/24 md5
    - host all all 0.0.0.0/0 md5

postgresql:
  listen: 0.0.0.0:5432
  connect_address: 10.0.1.10:5432
  authentication:
    replication:
      username: replication
      password: ${REPLICATION_PASSWORD}
    superuser:
      username: postgres
      password: ${SUPERUSER_PASSWORD}
  parameters:
    max_connections: 200
    shared_buffers: 4GB
    work_mem: 64MB
    maintenance_work_mem: 1GB
    effective_cache_size: 12GB
    synchronous_commit: on
    synchronous_standby_names: '*'
  pg_rewind:
    username: postgres
    password: ${SUPERUSER_PASSWORD}
```

### Circuit Breaker Implementation
```python
import asyncio
from enum import Enum
from dataclasses import dataclass
from typing import Callable, Any
import time

class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

@dataclass
class CircuitBreakerConfig:
    failure_threshold: int = 5
    success_threshold: int = 2
    timeout_seconds: float = 60.0
    sampling_window: int = 60

class CircuitBreaker:
    def __init__(self, name: str, config: CircuitBreakerConfig = None):
        self.name = name
        self.config = config or CircuitBreakerConfig()
        self.state = CircuitState.CLOSED
        self.failures = 0
        self.successes = 0
        self.last_failure_time = 0
        self._lock = asyncio.Lock()
    
    async def call(self, func: Callable, *args, **kwargs) -> Any:
        async with self._lock:
            if self._should_open():
                self.state = CircuitState.OPEN
                self.last_failure_time = time.time()
            
            if self.state == CircuitState.OPEN:
                if self._timeout_elapsed():
                    self.state = CircuitState.HALF_OPEN
                else:
                    raise CircuitOpenError(f"Circuit breaker {self.name} is open")
        
        return await self._execute(func, *args, **kwargs)
    
    async def _execute(self, func: Callable, *args, **kwargs) -> Any:
        try:
            result = await func(*args, **kwargs)
            await self._on_success()
            return result
        except Exception as e:
            await self._on_failure()
            raise
    
    async def _on_success(self):
        async with self._lock:
            if self.state == CircuitState.HALF_OPEN:
                self.successes += 1
                if self.successes >= self.config.success_threshold:
                    self.state = CircuitState.CLOSED
                    self.failures = 0
                    self.successes = 0
    
    async def _on_failure(self):
        async with self._lock:
            self.failures += 1
            if self.state == CircuitState.HALF_OPEN:
                self.state = CircuitState.OPEN
                self.last_failure_time = time.time()
                self.successes = 0
    
    def _should_open(self) -> bool:
        return (self.state == CircuitState.HALF_OPEN and 
                self.failures >= self.config.failure_threshold)
    
    def _timeout_elapsed(self) -> bool:
        return time.time() - self.last_failure_time > self.config.timeout_seconds

# Usage
circuit = CircuitBreaker("database", CircuitBreakerConfig(
    failure_threshold=3,
    timeout_seconds=30
))

async def get_user(user_id: int):
    async with circuit:
        return await database.query("SELECT * FROM users WHERE id = ?", user_id)
```

### Health Check Aggregation
```python
from typing import Dict, List
from dataclasses import dataclass
from enum import Enum
import asyncio

class HealthStatus(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"

@dataclass
class ComponentHealth:
    name: str
    status: HealthStatus
    latency_ms: float
    message: str
    details: dict = None

class HealthChecker:
    def __init__(self):
        self.checks = {}
    
    def register_check(self, name: str, check_func: callable):
        self.checks[name] = check_func
    
    async def check_all(self) -> Dict[str, ComponentHealth]:
        results = {}
        tasks = []
        
        for name, check_func in self.checks.items():
            tasks.append(self._run_check(name, check_func))
        
        for result in await asyncio.gather(*tasks, return_exceptions=True):
            if isinstance(result, Exception):
                results["unknown"] = ComponentHealth(
                    name="unknown",
                    status=HealthStatus.UNHEALTHY,
                    latency_ms=0,
                    message=str(result)
                )
            else:
                results[result.name] = result
        
        return results
    
    async def _run_check(self, name: str, check_func: callable) -> ComponentHealth:
        start = time.time()
        try:
            if asyncio.iscoroutinefunction(check_func):
                result = await check_func()
            else:
                result = check_func()
            
            latency_ms = (time.time() - start) * 1000
            
            return ComponentHealth(
                name=name,
                status=HealthStatus.HEALTHY if result else HealthStatus.DEGRADED,
                latency_ms=latency_ms,
                message="Check passed" if result else "Check returned unhealthy"
            )
        except Exception as e:
            return ComponentHealth(
                name=name,
                status=HealthStatus.UNHEALTHY,
                latency_ms=(time.time() - start) * 1000,
                message=str(e)
            )
    
    def aggregate_status(self, healths: Dict[str, ComponentHealth]) -> HealthStatus:
        statuses = [h.status for h in healths.values()]
        
        if any(s == HealthStatus.UNHEALTHY for s in statuses):
            return HealthStatus.UNHEALTHY
        elif any(s == HealthStatus.DEGRADED for s in statuses):
            return HealthStatus.DEGRADED
        return HealthStatus.HEALTHY

# Usage
checker = HealthChecker()
checker.register_check("database", lambda: db.health_check())
checker.register_check("redis", lambda: redis.ping())
checker.register_check("external_api", external_api.health_check)

async def health_endpoint():
    healths = await checker.check_all()
    status = checker.aggregate_status(healths)
    return {"status": status.value, "components": healths}
```

## Best Practices
- Design for failure - assume components will fail
- Use active-active for true high availability
- Implement proper health checks at multiple levels
- Keep configurations version-controlled
- Test failover procedures regularly
- Monitor SLIs and SLOs actively
- Use circuit breakers to prevent cascade failures
- Maintain proper capacity buffers
- Document failure modes and runbooks
- Consider geographic redundancy for disaster recovery
