---
name: api-gateway
description: API Gateway design and implementation patterns
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: architecture
---
## What I do
- Design API gateway architecture
- Implement request routing and transformation
- Handle authentication and authorization at gateway
- Implement rate limiting and quotas
- Handle request/response transformation
- Configure caching at gateway level
- Implement logging and monitoring
- Handle circuit breaking

## When to use me
When designing API gateway architecture or configuring gateway rules.

## Gateway Architecture
```
                                    ┌─────────────────┐
                                    │    Client       │
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │   API Gateway   │
                                    │                 │
                                    │  ┌───────────┐  │
                                    │  │  Routing  │  │
                                    │  └───────────┘  │
                                    │  ┌───────────┐  │
                                    │  │ Auth/N    │  │
                                    │  └───────────┘  │
                                    │  ┌───────────┐  │
                                    │  │ Rate Lim  │  │
                                    │  └───────────┘  │
                                    │  ┌───────────┐  │
                                    │  │ Transform │  │
                                    │  └───────────┘  │
                                    └────────┬────────┘
                                             │
         ┌────────────────────────────────────┼────────────────────────────────────┐
         │                                    │                                    │
         ▼                                    ▼                                    ▼
    ┌─────────┐                         ┌─────────┐                         ┌─────────┐
    │ Service │◄────────────────────────│ Service │◄────────────────────────│ Service │
    │    A    │                         │    B    │                         │    C    │
    └─────────┘                         └─────────┘                         └─────────┘
```

## Kong Gateway Configuration
```yaml
# kong.yml - declarative configuration

_format_version: "3.0"
_transform: true

services:
  - name: user-service
    url: http://user-service:8000
    routes:
      - name: user-routes
        paths:
          - /api/v1/users
        strip_path: false
    plugins:
      - name: rate-limiting
        config:
          minute: 100
          policy: local
      - name: jwt
        config:
          secret_is_base64: false

  - name: order-service
    url: http://order-service:8000
    routes:
      - name: order-routes
        paths:
          - /api/v1/orders
        strip_path: false
    plugins:
      - name: rate-limiting
        config:
          minute: 50
      - name: oauth2
        config:
          scopes:
            - openid
            - profile
            - orders

consumers:
  - username: api-client
    keyauth_credentials:
      - key: apikey-12345

upstreams:
  - name: user-service-upstream
    targets:
      - target: user-service:8000
        weight: 100
      - target: user-service-2:8000
        weight: 50
    healthchecks:
      active:
        http_path: /health
        healthy:
          interval: 5
          successes: 2
        unhealthy:
          interval: 5
          successes: 1
```

## AWS API Gateway Configuration
```yaml
# OpenAPI spec with extensions for API Gateway
openapi: 3.0.3
info:
  title: My API
  version: 1.0.0

x-amazon-api-gateway:
  authorizers:
    CognitoAuthorizer:
      type: cognito_user_pools
      provider_arns:
        - arn:aws:cognito-idp:us-east-1:123456789:userpool/us-east-1_abcdefghi
      identity_validation_expression: email
      header: Authorization

  gateway-responses:
    BAD_REQUEST_BODY:
      statusCode: 400
      responseTemplates:
        application/json: |
          {"error": "Invalid request body"}
    DEFAULT_5XX:
      statusCode: 500
      responseParameters:
        gatewayresponse.header.Access-Control-Allow-Origin: "'*'"
        gatewayresponse.header.Access-Control-Allow-Headers: "'*'"

paths:
  /users:
    get:
      security:
        - CognitoAuthorizer: []
      x-amazon-apigateway-integration:
        httpMethod: GET
        type: http_proxy
        uri: http://user-service.internal:8000/users
        connectionType: VPC_LINK
        connectionId: abc123xyz
        responses:
          default:
            statusCode: 200
      responses:
        '200':
          description: User list
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '500':
          $ref: '#/components/responses/InternalError'

  /users/{userId}:
    get:
      security:
        - CognitoAuthorizer: []
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
      x-amazon-apigateway-integration:
        httpMethod: GET
        type: http_proxy
        uri: http://user-service.internal:8000/users/{userId}
        responses:
          default:
            statusCode: 200
    delete:
      security:
        - CognitoAuthorizer: []
      x-amazon-apigateway-integration:
        httpMethod: DELETE
        type: http_proxy
        uri: http://user-service.internal:8000/users/{userId}
        responses:
          default:
            statusCode: 204

components:
  securitySchemes:
    CognitoAuthorizer:
      type: apiKey
      name: Authorization
      in: header
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://.auth.example.com
          tokenUrl: https://auth.example.com/oauth2/token
          scopes:
            openid: OpenID Connect
            profile: User profile
```

## Request Transformation (Kong)
```lua
-- request-transformer.lua plugin configuration

-- Add headers
config.add.headers:
  - "X-Request-ID: $request_id"
  - "X-Forwarded-Proto: $scheme"

-- Transform headers
config.rename.headers:
  - "X-Custom-Auth: X-Forwarded-Auth"

-- Transform query parameters
config.add.queryparams:
  - "client_id: kong"

-- Transform body (JSON)
config.add.body:
  - "request_timestamp: $global_request_id"

-- Remove sensitive data from logs
config.remove.headers:
  - "Authorization"
  - "X-API-Key"
```

## Response Transformation
```yaml
# Response transformer plugin
plugins:
  - name: response-transformer
    config:
      json:
        replace:
          meta:
            api_version: "v1"
        remove:
          - internal_field
          - debug_data
      header:
        replace:
          - "X-Custom-Header: new-value"
        remove:
          - "X-Internal-Header"
```

## Authentication Strategies

### JWT Verification
```yaml
# Kong JWT plugin
plugins:
  - name: jwt
    config:
      key_claim_name: iss
      claims_to_verify:
        - exp
        - nbf
      run_on_preflight: true
```

### OAuth2 Resource Server
```python
from fastapi import Security, HTTPException
from fastapi.security import OAuth2PasswordBearer
from auth0.jwt_decoder import JWTVerifier


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


async def get_current_user(
    token: str = Security(oauth2_scheme)
) -> User:
    try:
        payload = jwt.decode_token(token)
        return User(**payload)
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

## Rate Limiting Configuration
```yaml
# Kong rate limiting
plugins:
  - name: rate-limiting
    config:
      minute: 100
      hour: 1000
      day: 10000
      policy: redis
      redis_host: redis-host
      redis_port: 6379
      fault_tolerant: true

# More granular rate limiting by consumer
plugins:
  - name: rate-limiting
    config:
      minute: 1000
      policy: cluster
      hide_client_headers: false
```

## Canary Releases
```yaml
# Kong canary release using weighted routes
services:
  - name: api-service
    url: http://api-service-v1:8000
    routes:
      - name: api-routes
        paths:
          - /api/v1
    plugins:
      - name: canary
        config:
          percentage: 90
          hash: header
          header_name: X-Canary
```

## Logging and Monitoring
```yaml
# Kong logging
plugins:
  - name: http-log
    config:
      http_endpoint: https://logs.example.com/ingest
      method: POST
      timeout: 1000
      keepalive: 30
      retry_count: 3
      flush_timeout: 2
      queue_size: 100

  # Prometheus metrics
  - name: prometheus
    config:
      per_consumer: true
```
