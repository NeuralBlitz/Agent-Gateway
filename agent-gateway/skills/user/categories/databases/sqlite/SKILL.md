---
name: SQLite
description: Lightweight, self-contained, serverless SQL database engine perfect for embedded systems, mobile apps, and development environments
license: MIT
compatibility:
  - Python 3.8+
  - sqlite3 (built-in)
  - aiosqlite 0.18+
audience: Backend developers, mobile developers, embedded systems engineers
category: databases
---

# SQLite

## What I Do

I provide guidance on SQLite, the lightweight serverless database engine. I help with schema design, query optimization, transactions, full-text search extensions, JSON support, and best practices for embedded and mobile applications.

## When to Use Me

- Mobile applications (iOS, Android)
- Embedded systems and IoT devices
- Development and testing environments
- Desktop applications with local storage
- Small to medium web applications
- Caching and temporary data storage
- CLI tools and scripts
- Microservices with simple data needs

## Core Concepts

- **Serverless**: No separate database process
- **Single-File**: Entire database in one file
- **ACID**: Atomic, Consistent, Isolated, Durable
- **Transactions**: Full transaction support
- **SQLite3**: Latest SQLite version (Python module)
- **Connection**: File-based connections
- **Prepared Statements**: Parameterized queries
- **Row Factories**: Custom result formatting
- **Extensions**: FTS5, JSON1, RTree
- **WAL Mode**: Write-Ahead Logging for concurrency

## Code Examples

### Basic Connection and CRUD

```python
import sqlite3
from typing import Optional, List, Dict

def get_connection(db_path: str = "app.db") -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def create_tables(conn: sqlite3.Connection) -> None:
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT,
            published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    """)

def insert_user(conn: sqlite3.Connection, email: str, name: str) -> int:
    cursor = conn.execute(
        "INSERT INTO users (email, name) VALUES (?, ?)",
        (email, name)
    )
    conn.commit()
    return cursor.lastrowid

def get_user(conn: sqlite3.Connection, user_id: int) -> Optional[sqlite3.Row]:
    cursor = conn.execute(
        "SELECT * FROM users WHERE id = ?",
        (user_id,)
    )
    return cursor.fetchone()
```

### Transactions and Error Handling

```python
import sqlite3
from sqlite3 import Error

def transfer_credits(
    conn: sqlite3.Connection, 
    from_user: int, 
    to_user: int, 
    amount: float
) -> bool:
    try:
        cursor = conn.cursor()
        cursor.execute("BEGIN TRANSACTION")
        
        cursor.execute(
            "SELECT credits FROM users WHERE id = ? FOR UPDATE",
            (from_user,)
        )
        result = cursor.fetchone()
        if not result or result[0] < amount:
            cursor.execute("ROLLBACK")
            return False
        
        cursor.execute(
            "UPDATE users SET credits = credits - ? WHERE id = ?",
            (amount, from_user)
        )
        cursor.execute(
            "UPDATE users SET credits = credits + ? WHERE id = ?",
            (amount, to_user)
        )
        
        cursor.execute("COMMIT")
        return True
    except Error as e:
        conn.rollback()
        raise e
```

### Full-Text Search with FTS5

```python
import sqlite3

def create_fts_table(conn: sqlite3.Connection) -> None:
    conn.executescript("""
        CREATE VIRTUAL TABLE documents USING fts5(
            title, content, tokenize='porter unicode61'
        );
    """)

def search_documents(conn: sqlite3.Connection, query: str) -> list:
    cursor = conn.execute(
        """
        SELECT rowid, title, snippet(documents, 2, '<b>', '</b>', '...', 10)
        FROM documents
        WHERE documents MATCH ?
        ORDER BY bm25(documents)
        LIMIT 20
        """,
        (query,)
    )
    return [{"id": row[0], "title": row[1], "snippet": row[2]} for row in cursor]

def add_document(conn: sqlite3.Connection, title: str, content: str) -> int:
    cursor = conn.execute(
        "INSERT INTO documents (title, content) VALUES (?, ?)",
        (title, content)
    )
    conn.commit()
    return cursor.lastrowid
```

### JSON Support (JSON1 Extension)

```python
import sqlite3
import json

def store_json_data(conn: sqlite3.Connection, user_id: int, data: dict) -> None:
    conn.execute(
        """
        INSERT INTO user_profiles (user_id, data)
        VALUES (?, ?)
        ON CONFLICT(user_id) DO UPDATE SET data = ?
        """,
        (user_id, json.dumps(data), json.dumps(data))
    )
    conn.commit()

def query_by_json_field(
    conn: sqlite3.Connection, 
    field_path: str, 
    value: str
) -> list:
    cursor = conn.execute(
        """
        SELECT user_id, data FROM user_profiles
        WHERE json_extract(data, ?) = ?
        """,
        (field_path, value)
    )
    return [{"user_id": row[0], "data": json.loads(row[1])} for row in cursor]
```

## Best Practices

1. Use context managers for connections
2. Always use parameterized queries (prevent SQL injection)
3. Enable foreign keys with PRAGMA foreign_keys = ON
4. Use WAL mode for better concurrency: PRAGMA journal_mode=WAL
5. Create appropriate indexes on queried columns
6. Use appropriate data types (INTEGER for IDs, TEXT for strings)
7. Implement proper backup strategies (sqlite3 backup API)
8. Use FTS5 for full-text search requirements
9. Handle database locking gracefully (retry on busy)
10. Vacuum periodically to reclaim space

## Common Patterns

**Connection Pool (for threaded apps):**
```python
import sqlite3
import threading
from queue import Queue

class SQLitePool:
    def __init__(self, db_path: str, size: int = 5):
        self.db_path = db_path
        self.pool = Queue(size)
        for _ in range(size):
            conn = sqlite3.connect(db_path, check_same_thread=False)
            conn.row_factory = sqlite3.Row
            self.pool.put(conn)
    
    def get_connection(self):
        return self.pool.get(timeout=5)
    
    def return_connection(self, conn):
        self.pool.put(conn)
```

**Atomic Database Copy (Hot Backup):**
```python
import sqlite3

def backup_database(source: str, dest: str) -> None:
    source_conn = sqlite3.connect(source)
    dest_conn = sqlite3.connect(dest)
    source_conn.backup(dest_conn)
    dest_conn.close()
    source_conn.close()
```

**Upsert Pattern:**
```sql
INSERT INTO stats (key, value) VALUES ('page_views', 1)
ON CONFLICT(key) DO UPDATE SET value = stats.value + 1;
```
