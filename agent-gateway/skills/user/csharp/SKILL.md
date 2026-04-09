---
name: csharp
description: C# programming language best practices and patterns
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: programming
---
## What I do
- Write idiomatic C# code
- Use .NET features effectively
- Implement async/await patterns
- Use LINQ for queries
- Apply SOLID principles
- Handle exceptions properly
- Use dependency injection
- Write unit tests

## When to use me
When writing C# or .NET code.

## C# Best Practices
```csharp
// Async/await patterns
public async Task<UserDto> GetUserAsync(int id)
{
    return await _repository.GetByIdAsync(id)
        .ConfigureAwait(false);
}

// LINQ queries
var activeUsers = await _context.Users
    .Where(u => u.IsActive)
    .OrderBy(u => u.CreatedAt)
    .Skip(page * pageSize)
    .Take(pageSize)
    .ToListAsync();

// Dependency injection
services.AddScoped<IUserService, UserService>();
services.AddSingleton<IConfiguration>(Configuration);

// Records for DTOs
public record UserDto(
    int Id,
    string Email,
    string Name,
    DateTime CreatedAt);

// Pattern matching
public decimal CalculateDiscount(Order order) => order switch
{
    { IsPremium: true } => 0.2m,
    { Items.Count: > 10 } => 0.1m,
    { Total: > 100 } => 0.05m,
    _ => 0m
};
```
