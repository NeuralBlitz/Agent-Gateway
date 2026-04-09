---
name: linear-algebra
description: Master linear algebra operations including matrix manipulation, vector spaces, eigenvalues, and linear transformations for scientific computing and machine learning applications.
category: mathematics
tags:
  - mathematics
  - matrices
  - vectors
  - eigenvalues
  - linear-transformations
  - numpy
  - scientific-computing
difficulty: intermediate
author: neuralblitz
---

# Linear Algebra

## What I do

I provide comprehensive expertise in linear algebra, the branch of mathematics concerning linear equations, linear functions, and their representations through matrices and vector spaces. I enable you to perform fundamental operations including matrix multiplication, decomposition, eigenvalue analysis, and solving systems of linear equations. My knowledge spans from basic vector operations to advanced topics like singular value decomposition and principal component analysis, all essential for machine learning, computer graphics, scientific computing, and data analysis applications.

## When to use me

Use linear algebra when you need to: perform data transformations in machine learning pipelines, solve systems of linear equations arising from physical simulations, implement dimensionality reduction techniques like PCA, process images and signals through matrix operations, handle coordinate transformations in graphics applications, analyze stability of dynamical systems through eigenvalues, perform regression analysis and least squares fitting, or implement neural network layers and their backpropagation.

## Core Concepts

- **Vectors and Vector Spaces**: Collections of numbers arranged in rows or columns, forming spaces where linear combinations, span, and basis concepts apply.
- **Matrices and Matrix Operations**: Two-dimensional arrays supporting addition, multiplication, transposition, and inversion under specific conditions.
- **Matrix Decomposition**: Breaking matrices into products of simpler matrices including LU, QR, Cholesky, and eigendecomposition.
- **Eigenvalues and Eigenvectors**: Scalars and vectors satisfying Av = λv, critical for stability analysis and dimensionality reduction.
- **Linear Transformations**: Functions between vector spaces preserving vector addition and scalar multiplication.
- **Singular Value Decomposition**: Factorization of matrices into UΣV^T, fundamental for recommendation systems and image compression.
- **Orthogonality and Least Squares**: Perpendicular relationships and optimal approximation solutions for overdetermined systems.
- **Matrix Rank and Determinants**: Measures of linear independence and scalar values indicating matrix invertibility and volume scaling.

## Code Examples

### Matrix Operations and Basic Linear Algebra

```python
import numpy as np
from numpy.linalg import inv, det, eig, svd

# Matrix creation and basic operations
A = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 10]])
B = np.array([[2, 0, 0], [0, 3, 0], [0, 0, 5]])

# Matrix multiplication
C = A @ B  # or np.dot(A, B)

# Matrix transpose
A_T = A.T

# Matrix inverse (if square and invertible)
A_inv = inv(A)

# Determinant (zero means singular/non-invertible)
det_A = det(A)
print(f"Determinant: {det_A}")

# Create identity matrix
I = np.eye(3)
```

### Eigenvalue and Eigenvector Computation

```python
import numpy as np
from numpy.linalg import eig

# Compute eigenvalues and eigenvectors
A = np.array([[4, 1], [2, 3]])
eigenvalues, eigenvectors = eig(A)

print("Eigenvalues:", eigenvalues)
print("Eigenvectors:\n", eigenvectors)

# Verify Av = λv for first eigenpair
v1 = eigenvectors[:, 0]
lambda1 = eigenvalues[0]
print("Verification A*v = λ*v:", np.allclose(A @ v1, lambda1 * v1))

# Power iteration for largest eigenvalue
def power_iteration(A, max_iter=100, tol=1e-10):
    n = A.shape[0]
    v = np.random.randn(n)
    v = v / np.linalg.norm(v)
    
    for _ in range(max_iter):
        Av = A @ v
        v_new = Av / np.linalg.norm(Av)
        if abs(np.dot(v, v_new) - 1) < tol:
            break
        v = v_new
    
    eigenvalue = np.dot(v, A @ v)
    return eigenvalue, v

eigenvalue, eigenvector = power_iteration(A)
print(f"Largest eigenvalue: {eigenvalue}")
```

### Singular Value Decomposition

```python
import numpy as np
from numpy.linalg import svd

# SVD decomposition
A = np.array([[1, 2], [3, 4], [5, 6]])
U, S, Vt = svd(A)

print("U shape:", U.shape)
print("Singular values:", S)
print("V^T shape:", Vt.shape)

# Reconstruct original matrix
A_reconstructed = U @ np.diag(S) @ Vt
print("Reconstruction error:", np.linalg.norm(A - A_reconstructed))

# Low-rank approximation for dimensionality reduction
k = 1  # Keep top k singular values
A_compressed = U[:, :k] @ np.diag(S[:k]) @ Vt[:k, :]
print("Compressed shape:", A_compressed.shape)

# Pseudoinverse using SVD
U_pinv, S_pinv, Vt_pinv = svd(A, full_matrices=False)
A_pinv = Vt_pinv.T @ np.diag(1/S_pinv) @ U_pinv.T
print("Pseudoinverse computed successfully")
```

### Solving Linear Systems

```python
import numpy as np
from numpy.linalg import solve

# Solve Ax = b
A = np.array([[3, 1], [1, 2]])
b = np.array([9, 8])

# Direct solution using Gaussian elimination
x = solve(A, b)
print("Solution x:", x)

# Verify solution
print("Verification A*x = b:", np.allclose(A @ x, b))

# Least squares for overdetermined systems
A_over = np.array([[1, 1], [1, 2], [1, 3]])
b_over = np.array([1, 2, 3])
x_lstsq, residuals, rank, s = np.linalg.lstsq(A_over, b_over, rcond=None)
print("Least squares solution:", x_lstsq)

# Using normal equations (A^T A) x = A^T b
x_normal = np.linalg.inv(A_over.T @ A_over) @ A_over.T @ b_over
print("Normal equations solution:", x_normal)
```

### Matrix Decompositions

```python
import numpy as np
from numpy.linalg import lu, qr, cholesky

# LU Decomposition
A = np.array([[4, 3], [6, 3]])
P, L, U = lu(A)
print("P:\n", P)
print("L:\n", L)
print("U:\n", U)
print("PL = LU:", np.allclose(P @ L @ U, A))

# QR Decomposition (useful for least squares)
Q, R = qr(A)
print("Q:\n", Q)
print("R:\n", R)
print("QR = A:", np.allclose(Q @ R, A))

# Cholesky Decomposition (for positive definite matrices)
A_sym = np.array([[4, 2], [2, 3]])
L_chol = cholesky(A_sym)
print("Cholesky L:\n", L_chol)
print("L @ L^T = A:", np.allclose(L_chol @ L_chol.T, A_sym))
```

## Best Practices

- Always check matrix conditioning before solving linear systems; use `np.linalg.cond()` to assess numerical stability.
- Prefer `solve()` over manual matrix inversion for solving linear systems as it is more numerically stable.
- Use appropriate data types (float64) for numerical computations to maintain precision.
- For large sparse matrices, use scipy.sparse instead of dense numpy arrays to conserve memory.
- Validate matrix dimensions are compatible before performing multiplication to catch shape mismatches early.
- When dealing with near-singular matrices, consider regularization techniques like ridge regression.
- Use vectorized operations rather than explicit loops for performance-critical linear algebra computations.
- For eigendecomposition, verify matrices are square and consider symmetry for real eigenvalues.
- When computing pseudoinverses, handle near-zero singular values carefully to avoid numerical instability.
- Profile different decomposition methods to select the most efficient approach for your specific problem structure.

