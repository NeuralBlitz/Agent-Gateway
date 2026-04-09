---
name: acid-compliance
description: ACID compliance in databases
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: databases
---

## What I do
- Ensure ACID compliance in database operations
- Choose appropriate transaction strategies
- Implement retry logic

## When to use me
When designing database-backed applications requiring strong consistency.

## Compliance Strategies
```python
class ACIDCompliance:
    """Ensure ACID compliance"""
    
    def __init__(self, db):
        self.db = db
    
    def execute_transaction(self, operations: List[Callable], 
                          retries: int = 3) -> Any:
        """Execute with ACID guarantees"""
        for attempt in range(retries):
            try:
                with self.db.transaction() as tx:
                    results = [op() for op in operations]
                    tx.commit()
                    return results
            
            except DeadlockException:
                if attempt == retries - 1:
                    raise
                time.sleep(0.1 * (attempt + 1))
```
