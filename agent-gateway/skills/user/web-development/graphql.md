---
name: graphql
description: GraphQL API design best practices and patterns
category: web-development
---

# GraphQL

## What I Do

GraphQL is a query language and runtime for APIs, developed by Facebook. I enable clients to request exactly the data they need, nothing more and nothing less. Unlike REST APIs with fixed endpoints, GraphQL provides a single endpoint where clients send queries describing their data requirements. This reduces over-fetching and under-fetching while enabling powerful client-driven data fetching.

I excel at mobile applications with limited bandwidth, complex frontend data requirements, and APIs consumed by multiple clients. My strongly typed schema serves as documentation and enables powerful developer tools. Subscriptions enable real-time updates through persistent connections. My query language allows clients to fetch nested resources in a single request.

## When to Use Me

Choose GraphQL when clients need flexible data fetching with varying requirements, such as mobile apps with different screen sizes or dashboard applications with configurable widgets. I work well when you want to reduce the number of network requests by fetching multiple resources in one query. GraphQL is ideal for APIs consumed by many different clients with different needs. Avoid GraphQL for simple CRUD APIs where REST would be simpler, or when caching strategies are more important than flexible fetching.

## Core Concepts

GraphQL schemas define the structure of available data using the GraphQL Schema Definition Language (SDL). Types represent data shapes with fields of specific scalar or object types. Queries fetch data, mutations modify data, and subscriptions receive real-time updates. Resolvers are functions that fetch data for each field in a schema. The query execution engine runs queries by calling resolvers for each field.

Arguments allow passing values to fields. Interfaces and unions represent polymorphic types. Input types define complex argument structures. Enums restrict fields to specific values. Directives modify query execution, and custom directives can add behavior. The introspection system allows clients to query schema metadata.

## Code Examples

```javascript
const { gql, ApolloServer } = require('apollo-server-express');
const express = require('express');
const { buildSchema } = require('graphql');

const typeDefs = gql`
  enum UserRole {
    ADMIN
    USER
    GUEST
  }
  
  type User {
    id: ID!
    name: String!
    email: String!
    role: UserRole!
    posts: [Post!]!
    createdAt: String!
  }
  
  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
    comments: [Comment!]!
    createdAt: String!
  }
  
  type Comment {
    id: ID!
    content: String!
    author: User!
    createdAt: String!
  }
  
  type Query {
    users(role: UserRole, limit: Int, offset: Int): [User!]!
    user(id: ID!): User
    posts(limit: Int, offset: Int): [Post!]!
    post(id: ID!): Post
    feed(limit: Int, offset: Int): [Post!]!
  }
  
  input CreateUserInput {
    name: String!
    email: String!
    role: UserRole = USER
  }
  
  input CreatePostInput {
    title: String!
    content: String!
    authorId: ID!
  }
  
  input CreateCommentInput {
    content: String!
    postId: ID!
    authorId: ID!
  }
  
  type Mutation {
    createUser(input: CreateUserInput!): User!
    createPost(input: CreatePostInput!): Post!
    createComment(input: CreateCommentInput!): Comment!
  }
  
  type Subscription {
    postCreated: Post!
    commentCreated(postId: ID!): Comment!
  }
`;

const resolvers = {
  Query: {
    users: (_, { role, limit = 10, offset = 0 }) => {
      let users = db.users;
      if (role) users = users.filter(u => u.role === role);
      return users.slice(offset, offset + limit);
    },
    user: (_, { id }) => db.users.find(u => u.id === id),
    posts: (_, { limit = 10, offset = 0 }) => {
      return db.posts.slice(offset, offset + limit);
    },
    post: (_, { id }) => db.posts.find(p => p.id === id),
    feed: (_, { limit = 10, offset = 0 }) => {
      return db.posts
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(offset, offset + limit);
    }
  },
  
  User: {
    posts: (user) => db.posts.filter(p => p.authorId === user.id)
  },
  
  Post: {
    author: (post) => db.users.find(u => u.id === post.authorId),
    comments: (post) => db.comments.filter(c => c.postId === post.id)
  },
  
  Comment: {
    author: (comment) => db.users.find(u => u.id === comment.authorId)
  },
  
  Mutation: {
    createUser: (_, { input }) => {
      const user = {
        id: Date.now().toString(),
        ...input,
        createdAt: new Date().toISOString()
      };
      db.users.push(user);
      return user;
    },
    createPost: (_, { input }) => {
      const post = {
        id: Date.now().toString(),
        ...input,
        createdAt: new Date().toISOString()
      };
      db.posts.push(post);
      return post;
    },
    createComment: (_, { input }) => {
      const comment = {
        id: Date.now().toString(),
        ...input,
        createdAt: new Date().toISOString()
      };
      db.comments.push(comment);
      return comment;
    }
  }
};

// Mock database
const db = {
  users: [],
  posts: [],
  comments: []
};

// Apollo Server setup
async function startServer() {
  const app = express();
  
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({
      user: req.user,
      db
    }),
    formatError: (error) => {
      console.error(error);
      return error;
    },
    plugins: [
      {
        requestDidStart: () => ({
          didResolveOperation: (context) => {
            console.log('Operation:', context.operationName);
          }
        })
      }
    ]
  });
  
  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });
  
  app.listen(4000, () => {
    console.log(`Server ready at http://localhost:4000${server.graphqlPath}`);
  });
}

startServer();
```

```graphql
# Example queries
query GetUserWithPosts($userId: ID!, $postLimit: Int) {
  user(id: $userId) {
    id
    name
    email
    role
    posts(limit: $postLimit) {
      id
      title
      createdAt
      commentCount
    }
  }
}

query GetDashboard($userIds: [ID!]!, $limit: Int = 5) {
  users(ids: $userIds) {
    id
    name
    recentPosts: posts(limit: $limit) {
      title
      commentCount
    }
  }
}

mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    name
    email
  }
}

subscription OnNewComment($postId: ID!) {
  commentCreated(postId: $postId) {
    id
    content
    author {
      name
    }
    createdAt
  }
}
```

## Best Practices

Design schemas around client needs rather than database structure. Use descriptive names and consistent naming conventions. Implement pagination with cursor-based connections for performance. Use DataLoader to batch and cache database queries. Set up proper authentication and authorization in context or field resolvers.

Implement rate limiting at the schema level. Use query complexity analysis to prevent expensive queries. Set max depth and field limits to prevent abusive queries. Log queries and errors for monitoring. Use Apollo Studio or GraphQL Playground for schema exploration.

## Common Patterns

The relay connection pattern implements cursor-based pagination following Relay specifications. The federation pattern combines multiple GraphQL services into a unified schema. The schema stitching pattern merges schemas from different sources. The data loader pattern batches database queries to prevent N+1 problems.

The federation pattern enables a distributed GraphQL architecture with a gateway. The authorization pattern uses directives to control access to fields. The error handling pattern uses union types or interfaces for error responses. The versioning pattern uses deprecation with new fields rather than breaking changes.
