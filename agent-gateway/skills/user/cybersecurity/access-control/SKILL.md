---
name: Access Control
category: cybersecurity
description: Implementing authorization models including RBAC, ABAC, and policy-based access control
tags: [authorization, rbac, abac, permissions, policy-engine, least-privilege]
version: "1.0"
---

# Access Control

## What I Do

I provide guidance on designing and implementing authorization systems that control who can access what resources and perform which actions. This includes role-based access control (RBAC), attribute-based access control (ABAC), policy-based access control, and relationship-based access control (ReBAC).

## When to Use Me

- Designing an authorization model for a new application
- Implementing RBAC or ABAC permission systems
- Building multi-tenant authorization with data isolation
- Integrating external policy engines (OPA, Cedar, Zanzibar)
- Implementing fine-grained permissions at the resource level
- Auditing and reviewing access control implementations

## Core Concepts

1. **RBAC (Role-Based Access Control)**: Assign permissions to roles and roles to users for manageable access control.
2. **ABAC (Attribute-Based Access Control)**: Make authorization decisions based on attributes of the user, resource, action, and environment.
3. **ReBAC (Relationship-Based Access Control)**: Authorize based on relationships between users and resources (Google Zanzibar model).
4. **Policy as Code**: Express authorization logic in declarative policy languages (Rego, Cedar) that can be versioned and tested.
5. **Least Privilege**: Grant only the minimum permissions required for a task with time-bound access where possible.
6. **Separation of Duties**: Require multiple users to complete sensitive operations to prevent abuse.
7. **Multi-Tenancy Isolation**: Ensure users can only access data within their own tenant boundary.

## Code Examples

### 1. RBAC Implementation (Python)

```python
from enum import Enum
from typing import Set, Dict

class Permission(Enum):
    READ = "read"
    WRITE = "write"
    DELETE = "delete"
    ADMIN = "admin"

class Role(Enum):
    VIEWER = "viewer"
    EDITOR = "editor"
    ADMIN = "admin"

ROLE_PERMISSIONS: Dict[Role, Set[Permission]] = {
    Role.VIEWER: {Permission.READ},
    Role.EDITOR: {Permission.READ, Permission.WRITE},
    Role.ADMIN: {Permission.READ, Permission.WRITE, Permission.DELETE, Permission.ADMIN},
}

class AccessControl:
    def __init__(self) -> None:
        self.user_roles: Dict[str, Set[Role]] = {}

    def assign_role(self, user_id: str, role: Role) -> None:
        self.user_roles.setdefault(user_id, set()).add(role)

    def has_permission(self, user_id: str, permission: Permission) -> bool:
        roles = self.user_roles.get(user_id, set())
        for role in roles:
            if permission in ROLE_PERMISSIONS.get(role, set()):
                return True
        return False

    def check_permission(self, user_id: str, permission: Permission) -> None:
        if not self.has_permission(user_id, permission):
            raise PermissionError(
                f"User {user_id} lacks {permission.value} permission"
            )
```

### 2. ABAC Policy Evaluation (Python)

```python
from dataclasses import dataclass
from typing import Any, Dict, Callable, List
from datetime import datetime, timezone

@dataclass
class AccessRequest:
    subject: Dict[str, Any]
    resource: Dict[str, Any]
    action: str
    environment: Dict[str, Any]

class Policy:
    def __init__(self, name: str, condition: Callable[[AccessRequest], bool]):
        self.name = name
        self.condition = condition

class ABACEngine:
    def __init__(self) -> None:
        self.policies: List[Policy] = []

    def add_policy(self, policy: Policy) -> None:
        self.policies.append(policy)

    def evaluate(self, request: AccessRequest) -> bool:
        return all(p.condition(request) for p in self.policies)

engine = ABACEngine()
engine.add_policy(Policy(
    "same_department",
    lambda r: r.subject.get("department") == r.resource.get("department"),
))
engine.add_policy(Policy(
    "business_hours",
    lambda r: 9 <= r.environment.get("hour", 0) <= 17,
))
engine.add_policy(Policy(
    "classification_clearance",
    lambda r: r.subject.get("clearance", 0) >= r.resource.get("classification", 0),
))
```

### 3. Multi-Tenant Data Isolation (Python/SQLAlchemy)

```python
from sqlalchemy import event
from sqlalchemy.orm import Session, Query

class TenantFilter:
    def __init__(self, tenant_id: str) -> None:
        self.tenant_id = tenant_id

    def apply(self, query: Query, model: type) -> Query:
        if hasattr(model, "tenant_id"):
            return query.filter(model.tenant_id == self.tenant_id)
        return query

@event.listens_for(Session, "do_orm_execute")
def enforce_tenant_isolation(orm_execute_state):
    tenant_id = orm_execute_state.session.info.get("tenant_id")
    if tenant_id and orm_execute_state.is_select:
        orm_execute_state.statement = orm_execute_state.statement.filter_by(
            tenant_id=tenant_id
        )
```

### 4. OPA Policy (Rego)

```rego
package authz

default allow := false

allow if {
    input.method == "GET"
    input.path == ["api", "v1", "public"]
}

allow if {
    input.user.role == "admin"
}

allow if {
    input.method == "GET"
    input.path[0] == "api"
    input.path[1] == "v1"
    input.path[2] == "documents"
    input.resource.owner == input.user.id
}

allow if {
    input.method == "GET"
    input.user.role == "editor"
    input.resource.department == input.user.department
}
```

## Best Practices

1. **Deny by default** and explicitly grant access rather than denying specific combinations.
2. **Check authorization on every request** at the API layer, not just in the UI.
3. **Use resource-level authorization** to verify access to specific instances, not just resource types.
4. **Implement tenant isolation** at the data layer to prevent cross-tenant data access.
5. **Separate authentication from authorization** to allow flexible policy changes without modifying auth.
6. **Audit all access decisions** with enough context to reconstruct who accessed what and when.
7. **Test authorization rules** with comprehensive matrices covering all roles, resources, and actions.
8. **Review permissions regularly** and remove unused roles and excessive privileges.
9. **Use policy engines** (OPA, Cedar) for complex rules to keep authorization logic maintainable.
10. **Implement break-glass procedures** for emergency access with mandatory post-incident review.
