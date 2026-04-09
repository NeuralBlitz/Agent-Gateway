# Hexagonal Architecture

Hexagonal architecture (Ports and Adapters) organizes code with an inner domain core isolated from external concerns through well-defined ports.

## Key Concepts

- Domain core (business logic)
- Ports (interfaces)
- Adapters (implementations)
- Inner vs outer hexagon
- Dependency inversion

## Common Use Cases

- Testable business logic
- Framework independence
- Multiple delivery mechanisms
- Long-lived business rules
- Clean code organization

## Best Practices

- Keep domain pure
- Define ports clearly
- Adapt infrastructure to domain
- Use dependency injection
- Test domain in isolation

## Resources

- Alistair Cockburn: 12factor.net
- Related Skills: domain-driven-design, clean-architecture
