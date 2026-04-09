# Event Sourcing

Event sourcing is an architectural pattern where state changes are stored as a sequence of events. The current state is rebuilt by replaying these events.

## Key Concepts

- Event store
- Event versioning
- Snapshots for performance
- Projections
- Temporal queries

## Common Use Cases

- Audit trails required
- Complex state changes
- Temporal queries
- Rebuilding state
- Distributed systems

## Best Practices

- Version events carefully
- Implement snapshotting
- Design immutable events
- Use idempotent handlers
- Consider event size

## Resources

- EventSourcing.io
- Related Skills: cqrs, domain-driven-design, kafka

## Getting Started

Consider event sourcing for domains where audit trails and temporal queries provide significant business value, and where the complexity trade-off is justified.
