---
name: Microservices
description: Architectural style structuring applications as loosely coupled, independently deployable services
category: software-development
---
# Microservices

## What I do

I provide an architectural approach that structures applications as a collection of small, independent, loosely coupled services. Each microservice owns its business logic and data, communicating with other services through well-defined APIs. This enables teams to develop, deploy, and scale services independently, supporting continuous delivery and rapid iteration. I help design service boundaries, define communication patterns, and manage distributed system complexity.

## When to use me

Microservices are appropriate for large, complex applications requiring multiple teams, when rapid iteration is critical, or when different components have varying scalability needs. Use microservices when you need technology heterogeneity or when different parts of the system benefit from different databases or frameworks. Avoid microservices for simple applications, startups needing rapid iteration, or teams without DevOps capabilities.

## Core Concepts

- **Service Decomposition**: Splitting monolith into independent services
- **API-First Design**: Defining contracts before implementation
- **Service Discovery**: Dynamic location of service instances
- **Load Balancing**: Distributing requests across service replicas
- **Circuit Breaking**: Preventing cascade failures
- **Distributed Tracing**: Tracking requests across services
- **Configuration Management**: Centralized service configuration
- **Health Checks**: Monitoring service status
- **Graceful Degradation**: Maintaining functionality during failures
- **Feature Flags**: Controlling feature rollout

## Code Examples

### Service Definition with FastAPI

```python
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID, uuid4
from datetime import datetime

app = FastAPI(
    title="User Service",
    description="Manages user accounts and profiles",
    version="1.0.0"
)

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    name: str
    created_at: datetime
    is_active: bool = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None

# In-memory database for demonstration
users_db: dict[UUID, dict] = {}

@app.post("/users", response_model=UserResponse, status_code=201)
async def create_user(user_data: UserCreate) -> UserResponse:
    for user in users_db.values():
        if user["email"] == user_data.email:
            raise HTTPException(status_code=409, detail="Email already registered")
    
    user_id = uuid4()
    user = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "created_at": datetime.utcnow(),
        "is_active": True
    }
    users_db[user_id] = user
    return UserResponse(**user)

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: UUID) -> UserResponse:
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**users_db[user_id])

@app.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    updates: UserUpdate
) -> UserResponse:
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = users_db[user_id]
    if updates.name:
        user["name"] = updates.name
    if updates.email:
        user["email"] = updates.email
    
    return UserResponse(**user)

@app.delete("/users/{user_id}", status_code=204)
async def deactivate_user(user_id: UUID) -> None:
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    users_db[user_id]["is_active"] = False

def hash_password(password: str) -> str:
    import hashlib
    return hashlib.sha256(password.encode()).hexdigest()
```

### Service Discovery with Consul

```python
from consul import Consul
import requests
from typing import Optional

class ServiceRegistry:
    def __init__(self, host: str = "localhost", port: int = 8500):
        self.consul = Consul(host=host, port=port)
        self.service_name = "user-service"
        self.service_port = 8080
    
    def register(self, instance_id: str, health_check_url: str) -> None:
        self.consul.agent.service.register(
            name=self.service_name,
            service_id=instance_id,
            port=self.service_port,
            check={
                "http": health_check_url,
                "interval": "10s",
                "timeout": "5s",
                "deregistercriticalserviceafter": "30s"
            }
        )
    
    def deregister(self, instance_id: str) -> None:
        self.consul.agent.service.deregister(instance_id)
    
    def get_all_instances(self) -> list[dict]:
        services = self.consul.agent.service.get_all()
        return [
            {"address": s["Address"], "port": s["Port"]}
            for s in services.values()
            if s["Service"] == self.service_name
        ]
    
    def get_leader(self) -> Optional[dict]:
        instances = self.get_all_instances()
        return instances[0] if instances else None

class ServiceClient:
    def __init__(self, registry: ServiceRegistry):
        self.registry = registry
        self._cache: list[dict] = []
    
    def _refresh_cache(self) -> None:
        self._cache = self.registry.get_all_instances()
    
    def get_service_url(self, service_name: str) -> str:
        if not self._cache:
            self._refresh_cache()
        if not self._cache:
            raise ServiceUnavailable(f"No instances of {service_name}")
        instance = self._cache[0]
        return f"http://{instance['address']}:{instance['port']}"
```

### Distributed Configuration

