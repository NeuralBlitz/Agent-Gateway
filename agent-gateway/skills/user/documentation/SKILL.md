---
name: documentation
description: Technical documentation best practices and patterns
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: documentation
---
## What I do
- Write clear and comprehensive documentation
- Document APIs with OpenAPI/Swagger
- Create README files with setup instructions
- Write code comments and docstrings
- Document architecture decisions (ADRs)
- Create user guides and tutorials
- Maintain changelogs and release notes
- Use diagrams for complex concepts

## When to use me
When writing or updating documentation.

## README Structure
```markdown
# Project Name

Brief description of the project. What problem does it solve?

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

- Feature 1 with brief description
- Feature 2 with brief description
- Feature 3 with brief description

## Requirements

- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Node.js 20+

## Installation

```bash
# Clone the repository
git clone https://github.com/org/repo.git
cd repo

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup database
python manage.py migrate

# Start development server
python manage.py runserver
```

## Configuration

Create a `.env` file:

```bash
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/db
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key

# Optional
DEBUG=false
LOG_LEVEL=info
API_KEY=your-api-key
```

## Usage

### API Examples

```python
import requests

# Create a user
response = requests.post(
    'http://localhost:8000/api/v1/users',
    json={
        'email': 'user@example.com',
        'name': 'John Doe',
    },
    headers={'Authorization': 'Bearer YOUR_TOKEN'}
)
print(response.json())
```

## API Documentation

Full API documentation available at `/api/docs` (Swagger UI).

### Authentication

All API requests require authentication:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/v1/protected-resource
```

### Rate Limiting

- 100 requests per minute for authenticated users
- 10 requests per minute for unauthenticated users

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/api/test_users.py -v
```

## Deployment

### Docker

```bash
docker build -t myapp:latest .
docker run -p 8000:8000 myapp:latest
```

### Kubernetes

See `k8s/` directory for deployment manifests.

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## Architecture Decision Records

See [docs/adr](./docs/adr/) for architectural decisions.

## License

MIT License - see [LICENSE](LICENSE) for details.
```

## API Documentation (OpenAPI)
```yaml
openapi: 3.0.3
info:
  title: My API
  description: REST API for my application
  version: 1.0.0
  contact:
    name: API Support
    email: support@example.com

servers:
  - url: https://api.example.com/v1
    description: Production server
  - url: http://localhost:8000/api/v1
    description: Development server

tags:
  - name: Users
    description: User management operations
  - name: Auth
    description: Authentication operations

paths:
  /users:
    get:
      tags:
        - Users
      summary: List users
      description: Retrieve a paginated list of users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
          description: Page number
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
          description: Items per page
        - name: sort
          in: query
          schema:
            type: string
            default: '-createdAt'
          description: Sort field (prefix with - for descending)
        - name: search
          in: query
          schema:
            type: string
          description: Search in name and email
      responses:
        '200':
          description: List of users
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
                  meta:
                    $ref: '#/components/schemas/PaginationMeta'
        '401':
          $ref: '#/components/responses/Unauthorized'

    post:
      tags:
        - Users
      summary: Create user
      description: Create a new user account
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          $ref: '#/components/responses/ValidationError'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
          readOnly: true
        email:
          type: string
          format: email
        name:
          type: string
        createdAt:
          type: string
          format: date-time
          readOnly: true

    CreateUserRequest:
      type: object
      required:
        - email
        - name
        - password
      properties:
        email:
          type: string
          format: email
        name:
          type: string
          minLength: 1
          maxLength: 100
        password:
          type: string
          format: password
          minLength: 8

    PaginationMeta:
      type: object
      properties:
        total:
          type: integer
        page:
          type: integer
        limit:
          type: integer
        pages:
          type: integer

  responses:
    Unauthorized:
      description: Authentication required
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'

    ValidationError:
      description: Invalid request data
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: object
                properties:
                  code:
                    type: string
                  message:
                    type: string
                  details:
                    type: array
                    items:
                      type: object
                      properties:
                        field:
                          type: string
                        message:
                          type: string

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

## Code Comments
```python
class QuantumNeuron:
    """
    Quantum-inspired spiking neuron model.
    
    Implements quantum tunneling behavior for spike generation,
    coherence time management, and multi-reality state evolution.
    
    Attributes:
        num_qubits: Number of qubits in the quantum state
        coherence_time: Time before quantum decoherence (ms)
        tunneling_rate: Probability of quantum tunneling
    """
    
    def __init__(
        self,
        num_qubits: int = 4,
        coherence_time: float = 100.0,
        tunneling: float = 0.1,
    ) -> None:
        """
        Initialize quantum neuron.
        
        Args:
            num_qubits: Number of qubits (must be power of 2 for state vector)
            coherence_time: Quantum coherence duration in milliseconds
            tunneling: Tunneling probability (0.0 to 1.0)
            
        Raises:
            ValueError: If num_qubits is not a power of 2
        """
        if num_qubits & (num_qubits - 1):
            raise ValueError("num_qubits must be a power of 2")
            
        self.num_qubits = num_qubits
        self.coherence_time = coherence_time
        self.tunneling = tunneling
        self.state = np.zeros(2 ** num_qubits, dtype=complex)
        self.state[0] = 1.0  # Initialize to |0⟩ state
```
