# CQRS (Command Query Responsibility Segregation)

CQRS is a pattern that separates read and write operations into different models. It optimizes for the different requirements of queries and commands in complex domains.

## Key Concepts

- Command model (write)
- Query model (read)
- Event sourcing integration
- Separate data stores
- Eventually consistent reads

## Common Use Cases

- Complex domains
- High-throughput systems
- Event-driven architectures
- Read-heavy applications
- Distributed systems

## Best Practices

- Don't use blindly
- Keep commands simple
- Design read models for queries
- Handle eventual consistency
- Consider eventual complexity

## Resources

- Martin Fowler: martinfowler.com/bliki/CQRS.html
- Related Skills: event-sourcing, microservices, domain-driven-design
