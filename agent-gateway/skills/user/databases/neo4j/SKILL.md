---
name: neo4j
description: Neo4j graph database, Cypher queries, and relationship-based data modeling
category: databases
---
# Neo4j

## What I do

I am a native graph database designed for connected data. I represent and store data as nodes (entities) and relationships (connections) with properties on both. I excel at traversing complex relationships, social network analysis, recommendation engines, fraud detection, and knowledge graphs. My query language, Cypher, provides an intuitive pattern-matching syntax for expressing graph traversals and queries.

## When to use me

- Social networks and relationship-heavy applications
- Recommendation engines based on connections
- Fraud detection and anomaly identification
- Knowledge graphs and semantic web applications
- Network and IT infrastructure management
- Genealogy and organizational hierarchy queries
- Path finding and routing optimizations
- Master data management with complex relationships
- Supply chain and dependency analysis

## Core Concepts

1. **Nodes and Labels**: Entities with optional labels for categorizing (User, Product, Order)
2. **Relationships**: Directed connections between nodes with types (FOLLOWS, PURCHASED, LOCATED_AT)
3. **Properties**: Key-value attributes on both nodes and relationships
4. **Cypher Query Language**: Declarative pattern-matching query language with ASCII-art syntax
5. **Graph Traversal**: Efficient traversal of arbitrary-length relationship paths
6. **Indexes**: Single-property and composite indexes on node properties for fast lookups
7. **Constraints**: Uniqueness constraints, existence constraints, and node key constraints
8. **APOC Procedures**: Extended library of procedures for advanced graph operations
9. **Graph Data Science**: Built-in algorithms for centrality, community detection, and path finding
10. **Neo4j Bloom**: Visual exploration tool for graph data discovery

## Code Examples

### Basic Connection and CRUD Operations

```python
from neo4j import GraphDatabase
from neo4j.exceptions import ConstraintError

driver = GraphDatabase.driver(
    "bolt://localhost:7687",
    auth=("neo4j", "password"),
    max_connection_lifetime=3600
)

def create_user(name, email, **kwargs):
    with driver.session() as session:
        result = session.run("""
            CREATE (u:User {name: $name, email: $email, created_at: datetime()})
            SET u += $kwargs
            RETURN u
        """, name=name, email=email, kwargs=kwargs)
        return result.single()

def get_user_by_email(email):
    with driver.session() as session:
        result = session.run("""
            MATCH (u:User {email: $email})
            RETURN u
        """, email=email)
        return result.single()

def get_user_with_friends(user_email):
    with driver.session() as session:
        result = session.run("""
            MATCH (user:User {email: $email})-[:FRIEND*1..2]-(friend:User)
            WHERE user.email <> friend.email
            WITH DISTINCT friend
            OPTIONAL MATCH (friend)-[:PURCHASED]->(product:Product)
            RETURN friend, collect(product) as products
        """, email=email)
        return [dict(record) for record in result]

def update_user_properties(email, **updates):
    with driver.session() as session:
        result = session.run("""
            MATCH (u:User {email: $email})
            SET u += $updates
            RETURN u
        """, email=email, updates=updates)
        return result.single()

def delete_user(email):
    with driver.session() as session:
        result = session.run("""
            MATCH (u:User {email: $email})
            DETACH DELETE u
            RETURN count(*) as deleted
        """, email=email)
        return result.single()["deleted"] > 0
```

### Relationship Creation and Queries

