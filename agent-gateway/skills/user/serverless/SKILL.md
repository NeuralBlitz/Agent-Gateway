---
name: serverless
description: Serverless computing architecture
license: MIT
compatibility: opencode
metadata:
  audience: developer, devops-engineer
  category: devops
---

## What I do

- Design serverless architectures
- Build functions-as-a-service applications
- Implement event-driven systems
- Configure serverless databases and storage
- Optimize function performance and costs
- Build serverless CI/CD pipelines

## When to use me

- When building event-driven applications
- When scaling is unpredictable
- When minimizing operational overhead
- When implementing microservices
- When building data processing pipelines
- When creating APIs quickly

## Key Concepts

### AWS Lambda

```python
# Lambda handler
import json
import boto3

def lambda_handler(event, context):
    # Parse the event
    http_method = event['httpMethod']
    path = event['path']
    
    # Business logic
    if http_method == 'GET' and path == '/users':
        return {
            'statusCode': 200,
            'body': json.dumps({'users': []}),
            'headers': {'Content-Type': 'application/json'}
        }
    
    return {
        'statusCode': 404,
        'body': json.dumps({'error': 'Not found'})
    }

# Lambda layers for dependencies
# Layer structure:
# python/lib/python3.11/site-packages/
```

### Serverless Framework

```yaml
# serverless.yml
service: my-serverless-app

provider:
  name: aws
  runtime: python3.11
  stage: ${opt:stage, 'dev'}
  region: ${opt:region, 'us-east-1'}
  
  environment:
    TABLE_NAME: !Ref UsersTable
    STRIPE_KEY: ${env:STRIPE_KEY}
    
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - dynamodb:Query
            - dynamodb:Scan
          Resource: !GetAtt UsersTable.Arn

functions:
  users:
    handler: handler.get_users
    events:
      - http:
          path: /users
          method: get
          cors: true
      - http:
          path: /users/{userId}
          method: get
          cors: true
          
  processOrder:
    handler: handler.process_order
    events:
      - sqs:
          arn: !GetAtt OrdersQueue.Arn
          batchSize: 10
          
  uploadHandler:
    handler: handler.handle_upload
    events:
      - s3:
          bucket: uploads-${self:provider.stage}
          event: s3:ObjectCreated:*
          rules:
            - prefix: images/

resources:
  Resources:
    UsersTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: users-${self:provider.stage}
        BillingMode: PAY_PER_REQUEST
        AttributeDefinitions:
          - AttributeName: userId
            AttributeType: S
        KeySchema:
          - AttributeName: userId
            KeyType: HASH
```

### Azure Functions

```javascript
// Azure Function with triggers
module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    
    const name = (req.query.name || (req.body && req.body.name));
    
    if (name) {
        context.res = {
            status: 200,
            body: { message: `Hello, ${name}` }
        };
    } else {
        context.res = {
            status: 400,
            body: { error: "Please pass a name" }
        };
    }
};

// bindings.json
{
  "bindings": [
    {
      "name": "req",
      "type": "httpTrigger",
      "direction": "in",
      "authLevel": "function"
    },
    {
      "name": "$return",
      "type": "http",
      "direction": "out"
    }
  ]
}
```

### GCP Cloud Functions

```javascript
// Cloud Function 2nd Gen
const { CloudEvent, CloudFunction } = require('@google-cloud/functions-framework');

exports.processEvent = CloudEvent(async (cloudEvent) => {
  const data = cloudEvent.data;
  
  console.log('Event ID:', cloudEvent.id);
  console.log('Event Type:', cloudEvent.type);
  console.log('Data:', data);
  
  // Process the event
  await processData(data);
  
  return { success: true };
});

// HTTP Function
exports.httpFunction = async (req, res) => {
  const name = req.query.name || req.body.name || 'World';
  res.send(`Hello, ${name}!`);
};
```

### Event-Driven Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    S3       │────►│   Lambda    │────►│   DynamoDB  │
│  (Upload)    │     │  (Process)  │     │   (Store)   │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │    SNS     │
                   │  (Notify)  │
                   └─────────────┘
```

### Serverless Databases

```python
# AWS DynamoDB access
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('users')

def get_user(user_id):
    response = table.get_item(Key={'user_id': user_id})
    return response.get('Item')

def query_users_by_org(org_id):
    response = table.query(
        KeyConditionExpression=Key('org_id').eq(org_id)
    )
    return response['Items']
```

### Cold Start Mitigation

- Provisioned concurrency
- Keep functions warm with scheduled invocations
- Use lighter dependencies
- Minimize function code size
- Pre-compile dependencies
- Use ARM/Graviton2 for better performance

### Cost Optimization

- Right-size memory allocation
- Use reserved capacity
- Optimize execution time
- Remove unnecessary dependencies
- Use native libraries instead of AWS SDK
- Batch operations where possible
