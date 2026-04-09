---
name: code-review
description: Code review best practices and guidelines
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: code-quality
---
## What I do
- Review code for quality, correctness, and maintainability
- Provide constructive and actionable feedback
- Check for security vulnerabilities
- Ensure tests are adequate
- Verify code follows project conventions
- Suggest improvements without being prescriptive
- Balance thoroughness with velocity
- Learn from others' code

## When to use me
When performing code reviews or addressing feedback.

## What to Look For

### Correctness
- Does the code do what it's supposed to?
- Are edge cases handled?
- Are error conditions properly handled?
- Is the logic sound and bug-free?

### Security
- Input validation and sanitization
- Authentication and authorization
- Sensitive data handling
- SQL injection, XSS, CSRF protection

### Performance
- Unnecessary database queries (N+1 problem)
- Inefficient algorithms or data structures
- Missing indexes or caching
- Memory leaks

### Maintainability
- Readable and understandable code
- Proper naming conventions
- Code duplication
- Dead code
- Comments where needed

### Testing
- Adequate test coverage
- Meaningful test cases
- Edge cases and error scenarios

## Feedback Guidelines

### DO
- Be specific about what needs to change
- Explain why something should be changed
- Offer alternative solutions
- Acknowledge good code
- Focus on the code, not the person
- Distinguish between must-haves and suggestions

### DON'T
- Be rude or dismissive
- Nitpick style preferences
- Make personal comments
- Block PRs for minor issues
- Demand changes without explaining why
- Be overly critical without suggestions

## Example Review Comments

### Critical Finding
```markdown
**High: SQL Injection Vulnerability**

The user input is directly concatenated into the SQL query:

```python
query = f"SELECT * FROM users WHERE email = '{email}'"
```

**Risk**: An attacker could inject malicious SQL to extract or modify database data.

**Fix**: Use parameterized queries:

```python
cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
```

Required change - this is a security issue that must be fixed before merge.
```

### Improvement Suggestion
```markdown
**Medium: Consider using a context manager**

The current code manually manages the database connection:

```python
connection = get_db_connection()
try:
    process_data(connection)
finally:
    connection.close()
```

**Suggestion**: Using a context manager ensures proper cleanup even on exceptions:

```python
with get_db_connection() as connection:
    process_data(connection)
```

This is more Pythonic and handles edge cases automatically. Not blocking, but recommended.
```

### Style/Convention
```markdown
**Low: Line length**

This line exceeds our 100 character limit:

```python
some_function(argument_one, argument_two, argument_three=some_value, argument_four=other_value)
```

**Fix**: Break onto multiple lines:

```python
some_function(
    argument_one,
    argument_two,
    argument_three=some_value,
    argument_four=other_value,
)
```

We use Black formatter - running `black .` will auto-fix this.
```

### Positive Reinforcement
```markdown
**Great work!** The error handling here is excellent. Using a custom exception hierarchy makes the code very clear about what can go wrong and where. Thanks for the thorough docstrings too!
```

## Review Checklist
```
[] Code compiles/runs without errors
[] Tests pass (unit, integration, e2e)
[] No security vulnerabilities
[] Performance is acceptable
[] Follows naming conventions
[] Adequate error handling
[] Input validation present
[] No hardcoded secrets
[] No debug code left in
[] Documentation updated
[] Comments are helpful
[] No dead code
[] No code duplication
[] Logging is appropriate
[] Metrics/monitoring if needed
```

## Responding to Reviews

### When You Disagree
1. Understand the reviewer's perspective
2. Explain your reasoning
3. Provide evidence or examples
4. Seek common ground
5. Escalate if necessary (don't flame wars)

### When Making Changes
1. Address all feedback
2. Explain what you changed
3. Request re-review
4. Thank the reviewer

### Quick Wins
- Fix typos and formatting
- Rename variables for clarity
- Add missing tests
- Remove debug code
- Add comments
