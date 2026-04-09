---
name: DynamoDB
description: Fully managed NoSQL database service by AWS with seamless scalability, single-digit millisecond performance, and integrated security
license: MIT
compatibility:
  - Python 3.8+
  - boto3 1.26+
  - pynamodb 5.5+
audience: Backend developers, cloud engineers, serverless developers
category: databases
---

# DynamoDB

## What I Do

I provide guidance on Amazon DynamoDB, the fully managed NoSQL database. I help with table design, key schema optimization, GSI/LSI strategies, on-demand vs provisioned capacity, DAX caching, and serverless integrations.

## When to Use Me

- Serverless applications on AWS
- High-scale web applications
- Real-time bidding and gaming leaderboards
- IoT data storage
- Session storage at scale
- Microservices with isolated data stores
- Applications needing predictable performance
- Event-driven architectures

## Core Concepts

- **Tables**: Collections of items with no fixed schema
- **Items**: Individual records (up to 400KB)
- **Attributes**: Data elements (scalars, sets, maps)
- **Partition Key**: Distributes data across partitions
- **Sort Key**: Orders items within a partition
- **GSI**: Global Secondary Index (different partition key)
- **LSI**: Local Secondary Index (same PK, different sort key)
- **RCU/WCU**: Read/Write Capacity Units
- **DAX**: In-memory cache for microsecond latency
- **TTL**: Automatic item expiration
- **Streams**: Change data capture

## Code Examples

### Basic Operations with boto3

```python
import boto3
from boto3.dynamodb.conditions import Key, Attr

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
users_table = dynamodb.Table('Users')

def create_user(user_id: str, email: str, name: str) -> dict:
    return users_table.put_item(
        Item={
            'user_id': user_id,
            'email': email,
            'name': name,
            'created_at': '2024-01-01T00:00:00Z',
            'status': 'active'
        },
        ReturnValues='ALL_OLD'
    )

def get_user(user_id: str) -> dict:
    response = users_table.get_item(Key={'user_id': user_id})
    return response.get('Item')

def update_user_status(user_id: str, status: str) -> dict:
    return users_table.update_item(
        Key={'user_id': user_id},
        UpdateExpression='SET #status = :status, updated_at = :now',
        ExpressionAttributeNames={'#status': 'status'},
        ExpressionAttributeValues={
            ':status': status,
            ':now': '2024-01-01T00:00:00Z'
        },
        ReturnValues='ALL_NEW'
    )
```

### Query and Scan Operations

```python
import boto3
from boto3.dynamodb.conditions import Key, Attr

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
orders_table = dynamodb.Table('Orders')

def get_customer_orders(customer_id: str, limit: int = 20) -> list:
    response = orders_table.query(
        KeyConditionExpression=Key('customer_id').eq(customer_id),
        ScanIndexForward=False,
        Limit=limit
    )
    return response.get('Items', [])

def get_orders_by_date_range(customer_id: str, start: str, end: str) -> list:
    response = orders_table.query(
        KeyConditionExpression=(
            Key('customer_id').eq(customer_id) &
            Key('order_date').between(start, end)
        )
    )
    return response.get('Items', [])

def find_active_users_by_registration(registration_month: str) -> list:
    response = users_table.scan(
        FilterExpression=(
            Attr('status').eq('active') &
            Attr('registration_month').eq(registration_month)
        ),
        ProjectionExpression='user_id, email, name'
    )
    return response.get('Items', [])
```

### Global Secondary Index Operations

```python
import boto3
from boto3.dynamodb.conditions import Key, Attr

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
products_table = dynamodb.Table('Products')

def find_products_by_category(category: str) -> list:
    response = products_table.query(
        IndexName='category-index',
        KeyConditionExpression=Key('category').eq(category)
    )
    return response.get('Items', [])

def find_products_by_price_range(
    min_price: float, 
    max_price: float, 
    category: str = None
) -> list:
    kwargs = {
        'IndexName': 'price-index',
        'KeyConditionExpression': (
            Key('price').between(min_price, max_price)
        )
    }
    
    if category:
        kwargs['FilterExpression'] = Attr('category').eq(category)
    
    response = products_table.query(**kwargs)
    return response.get('Items', [])
```

### Batch Operations and TTL

```python
import boto3
from botocore.exceptions import ClientError
from datetime import datetime

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
sessions_table = dynamodb.Table('UserSessions')

def batch_create_sessions(sessions: list) -> dict:
    try:
        response = sessions_table.batch_write_item(
            RequestItems={
                'UserSessions': [
                    {
                        'PutRequest': {
                            'Item': {
                                'session_id': s['id'],
                                'user_id': s['user_id'],
                                'expires_at': s['expires'],
                                'data': s['data']
                            }
                        }
                    } for s in sessions
                ]
            }
        )
        return {'success': True, 'unprocessed': response.get('UnprocessedItems', {})}
    except ClientError as e:
        return {'success': False, 'error': str(e)}

def get_expired_sessions(expired_before: int) -> list:
    response = sessions_table.scan(
        FilterExpression=Attr('expires_at').lt(expired_before),
        ProjectionExpression='session_id, user_id'
    )
    return response.get('Items', [])
```

## Best Practices

1. Choose partition keys with high cardinality
2. Use GSIs for alternative access patterns
3. Avoid hot partitions (distribute access evenly)
4. Use batch operations for efficiency
5. Implement exponential backoff for throttling
6. Use DAX for read-heavy microsecond latency
7. Set appropriate TTLs for temporary data
8. Monitor consumed capacity and throttles
9. Use on-demand capacity for unpredictable workloads
10. Enable DynamoDB Streams for change capture

## Common Patterns

**Single-Table Design (adjacency list):**
```python
# Items have PK and SK for flexible relationships
{
    'PK': 'USER#123',
    'SK': 'METADATA',
    'name': 'John'
}
{
    'PK': 'USER#123',
    'SK': 'ORDER#456',
    'order_id': '456',
    'total': 99.99
}
{
    'PK': 'ORDER#456',
    'SK': 'USER#123',
    'user_id': '123'
}
```

**Cursor Pagination:**
```python
def paginate_orders(customer_id: str, last_evaluated_key: dict = None):
    kwargs = {'KeyConditionExpression': Key('customer_id').eq(customer_id)}
    if last_evaluated_key:
        kwargs['ExclusiveStartKey'] = last_evaluated_key
    
    response = orders_table.query(**kwargs)
    return response['Items'], response.get('LastEvaluatedKey')
```

**TTL for Session Cleanup:**
```python
# Set TTL attribute (epoch seconds)
expires_at = int((datetime.utcnow() + timedelta(days=7)).timestamp())
table.put_item(Item={'session_id': '...', 'expires_at': expires_at})
# DynamoDB auto-deletes expired items
```
