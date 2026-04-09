---
name: restful-apis
description: RESTful API architecture and implementation patterns
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: api-design
---
## What I do
- Design RESTful endpoints
- Use proper HTTP verbs
- Implement HATEOAS
- Handle errors consistently
- Add pagination
- Version APIs

## When to use me
When designing and building RESTful web services.

## Resources & Endpoints
```
GET    /api/v1/users          - List
GET    /api/v1/users/:id       - Retrieve
POST   /api/v1/users           - Create
PATCH  /api/v1/users/:id       - Update
DELETE /api/v1/users/:id       - Delete

GET    /api/v1/users/:id/posts - User's posts
POST   /api/v1/users/:id/posts - Create post for user
```

## Query Parameters
```
?page=2&limit=20     - Pagination
?sort=-created_at    - Sorting
?status=active       - Filtering
?fields=name,email   - Field selection
?include=posts       - Related resources
```
