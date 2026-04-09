---
name: api-design
description: RESTful API design principles and best practices
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: api-design
---
## What I do
- Design clean REST APIs
- Choose appropriate HTTP methods
- Handle resource relationships
- Implement pagination and filtering
- Version APIs effectively
- Document APIs with OpenAPI
- Handle errors consistently
- Design for scalability

## When to use me
When designing or implementing REST APIs.

## Resource Design
```
Resources should be nouns:

GET    /users              # List users
GET    /users/{id}         # Get user
POST   /users              # Create user
PUT    /users/{id}         # Update user
PATCH  /users/{id}         # Partial update
DELETE /users/{id}          # Delete user

Sub-resources:
GET /users/{id}/posts      # User's posts
GET /users/{id}/orders     # User's orders

Actions as resources:
POST /users/{id}/activate
POST /users/{id}/deactivate
```

## Response Patterns
```json
{
  "data": {},
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100
  },
  "links": {
    "self": "/api/v1/users?page=1",
    "next": "/api/v1/users?page=2"
  }
}

{
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "The email field is required",
      "field": "email",
      "status": 400
    }
  ]
}
```
