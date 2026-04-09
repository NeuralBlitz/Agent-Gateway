---
name: dynamodb
description: Amazon DynamoDB NoSQL database, key-value and document store, serverless operations
category: databases
---
# Amazon DynamoDB

## What I do

I am a fully managed NoSQL database service by AWS, offering fast and predictable performance with seamless scalability. I support both key-value and document data models, providing single-digit millisecond latency at any scale. I offer built-in security, backup/restore, in-memory caching (DAX), and on-demand capacity modes. I am ideal for serverless architectures, high-traffic web applications, and distributed systems requiring elastic scaling.

## When to use me

- Serverless applications using AWS Lambda
- High-traffic web applications and APIs
- Gaming leaderboards and real-time analytics
- Session storage and user state management
- IoT data ingestion and time-series storage
- E-commerce product catalogs
- Mobile backends with offline sync
- Microservices requiring independent data stores
- Applications needing global tables for multi-region replication

## Core Concepts

1. **Tables, Items, and Attributes**: Data organized in tables containing items with multiple attributes
2. **Primary Key**: Either simple (partition key) or composite (partition + sort key)
3. **Partition Key and Sort Key**: Determine data distribution and sorting within partitions
4. **Local Secondary Indexes (LSI)**: Alternative sort key on same partition key
5. **Global Secondary Indexes (GSI)**: Alternative partition/sort key combinations for different access patterns
6. **DynamoDB Streams**: Capture item-level changes for event-driven architectures
7. **DAX (DynamoDB Accelerator)**: In-memory cache providing microsecond read latency
8. **On-Demand vs Provisioned Capacity**: Flexible billing modes for varying workloads
9. **Time to Live (TTL)**: Automatic item expiration for managing data lifecycle
10. **Global Tables**: Multi-region, multi-active replication for global low-latency access

## Code Examples

### Basic Operations

```python
import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError

dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
table = dynamodb.Table("Products")

def create_product(product_data):
    table.put_item(Item=product_data)
    return product_data["product_id"]

def get_product(product_id):
    response = table.get_item(Key={"product_id": product_id})
    return response.get("Item")

def update_product(product_id, updates):
    update_expr = "SET " + ", ".join([f"{k} = :{k}" for k in updates.keys()])
    expr_attr_vals = {f":{k}": v for k, v in updates.items()}
    
    response = table.update_item(
        Key={"product_id": product_id},
        UpdateExpression=update_expr,
        ExpressionAttributeValues=expr_attr_vals,
        ReturnValues="UPDATED_NEW"
    )
    return response["Attributes"]

def delete_product(product_id):
    response = table.delete_item(
        Key={"product_id": product_id},
        ReturnValues="ALL_OLD"
    )
    return response.get("Attributes")

def batch_write_products(products):
    with table.batch_writer() as batch:
        for product in products:
            batch.put_item(Item=product)

def batch_get_products(product_ids):
    keys = [{"product_id": pid} for pid in product_ids]
    response = table.batch_get_item(Keys=keys)
    return response.get("Responses", {}).get("Products", [])
```

### Query and Scan Operations

```python
def query_products_by_category(category, limit=50):
    response = table.query(
        KeyConditionExpression=Key("category").eq(category),
        Limit=limit
    )
    return response.get("Items", [])

def query_products_with_filter(category, min_price=None, in_stock=None):
    key_cond = Key("category").eq(category)
    
    filter_expr = None
    if min_price:
        filter_expr = Attr("price").gte(min_price) if not filter_expr else filter_expr & Attr("price").gte(min_price)
    if in_stock is not None:
        filter_expr = Attr("in_stock").eq(in_stock) if not filter_expr else filter_expr & Attr("in_stock").eq(in_stock)
    
    response = table.query(
        KeyConditionExpression=key_cond,
        FilterExpression=filter_expr,
        Limit=100
    )
    return response.get("Items", [])

def scan_all_products():
    items = []
    response = table.scan()
    items.extend(response.get("Items", []))
    
    while "LastEvaluatedKey" in response:
        response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
        items.extend(response.get("Items", []))
    
    return items

def scan_with_filter(min_price=100, max_price=500):
    response = table.scan(
        FilterExpression=Attr("price").between(min_price, max_price) & Attr("in_stock").eq(True),
        ProjectionExpression="product_id, name, price, category"
    )
    return response.get("Items", [])

def query_with_pagination(category, start_key=None, page_size=20):
    kwargs = {
        "KeyConditionExpression": Key("category").eq(category),
        "Limit": page_size
    }
    if start_key:
        kwargs["ExclusiveStartKey"] = start_key
    
    response = table.query(**kwargs)
    return response.get("Items", []), response.get("LastEvaluatedKey")

def query_with_sort_range(category, sort_key, operator="gte"):
    operators = {"gte": ">=", "lte": "<=", "gt": ">", "lt": "<", "eq": "="}
    key_cond = Key("category").eq(category) & Key("created_at")[operator](sort_key)
    
    response = table.query(KeyConditionExpression=key_cond)
    return response.get("Items", [])
```

### Secondary Indexes

```python
def create_indexes():
    table = dynamodb.Table("Products")
    
    table.update(
        AttributeDefinitions=[
            {"AttributeName": "category", "AttributeType": "S"},
            {"AttributeName": "price", "AttributeType": "N"},
            {"AttributeName": "SKU", "AttributeType": "S"}
        ],
        GlobalSecondaryIndexUpdates=[
            {
                "Create": {
                    "IndexName": "CategoryPriceIndex",
                    "KeySchema": [
                        {"AttributeName": "category", "KeyType": "HASH"},
                        {"AttributeName": "price", "KeyType": "RANGE"}
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                    "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
                }
            }
        ]
    )

def query_by_SKU(SKU):
    table = dynamodb.Table("Products")
    response = table.query(
        IndexName="SKUIndex",
        KeyConditionExpression=Key("SKU").eq(SKU)
    )
    return response.get("Items", [])[0] if response.get("Items") else None

def query_products_by_gsi(category, limit=100):
    table = dynamodb.Table("Products")
    response = table.query(
        IndexName="CategoryPriceIndex",
        KeyConditionExpression=Key("category").eq(category),
        ScanIndexForward=True,
        Limit=limit
    )
    return response.get("Items", [])
```

