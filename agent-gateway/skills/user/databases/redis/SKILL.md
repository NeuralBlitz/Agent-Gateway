---
name: redis
description: Redis in-memory data store, caching strategies, and pub/sub messaging
category: databases
---
# Redis

## What I do

I am an in-memory data structure store, functioning as a database, cache, and message broker. I provide exceptional performance by keeping data in RAM with optional persistence to disk. I support diverse data structures including strings, hashes, lists, sets, sorted sets, bitmaps, hyperloglog, and streams. I excel at high-speed caching, session management, real-time analytics, leaderboards, and pub/sub messaging patterns.

## When to use me

- Application caching layer for frequently accessed data
- Session storage for web applications
- Real-time analytics and counters
- Leaderboards and ranking systems
- Pub/sub messaging and real-time notifications
- Rate limiting and throttling
- Distributed locks and synchronization
- Temporary data and job queues
- Full-text search with RediSearch
- Graph operations with RedisGraph

## Core Concepts

1. **In-Memory Storage**: All data resides in RAM for microsecond access times; persistence options (RDB, AOF)
2. **Data Structures**: Strings, Hashes, Lists, Sets, Sorted Sets, Bitmaps, HyperLogLog, Streams, Geospatial
3. **Expiration (TTL)**: Automatic key expiration for cache-like behavior and temporary data management
4. **Persistence**: RDB (point-in-time snapshots) and AOF (append-only file) persistence modes
5. **Pub/Sub**: Publish-subscribe messaging for real-time communication between clients
6. **Transactions**: MULTI/EXEC for atomic execution of commands; WATCH for optimistic locking
7. **Lua Scripting**: Server-side scripts for atomic, efficient multi-command operations
8. **Cluster**: Redis Cluster for horizontal scaling and automatic sharding
9. **Replication**: Master-replica replication for high availability and read scaling
10. **Modules**: Extensible functionality through modules (RediSearch, RedisGraph, RedisJSON, RedisTimeSeries)

## Code Examples

### Basic Operations and Data Types

```python
import redis
from redis.exceptions import LockError

r = redis.Redis(
    host="localhost",
    port=6379,
    db=0,
    decode_responses=True,
    socket_timeout=5,
    socket_connect_timeout=5
)

def cache_user_session(session_id, user_data, ttl=3600):
    r.hset(f"session:{session_id}", mapping={
        "user_id": user_data["id"],
        "email": user_data["email"],
        "created_at": str(user_data["created_at"])
    })
    r.expire(f"session:{session_id}", ttl)
    return True

def get_user_session(session_id):
    session_data = r.hgetall(f"session:{session_id}")
    return session_data if session_data else None

def increment_page_view(page_id):
    key = f"page_views:{page_id}"
    return r.incr(key)

def get_page_views(page_id):
    return r.get(f"page_views:{page_id}")

def add_to_shopping_cart(user_id, product_id, quantity=1):
    cart_key = f"cart:{user_id}"
    r.hincrby(cart_key, product_id, quantity)
    r.expire(cart_key, 86400 * 7)
    return True

def get_shopping_cart(user_id):
    cart_key = f"cart:{user_id}"
    return r.hgetall(cart_key)

def remove_from_cart(user_id, product_id):
    cart_key = f"cart:{user_id}"
    r.hdel(cart_key, product_id)
    return True

def store_user_preferences(user_id, preferences):
    r.hset(f"prefs:{user_id}", mapping=preferences)
    return True

def get_user_preferences(user_id):
    return r.hgetall(f"prefs:{user_id}")
```

### Sorted Sets for Leaderboards and Rankings

