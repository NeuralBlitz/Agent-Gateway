---
name: numpy
description: Numerical computing library providing support for large, multi-dimensional arrays, mathematical functions, linear algebra, random number generation, and Fourier transforms.
category: data-science
keywords:
  - numpy
  - arrays
  - numerical computing
  - linear algebra
  - broadcasting
  - mathematical functions
  - random numbers
  - matrix operations
difficulty: beginner
related_skills:
  - pandas
  - scikit-learn
  - statistics
---

# NumPy

## What I do

I provide fundamental numerical computing capabilities for Python through powerful N-dimensional array objects and mathematical functions. I enable efficient array operations, linear algebra computations, random number generation, Fourier transforms, and statistical calculations. I am the backbone of scientific computing in Python and serve as the foundation for pandas, scikit-learn, and other data science libraries.

## When to use me

- Performing numerical computations on large datasets
- Working with multi-dimensional arrays and matrices
- Implementing mathematical and statistical operations
- Linear algebra operations (matrix multiplication, eigenvalues, decompositions)
- Random sampling and probability distributions
- Signal processing and Fourier analysis
- Image processing (as multi-dimensional arrays)
- Performance-critical numerical code

## Core Concepts

### Arrays
- **ndarray**: N-dimensional array object with homogeneous data types
- **Shape**: Dimensions of the array (e.g., (1000, 50) for 1000 rows, 50 columns)
- **Data Types**: int8-uint64, float16-float128, complex, bool, object
- **Memory Layout**: C-contiguous (row-major) or Fortran-contiguous (column-major)

### Array Creation
- **From scratch**: `np.zeros()`, `np.ones()`, `np.empty()`, `np.arange()`, `np.linspace()`
- **From data**: `np.array()`, `np.asarray()`, `np.fromfunction()`
- **Random arrays**: `np.random.rand()`, `np.random.randint()`, `np.random.randn()`
- **Special matrices**: `np.eye()`, `np.identity()`, `np.diag()`

### Indexing and Slicing
- **Basic indexing**: Single element `arr[0, 0]`, slices `arr[1:5, :]`
- **Boolean indexing**: `arr[arr > 0]` for filtering
- **Fancy indexing**: `arr[[0, 2, 5]]` for multiple indices
- **Advanced indexing**: Integer arrays `arr[np.newaxis, :]`

### Broadcasting
- Automatic expansion of arrays with different shapes for element-wise operations
- Rule 1: Dimensions match from right to left
- Rule 2: Dimensions of size 1 can be stretched to match
- Enables vectorized operations without explicit loops

### Vectorization
- **ufuncs**: Universal functions for element-wise operations (np.add, np.multiply)
- **Reduction operations**: `np.sum()`, `np.mean()`, `np.max()`, `np.min()`
- **Accumulation**: `np.cumsum()`, `np.cumprod()`
- **Sorting**: `np.sort()`, `np.argsort()`, `np.partition()`

## Code Examples (Python)

