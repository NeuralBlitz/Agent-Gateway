---
name: spring-boot
description: Spring Boot framework and Java enterprise patterns
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: frameworks
---
## What I do
- Build Spring Boot applications
- Use Spring Data JPA
- Implement Spring Security
- Create REST APIs
- Handle microservices
- Use Spring Cloud
- Implement caching
- Handle testing

## When to use me
When writing Java/Spring Boot code.

## Spring Boot Patterns
```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.findById(id));
    }
    
    @PostMapping
    public ResponseEntity<UserDto> createUser(
            @Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(userService.create(request));
    }
}

@Service
@Transactional
public class UserService {
    private final UserRepository repository;
    
    public UserService(UserRepository repository) {
        this.repository = repository;
    }
}
```
