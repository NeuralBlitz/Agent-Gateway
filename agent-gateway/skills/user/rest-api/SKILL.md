---
name: rest-api
description: REST API design best practices and patterns
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: api-design
---
## What I do
- Design clean REST APIs following best practices
- Implement proper HTTP methods and status codes
- Handle pagination, filtering, and sorting
- Version APIs properly
- Document APIs with OpenAPI/Swagger
- Implement authentication and authorization
- Handle errors consistently
- Use HATEOAS where appropriate

## When to use me
When designing or implementing REST APIs.

## REST Design Principles
```
Resources: /users, /users/{id}, /users/{id}/posts
Collections: /posts, /posts?status=published
Actions as sub-resources: /users/{id}/activate, /users/{id}/deactivate

HTTP Methods:
GET     - Retrieve resource(s)
POST    - Create resource(s)
PUT     - Replace resource
PATCH   - Partial update
DELETE  - Remove resource

Status Codes:
200 OK - Success
201 Created - Resource created
204 No Content - Success, no body
400 Bad Request - Invalid input
401 Unauthorized - Authentication required
403 Forbidden - Authenticated but not authorized
404 Not Found - Resource doesn't exist
409 Conflict - Resource state conflict
422 Unprocessable Entity - Validation errors
429 Too Many Requests - Rate limiting
500 Internal Server Error - Server error
```

## API Response Format
```json
{
  "data": {
    "id": "123",
    "type": "user",
    "attributes": {
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "relationships": {
      "posts": {
        "links": {
          "related": "/users/123/posts"
        }
      }
    },
    "links": {
      "self": "/users/123"
    }
  },
  "meta": {
    "copyright": "2024"
  }
}
```

## Error Response Format
```json
{
  "errors": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "status": 422,
      "code": "VALIDATION_ERROR",
      "title": "Validation failed",
      "detail": "The 'email' field must be a valid email address",
      "source": {
        "pointer": "/data/attributes/email"
      },
      "meta": {
        "field": "email",
        "value": "invalid-email"
      }
    }
  ]
}
```

## Collection Responses
```json
{
  "data": [
    {
      "id": "1",
      "type": "user",
      "attributes": { "name": "User 1" }
    },
    {
      "id": "2",
      "type": "user",
      "attributes": { "name": "User 2" }
    }
  ],
  "links": {
    "self": "/api/v1/users?page[number]=1&page[size]=10",
    "first": "/api/v1/users?page[number]=1&page[size]=10",
    "last": "/api/v1/users?page[number]=10&page[size]=10",
    "next": "/api/v1/users?page[number]=2&page[size]=10",
    "prev": null
  },
  "meta": {
    "totalCount": 100,
    "totalPages": 10,
    "currentPage": 1,
    "pageSize": 10
  }
}
```

## Query Parameters
```
Filtering:      ?status=published&author=123
Sorting:        ?sort=-createdAt,title
Pagination:     ?page[number]=2&page[size]=20
Fields:         ?fields[user]=email,name
Including:      ?include=posts,posts.comments
Sparse Fields: ?fields[user]=id,name&fields[post]=id,title
Search:         ?search=keyword
```

## API Versioning
```
URL: /api/v1/users
Header: Accept: application/vnd.api+json; version=1
```

## Best Practices
- Use plural nouns for resources: `/users` not `/user`
- Use nouns for resources, not verbs
- Return appropriate headers (ETag, Last-Modified)
- Use idempotent operations for safety
- Implement rate limiting
- Use HTTPS only
- Cache with proper headers
- Document breaking changes in new versions