### Conditional Updates and Transactions

```python
def update_with_condition(product_id, new_price, expected_version):
    try:
        response = table.update_item(
            Key={"product_id": product_id},
            UpdateExpression="SET price = :price, version = :new_version",
            ConditionExpression="version = :expected_version",
            ExpressionAttributeValues={
                ":price": new_price,
                ":expected_version": expected_version,
                ":new_version": expected_version + 1
            },
            ReturnValues="UPDATED_NEW"
        )
        return True, response["Attributes"]
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return False, None
        raise

def update_inventory(product_id, quantity_change):
    return table.update_item(
        Key={"product_id": product_id},
        UpdateExpression="SET inventory_count = if_not_exists(inventory_count, :zero) + :change",
        ExpressionAttributeValues={":zero": 0, ":change": quantity_change},
        ConditionExpression="attribute_exists(product_id)",
        ReturnValues="UPDATED_NEW"
    )

def transfer_points(from_user, to_user, amount):
    dynamodb_transact = boto3.resource("dynamodb").Table("UserPoints")
    
    try:
        response = dynamodb_transact.transact_write_items(
            TransactItems=[
                {
                    "Update": {
                        "TableName": "UserPoints",
                        "Key": {"user_id": from_user},
                        UpdateExpression="SET points = points - :amount",
                        ConditionExpression="points >= :amount",
                        ExpressionAttributeValues={":amount": amount}
                    }
                },
                {
                    "Update": {
                        "TableName": "UserPoints",
                        "Key": {"user_id": to_user},
                        UpdateExpression="SET points = points + :amount",
                        ExpressionAttributeValues={":amount": amount}
                    }
                }
            ]
        )
        return True
    except ClientError as e:
        return False

def atomic_counter(table_name, counter_key, amount):
    table = dynamodb.Table(table_name)
    response = table.update_item(
        Key={"id": counter_key},
        UpdateExpression="SET #cnt = #cnt + :amount",
        ExpressionAttributeNames={"#cnt": "count"},
        ExpressionAttributeValues={":amount": amount},
        ReturnValues="UPDATED_NEW"
    )
    return response["Attributes"]["count"]
```

### Streams and TTL

```python
def enable_ttl(table_name, ttl_attribute="expires_at"):
    dynamodb_client = boto3.client("dynamodb")
    dynamodb_client.update_time_to_live(
        TableName=table_name,
        TimeToLiveSpecification={
            "Enabled": True,
            "AttributeName": ttl_attribute
        }
    )

def set_item_with_ttl(item, ttl_seconds=86400):
    from datetime import datetime, timedelta
    import time
    
    item["expires_at"] = int(time.time() + ttl_seconds)
    table.put_item(Item=item)

def create_ddb_stream_handler(lambda_function_name):
    import boto3
    
    dynamodb_client = boto3.client("dynamodb")
    streams_client = boto3.client("dynamodbstreams")
    
    response = dynamodb_client.describe_table(TableName="Products")
    stream_arn = response["Table"]["LatestStreamArn"]
    
    lambda_client = boto3.client("lambda")
    lambda_client.create_event_source_mapping(
        EventSourceArn=stream_arn,
        FunctionName=lambda_function_name,
        StartingPosition="LATEST",
        BatchSize=100,
        MaximumBatchingWindowInSeconds=60
    )

def process_stream_records(records):
    for record in records:
        event_name = record["eventName"]
        item = record["dynamodb"].get("NewImage")
        old_item = record["dynamodb"].get("OldImage")
        
        if event_name == "INSERT":
            print(f"New item added: {item}")
        elif event_name == "MODIFY":
            print(f"Item modified: {old_item} -> {item}")
        elif event_name == "REMOVE":
            print(f"Item removed: {old_item}")

def backup_table(table_name, backup_name):
    dynamodb_client = boto3.client("dynamodb")
    dynamodb_client.create_backup(
        TableName=table_name,
        BackupName=backup_name
    )

def restore_from_backup(backup_arn, new_table_name):
    dynamodb_client = boto3.client("dynamodb")
    dynamodb_client.restore_table_from_backup(
        TargetTableName=new_table_name,
        BackupArn=backup_arn
    )
```

## Best Practices

1. **Choose Primary Key Wisely**: Avoid hot partitions by distributing data across partition keys
2. **Use GSIs for Multiple Access Patterns**: Create GSIs for queries that don't fit primary key access
3. **Implement Proper Error Handling**: Use exponential backoff and jitter for retry logic
4. **Use Batch Operations**: BatchGetItem and BatchWriteItem for bulk operations reduce API calls
5. **Choose Capacity Mode Appropriately**: Use on-demand for variable workloads; provisioned for predictable patterns
6. **Enable DAX for Read-Heavy Workloads**: DAX provides sub-millisecond read latency for hot data
7. **Implement TTL for Data Expiration**: Use TTL instead of scheduled deletes for automatic cleanup
8. **Use Projections to Reduce Data Transfer**: Specify only needed attributes in queries
9. **Leverage Adaptive Capacity**: DynamoDB automatically handles hot partitions; design accordingly
10. **Monitor with CloudWatch**: Track throttled requests, consumed capacity, and latency metrics