```python
from dataclasses import dataclass
from typing import Protocol, Optional
import yaml

@dataclass
class ServiceConfig:
    service_name: str
    host: str
    port: int
    database_url: str
    redis_url: str
    log_level: str
    retry_max_attempts: int
    timeout_seconds: int

class ConfigurationManager:
    def __init__(self, config_path: str = "config.yaml"):
        self.config_path = config_path
        self._config: Optional[ServiceConfig] = None
    
    def load(self) -> ServiceConfig:
        with open(self.config_path) as f:
            raw = yaml.safe_load(f)
        
        self._config = ServiceConfig(
            service_name=raw["service"]["name"],
            host=raw["service"]["host"],
            port=raw["service"]["port"],
            database_url=self._resolve_env(raw["database"]["url"]),
            redis_url=self._resolve_env(raw["redis"]["url"]),
            log_level=raw.get("logging", {}).get("level", "INFO"),
            retry_max_attempts=raw.get("retry", {}).get("max_attempts", 3),
            timeout_seconds=raw.get("timeout", {}).get("seconds", 30)
        )
        return self._config
    
    def _resolve_env(self, value: str) -> str:
        if isinstance(value, str) and value.startswith("${") and value.endswith("}"):
            env_var = value[2:-1]
            return self._get_env(env_var, value)
        return value
    
    def _get_env(self, var: str, default: str) -> str:
        import os
        return os.getenv(var, default)
    
    @property
    def config(self) -> ServiceConfig:
        if self._config is None:
            self.load()
        return self._config

class FeatureFlags:
    def __init__(self, config: ServiceConfig):
        self.flags = {
            "new_checkout_flow": False,
            "premium_discounts": True,
            "beta_features": False,
        }
        self.config = config
    
    def is_enabled(self, flag_name: str) -> bool:
        return self.flags.get(flag_name, False)
    
    def enable(self, flag_name: str) -> None:
        self.flags[flag_name] = True
```

### Health Check Endpoints

```python
from fastapi import APIRouter, Response
from pydantic import BaseModel
from datetime import datetime
import psutil
import subprocess

health_router = APIRouter()

class HealthStatus(BaseModel):
    status: str
    version: str
    timestamp: str
    checks: dict

class ComponentHealth(BaseModel):
    status: str
    latency_ms: float
    details: Optional[dict] = None

@health_router.get("/health", response_model=HealthStatus)
async def health_check() -> HealthStatus:
    checks = {
        "database": check_database(),
        "cache": check_cache(),
        "external_api": check_external_api(),
    }
    
    overall_status = "healthy" if all(
        c.status == "healthy" for c in checks.values()
    ) else "degraded"
    
    return HealthStatus(
        status=overall_status,
        version="1.0.0",
        timestamp=datetime.utcnow().isoformat(),
        checks={k: c.model_dump() for k, c in checks.items()}
    )

@health_router.get("/health/live")
async def liveness() -> Response:
    return Response(status_code=200, content="OK")

@health_router.get("/health/ready")
async def readiness() -> Response:
    checks = ["database", "cache"]
    all_ready = all(check_component(c) for c in checks)
    return Response(
        status_code=200 if all_ready else 503,
        content="Ready" if all_ready else "Not Ready"
    )

def check_database() -> ComponentHealth:
    import time
    start = time.time()
    # Simulated check
    latency = (time.time() - start) * 1000
    return ComponentHealth(status="healthy", latency_ms=latency)

def check_cache() -> ComponentHealth:
    return ComponentHealth(status="healthy", latency_ms=1.5)

def check_external_api() -> ComponentHealth:
    return ComponentHealth(status="healthy", latency_ms=45.2)
```

### API Gateway Aggregation

```python
from fastapi import FastAPI, HTTPException
from httpx import AsyncClient, Timeout
from typing import Any

app = FastAPI()

class APIGateway:
    def __init__(self):
        self.services = {
            "users": "http://user-service:8080",
            "orders": "http://order-service:8080",
            "inventory": "http://inventory-service:8080",
        }
    
    async def aggregate_order_details(
        self,
        client: AsyncClient,
        order_id: str
    ) -> dict[str, Any]:
        order_response = await client.get(
            f"{self.services['orders']}/orders/{order_id}",
            timeout=Timeout(5.0)
        )
        if order_response.status_code != 200:
            raise HTTPException(404, "Order not found")
        
        order_data = order_response.json()
        
        user_response = await client.get(
            f"{self.services['users']}/users/{order_data['user_id']}"
        )
        order_data["user"] = user_response.json()
        
        items_with_inventory = []
        for item in order_data["items"]:
            inv_response = await client.get(
                f"{self.services['inventory']}/products/{item['product_id']}"
            )
            item["inventory_status"] = inv_response.json().get("status")
            items_with_inventory.append(item)
        order_data["items"] = items_with_inventory
        
        return order_data

@app.get("/api/orders/{order_id}/details")
async def get_order_details(order_id: str) -> dict:
    async with AsyncClient() as client:
        gateway = APIGateway()
        return await gateway.aggregate_order_details(client, order_id)
```

## Best Practices

1. **Start Simple**: Don't microservices until you need them
2. **Design APIs First**: Contract-driven development
3. **Separate Data**: Each service owns its database
4. **Graceful Degradation**: Handle failures without total system failure
5. **Observability**: Logs, metrics, and tracing for all services
6. **Automate Everything**: CI/CD pipelines for each service
7. **Containerize Services**: Docker for consistent deployments
8. **API Versioning**: Support backward compatibility
9. **Security**: Auth at gateway, service-to-service auth
10. **Failure Modes**: Design for partial failures
11. **Documentation**: OpenAPI specs for all services
12. **Team Ownership**: Each team owns their services end-to-end
