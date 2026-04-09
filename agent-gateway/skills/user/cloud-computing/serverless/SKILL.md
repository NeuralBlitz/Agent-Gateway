---
name: serverless
description: Cloud computing execution model where cloud provider runs the server, dynamically allocating machine resources
category: cloud-computing
---

# Serverless Computing

## What I Do

I enable developers to build and run applications without managing servers. You write code, deploy it to the cloud, and the provider handles infrastructure, scaling, and maintenance. You only pay for actual compute time consumed, not idle server capacity.

## When to Use Me

- Event-driven workloads (file processing, database triggers)
- Variable or unpredictable traffic patterns
- Rapid prototyping and MVP development
- Microservices architectures
- Background jobs and batch processing
- API backends with intermittent usage

## Core Concepts

- **Function as a Service (FaaS)**: Deploy individual functions that run in stateless containers
- **Cold Starts**: Initial invocation latency when a function hasn't been used recently
- **Event Sources**: Triggers that activate functions (HTTP, S3, DynamoDB, etc.)
- **Stateless Execution**: Functions don't maintain state between invocations
- **Execution Time Limits**: Maximum duration functions can run (typically 5-15 minutes)
- **Memory Allocation**: Functions are allocated CPU proportionally to memory
- **Concurrency Limits**: Maximum simultaneous executions per function
- **Dead Letter Queues**: Handle failed function invocations
- **Layered Packaging**: Share dependencies across functions

## Code Examples

**AWS Lambda (Python):**
```python
import json
import boto3

def handler(event, context):
    s3 = boto3.client('s3')
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = event['Records'][0]['s3']['object']['key']
    
    response = s3.get_object(Bucket=bucket, Key=key)
    content = response['Body'].read()
    
    return {
        'statusCode': 200,
        'body': json.dumps(f'Processed {len(content)} bytes')
    }
```

**Azure Functions (JavaScript):**
```javascript
module.exports = async function (context, myQueueItem) {
    context.log('Processing queue item:', myQueueItem);
    
    // Process the item
    const result = await processItem(myQueueItem);
    
    context.res = {
        body: { result: result }
    };
};

async function processItem(item) {
    return { processed: true, item: item.id };
}
```

**Google Cloud Function (Python):**
```python
def hello_world(request):
    request_json = request.get_json()
    if request_json and 'name' in request_json:
        return f"Hello, {request_json['name']}!"
    return "Hello, World!"
```

**AWS Lambda with Layers:**
```python
import pandas as pd
import numpy as np

def analyze_data(event, context):
    df = pd.DataFrame(event['data'])
    result = df.describe()
    return {
        'statusCode': 200,
        'body': result.to_dict()
    }
```

## Best Practices

1. **Keep functions small and focused** - Single responsibility principle
2. **Minimize deployment package size** - Use layers for shared dependencies
3. **Avoid cold starts** - Use provisioned concurrency for latency-sensitive apps
4. **Implement proper error handling** - Use try/catch and dead letter queues
5. **Use environment variables** - Configuration over hardcoding
6. **Set appropriate timeout values** - Match actual execution time needs
7. **Monitor and log extensively** - CloudWatch, X-Ray, structured logging
8. **Design for idempotency** - Handle duplicate invocations safely
9. **Use async patterns** - Leverage event-driven architecture benefits
10. **Optimize memory allocation** - Right-size based on actual usage patterns