```python
def add_score_to_leaderboard(leaderboard_key, member, score):
    r.zadd(leaderboard_key, {member: score})

def get_top_scores(leaderboard_key, top_n=10):
    return r.zrevrange(leaderboard_key, 0, top_n - 1, withscores=True)

def get_member_rank(leaderboard_key, member):
    return r.zrevrank(leaderboard_key, member)

def get_member_score(leaderboard_key, member):
    return r.zscore(leaderboard_key, member)

def increment_member_score(leaderboard_key, member, increment):
    return r.zincrby(leaderboard_key, increment, member)

def get_members_in_score_range(leaderboard_key, min_score, max_score):
    return r.zrangebyscore(leaderboard_key, min_score, max_score, withscores=True)

def remove_low_score_members(leaderboard_key, min_score):
    return r.zremrangebyscore(leaderboard_key, "-inf", min_score)

def get_member_percentile(leaderboard_key, member):
    rank = r.zrevrank(leaderboard_key, member)
    total = r.zcard(leaderboard_key)
    if rank is None or total == 0:
        return None
    return (rank / (total - 1)) * 100 if total > 1 else 100

def update_game_scores(game_id, player_scores):
    leaderboard_key = f"game:{game_id}:leaderboard"
    pipeline = r.pipeline()
    for player, score in player_scores.items():
        pipeline.zadd(leaderboard_key, {player: score})
    pipeline.execute()

def get_weekly_leaderboard(week_offset=0):
    import time
    week_start = time.time() - (week_offset * 7 * 86400)
    week_start = week_start - (week_start % (7 * 86400))
    return get_top_scores(f"leaderboard:{int(week_start)}", 100)
```

### Pub/Sub for Real-Time Messaging

```python
import threading
from redis import ConnectionPool

pool = ConnectionPool(host="localhost", port=6379, db=0)
pubsub = redis.Redis(connection_pool=pool)

def publish_notification(channel, notification):
    pubsub.publish(channel, notification)
    return True

def send_user_notification(user_id, notification):
    return publish_notification(f"user:{user_id}:notifications", notification)

def broadcast_to_all_users(notification):
    channels = pubsub.pubsub_channels("*")
    for channel in channels:
        if channel.startswith("user:"):
            pubsub.publish(channel, notification)
    return True

class NotificationSubscriber:
    def __init__(self, user_id):
        self.user_id = user_id
        self.pubsub = pubsub.pubsub()
        self.pubsub.subscribe(f"user:{user_id}:notifications")
        self.thread = None
    
    def start_listening(self):
        def listener():
            for message in self.pubsub.listen():
                if message["type"] == "message":
                    yield message["data"]
        
        self.thread = threading.Thread(target=lambda: list(listener()))
        self.thread.daemon = True
        self.thread.start()
    
    def stop(self):
        self.pubsub.unsubscribe()
        self.pubsub.close()

def on_new_order(channel, message):
    import json
    order_data = json.loads(message)
    print(f"New order received: {order_data['order_id']}")
    return order_data
```

### Lua Scripting for Atomic Operations

```python
def register_user_with_lock(user_data, lock_timeout=10):
    lock_key = f"lock:register:{user_data['email']}"
    user_key = f"user:email:{user_data['email']}"
    
    lock = r.lock(lock_key, timeout=lock_timeout)
    try:
        if lock.acquire(blocking=True, blocking_timeout=5):
            if r.exists(user_key):
                raise ValueError("User already exists")
            
            user_id = generate_user_id()
            r.set(user_key, user_id)
            r.hset(f"user:{user_id}", mapping=user_data)
            r.sadd("users:all", user_id)
            return user_id
    except LockError:
        raise TimeoutError("Could not acquire lock")
    finally:
        lock.release()

SCRIPT_PURCHASE = """
local cart_key = KEYS[1]
local inventory_key = KEYS[2]
local order_key = KEYS[3]
local user_id = ARGV[1]

local items = redis.call('HGETALL', cart_key)
if #items == 0 then
    return {err = 'Cart is empty'}
end

local total = 0
local order_items = {}

for i = 1, #items, 2 do
    local product_id = items[i]
    local quantity = tonumber(items[i+1])
    
    local stock = tonumber(redis.call('HGET', inventory_key, product_id))
    if stock < quantity then
        return {err = 'Insufficient stock for product ' .. product_id}
    end
    
    local price = tonumber(redis.call('HGET', 'product:prices', product_id))
    total = total + (price * quantity)
    
    redis.call('HINCRBY', inventory_key, product_id, -quantity)
    table.insert(order_items, {product_id, quantity, price})
end

local order_id = redis.call('INCR', 'orders:counter')
redis.call('HSET', order_key .. ':' .. user_id, order_id, total)
redis.call('DEL', cart_key)

return {order_id, total, order_items}
"""

def execute_purchase(user_id):
    keys = [f"cart:{user_id}", f"inventory:{user_id}", f"orders:{user_id}"]
    return r.eval(SCRIPT_PURCHASE, len(keys), *keys, user_id)

SCRIPT_RATE_LIMIT = """
local current = tonumber(redis.call('GET', KEYS[1]) or '0')
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])

if current >= limit then
    return {remaining = 0, reset = redis.call('TTL', KEYS[1])}
end

local new_count = redis.call('INCR', KEYS[1])
if new_count == 1 then
    redis.call('EXPIRE', KEYS[1], window)
end

return {remaining = limit - new_count, reset = redis.call('TTL', KEYS[1])}
"""

def check_rate_limit(client_id, limit=100, window=60):
    key = f"rate_limit:{client_id}"
    result = r.eval(SCRIPT_RATE_LIMIT, 1, key, limit, window)
    return {"remaining": result[0], "reset": result[1]}
```

