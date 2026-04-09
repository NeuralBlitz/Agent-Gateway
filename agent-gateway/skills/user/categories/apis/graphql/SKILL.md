# GraphQL APIs

GraphQL is a query language for APIs that enables clients to request exactly the data they need. It provides a complete description of data with a strongly typed schema.

## Key Concepts

- Schema Definition Language (SDL)
- Queries (read) and Mutations (write)
- Resolvers and DataSources
- Subscriptions for real-time
- Fragments for reusable selections

## Common Use Cases

- Mobile apps with limited bandwidth
- Complex data requirements
- Rapid product iteration
- BFF (Backend for Frontend)
- Aggregating multiple services

## Best Practices

- Design schema around UI needs
- Implement proper rate limiting
- Use DataLoader to prevent N+1
- Validate queries aggressively
- Set query depth limits

## Resources

- GraphQL.org: graphql.org/learn
- Related Skills: rest, apollo, api-design
