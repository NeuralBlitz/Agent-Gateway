---
name: Linear Algebra
description: Master linear algebra operations including matrix manipulation, vector spaces, eigenvalues, and linear transformations for scientific computing and machine learning applications.
license: MIT
compatibility: python>=3.8
audience: data-scientists, engineers, physicists, mathematicians
category: mathematics
---

# Linear Algebra

## What I Do

I provide comprehensive linear algebra capabilities including matrix operations, vector space computations, eigenvalue problems, singular value decomposition, and linear transformations essential for scientific computing, machine learning, and engineering applications.

## When to Use Me

- Solving systems of linear equations
- Dimensionality reduction with SVD/PCA
- Eigenvalue computations for stability analysis
- Linear transformations in graphics and robotics
- Quantum state representations
- Machine learning weight transformations

## Core Concepts

- **Matrix Operations**: Multiplication, inversion, factorization
- **Vector Spaces**: Basis, span, orthogonality, projections
- **Eigenvalues/Eigenvectors**: Spectral decomposition, diagonalization
- **Linear Transformations**: Mappings, rank, null space
- **Matrix Factorizations**: LU, QR, SVD, Cholesky
- **Least Squares**: Normal equations, pseudoinverse
- **Matrix Decompositions**: Eigendecomposition, Schur, Jordan

## Code Examples

### Matrix Operations

```python
import numpy as np
from numpy.linalg import inv, det, eig, svd

A = np.array([[3, 1], [1, 2]])
B = np.array([[1, 2], [2, 1]])

matrix_mult = np.dot(A, B)
matrix_inv = inv(A)
matrix_det = det(A)

print(f"Matrix multiplication:\n{matrix_mult}")
print(f"Determinant: {matrix_det}")
```

### Eigenvalue Decomposition

```python
A = np.array([[4, 2], [2, 3]])
eigenvalues, eigenvectors = eig(A)

print(f"Eigenvalues: {eigenvalues}")
print(f"Eigenvectors:\n{eigenvectors}")

normalized_eigenvectors = eigenvectors / np.linalg.norm(eigenvectors, axis=0)
```

### Singular Value Decomposition

```python
M = np.array([[1, 2], [3, 4], [5, 6]])
U, s, Vt = svd(M)

print(f"U matrix:\n{U}")
print(f"Singular values: {s}")
print(f"V transpose:\n{Vt}")

reconstructed = U @ np.diag(s) @ Vt
print(f"Reconstructed:\n{reconstructed}")
```

### Solving Linear Systems

```python
A = np.array([[2, 1], [1, 3]])
b = np.array([5, 8])

x = np.linalg.solve(A, b)
print(f"Solution: {x}")

least_squares_solution = np.linalg.lstsq(A, b, rcond=None)[0]
```

### Vector Projections and Orthogonality

```python
v = np.array([1, 2, 3])
u = np.array([1, 0, 1])

proj = np.dot(v, u) / np.dot(u, u) * u
orthogonal = v - proj

print(f"Projection of v onto u: {proj}")
print(f"Orthogonal component: {orthogonal}")
print(f"Dot product (should be ~0): {np.dot(proj, orthogonal)}")
```

## Best Practices

1. **Preconditioning**: Use well-conditioned matrices to avoid numerical instability
2. **Sparse Matrices**: Use scipy.sparse for large sparse systems
3. **Memory Efficiency**: Consider dtype float32 for large matrices
4. **Parallelization**: Use BLAS libraries for optimized matrix operations
5. **Numerical Stability**: Prefer QR decomposition over direct inversion

## Common Patterns

```python
# Power iteration for largest eigenvalue
def power_iteration(A, max_iter=100, tol=1e-10):
    b_k = np.random.rand(A.shape[1])
    for _ in range(max_iter):
        b_k_next = np.dot(A, b_k)
        b_k_next = b_k_next / np.linalg.norm(b_k_next)
        if abs(np.dot(b_k, b_k_next)) > 1 - tol:
            break
        b_k = b_k_next
    return b_k, np.dot(b_k, np.dot(A, b_k))

# Gram-Schmidt orthogonalization
def gram_schmidt(vectors):
    basis = []
    for v in vectors:
        for b in basis:
            v = v - np.dot(v, b) / np.dot(b, b) * b
        if np.linalg.norm(v) > 1e-10:
            basis.append(v / np.linalg.norm(v))
    return np.array(basis)
```

## Core Competencies

1. Matrix operations and factorizations
2. Eigenvalue/eigenvector computations
3. Singular value decomposition
4. Linear system solving
5. Vector space operations and projections