### Advanced Patterns and Caching Strategies

```python
from functools import wraps
import json

def cache_with_ttl(ttl=300, key_prefix=""):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache_key = f"{key_prefix}:{func.__name__}:{args}:{kwargs}"
            cached = r.get(cache_key)
            if cached:
                return json.loads(cached)
            
            result = func(*args, **kwargs)
            r.setex(cache_key, ttl, json.dumps(result))
            return result
        return wrapper
    return decorator

@cache_with_ttl(ttl=600, key_prefix="products")
def get_product_details(product_id):
    return {"id": product_id, "name": "Product", "price": 99.99}

def invalidate_product_cache(product_id):
    pattern = f"products:*:{product_id}"
    keys = r.keys(pattern)
    if keys:
        r.delete(*keys)
    return True

def cache_aside_get(cache_key, fallback_func, ttl=300):
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)
    
    result = fallback_func()
    r.setex(cache_key, ttl, json.dumps(result))
    return result

def set_with_nx(key, value, ttl=None):
    return r.set(key, value, nx=True, ex=ttl)

def acquire_distributed_lock(lock_name, timeout=10):
    lock = r.lock(lock_name, timeout=timeout)
    if lock.acquire(blocking=False):
        return lock
    return None

def update_visitor_count():
    key = "site:visitors:daily"
    today = datetime.now().strftime("%Y-%m-%d")
    return r.incr(f"{key}:{today}")

def get_daily_visitors():
    today = datetime.now().strftime("%Y-%m-%d")
    return r.get(f"site:visitors:daily:{today}") or 0

def track_unique_visitors(user_cookie):
    return r.sadd("site:visitors:unique", user_cookie)

def get_unique_visitor_count():
    return r.scard("site:visitors:unique")

def store_user_feed(user_id, feed_items, max_items=100):
    feed_key = f"feed:{user_id}"
    pipeline = r.pipeline()
    for item in feed_items:
        pipeline.lpush(feed_key, item)
    pipeline.ltrim(feed_key, 0, max_items - 1)
    pipeline.execute()

def get_user_feed(user_id, start=0, count=10):
    feed_key = f"feed:{user_id}"
    return r.lrange(feed_key, start, start + count - 1)
```

## Best Practices

1. **Use Connection Pooling**: Create a connection pool for production to handle concurrent connections efficiently
2. **Set Appropriate TTL**: Configure expiration times based on data freshness requirements; avoid perpetual keys for cache
3. **Monitor Memory Usage**: Use MEMORY USAGE command and monitor via redis-cli info memory; set maxmemory policy
4. **Use Redis Sentinel or Cluster**: For high availability; avoid single-point-of-failure deployments
5. **Use Appropriate Data Structures**: Choose the right structure (sorted sets for rankings, hashes for objects, lists for queues)
6. **Implement Lua Scripts for Atomicity**: Use scripts for multi-command operations that must be atomic
7. **Enable Persistence Appropriately**: Use AOF with fsync=everysec for durability; RDB for faster restarts
8. **Secure Your Instance**: Enable requirepass, bind to localhost, use TLS, and implement ACLs in Redis 6+
9. **Use Pipeline for Bulk Operations**: Batch commands using pipeline to reduce network round trips
10. **Monitor and Tune**: Track slow queries with SLOWLOG, monitor hit rates, and tune maxmemory-eviction-policy
