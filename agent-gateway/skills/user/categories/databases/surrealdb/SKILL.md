---
name: surrealdb
description: SurrealDB multi-model database, document-graph hybrid, and real-time capabilities
category: databases
---
# SurrealDB

## What I do

I am a multi-model, document-graph hybrid database designed for modern applications. I combine the flexibility of document databases with the relationship traversal capabilities of graph databases. I support structured query language (SurrealQL) with joins, graph traversals, and aggregations. I provide built-in authentication, real-time subscriptions, and native support for files and media. I am designed for web, mobile, and serverless applications requiring flexible data models and real-time features.

## When to use me

- Web and mobile applications with complex data models
- Real-time collaborative applications
- Graph-like relationship traversal in document data
- Content management systems
- Gaming platforms with player interactions
- Social networks and community platforms
- IoT data with device relationships
- E-commerce with complex product relationships
- Microservices with shared data layer
- Applications requiring real-time updates

## Core Concepts

1. **Multi-Model Data**: Support for documents, graphs, key-value, and time-series in one database
2. **SurrealQL**: SQL-like query language with extensions for graph traversal and arrays
3. **Record IDs**: Unique identifiers combining table name and random/string ID
4. **Embedded Graph Engine**: Native graph traversal without separate graph database
5. **Real-Time Subscriptions**: Live queries that push updates to connected clients
6. **Schemafull or Schemaless**: Flexible schemas or strict type enforcement per table
7. **Transactions**: ACID transactions with snapshot isolation
8. **Authentication**: Built-in JWT authentication with role-based access control
9. **ML/AI Integration**: Native support for embedding vectors and AI operations
10. **Multi-Table Queries**: Graph-style joins across multiple tables in single queries

## Code Examples

### Basic Connection and CRUD Operations

```python
import surrealdb
from surrealdb.surreal import Surreal

db = Surreal("ws://localhost:8000/rpc")

async def init_connection():
    await db.connect()
    await db.signin({"user": "root", "pass": "root"})
    await db.use("app_database", "app_namespace")

def create_user(user_data):
    return db.create("users", user_data)

def get_user(user_id):
    return db.select(f"users:{user_id}")

def get_all_users():
    return db.select("users")

def update_user(user_id, updates):
    return db.update(f"users:{user_id}", updates)

def delete_user(user_id):
    return db.delete(f"users:{user_id}")

def upsert_user(user_id, user_data):
    return db.upsert(f"users:{user_id}", user_data)

def bulk_create_users(users):
    results = []
    for user in users:
        result = db.create("users", user)
        results.append(result)
    return results
```

### Advanced Queries with SurrealQL

```python
def query_users_with_orders():
    return db.query("""
        SELECT 
            *,
            ->placed_orders->orders AS user_orders
        FROM users
        WHERE active = true
    """)

def get_user_with_details(user_id):
    return db.query(f"""
        SELECT 
            *,
            ->friends->friends AS friend_network,
            ->placed_orders->orders AS orders,
            ->user_profile->profiles AS profile
        FROM users:{user_id}
    """)

def get_graph_traversal(start_user_id, depth=3):
    return db.query(f"""
        SELECT 
            id,
            name,
            ->friends AS level_1_friends,
            ->friends->friends AS level_2_friends,
            ->friends->friends->friends AS level_3_friends
        FROM users:{start_user_id}
    """)

def find_common_friends(user1_id, user2_id):
    return db.query(f"""
        LET $user1 = (SELECT id FROM users:{user1_id});
        LET $user2 = (SELECT id FROM users:{user2_id});
        
        SELECT 
            id,
            name,
            ->friends AS friends
        FROM users
        WHERE id IN $user1.friends 
            AND id IN $user2.friends
    """)

def get_product_recommendations(user_id):
    return db.query(f"""
        SELECT 
            id,
            name,
            category,
            price,
            ->purchased_by->orders->user AS purchasers,
            (SELECT id FROM purchasers WHERE id = '{user_id}') AS user_purchased
        FROM products
        WHERE user_purchased = NONE
        ORDER BY rating DESC
        LIMIT 10
    """)

def get_social_graph_stats():
    return db.query("""
        SELECT 
            id,
            name,
            ->friends AS direct_friends,
            LENGTH(direct_friends) AS friend_count,
            (SELECT id FROM ->friends->friends) AS friends_of_friends,
            LENGTH(friends_of_friends) AS extended_network
        FROM users
        ORDER BY friend_count DESC
        LIMIT 100
    """)
```

