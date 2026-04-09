---
name: PHP
description: Server-side scripting language designed for web development with extensive framework ecosystem and CMS platforms.
license: PHP License
compatibility: PHP 8.0+
audience: Web developers, WordPress developers, Laravel developers
category: Programming Languages
---

# PHP

## What I do

I am a server-side scripting language created by Rasmus Lerdorf in 1994. I was designed for web development, excelling at generating dynamic HTML content, processing forms, and interacting with databases. I power 77% of websites with known server-side programming including WordPress, Drupal, and Laravel. I offer a shallow learning curve, excellent database connectivity, and rich framework ecosystem. Modern PHP (7+) features significant performance improvements, scalar type declarations, return type declarations, null coalescing operator, and anonymous classes.

## When to use me

Use PHP when building web applications with Laravel/Symfony, content management systems (WordPress, Drupal), e-commerce platforms (Magento, WooCommerce), REST APIs and microservices, or when working with existing PHP codebases and infrastructure.

## Core Concepts

- **Hypertext Preprocessor**: Server-side processing generating HTML responses, running on web server.
- **Weak Typing with Strict Mode**: Type coercion by default, strict_types for strict scalar type checking.
- **Superglobals**: Built-in global variables like $_GET, $_POST, $_SESSION, $_COOKIE, $_SERVER.
- **Arrays as Ordered Maps**: PHP arrays serve as both indexed arrays and associative maps.
- **Object-Oriented Features**: Classes, interfaces, traits, inheritance, and polymorphism since PHP 5.
- **Namespaces**: Code organization and avoiding naming conflicts, used extensively with autoloading.
- **PDO (PHP Data Objects)**: Database abstraction layer supporting multiple databases with prepared statements.
- **Traits**: Horizontal code reuse mechanism for classes, addressing multiple inheritance limitations.
- **Anonymous Functions and Closures**: First-class callable objects capturing variables from parent scope.
- **Composer**: Dependency manager and autoloader, managing PHP packages from Packagist.

## Code Examples

**Modern PHP Syntax:**
```php
<?php
declare(strict_types=1);

function greet(string $name): string
{
    return "Hello, {$name}!";
}

class User
{
    public function __construct(
        private string $name,
        private int $age,
        private ?string $email = null
    ) {}
    
    public function getName(): string
    {
        return $this->name;
    }
    
    public function getAge(): int
    {
        return $this->age;
    }
    
    public function getEmail(): ?string
    {
        return $this->email;
    }
    
    public function setEmail(string $email): self
    {
        $this->email = $email;
        return $this;
    }
    
    public function greet(): string
    {
        return greet($this->name);
    }
}

$user = new User('Alice', 30, 'alice@example.com');
echo $user->greet();
echo $user->setEmail('newemail@example.com')->getEmail();
```

**Arrays and Functional Operations:**
```php
<?php

$numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

$squares = array_map(fn($n) => $n ** 2, $numbers);
$evens = array_filter($numbers, fn($n) => $n % 2 === 0);
$sum = array_reduce($numbers, fn($carry, $n) => $carry + $n, 0);

print_r($squares);
print_r($evens);
echo "Sum: {$sum}\n";

$users = [
    ['name' => 'Alice', 'age' => 30, 'city' => 'NYC'],
    ['name' => 'Bob', 'age' => 25, 'city' => 'LA'],
    ['name' => 'Charlie', 'age' => 35, 'city' => 'NYC'],
];

$userNames = array_column($users, 'name');
$nycUsers = array_filter($users, fn($user) => $user['city'] === 'NYC');
$ageSum = array_reduce($users, fn($sum, $user) => $sum + $user['age'], 0);

$groupedByCity = [];
foreach ($users as $user) {
    $groupedByCity[$user['city']][] = $user;
}

print_r($groupedByCity);

$usersByName = [
    'Alice' => ['age' => 30, 'city' => 'NYC'],
    'Bob' => ['age' => 25, 'city' => 'LA'],
];

$aliceAge = $usersByName['Alice']['age'] ?? 0;
$charlieCity = $usersByName['Charlie']['city'] ?? 'Unknown';

echo "Alice's age: {$aliceAge}\n";
echo "Charlie's city: {$charlieCity}\n";
```

**PDO Database Operations:**
```php
<?php

class Database
{
    private PDO $pdo;
    
    public function __construct(string $dsn, string $username, string $password)
    {
        $this->pdo = new PDO($dsn, $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
    
    public function fetchAll(string $query, array $params = []): array
    {
        $stmt = $this->pdo->prepare($query);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
    
    public function fetchOne(string $query, array $params = []): ?array
    {
        $stmt = $this->pdo->prepare($query);
        $stmt->execute($params);
        $result = $stmt->fetch();
        return $result ?: null;
    }
    
    public function execute(string $query, array $params = []): int
    {
        $stmt = $this->pdo->prepare($query);
        $stmt->execute($params);
        return $stmt->rowCount();
    }
    
    public function lastInsertId(): string
    {
        return $this->pdo->lastInsertId();
    }
}

$db = new Database('mysql:host=localhost;dbname=test', 'user', 'pass');

$users = $db->fetchAll('SELECT * FROM users WHERE active = ?', [1]);

$user = $db->fetchOne('SELECT * FROM users WHERE id = ?', [123]);

$affected = $db->execute(
    'UPDATE users SET name = ? WHERE id = ?',
    ['New Name', 123]
);
```

**Traits and Interfaces:**
```php
<?php

interface Loggable
{
    public function log(string $message): void;
}

trait Timestamped
{
    private DateTimeImmutable $createdAt;
    private DateTimeImmutable $updatedAt;
    
    public function __construct()
    {
        $this->createdAt = new DateTimeImmutable();
        $this->updatedAt = new DateTimeImmutable();
    }
    
    public function getCreatedAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }
    
    public function getUpdatedAt(): DateTimeImmutable
    {
        return $this->updatedAt;
    }
    
    public function touch(): void
    {
        $this->updatedAt = new DateTimeImmutable();
    }
}

class User implements Loggable
{
    use Timestamped;
    
    public function __construct(
        private string $name,
        private string $email
    ) {}
    
    public function log(string $message): void
    {
        echo sprintf("[%s] User: %s - %s\n", date('Y-m-d H:i:s'), $this->name, $message);
    }
    
    public function getName(): string
    {
        return $this->name;
    }
}

$user = new User('Alice', 'alice@example.com');
$user->log('Created account');
$user->touch();
echo "Created: " . $user->getCreatedAt()->format('Y-m-d') . "\n";
echo "Updated: " . $user->getUpdatedAt()->format('Y-m-d') . "\n";
```

## Best Practices

1. **Enable strict_types**: Use declare(strict_types=1) at the top of files for type safety.
2. **Use Type Declarations**: Declare parameter types and return types on all functions and methods.
3. **Prefer PDO over mysqli**: Use PDO with prepared statements to prevent SQL injection.
4. **Use Namespaces**: Organize code with PSR-4 autoloading and proper namespace structure.
5. **Follow PSR Standards**: Use PSR-12 for code style, PSR-3 for logging, PSR-15 for HTTP middleware.
6. **Avoid $_GET/$_POST Directly**: Sanitize and validate all user input using filter_input() or libraries.
7. **Use Composer for Dependencies**: Never include libraries directly; use Composer to manage dependencies.
8. **Enable Error Reporting in Development**: Use error_reporting(E_ALL) and display_errors in development.
9. **Use Prepared Statements**: Always use prepared statements for database queries to prevent SQL injection.
10. **Write Tests with PHPUnit**: Use PHPUnit for unit testing, aiming for high code coverage on business logic.
