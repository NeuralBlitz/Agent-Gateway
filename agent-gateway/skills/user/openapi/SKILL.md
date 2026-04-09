---
name: openapi
description: OpenAPI/Swagger specification and documentation
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: api-design
---
## What I do
- Design OpenAPI specifications
- Create API documentation
- Define schemas and data models
- Document authentication
- Handle pagination and filtering
- Use advanced OpenAPI features
- Generate client SDKs
- Test with OpenAPI

## When to use me
When creating API specifications or OpenAPI documentation.

## OpenAPI Structure
```yaml
openapi: 3.0.3
info:
  title: Pet Store API
  description: |
    A sample API for managing pets.
    
    ## Features
    - List pets
    - Add new pets
    - Update pet information
    - Place orders
    
    ## Authentication
    All endpoints require Bearer token authentication.
  version: 1.0.0
  contact:
    name: API Support
    email: support@example.com
    url: https://example.com/support
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.example.com/v1
    description: Production server
  - url: https://staging-api.example.com/v1
    description: Staging server
  - url: http://localhost:8000/api/v1
    description: Local development

tags:
  - name: Pets
    description: Pet management operations
  - name: Store
    description: Store operations
  - name: Users
    description: User management
```

## Paths and Operations
```yaml
paths:
  /pets:
    get:
      summary: List all pets
      description: Returns a paginated list of pets
      tags:
        - Pets
      operationId: listPets
      parameters:
        - name: status
          in: query
          description: Filter by pet status
          schema:
            type: string
            enum:
              - available
              - pending
              - sold
        - name: limit
          in: query
          description: Maximum number of pets to return
          schema:
            type: integer
            default: 20
            minimum: 1
            maximum: 100
        - name: offset
          in: query
          description: Number of pets to skip
          schema:
            type: integer
            default: 0
            minimum: 0
      responses:
        '200':
          description: A list of pets
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PetListResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '500':
          $ref: '#/components/responses/InternalError'
    
    post:
      summary: Create a new pet
      description: Add a new pet to the store
      tags:
        - Pets
      operationId: createPet
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreatePetRequest'
      responses:
        '201':
          description: Pet created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
```

## Components and Schemas
```yaml
components:
  schemas:
    Pet:
      type: object
      required:
        - id
        - name
        - status
      properties:
        id:
          type: string
          format: uuid
          example: "123e4567-e89b-12d3-a456-426614174000"
        name:
          type: string
          minLength: 1
          maxLength: 100
          example: "Fluffy"
        status:
          type: string
          enum:
            - available
            - pending
            - sold
          example: "available"
        category:
          $ref: '#/components/schemas/Category'
        tags:
          type: array
          items:
            $ref: '#/components/schemas/Tag'
        photoUrls:
          type: array
          items:
            type: string
            format: uri
          maxItems: 10
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
    
    Category:
      type: object
      properties:
        id:
          type: integer
          format: int64
        name:
          type: string
    
    Tag:
      type: object
      properties:
        id:
          type: integer
          format: int64
        name:
          type: string
    
    CreatePetRequest:
      type: object
      required:
        - name
        - status
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 100
        status:
          type: string
          enum:
            - available
            - pending
            - sold
        categoryId:
          type: integer
          format: int64
        tags:
          type: array
          items:
            type: string
        photoUrls:
          type: array
          items:
            type: string
            format: uri
          maxItems: 10
    
    PetListResponse:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/Pet'
        pagination:
          $ref: '#/components/schemas/Pagination'
        meta:
          type: object
          properties:
            requestId:
              type: string
            timestamp:
              type: string
              format: date-time
    
    Pagination:
      type: object
      properties:
        total:
          type: integer
          format: int64
        limit:
          type: integer
        offset:
          type: integer
        hasMore:
          type: boolean
```

## Authentication
```yaml
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT token authentication
    
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
    
    OAuth2Password:
      type: oauth2
      flows:
        password:
          tokenUrl: /api/v1/auth/token
          scopes:
            read: Read access
            write: Write access

security:
  - BearerAuth: []
  - ApiKeyAuth: []
```

## Advanced Features
```yaml
# Callbacks
paths:
  /orders:
    post:
      summary: Create an order
      callbacks:
        orderCompleted:
          '$ref': '#/components/callbacks/OrderCompleted'
        orderShipped:
          '$ref': '#/components/callbacks/OrderShipped'

callbacks:
  OrderCompleted:
    '{$request.body#/callbackUrl}':
      post:
        requestBody:
          description: Order completed callback
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/OrderCallback'
        responses:
          '200':
            description: Callback received successfully

# Links
paths:
  /users/{userId}:
    get:
      summary: Get user by ID
      responses:
        '200':
          description: User found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
          links:
            userOrders:
              operationId: getUserOrders
              parameters:
                userId: '$request.path.userId'

# Webhooks
webhooks:
  newOrder:
    post:
      summary: Receive new order notifications
      operationId: newOrderWebhook
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Order'
      responses:
        '200':
          description: Webhook received
```

## Documentation Best Practices
```
1. Write clear summaries
   - One-line description
   - What the endpoint does

2. Provide detailed descriptions
   - Explain behavior
   - Document edge cases

3. Use proper examples
   - Request examples
   - Response examples
   - Error examples

4. Document all parameters
   - Required vs optional
   - Valid values
   - Default values

5. Define error responses
   - Common errors
   - Error codes
   - Error messages

6. Use tags to organize
   - Group by resource
   - Group by functionality

7. Keep it up to date
   - Update on code changes
   - Version documentation

8. Add getting started
   - Authentication guide
   - Base URL
   - Rate limits
```

## Code Generation
```bash
# Generate Python client
openapi-generator generate \
  -i openapi.yaml \
  -g python \
  -o ./clients/python \
  --additional-properties=pythonLibraryName=petshop

# Generate TypeScript client
openapi-generator generate \
  -i openapi.yaml \
  -g typescript-axios \
  -o ./clients/typescript

# Generate Go server
openapi-generator generate \
  -i openapi.yaml \
  -g go-gin-server \
  -o ./server/go

# Generate Postman collection
openapi-generator generate \
  -i openapi.yaml \
  -g postman-collection \
  -o ./docs/postman.json
```

## Validation with OpenAPI
```python
from openapi_spec_validator import validate
from openapi_spec_validator.versions import consts as validator_versions


def validate_openapi_spec(spec_path: str) -> bool:
    """Validate OpenAPI specification file."""
    with open(spec_path, 'r') as f:
        spec_dict = yaml.safe_load(f)
    
    try:
        validate(spec_dict)
        return True
    except Exception as e:
        print(f"Validation error: {e}")
        return False


def check_coverage(spec: dict) -> dict:
    """Check API coverage against requirements."""
    paths = spec.get('paths', {})
    
    required_endpoints = [
        '/users',
        '/users/{id}',
        '/pets',
        '/pets/{id}',
    ]
    
    existing = []
    missing = []
    
    for endpoint in required_endpoints:
        if endpoint in paths:
            existing.append(endpoint)
        else:
            missing.append(endpoint)
    
    return {
        'existing': existing,
        'missing': missing,
        'coverage': len(existing) / len(required_endpoints),
    }
```