```python
import numpy as np

# Array creation
arr = np.array([1, 2, 3, 4, 5])
zeros = np.zeros((3, 4))
ones = np.ones((2, 3), dtype=int)
arange = np.arange(0, 10, 2)
linspace = np.linspace(0, 1, 100)
random = np.random.rand(1000)
random_normal = np.random.randn(1000)
random_int = np.random.randint(0, 100, (5, 5))
identity = np.eye(3)
diagonal = np.diag([1, 2, 3])

# Array properties
arr.shape  # (5,) or (rows, cols)
arr.dtype  # dtype('int64')
arr.ndim  # Number of dimensions
arr.size  # Total elements
arr.nbytes  # Memory usage in bytes

# Reshaping
arr = np.arange(12)
reshaped = arr.reshape(3, 4)
flattened = reshaped.ravel()
transposed = reshaped.T
newaxis = arr[:, np.newaxis]

# Indexing
arr = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
arr[0, 0]  # First element: 1
arr[0]  # First row: [1, 2, 3]
arr[:, 0]  # First column: [1, 4, 7]
arr[1:3, 1:3]  # Sub-array
arr[arr > 5]  # Boolean indexing: [6, 7, 8, 9]
arr[[0, 2], [0, 2]]  # Fancy indexing: [1, 9]

# Mathematical operations
arr1 = np.array([1, 2, 3])
arr2 = np.array([4, 5, 6])
np.add(arr1, arr2)  # [5, 7, 9]
np.multiply(arr1, arr2)  # [4, 10, 18]
np.divide(arr1, arr2)  # [0.25, 0.4, 0.5]
np.power(arr1, 2)  # [1, 4, 9]
np.sqrt(arr1)  # [1.0, 1.414, 1.732]
np.exp(arr1)  # [2.718, 7.389, 20.086]
np.log(arr1)  # [0.0, 0.693, 1.099]

# Broadcasting
arr1 = np.array([[1], [2], [3]])  # (3, 1)
arr2 = np.array([4, 5, 6])  # (3,)
result = arr1 + arr2  # [[5, 6, 7], [6, 7, 8], [7, 8, 9]]

# Reductions
arr = np.array([1, 2, 3, 4, 5])
np.sum(arr)  # 15
np.mean(arr)  # 3.0
np.std(arr)  # 1.414...
np.var(arr)  # 2.0
np.min(arr)  # 1
np.max(arr)  # 5
np.argmax(arr)  # 4
np.median(arr)  # 3.0
np.percentile(arr, 75)  # 4.0

# Axis-based operations
matrix = np.array([[1, 2, 3], [4, 5, 6]])
np.sum(matrix, axis=0)  # Column sums: [5, 7, 9]
np.sum(matrix, axis=1)  # Row sums: [6, 15]
np.mean(matrix, axis=1)  # Row means: [2.0, 5.0]

# Linear algebra
A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])
np.dot(A, B)  # Matrix multiplication
A @ B  # Same as above
np.linalg.det(A)  # Determinant: -2
np.linalg.inv(A)  # Inverse
np.linalg.eig(A)  # Eigenvalues and eigenvectors
np.linalg.solve(A, np.array([5, 6]))  # Solve Ax = b
np.linalg.svd(A)  # Singular value decomposition
np.linalg.qr(A)  # QR decomposition
np.linalg.norm(A)  # Matrix/vector norm

# Random number generation
np.random.seed(42)  # Set seed
np.random.rand(5)  # Uniform [0, 1)
np.random.randn(5)  # Standard normal
np.random.randint(0, 10, 5)  # Random integers
np.random.uniform(0, 1, 5)  # Explicit uniform
np.random.normal(0, 1, 5)  # Explicit normal
np.random.choice([1, 2, 3, 4, 5], 3, replace=False)  # Without replacement
np.random.permutation(5)  # Permutation

# Distributions
np.random.binomial(10, 0.5, 100)  # Binomial
np.random.poisson(5, 100)  # Poisson
np.random.exponential(1, 100)  # Exponential
np.random.uniform(0, 1, 100)  # Uniform
np.random.normal(0, 1, 100)  # Normal

# Sorting
arr = np.array([3, 1, 4, 1, 5, 9, 2])
np.sort(arr)  # Sorted array
np.argsort(arr)  # Indices
np.partition(arr, 3)  # Partition around 3rd element

# Set operations
arr1 = np.array([1, 2, 3, 4, 5])
arr2 = np.array([3, 4, 5, 6, 7])
np.union1d(arr1, arr2)  # [1, 2, 3, 4, 5, 6, 7]
np.intersect1d(arr1, arr2)  # [3, 4, 5]
np.setdiff1d(arr1, arr2)  # [1, 2]
```

## Best Practices

1. **Use vectorization**: Replace Python loops with NumPy vectorized operations for 10-100x speedup.

2. **Pre-allocate arrays**: Create arrays with known sizes before loops instead of appending.

3. **Use appropriate dtypes**: Choose smaller dtypes (float32 instead of float64) when precision permits.

4. **Avoid copies**: Use views (`reshape`, `strides`) instead of copies when possible.

5. **Use in-place operations**: `arr += 5` instead of `arr = arr + 5` to avoid temporary arrays.

6. **Leverage broadcasting**: Write clean code that broadcasts instead of explicit tiling.

7. **Use np.newaxis**: Create proper dimensions for broadcasting.

8. **Memory-mapped arrays**: For large datasets, use `np.memmap` to avoid loading everything into memory.

## Common Patterns

### Pattern 1: Efficient Loop Replacement
```python
# Instead of this:
result = []
for i in range(len(data)):
    if data[i] > 0:
        result.append(data[i] ** 2)

# Use this:
result = data[data > 0] ** 2
```

### Pattern 2: Moving Average Calculation
```python
def moving_average(arr, window):
    """Calculate moving average using convolution."""
    kernel = np.ones(window) / window
    return np.convolve(arr, kernel, mode='valid')

# Or using rolling window:
def rolling_mean(arr, window):
    return np.array([arr[max(0,i):i+1].mean() 
                     for i in range(len(arr))])
```

### Pattern 3: Distance Matrix Computation
```python
def compute_distance_matrix(X, metric='euclidean'):
    """Compute pairwise distances efficiently."""
    # euclidean: ||a - b||^2 = ||a||^2 + ||b||^2 - 2*a.b
    X_sq = np.sum(X**2, axis=1)
    dist_sq = X_sq[:, np.newaxis] + X_sq[np.newaxis, :] - 2 @ X @ X.T
    dist_sq = np.maximum(dist_sq, 0)  # Numerical precision
    if metric == 'euclidean':
        return np.sqrt(dist_sq)
    return dist_sq
```
