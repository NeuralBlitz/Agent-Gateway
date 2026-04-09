---
name: Neo4j
description: Native graph database optimized for connected data, relationships, and complex traversals with Cypher query language
license: MIT
compatibility:
  - Python 3.8+
  - neo4j 5.0+
  - py2neo 2021.1+
audience: Backend developers, data scientists, graph application developers
category: databases
---

# Neo4j

## What I Do

I provide guidance on Neo4j, the leading graph database for connected data. I help with graph modeling, Cypher queries, relationship traversal, path finding, social network analysis, and recommendation systems.

## When to Use Me

- Social networks and relationship-heavy applications
- Fraud detection with complex patterns
- Knowledge graphs and semantic web
- Network and IT operations
- Recommendation engines
- Genealogy and family trees
- Supply chain and dependency analysis
- Master data management

## Core Concepts

- **Nodes**: Entities with labels and properties
- **Relationships**: Directed connections between nodes
- **Labels**: Categories for nodes (like table names)
- **Properties**: Key-value attributes on nodes/relationships
- **Cypher**: SQL-like query language for graphs
- **Patterns**: Graph traversals using ASCII art syntax
- **Indexes**: Single-property and composite indexes
- **Constraints**: Uniqueness and existence constraints
- **APOC**: Awesome Procedures for Cypher library
- **Graph Data Science**: ML algorithms on graph data

## Code Examples

### Basic Connection and CRUD

```python
from neo4j import GraphDatabase

driver = GraphDatabase.driver(
    "bolt://localhost:7687",
    auth=("neo4j", "password")
)

def create_user(name: str, email: str) -> str:
    with driver.session() as session:
        result = session.run(
            """
            CREATE (u:User {name: $name, email: $email})
            RETURN elementId(u) as id
            """,
            name=name, email=email
        )
        return result.single()["id"]

def get_user(email: str) -> dict:
    with driver.session() as session:
        result = session.run(
            "MATCH (u:User {email: $email}) RETURN u",
            email=email
        )
        record = result.single()
        return dict(record["u"]) if record else None
```

### Relationship Creation and Query

```python
from neo4j import GraphDatabase

driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "password"))

def create_friendship(user1_email: str, user2_email: str) -> None:
    with driver.session() as session:
        session.run(
            """
            MATCH (u1:User {email: $email1}), (u2:User {email: $email2})
            MERGE (u1)-[:FRIEND {since: date()}]->(u2)
            """,
            email1=user1_email, email2=user2_email
        )

def get_friends_of_friends(user_email: str, depth: int = 2) -> list:
    with driver.session() as session:
        result = session.run(
            """
            MATCH (user:User {email: $email})-[:FRIEND*2..$depth]->(friend)
            RETURN DISTINCT friend.name as name, friend.email as email
            """,
            email=user_email, depth=depth
        )
        return [dict(record) for record in result]
```

### Shortest Path Finding

```python
from neo4j import GraphDatabase

driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "password"))

def find_shortest_path(source: str, target: str) -> list:
    with driver.session() as session:
        result = session.run(
            """
            MATCH (source:Airport {code: $source}), (target:Airport {code: $target})
            CALL algo.shortestPath.allShortestPaths(
                source, target, 
                {nodeQuery: 'Airport', relationshipQuery: 'FLIGHT'}
            )
            YIELD path
            RETURN path
            """,
            source=source, target=target
        )
        record = result.single()
        if record:
            return [node["code"] for node in record["path"].nodes]
        return []

def find_connected_components() -> list:
    with driver.session() as session:
        result = session.run(
            """
            CALL algo.labelPropagation.stream('User', 'FRIEND', {direction: 'UNDIRECTED'})
            YIELD nodeId, label
            RETURN algo.getNodeById(nodeId).email as email, label as component
            ORDER BY component
            """
        )
        return [dict(record) for record in result]
```

### Recommendation Query

```python
from neo4j import GraphDatabase

driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "password"))

def recommend_friends(user_email: str) -> list:
    with driver.session() as session:
        result = session.run(
            """
            MATCH (user:User {email: $email})-[:FRIEND]->(friend)-[:FRIEND]->(suggestion)
            WHERE suggestion <> user AND NOT (user)-[:FRIEND]->(suggestion)
            WITH suggestion, COUNT(*) as mutual_friends
            WHERE mutual_friends >= 2
            RETURN suggestion.email as email, suggestion.name as name, mutual_friends
            ORDER BY mutual_friends DESC
            LIMIT 5
            """,
            email=user_email
        )
        return [dict(record) for record in result]
```

## Best Practices

1. Use descriptive labels for nodes
2. Prefer relationship types over node types when appropriate
3. Use MERGE for idempotent pattern creation
4. Create indexes on frequently queried node properties
5. Use parameterised queries for performance
6. Limit pattern matching depth to prevent expensive queries
7. Use EXISTS() and SIZE() for property checks
8. Implement constraints for data integrity
9. Use LOAD CSV for bulk imports
10. Profile queries with EXPLAIN and PROFILE

## Common Patterns

**Hierarchical Data (Tree):**
```cypher
MATCH path = (root:Category {name: 'Electronics'})-[:PARENT*]->(child)
RETURN child.name as category, length(path) as level
```

**Temporal Relationship Query:**
```cypher
MATCH (person)-[r:FRIEND]->(friend)
WHERE r.since >= date('2020-01-01')
RETURN person.name, friend.name
```

**Graph Algorithm (PageRank):**
```cypher
CALL algo.pageRank.stream('User', 'FRIEND', {iterations: 20, dampingFactor: 0.85})
YIELD nodeId, score
RETURN algo.getNodeById(nodeId).name as name, score
ORDER BY score DESC
```
