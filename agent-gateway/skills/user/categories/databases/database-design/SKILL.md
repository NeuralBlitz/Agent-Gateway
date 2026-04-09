---
name: Database Design
description: Principles and practices for designing efficient, scalable, and maintainable database schemas across relational and NoSQL systems
license: MIT
compatibility:
  - Python 3.8+
  - SQLAlchemy 1.4+
  - psycopg2 2.9+
  - pymongo 4.0+
audience: Backend developers, data architects, system designers
category: databases
---

# Database Design

## What I Do

I provide comprehensive guidance on database design principles, schema modeling, normalization, indexing strategies, and architectural decisions. I help choose between relational and NoSQL approaches, design for scalability, and implement data integrity patterns.

## When to Use Me

- Starting new database projects
- Schema migration and refactoring
- Performance optimization
- Choosing database technology
- Normalization/denormalization decisions
- Microservices data architecture
- Data migration strategies
- Audit and compliance requirements

## Core Concepts

- **Normalization**: Reducing data redundancy (1NF, 2NF, 3NF, BCNF)
- **Denormalization**: Intentionally adding redundancy for performance
- **Primary Keys**: Unique entity identifiers (surrogate vs natural)
- **Foreign Keys**: Referential integrity constraints
- **Indexes**: Performance optimization structures
- **Cardinality**: Uniqueness of column values
- **Selectivity**: Index efficiency measurement
- **Partitioning**: Horizontal data distribution
- **Sharding**: Cross-node data distribution
- **ACID**: Transaction guarantees
- **CAP Theorem**: Consistency vs Availability trade-offs
- **CQRS**: Command Query Responsibility Segregation

## Code Examples

### Relational Schema Design (SQLAlchemy)

```python
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Index
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(50), unique=True, nullable=False = Column(String()
    password_hash255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_users_active_email', 'email', 'is_active'),
    )

class Post(Base):
    __tablename__ = 'posts'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False)
    content = Column(String, nullable=True)
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    author = relationship('User', back_populates='posts')
    
    __table_args__ = (
        Index('idx_posts_user_published', 'user_id', 'published_at'),
        ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )

User.posts = relationship('Post', order_by='Post.created_at.desc()', back_populates='author')
```

### NoSQL Document Schema (MongoDB)

```python
from datetime import datetime
from typing import Optional, List, Dict, Any

def create_product_schema() -> dict:
    return {
        'bsonType': 'object',
        'required': ['name', 'sku', 'price', 'inventory'],
        'properties': {
            'name': {
                'bsonType': 'string',
                'description': 'Product name'
            },
            'sku': {
                'bsonType': 'string',
                'description': 'Stock keeping unit'
            },
            'price': {
                'bsonType': 'number',
                'minimum': 0,
                'description': 'Product price'
            },
            'inventory': {
                'bsonType': 'object',
                'required': ['quantity', 'warehouse'],
                'properties': {
                    'quantity': {'bsonType': 'int', 'minimum': 0},
                    'warehouse': {'bsonType': 'string'},
                    'reserved': {'bsonType': 'int', 'minimum': 0}
                }
            },
            'categories': {
                'bsonType': 'array',
                'items': {'bsonType': 'string'}
            },
            'attributes': {
                'bsonType': 'object',
                'additionalProperties': True
            },
            'created_at': {'bsonType': 'date'},
            'updated_at': {'bsonType': 'date'}
        }
    }
```

### Audit Trail Pattern

```python
from datetime import datetime
from typing import Optional, Dict, Any

class AuditLogMixin:
    def to_audit_record(self, action: str, user_id: Optional[int] = None) -> Dict[str, Any]:
        return {
            'entity_type': self.__class__.__name__,
            'entity_id': getattr(self, 'id', None),
            'action': action,
            'changes': self._get_changes(),
            'user_id': user_id,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def _get_changes(self) -> Dict[str, Any]:
        return {}

class AuditableMixin:
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._original_values = {}
    
    def __setattr__(self, key: str, value: Any) -> None:
        if hasattr(self, 'id') and key not in ('_original_values',):
            if key not in ('created_at', 'updated_at'):
                if key not in self._original_values:
                    self._original_values[key] = getattr(self, key, None)
        super().__setattr__(key, value)
```

### Soft Delete Pattern

