---
name: graphql
description: GraphQL API design best practices and patterns
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: api-design
---
## What I do
- Design GraphQL schemas with proper typing
- Implement queries, mutations, and subscriptions
- Handle N+1 problems with data loaders
- Implement authentication and authorization
- Use fragments and aliases effectively
- Handle pagination (cursor-based)
- Validate inputs properly
- Optimize query complexity

## When to use me
When implementing or querying GraphQL APIs.

## Schema Design
```graphql
scalar DateTime
scalar UUID
scalar Email
scalar URL

interface Node {
  id: ID!
}

interface Error {
  message: String!
  code: String!
}

type User implements Node {
  id: ID!
  email: Email!
  username: String!
  name: String
  avatarUrl: URL
  posts(first: Int, after: Cursor): PostConnection!
  createdAt: DateTime!
}

type Post implements Node {
  id: ID!
  title: String!
  slug: String!
  excerpt: String
  content: String!
  author: User!
  tags: [Tag!]!
  publishedAt: DateTime
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Tag implements Node {
  id: ID!
  name: String!
  slug: String!
  postCount: Int!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: Cursor
  endCursor: Cursor
}

type PostConnection {
  edges: [PostEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PostEdge {
  node: Post!
  cursor: Cursor!
}

input CreatePostInput {
  title: String!
  content: String!
  tags: [String!]
}

type Mutation {
  createPost(input: CreatePostInput!): Post!
  deletePost(id: ID!): Boolean!
  publishPost(id: ID!): Post!
}

type Query {
  node(id: ID!): Node
  user(id: ID!): User
  users(first: Int, after: Cursor): UserConnection!
  post(slug: String!): Post
  posts(
    author: ID
    tag: String
    first: Int
    after: Cursor
  ): PostConnection!
}

type Subscription {
  postPublished(tag: String): Post!
}
```

## DataLoaders (N+1 Prevention)
```python
from dataloader import DataLoader


class UserLoader(DataLoader):
    def batch_load_fn(self, keys):
        users = user_repository.find_by_ids(keys)
        return [users.get(key) for key in keys]


class PostLoader(DataLoader):
    def batch_load_fn(self, keys):
        posts = post_repository.find_by_author_ids(keys)
        return [posts.get(key) for key in keys]


# In resolvers
def resolve_user_posts(user, info, first=10, after=None):
    loader = info.context.user_loader
    return loader.load(user.id).then(
        lambda user: connection_from_list_slice(
            user.posts[:first],
            loaders=loader,
            slice_start=0,
            list_length=len(user.posts),
            list_slice_length=first,
        )
    )


# Context setup
def get_context(request):
    return {
        'user_loader': UserLoader(),
        'post_loader': PostLoader(),
        'current_user': get_current_user(request),
    }
```

## Query Complexity Limits
```python
from graphql import parse, FieldNode


def get_query_depth(query):
    def traverse(node, depth):
        if isinstance(node, FieldNode):
            return max(
                (traverse(child, depth + 1) for child in node.selection_set.selections),
                default=depth
            )
        return depth

    return traverse(query, 0)


def complexity_validation(schema):
    def validate(ast):
        query = parse(ast.query_string)
        depth = get_query_depth(query)
        if depth > 10:
            raise GraphQLError("Query too deep")
        return depth

    return validate


# Limit number of items in lists
LIMIT = 100


def enforce_list_limits(args):
    first = args.get('first', 0)
    args['first'] = min(first, LIMIT) if first else LIMIT
    return args
```

## Error Handling
```graphql
type Mutation {
  createPost(input: CreatePostInput!): CreatePostResult!
}

union CreatePostResult = Post | ValidationError | UnauthorizedError


type ValidationError implements Error {
  message: String!
  code: String!
  fields: [FieldError!]!
}

type FieldError {
  field: String!
  message: String!
}


# Python implementation
def resolve_create_post(_, info, input):
    try:
        validate_input(input)
        post = post_service.create(input, author=info.context.current_user)
        return post
    except ValidationError as e:
        return ValidationError(
            message=str(e),
            code="VALIDATION_ERROR",
            fields=e.errors
        )
    except UnauthorizedError as e:
        return UnauthorizedError(
            message=str(e),
            code="UNAUTHORIZED"
        )
```
