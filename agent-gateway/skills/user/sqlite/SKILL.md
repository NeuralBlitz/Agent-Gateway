---
name: sqlite
description: SQLite lightweight embedded database for local storage and prototyping
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: databases
---
## What I do
- Create SQLite databases and tables
- Write efficient queries with indexes
- Use transactions for data integrity
- Implement full-text search
- Handle migrations and schema changes
- Optimize for performance
- Work with JSON data in SQLite

## When to use me
When building local-first applications, prototypes, or small-to-medium data needs.

## Basic Operations
```sql
-- Create table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert
INSERT INTO users (name, email) VALUES ('John', 'john@example.com');
INSERT INTO users (name, email) VALUES ('Jane', 'jane@example.com');

-- Select
SELECT * FROM users;
SELECT name, email FROM users WHERE id = 1;

-- Update
UPDATE users SET email = 'new@example.com' WHERE id = 1;

-- Delete
DELETE FROM users WHERE id = 1;
```

## Indexes
```sql
-- Single column index
CREATE INDEX idx_users_email ON users(email);

-- Composite index
CREATE INDEX idx_posts_user_date ON posts(user_id, created_at);

-- Unique index
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Partial index
CREATE INDEX idx_active_users ON users(email) WHERE active = 1;
```

## Queries
```sql
-- Join tables
SELECT u.name, p.title 
FROM users u 
INNER JOIN posts p ON u.id = p.user_id;

-- Aggregation
SELECT COUNT(*), AVG(price), SUM(total) FROM orders;

-- Group by
SELECT category, COUNT(*) as count 
FROM products 
GROUP BY category 
HAVING count > 5;

-- Subquery
SELECT * FROM users 
WHERE id IN (SELECT user_id FROM orders WHERE total > 100);

-- CASE expression
SELECT name,
    CASE 
        WHEN price > 100 THEN 'expensive'
        WHEN price > 50 THEN 'moderate'
        ELSE 'cheap'
    END as price_category
FROM products;
```

## Transactions
```sql
BEGIN TRANSACTION;

INSERT INTO accounts (name, balance) VALUES ('Alice', 1000);
INSERT INTO accounts (name, balance) VALUES ('Bob', 1000);

-- Transfer money
UPDATE accounts SET balance = balance - 100 WHERE name = 'Alice';
UPDATE accounts SET balance = balance + 100 WHERE name = 'Bob';

COMMIT;
-- Or ROLLBACK;
```

## JSON Support
```sql
-- Create table with JSON
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT,
    attributes JSON
);

-- Insert JSON
INSERT INTO products (name, attributes) 
VALUES ('Phone', '{"color": "black", "storage": "256gb"}');

-- Extract JSON
SELECT name, json_extract(attributes, '$.color') as color FROM products;

-- Query JSON
SELECT * FROM products WHERE json_extract(attributes, '$.storage') = '256gb';

-- Modify JSON
UPDATE products 
SET attributes = json_set(attributes, '$.color', 'white')
WHERE id = 1;
```

## Full-Text Search
```sql
-- Create FTS table
CREATE VIRTUAL TABLE articles_fts USING fts5(
    title,
    content,
    content=articles,
    content_rowid=id
);

-- Populate
INSERT INTO articles_fts(rowid, title, content) 
SELECT id, title, content FROM articles;

-- Search
SELECT * FROM articles_fts WHERE articles_fts MATCH 'python';

-- With ranking
SELECT title, bm25(articles_fts) as rank 
FROM articles_fts 
WHERE articles_fts MATCH 'python' 
ORDER BY rank;
```

## Python (sqlite3)
```python
import sqlite3

conn = sqlite3.connect('database.db')
cursor = conn.cursor()

# Execute
cursor.execute('SELECT * FROM users WHERE id = ?', (1,))
user = cursor.fetchone()

# Execute many
users = [('Alice', 'alice@example.com'), ('Bob', 'bob@example.com')]
cursor.executemany('INSERT INTO users (name, email) VALUES (?, ?)', users)

# With context manager
with sqlite3.connect('database.db') as conn:
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users')
    print(cursor.fetchall())
```

## Go
```go
import "database/sql"
import _ "github.com/mattn/go-sqlite3"

func main() {
    db, _ := sql.Open("sqlite3", "./database.db")
    defer db.Close()
    
    // Query
    rows, _ := db.Query("SELECT id, name FROM users")
    defer rows.Close()
    
    for rows.Next() {
        var id int
        var name string
        rows.Scan(&id, &name)
        fmt.Println(id, name)
    }
    
    // Execute
    stmt, _ := db.Prepare("INSERT INTO users (name) VALUES (?)")
    result, _ := stmt.Exec("Alice")
    id, _ := result.LastInsertId()
}
```