```python
from datetime import datetime
from typing import TypeVar, Generic
from sqlalchemy import Column, DateTime, Boolean
from sqlalchemy.orm import declared_attr

T = TypeVar('T')

class SoftDeleteMixin:
    deleted_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    
    @declared_attr
    def __mapper_args__(cls):
        return {
            'with_polymorphic': '*',
            'always_refresh': True
        }

class SoftDeleteRepository(Generic[T]):
    def query(self):
        return self.session.query(self.model).filter(
            self.model.is_deleted == False
        )
    
    def delete(self, entity: T) -> None:
        entity.deleted_at = datetime.utcnow()
        entity.is_deleted = True
        self.session.add(entity)
    
    def hard_delete(self, entity: T) -> None:
        self.session.delete(entity)
    
    def find_deleted(self, limit: int = 100) -> list:
        return self.session.query(self.model).filter(
            self.model.is_deleted == True
        ).limit(limit).all()
```

### Polymorphic Associations

```python
from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

class Comment(Base):
    __tablename__ = 'comments'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    content = Column(String, nullable=False)
    commentable_type = Column(String(50), nullable=False)
    commentable_id = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __mapper_args__ = {
        'polymorphic_identity': 'comment',
        'polymorphic_on': commentable_type
    }

class CommentableMixin:
    @declared_attr
    def comments(cls):
        return relationship(
            'Comment',
            primaryjoin=f'and_(Comment.commentable_id=={cls.__name__}.id, Comment.commentable_type=="{cls.__name__}")',
            backref='commentable',
            lazy='dynamic'
        )

class Post(CommentableMixin, Base):
    __tablename__ = 'posts'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    content = Column(String)
    
    def add_comment(self, user_id: int, content: str) -> Comment:
        return Comment(
            user_id=user_id,
            content=content,
            commentable_type='Post',
            commentable_id=self.id
        )
```

## Best Practices

1. **Start Simple**: Design for current needs, not hypothetical future scale
2. **Choose the Right Tool**: Match database type to data access patterns
3. **Normalize First**: Start with normalized design, denormalize based on performance needs
4. **Index Strategically**: Index columns used in WHERE, JOIN, ORDER BY clauses
5. **Use Appropriate Data Types**: Choose smallest type that fits your data
6. **Plan for Growth**: Consider partitioning and sharding from the start
7. **Document Your Schema**: Maintain ER diagrams and data dictionaries
8. **Implement Soft Deletes**: Never truly delete critical business data
9. **Version Your Migrations**: Use migration tools (Alembic, Flyway)
10. **Test Performance Early**: Profile queries with realistic data volumes
11. **Use Constraints**: Enforce data integrity at the database level
12. **Separate Concerns**: Use different databases for different access patterns

## Common Patterns

**Event Sourcing:**
```python
class EventStore:
    def append(self, aggregate_id: str, events: list) -> None:
        for event in events:
            self.session.execute(
                """
                INSERT INTO events (aggregate_id, event_type, data, created_at)
                VALUES (%s, %s, %s, %s)
                """,
                (aggregate_id, event['type'], json.dumps(event['data']), datetime.utcnow())
            )
    
    def get_events(self, aggregate_id: str) -> list:
        return self.session.execute(
            "SELECT * FROM events WHERE aggregate_id = ? ORDER BY created_at",
            (aggregate_id,)
        ).fetchall()
```

**Saga Pattern for Distributed Transactions:**
```python
class OrderSaga:
    def execute(self, order_id: int) -> bool:
        try:
            self.create_order(order_id)
            self.reserve_inventory(order_id)
            self.process_payment(order_id)
            self.confirm_order(order_id)
            return True
        except SagaException as e:
            self.rollback(order_id, e.step)
            return False
    
    def rollback(self, order_id: int, failed_step: str) -> None:
        if failed_step == 'inventory':
            self.release_inventory(order_id)
        if failed_step == 'payment':
            self.refund_payment(order_id)
        self.cancel_order(order_id)
```

**Data Vault Modeling:**
```python
# Hub (business keys)
class CustomerHub:
    customer_id = Column(String, primary_key=True)
    load_date = Column(DateTime, primary_key=True)
    record_source = Column(String)

# Satellite (contextual data)
class CustomerSatellite:
    customer_id = Column(String, ForeignKey('hub_customer.customer_id'), primary_key=True)
    load_date = Column(DateTime, primary_key=True)
    hash_diff = Column(String)
    name = Column(String)
    email = Column(String)
    address = Column(String)

# Link (relationships)
class OrderLink:
    order_id = Column(String, primary_key=True)
    load_date = Column(DateTime, primary_key=True)
    customer_id = Column(String, ForeignKey('hub_customer.customer_id'))
    product_id = Column(String, ForeignKey('hub_product.product_id'))
```
