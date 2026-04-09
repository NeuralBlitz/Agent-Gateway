---
name: python
description: Python programming language advanced patterns
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: programming
---
## What I do
- Write idiomatic Python
- Use type hints effectively
- Implement async patterns
- Use decorators properly
- Handle generators
- Use context managers
- Write Pythonic code
- Optimize Python performance

## When to use me
When writing Python code.

## Python Patterns
```python
from typing import TypeVar, Generic, Protocol
from contextlib import contextmanager
import asyncio

T = TypeVar('T')

# Generators for memory efficiency
def process_large_file(filepath: str):
    with open(filepath) as f:
        for line in f:
            yield line.strip()

# Context managers
@contextmanager
def database_transaction():
    try:
        yield
        commit()
    except Exception:
        rollback()
        raise

# Async patterns
async def fetch_all(urls: list[str]) -> list[dict]:
    async with aiohttp.ClientSession() as session:
        tasks = [fetch(session, url) for url in urls]
        return await asyncio.gather(*tasks)

# Protocol for duck typing
class Database(Protocol):
    async def connect(self): ...
    async def query(self, sql: str): ...

# Type hints
from dataclasses import dataclass

@dataclass(frozen=True)
class User:
    id: int
    name: str
    email: str
```
