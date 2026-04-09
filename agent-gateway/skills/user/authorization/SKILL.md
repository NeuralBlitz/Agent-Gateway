# Authorization

**Category:** Security  
**Skill Level:** Intermediate  
**Domain:** Access Control, Identity Management, Backend Security

## Overview

Authorization is the process of determining whether an authenticated entity has permission to access specific resources or perform particular actions. It operates after authentication to enforce granular access control policies that govern what users can see and do within a system.

## Description

Authorization transforms authenticated identities into permissions, defining the boundaries of what each user or system can access and what operations they may perform. While authentication answers the question "who are you?", authorization answers "what are you allowed to do?" This separation of concerns enables flexible security architectures that can adapt to complex organizational hierarchies, diverse resource types, and evolving business requirements.

The dominant authorization models include Role-Based Access Control (RBAC), which assigns permissions through roles that users inherit, and Attribute-Based Access Control (ABAC), which makes decisions based on attributes of the user, resource, and environment. RBAC offers simplicity and ease of management for well-defined organizational structures, while ABAC provides fine-grained control for complex, dynamic scenarios. Policy-Based Access Control (PBAC) extends these concepts by encoding business rules into explicit policies that can be audited and modified without code changes.

Modern authorization systems often implement the principle of least privilege, granting only the minimum permissions necessary for each entity to perform their functions. Attribute-based and policy-based approaches naturally support this principle by evaluating multiple factors before permitting access. The emergence of Zero Trust architectures extends these concepts further, requiring authorization for every request regardless of the network origin, effectively treating internal networks as untrusted as external ones.

## Prerequisites

- Understanding of authentication mechanisms and identity concepts
- Knowledge of access control models (RBAC, ABAC, PBAC)
- Familiarity with security principles including least privilege
- Understanding of policy evaluation and enforcement patterns

## Core Competencies

- Designing and implementing role-based access control systems
- Creating attribute-based access policies with complex conditions
- Implementing permission checking in API endpoints and services
- Building centralized authorization services and policy engines
- Enforcing authorization at multiple architectural layers
- Auditing and logging access control decisions

## Implementation

```python
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Set

class Permission(Enum):
    READ = "read"
    WRITE = "write"
    DELETE = "delete"
    EXECUTE = "execute"
    ADMIN = "admin"

class ResourceType(Enum):
    DOCUMENT = "document"
    USER = "user"
    TEAM = "team"

@dataclass
class Resource:
    id: str
    type: ResourceType
    owner_id: str
    attributes: Dict[str, Any] = field(default_factory=dict)

@dataclass
class Role:
    name: str
    permissions: Set[Permission]

@dataclass
class User:
    id: str
    username: str
    roles: Set[str] = field(default_factory=set)
    attributes: Dict[str, Any] = field(default_factory=dict)

@dataclass
class AuthorizationDecision:
    allowed: bool
    reason: str

class RBACService:
    def __init__(self):
        self.roles: Dict[str, Role] = {}
        self.user_roles: Dict[str, Set[str]] = {}
    
    def define_role(self, role: Role):
        self.roles[role.name] = role
    
    def assign_role_to_user(self, user_id: str, role_name: str):
        if user_id not in self.user_roles:
            self.user_roles[user_id] = set()
        self.user_roles[user_id].add(role_name)
    
    def has_permission(
        self, 
        user: User, 
        resource: Resource, 
        permission: Permission
    ) -> AuthorizationDecision:
        user_effective_roles = self.user_roles.get(user.id, set()).union(user.roles)
        
        for role_name in user_effective_roles:
            if role_name in self.roles:
                role = self.roles[role_name]
                if permission in role.permissions:
                    return AuthorizationDecision(
                        allowed=True,
                        reason=f"Permission granted via role: {role_name}"
                    )
        
        return AuthorizationDecision(
            allowed=False,
            reason="No matching role grants this permission"
        )

admin_role = Role(name="admin", permissions={Permission.READ, Permission.WRITE, Permission.DELETE, Permission.ADMIN})
rbac_service = RBACService()
rbac_service.define_role(admin_role)
```

## Use Cases

- Implementing role-based access control for multi-tenant applications
- Creating attribute-based policies for fine-grained document permissions
- Building authorization services that span multiple microservices
- Enforcing resource-level permissions in API gateways
- Auditing access patterns for compliance reporting

## Artifacts

- RBAC configuration schemas
- Open Policy Agent (OPA) policy files
- Authorization middleware for various frameworks
- Policy decision point (PDP) implementations
- Access control audit logging systems

## Related Skills

- Authentication
- Role-Based Access Control
- Attribute-Based Access Control
- OAuth 2.0 Scopes
- Policy-Based Access Control
