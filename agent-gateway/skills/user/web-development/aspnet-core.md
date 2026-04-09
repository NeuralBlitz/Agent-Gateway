---
name: ASP.NET Core
category: web-development
description: A cross-platform, high-performance framework for building web apps and APIs with C#
tags:
  - backend
  - csharp
  - dotnet
  - enterprise
---

# ASP.NET Core

## What I Do

ASP.NET Core is a cross-platform, high-performance framework for building web applications and APIs with C#. I was redesigned from ASP.NET to be modular, fast, and cross-platform. I support multiple hosting models including Kestrel, IIS, and Nginx. My architecture embraces dependency injection, middleware pipelines, and configuration systems. Entity Framework Core provides ORM capabilities.

I excel at building enterprise applications, microservices, and high-performance APIs. My integration with Azure provides excellent cloud deployment options. SignalR enables real-time web functionality. Blazor allows building interactive UIs with C#.

## When to Use Me

Choose ASP.NET Core for enterprise applications requiring scalability and performance. I work well for projects needing cross-platform support or Windows Server integration. ASP.NET Core is ideal for teams familiar with C# and .NET. Avoid ASP.NET Core for simple scripts or when .NET hosting is unavailable.

## Core Concepts

ASP.NET Core uses middleware pipelines for request processing. Controllers handle HTTP requests with attribute routing. Razor Pages provide page-based MVC. Entity Framework Core handles database operations with LINQ. Dependency injection is built into the framework. Configuration systems support environment variables and JSON files. Identity provides authentication and authorization.

## Code Examples

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IUserService _userService;

    public UsersController(AppDbContext context, IUserService userService)
    {
        _context = context;
        _userService = userService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<UserDto>>> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var users = await _context.Users
            .AsNoTracking()
            .OrderBy(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var total = await _context.Users.CountAsync();

        return Ok(new PagedResult<UserDto>
        {
            Data = users.Select(u => u.ToDto()),
            Total = total,
            Page = page,
            PageSize = pageSize
        });
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserDto>> GetUser(Guid id)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            return NotFound();

        return Ok(user.ToDto());
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateUser(CreateUserDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = new User
        {
            Email = dto.Email,
            UserName = dto.UserName,
            CreatedAt = DateTime.UtcNow
        };

        var createdUser = await _userService.CreateAsync(user, dto.Password);
        
        return CreatedAtAction(
            nameof(GetUser),
            new { id = createdUser.Id },
            createdUser.ToDto()
        );
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<UserDto>> UpdateUser(
        Guid id,
        UpdateUserDto dto)
    {
        var user = await _context.Users.FindAsync(id);
        
        if (user == null)
            return NotFound();

        user.Email = dto.Email;
        user.UserName = dto.UserName;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(user.ToDto());
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var user = await _context.Users.FindAsync(id);
        
        if (user == null)
            return NotFound();

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
```

```csharp
using Microsoft.EntityFrameworkCore;

namespace Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<Comment> Comments => Set<Comment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasIndex(u => u.UserName).IsUnique();
            
            entity.HasMany(u => u.Posts)
                .WithOne(p => p.User)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Post>(entity =>
        {
            entity.HasIndex(p => p.Slug).IsUnique();
            
            entity.HasOne(p => p.User)
                .WithMany(u => u.Posts)
                .HasForeignKey(p => p.UserId);
            
            entity.HasMany(p => p.Comments)
                .WithOne(c => c.Post)
                .HasForeignKey(c => c.PostId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
```

```csharp
using System.ComponentModel.DataAnnotations;

namespace Api.DTOs;

public class CreateUserDto
{
    [Required]
    [StringLength(50, MinimumLength = 3)]
    public string UserName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;
}

public class UpdateUserDto
{
    [StringLength(50, MinimumLength = 3)]
    public string? UserName { get; set; }

    [EmailAddress]
    public string? Email { get; set; }
}

public class UserDto
{
    public Guid Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class PagedResult<T>
{
    public List<T> Data { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
```

```csharp
using Microsoft.AspNetCore.Identity;

namespace Api.Entities;

public class User : IdentityUser<Guid>
{
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    public ICollection<Post> Posts { get; set; } = new List<Post>();
}

public class Post
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Excerpt { get; set; }
    public PostStatus Status { get; set; } = PostStatus.Draft;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}

public enum PostStatus
{
    Draft = 0,
    Published = 1,
    Archived = 2
}
```

```csharp
using Api.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddIdentity<User, IdentityRole<Guid>>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredLength = 8;
})
.AddEntityFrameworkStores<AppDbContext>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddScoped<IUserService, UserService>();

var app = builder.Build();

// Configure middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
```

```csharp
using Api.Services;

namespace Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");
            
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            
            var response = new
            {
                error = "An unexpected error occurred",
                details = app.Environment.IsDevelopment() ? ex.Message : null
            };
            
            await context.Response.WriteAsJsonAsync(response);
        }
    }
}
```

## Best Practices

Use dependency injection throughout the application. Implement repository pattern for data access abstraction. Use async/await consistently for I/O operations. Implement validation with Data Annotations or FluentValidation. Use middleware for cross-cutting concerns. Configure CORS properly for frontend origins. Implement rate limiting for API protection. Use logging throughout the application. Write unit tests with xUnit and Moq. Configure proper error handling middleware.

## Common Patterns

The repository pattern abstracts data access with EF Core. The service layer pattern encapsulates business logic. The CQRS pattern separates reads and writes. The mediator pattern uses MediatR for request/response handling. The decorator pattern adds cross-cutting concerns. The unit of work pattern manages database transactions.