```python
def create_friendship(user1_email, user2_email):
    with driver.session() as session:
        result = session.run("""
            MATCH (a:User {email: $email1}), (b:User {email: $email2})
            WHERE a <> b
            MERGE (a)-[:FRIEND {since: datetime()}]-(b)
            RETURN a, b
        """, email1=user1_email, email2=user2_email)
        return result.single()

def get_mutual_friends(user1_email, user2_email):
    with driver.session() as session:
        result = session.run("""
            MATCH (a:User {email: $email1})-[:FRIEND]-(mutual)-[:FRIEND]-(b:User {email: $email2})
            WHERE a <> b
            RETURN collect(mutual) as mutual_friends, count(mutual) as count
        """, email1=user1_email, email2=user2_email)
        return result.single()

def get_friends_of_friends(user_email, limit=50):
    with driver.session() as session:
        result = session.run("""
            MATCH (user:User {email: $email})-[:FRIEND]->()-[:FRIEND]-(friend:User)
            WHERE user <> friend AND NOT (user)-[:FRIEND]-(friend)
            WITH friend, count(*) as common_friends
            ORDER BY common_friends DESC
            LIMIT $limit
            RETURN friend, common_friends
        """, email=user_email, limit=limit)
        return [(dict(record["friend"]), record["common_friends"]) for record in result]

def record_purchase(user_email, product_sku, quantity=1):
    with driver.session() as session:
        result = session.run("""
            MATCH (user:User {email: $email}), (product:Product {SKU: $sku})
            MERGE (user)-[:PURCHASED {quantity: $quantity, at: datetime()}]->(product)
            RETURN user, product
        """, email=user_email, sku=product_sku, quantity=quantity)
        return result.single()

def get_user_purchase_history(user_email, limit=50):
    with driver.session() as session:
        result = session.run("""
            MATCH (user:User {email: $email})-[:PURCHASED]->(product:Product)
            WITH product, purchase
            ORDER BY purchase.at DESC
            LIMIT $limit
            RETURN product, purchase
        """, email=user_email, limit=limit)
        return [dict(record) for record in result]
```

### Path Finding and Graph Algorithms

```python
def find_shortest_path(start_email, end_email):
    with driver.session() as session:
        result = session.run("""
            MATCH (start:User {email: $start}), (end:User {email: $end})
            MATCH path = shortestPath((start)-[:FRIEND*..15]-(end))
            RETURN nodes(path) as users, length(path) as distance
        """, start=start_email, end=end_email)
        return result.single()

def find_all_shortest_paths(start_email, end_email):
    with driver.session() as session:
        result = session.run("""
            MATCH (start:User {email: $start}), (end:User {email: $end})
            MATCH paths = allShortestPaths((start)-[:FRIEND*..10]-(end))
            RETURN paths, length(paths) as hops
        """, start=start_email, end=end_email)
        return [dict(record) for record in result]

def get_influencers(limit=10):
    with driver.session() as session:
        result = session.run("""
            MATCH (user:User)
            WITH user, size((user)<-[:FRIEND]-()) as follower_count
            ORDER BY follower_count DESC
            LIMIT $limit
            RETURN user.name, follower_count
        """, limit=limit)
        return [dict(record) for record in result]

def find_communities():
    with driver.session() as session:
        result = session.run("""
            CALL gds.louvain.stream('user-graph', {relationshipTypes: ['FRIEND']})
            YIELD nodeId, communityId
            MATCH (u:User) WHERE id(u) = nodeId
            RETURN communityId, collect(u.name) as members, count(*) as size
            ORDER BY size DESC
        """)
        return [dict(record) for record in result]

def find_central_users():
    with driver.session() as session:
        result = session.run("""
            CALL gds.betweenness.stream('user-graph', {relationshipTypes: ['FRIEND']})
            YIELD nodeId, score
            MATCH (u:User) WHERE id(u) = nodeId
            RETURN u.name, score
            ORDER BY score DESC
            LIMIT 20
        """)
        return [dict(record) for record in result]
```

### Recommendation Engine

