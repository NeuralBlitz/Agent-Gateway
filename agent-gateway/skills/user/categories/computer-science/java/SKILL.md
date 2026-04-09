---
name: java
description: Java programming language best practices and patterns
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: programming
---
## What I do
- Write idiomatic Java using modern features (Java 17+)
- Use streams and Optional properly
- Handle exceptions with specific exception types
- Implement builder pattern for complex objects
- Use records for immutable data
- Follow SOLID principles
- Use dependency injection
- Write JUnit 5 tests

## When to use me
When writing or reviewing Java code.

## Modern Java Patterns
```java
import java.util.Optional;
import java.util.stream.Stream;

public record User(
    String id,
    String name,
    String email,
    LocalDateTime createdAt
) {
    public User {
        Objects.requireNonNull(id, "id cannot be null");
        Objects.requireNonNull(name, "name cannot be null");
    }
}

public class UserService {
    private final UserRepository repository;
    private final EmailService emailService;

    public UserService(UserRepository repository, EmailService emailService) {
        this.repository = repository;
        this.emailService = emailService;
    }

    public Optional<User> findById(String id) {
        return repository.findById(id);
    }

    public Stream<User> findActiveUsers() {
        return repository.findAll()
            .stream()
            .filter(u -> !u.isDeleted());
    }

    public Result<User> createUser(CreateUserRequest request) {
        return Result.tryCatch(() -> {
            validateRequest(request);
            User user = new User(
                UUID.randomUUID().toString(),
                request.name(),
                request.email(),
                LocalDateTime.now()
            );
            return repository.save(user);
        });
    }

    private void validateRequest(CreateUserRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            throw new ValidationException("Name is required");
        }
    }
}
```

## Builder Pattern
```java
public class EmailMessage {
    private final String to;
    private final String subject;
    private final String body;
    private final List<String> cc;
    private final boolean important;
    private final LocalDateTime scheduledAt;

    private EmailMessage(Builder builder) {
        this.to = builder.to;
        this.subject = builder.subject;
        this.body = builder.body;
        this.cc = List.copyOf(builder.cc);
        this.important = builder.important;
        this.scheduledAt = builder.scheduledAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String to;
        private String subject;
        private String body;
        private List<String> cc = new ArrayList<>();
        private boolean important;
        private LocalDateTime scheduledAt;

        public Builder to(String to) {
            this.to = to;
            return this;
        }

        public Builder subject(String subject) {
            this.subject = subject;
            return this;
        }

        public Builder body(String body) {
            this.body = body;
            return this;
        }

        public Builder cc(String... cc) {
            this.cc = Arrays.asList(cc);
            return this;
        }

        public Builder important(boolean important) {
            this.important = important;
            return this;
        }

        public Builder scheduledAt(LocalDateTime scheduledAt) {
            this.scheduledAt = scheduledAt;
            return this;
        }

        public EmailMessage build() {
            return new EmailMessage(this);
        }
    }
}
```

## Testing with JUnit 5
```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    @Mock
    private UserRepository repository;

    @InjectMocks
    private UserService service;

    @Test
    void findById_whenUserExists_returnsUser() {
        User expected = new User("1", "John", "john@example.com", LocalDateTime.now());
        when(repository.findById("1")).thenReturn(Optional.of(expected));

        Optional<User> result = service.findById("1");

        assertThat(result).isPresent()
            .get()
            .extracting(User::name)
            .isEqualTo("John");
    }

    @ParameterizedTest
    @CsvSource({
        "'', name is required",
        "null, name is required",
        "  , name is required"
    })
    void createUser_whenNameIsInvalid_throwsException(String name, String message) {
        CreateUserRequest request = new CreateUserRequest(name, "email@test.com");

        assertThatThrownBy(() -> service.createUser(request))
            .isInstanceOf(ValidationException.class)
            .hasMessage(message);
    }
}
```