### Relationships and Graph Traversals

```python
def create_relationship(from_id, relationship, to_id):
    return db.query(f"""
        RELATE {from_id}->{relationship}->{to_id}
    """)

def create_user_friend(user_id, friend_id):
    return db.query(f"""
        RELATE users:{user_id}->friends->users:{friend_id}
    """)

def create_order_relationship(user_id, order_id):
    return db.query(f"""
        RELATE users:{user_id}->placed_orders->orders:{order_id}
    """)

def get_related_data(record_id):
    return db.query(f"""
        SELECT 
            id,
            ->* AS all_relationships,
            <-* AS all_reverse_relationships
        FROM {record_id}
    """)

def delete_relationship(from_id, relationship, to_id):
    return db.query(f"""
        DELETE {from_id}->{relationship}->{to_id}
    """)

def get_connected_nodes(record_id, relationship):
    return db.query(f"""
        SELECT 
            id,
            in AS source,
            out AS destination
        FROM {relationship}
        WHERE in = {record_id} OR out = {record_id}
    """)

def analyze_social_connections(user_id):
    return db.query(f"""
        SELECT 
            id,
            name,
            email,
            ->friends->friends AS mutual_friends,
            (SELECT count() FROM mutual_friends) AS common_friend_count
        FROM users:{user_id}
    """)

def find_shortest_path(start_user, end_user):
    return db.query(f"""
        SELECT 
            id,
            ->friends->->friends->->friends AS path,
            LENGTH(path) AS distance
        FROM users:{start_user}
        WHERE id = '{end_user}'
    """)
```

### Real-Time Subscriptions

```python
import asyncio

async def subscribe_to_table(table_name, callback):
    async for result in db.subscribe(table_name):
        callback(result)

async def subscribe_to_query(query, callback):
    async for result in db.subscribe_query(query):
        callback(result)

async def subscribe_to_user_changes(user_id, callback):
    async for result in db.subscribe(f"users:{user_id}"):
        callback(result)

async def subscribe_to_orders_for_user(user_id, callback):
    query = f"""
        SELECT * FROM orders
        WHERE ->placed_orders->users.id = '{user_id}'
    """
    async for result in db.subscribe_query(query):
        callback(result)

async def subscribe_to_live_table():
    async def on_change(data):
        print(f"New data: {data}")
    
    await db.subscribe("products", on_change)
    
    await asyncio.sleep(60)

async def subscribe_with_filter(table_name, filter_query, callback):
    async for result in db.subscribe(table_name, filter_query):
        callback(result)

async def live_query_example():
    await db.live("products", callback=lambda data: print(f"Product updated: {data}"))
    await asyncio.sleep(30)

def kill_live_query(query_id):
    return db.kill(query_id)
```

### Authentication and Security

``` def create_user_auth(email, password, role="user"):
    return db.signup({
        "NS": "app_namespace",
        "DB": "app_database",
        "SC": "user_scope",
        "email": email,
        "password": password,
        "role": role
    })

def signin_user(email, password):
    return db.signin({
        "NS": "app_namespace",
        "DB": "app_database",
        "SC": "user_scope",
        "email": email,
        "password": password
    })

def authenticate_request(token):
    return db.authenticate(token)

def create_api_key(name, role):
    return db.create("api_keys", {
        "name": name,
        "role": role,
        "key": generate_random_key(),
        "created_at": datetime.utcnow()
    })

def verify_api_key(api_key):
    return db.query(f"""
        SELECT * FROM api_keys
        WHERE key = '{api_key}'
        LIMIT 1
    """)

def create_scope_auth():
    return db.query("""
        DEFINE SCOPE user_scope
        SESSION 24h
        SIGNUP (CREATE user SET email = $email, password = $password)
        SIGNIN (SELECT * FROM user WHERE email = $email AND crypto::bcrypt::compare(password, $password))
    """)

def create_record_rules():
    return db.query("""
        DEFINE TABLE users SCHEMALESS
        PERMISSIONS
            FOR select WHERE id = $auth.id
            FOR create, update, delete WHERE id = $auth.id;
        
        DEFINE TABLE orders
        PERMISSIONS
            FOR select WHERE user.id = $auth.id
            FOR create WHERE user.id = $auth.id
            FOR update, delete WHERE user.id = $auth.id;
    """)

def create_field_permissions():
    return db.query("""
        DEFINE FIELD email ON users TYPE string ASSERT $value IS STRING;
        DEFINE FIELD password ON users TYPE string ASSERT crypto::bcrypt::generate($value) = $value;
        DEFINE FIELD role ON users TYPE string VALUE $value OR "user";
    """)

def get_auth_info():
    return db.info()

def revoke_token(token):
    return db.invalidate(token)
```