```python
def recommend_products_to_user(user_email, limit=10):
    with driver.session() as session:
        result = session.run("""
            MATCH (user:User {email: $email})-[:PURCHASED]->(p1:Product)-[:PURCHASED]-()-[:PURCHASED]->(recommendation:Product)
            WHERE NOT (user)-[:PURCHASED]->(recommendation) AND p1 <> recommendation
            WITH recommendation, count(*) as score
            ORDER BY score DESC
            LIMIT $limit
            RETURN recommendation, score
        """, email=user_email, limit=limit)
        return [(dict(record["recommendation"]), record["score"]) for record in result]

def recommend_friends(user_email, limit=10):
    with driver.session() as session:
        result = session.run("""
            MATCH (user:User {email: $email})-[:FRIEND]->(friend:User)-[:FRIEND]->(suggestion:User)
            WHERE user <> suggestion AND NOT (user)-[:FRIEND]-(suggestion)
            WITH suggestion, count(*) as common_friends
            ORDER BY common_friends DESC
            LIMIT $limit
            RETURN suggestion, common_friends
        """, email=user_email, limit=limit)
        return [(dict(record["suggestion"]), record["common_friends"]) for record in result]

def get_trending_products(timeframe="30d"):
    with driver.session() as session:
        result = session.run("""
            MATCH (product:Product)<-[:PURCHASED]-(order:Order)
            WHERE order.purchased_at >= datetime() - duration({days: 30})
            WITH product, count(*) as purchase_count
            ORDER BY purchase_count DESC
            RETURN product.name, purchase_count
            LIMIT 20
        """)
        return [dict(record) for record in result]

def find_similar_users(user_email, limit=10):
    with driver.session() as session:
        result = session.run("""
            MATCH (user:User {email: $email})-[:PURCHASED]->(:Product)<-[:PURCHASED]-(similar:User)
            WHERE user <> similar
            WITH similar, count(*) as shared_purchases
            ORDER BY shared_purchases DESC
            LIMIT $limit
            RETURN similar.name, similar.email, shared_purchases
        """, email=user_email, limit=limit)
        return [dict(record) for record in result]
```

### Advanced Graph Operations

```python
def create_company_hierarchy():
    with driver.session() as session:
        result = session.run("""
            MATCH (ceo:Employee {title: 'CEO'})
            OPTIONAL MATCH (ceo)-[:MANAGES*]->(report:Employee)
            WITH ceo, collect(report) as all_reports
            RETURN ceo.name as ceo, size(all_reports) as total_reports
        """)
        return result.single()

def find_employees_by_department(department_name):
    with driver.session() as session:
        result = session.run("""
            MATCH (dept:Department {name: $dept})-[:HAS_MEMBER]->(emp:Employee)
            RETURN emp.name, emp.title, emp.email
        """, dept=department_name)
        return [dict(record) for record in result]

def analyze_supply_chain():
    with driver.session() as session:
        result = session.run("""
            MATCH path = (supplier:Supplier)-[:SUPPLIES*]->(manufacturer:Manufacturer)-[:PRODUCES]->(product:Product)
            WITH supplier, product, length(path) as chain_length
            RETURN supplier.name, collect(product.name) as products, chain_length
            ORDER BY chain_length DESC
        """)
        return [dict(record) for record in result]

def detect_fraud_patterns():
    with driver.session() as session:
        result = session.run("""
            MATCH (user:User)-[:PURCHASED]->(order:Order)
            WITH user, count(order) as order_count, sum(order.total) as total_spent
            WHERE order_count > 10 AND total_spent < 100
            RETURN user.name, user.email, order_count, total_spent
            LIMIT 50
        """)
        return [dict(record) for record in result]

def find_connected_components():
    with driver.session() as session:
        result = session.run("""
            CALL gds.wcc.stream('social-graph', {relationshipTypes: ['FRIEND']})
            YIELD nodeId, componentId
            MATCH (u:User) WHERE id(u) = nodeId
            RETURN componentId, collect(u.name) as members
        """)
        return [dict(record) for record in result]
```

## Best Practices

1. **Use Constraints for Data Integrity**: Create uniqueness constraints on frequently queried properties
2. **Index Wisely**: Create indexes on properties used in WHERE clauses and MATCH patterns
3. **Avoid Cartesian Products**: Be careful with unbounded pattern matching that can explode result sets
4. **Use Parameters in Queries**: Always parameterize Cypher queries for performance and security
5. **Profile Your Queries**: Use EXPLAIN and PROFILE to understand query execution plans
6. **Limit Path Lengths**: Set maximum depth in path patterns to prevent infinite traversals
7. **Use MERGE Carefully**: MERGE can create unintended patterns; use CREATE when you know node doesn't exist
8. **Leverage APOC Procedures**: Use APOC for advanced operations like bulk imports and graph transformations
9. **Consider Graph Data Science**: Use built-in algorithms for centrality, community detection, and embeddings
10. **Monitor Query Performance**: Track slow queries and optimize patterns that cause full scans