### Complex Aggregations and Analytics

```python
def get_user_stats():
    return db.query("""
        SELECT 
            count() AS total_users,
            array::len(->friends) AS avg_friends,
            ->placed_orders->orders.id AS all_orders,
            LENGTH(all_orders) AS total_orders,
            math::mean(->placed_orders->orders.total) AS avg_order_value
        FROM users
        GROUP BY id
    """)

def get_popular_products():
    return db.query("""
        SELECT 
            *,
            ->purchased_by->orders.id AS purchases,
            LENGTH(purchases) AS purchase_count,
            math::mean(->purchased_by->orders.total) AS avg_purchase_value
        FROM products
        ORDER BY purchase_count DESC
        LIMIT 20
    """)

def get_sales_analytics():
    return db.query("""
        SELECT 
            ->placed_orders->orders.status AS statuses,
            count() AS total_orders,
            math::sum(->placed_orders->orders.total) AS total_revenue,
            math::mean(->placed_orders->orders.total) AS avg_order_value
        FROM users
        GROUP BY id
    """)

def get_time_series_stats():
    return db.query("""
        SELECT 
            *,
            time::year(created_at) AS year,
            time::month(created_at) AS month,
            count() AS monthly_signups
        FROM users
        GROUP BY year, month
        ORDER BY year, month
    """)

def get_nested_aggregations():
    return db.query("""
        SELECT 
            id,
            name,
            ->friends AS friends,
            (SELECT count() FROM friends) AS friend_count,
            (SELECT id FROM ->friends->friends) AS extended_network,
            (SELECT count() FROM extended_network) AS network_size
        FROM users
        ORDER BY network_size DESC
        LIMIT 50
    """)

def get_user_segments():
    return db.query("""
        SELECT 
            id,
            name,
            ->placed_orders->orders.total AS order_totals,
            LENGTH(order_totals) AS order_count,
            math::sum(order_totals) AS lifetime_value,
            CASE 
                WHEN order_count > 10 THEN 'premium'
                WHEN order_count > 5 THEN 'regular'
                WHEN order_count > 0 THEN 'occasional'
                ELSE 'new'
            END AS segment
        FROM users
    """)

def get_category_breakdown():
    return db.query("""
        SELECT 
            category,
            count() AS product_count,
            math::mean(price) AS avg_price,
            math::min(price) AS min_price,
            math::max(price) AS max_price,
            ->purchased_by->orders.id AS purchases,
            LENGTH(purchases) AS total_purchases
        FROM products
        GROUP BY category
        ORDER BY total_purchases DESC
    """)
```

## Best Practices

1. **Use Record IDs for Relationships**: Leverage SurrealDB's graph capabilities with proper record IDs
2. **Leverage Live Queries**: Use subscriptions for real-time features instead of polling
3. **Design for Graph Traversal**: Model data with relationships for efficient traversal queries
4. **Use SurrealQL Effectively**: Leverage graph-style joins and array functions for complex queries
5. **Implement Proper Authentication**: Use scopes and permissions for row-level access control
6. **Choose Schemaless or Schemafull**: Define schemas for critical data; use flexible schemas for evolving data
7. **Optimize Relationships**: Use appropriate relationship types; limit deep traversals in production
8. **Use Indexes**: Create indexes on frequently queried fields for performance
9. **Leverage Multi-Model Features**: Combine document and graph capabilities based on use case
10. **Monitor Query Performance**: Use EXPLAIN to analyze query plans and optimize slow queries
