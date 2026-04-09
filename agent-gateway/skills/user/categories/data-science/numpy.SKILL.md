---
name: numpy
description: Fundamental package for numerical computing with powerful N-dimensional array objects
category: data-science
skills:
  - numerical computing
  - array operations
  - linear algebra
  - random number generation
  - mathematical functions
---

# NumPy

## What I do

I am NumPy, the foundational numerical computing library for Python and the backbone of the entire scientific Python ecosystem. I provide the N-dimensional array object called ndarray, which serves as the efficient, homogeneous container for large datasets in Python. My arrays are implemented in C and provide dramatic performance improvements over native Python lists for numerical operations through vectorization and optimized C implementations underneath. I offer comprehensive mathematical functions for linear algebra operations, Fourier transforms, random number generation, and element-wise operations that form the building blocks for higher-level libraries like pandas, SciPy, and scikit-learn. Think of me as MATLAB for Python programmers, providing the low-level array operations that enable the rich ecosystem of data science tools built on top of me.

## When to use me

Use NumPy whenever you need to perform numerical computations on large arrays or matrices efficiently. This includes linear algebra operations like matrix multiplication, eigenvalue decomposition, and solving linear systems, numerical integration and differentiation, signal and image processing where you need efficient array manipulations, statistical computations and random sampling, and any scenario where performance matters and you're working with numerical data. You should avoid using NumPy for general-purpose programming that doesn't involve numerical operations, for data structures that aren't array-like (use Python lists or pandas for mixed-type tabular data), or for string manipulation and text processing where pandas or built-in string methods are more appropriate.

## Core Concepts

**ndarray**: The core NumPy object representing an N-dimensional array of homogeneous data types. Arrays provide faster creation and manipulation compared to Python lists due to contiguous memory allocation and C-level implementations. Arrays have a shape tuple defining their dimensions and a dtype specifying the data type of elements.

**Vectorization**: The practice of replacing explicit loops with array operations that execute in compiled C code underneath. Vectorized operations apply functions to entire arrays simultaneously, providing 10-100x speedups over Python loops. This is the key to NumPy's performance advantage.

**Broadcasting**: The set of rules that allow NumPy to perform operations on arrays with different shapes. When shapes are compatible (either equal or one is 1), NumPy automatically expands the smaller array to match the larger one, enabling elegant code without explicit reshaping.

**Indexing and Slicing**: NumPy supports Python-style basic indexing with start:stop:step, advanced indexing with integer arrays or boolean masks, and fancy indexing with multiple arrays. Understanding the distinction between views and copies is crucial for performance and avoiding unintended data modification.

**Universal Functions (ufuncs)**: Vectorized functions that operate element-wise on arrays, including mathematical operations like sin, cos, exp, and arithmetic operations. ufuncs support broadcasting, type casting, and reduce/accumulate operations for efficient parallel computation.

**Strides**: The number of bytes to step in each dimension when traversing an array in memory. Strides determine memory layout and enable efficient views without copying. Understanding strides helps optimize memory usage and avoid unexpected behavior.

**Memory Layout**: NumPy arrays can be row-major (C-style) or column-major (Fortran-style), affecting cache efficiency for different operations. Most operations work with both layouts, but knowing the layout helps optimize performance-critical code.

## Code Examples

```python
import numpy as np

# Creating arrays from various sources
arr_from_list = np.array([1, 2, 3, 4, 5])
arr_zeros = np.zeros((3, 4), dtype=np.float64)
arr_ones = np.ones((2, 3), dtype=np.int32)
arr_range = np.arange(0, 10, 2)
arr_linspace = np.linspace(0, 1, 100)
arr_random = np.random.random((1000, 10))
arr_normal = np.random.randn(1000)
arr_integers = np.random.randint(0, 100, size=(100, 5))

# Array operations and broadcasting
a = np.array([[1, 2, 3], [4, 5, 6]])
b = np.array([10, 20, 30])
result = a + b  # Broadcasting: adds [10,20,30] to each row

# Matrix operations
matrix = np.array([[1, 2], [3, 4], [5, 6]])
dot_product = np.dot(matrix, matrix.T)
eigenvalues, eigenvectors = np.linalg.eigh(matrix @ matrix.T)
inverse = np.linalg.inv(matrix @ matrix.T + 0.01 * np.eye(3))
determinant = np.linalg.det(matrix @ matrix.T)
singular_values = np.linalg.svd(matrix, compute_uv=False)

# Slicing and indexing
arr = np.arange(20).reshape(4, 5)
first_row = arr[0]
first_column = arr[:, 0]
submatrix = arr[1:3, 2:4]
mask = arr > 10
filtered = arr[mask]
fancy_indexing = arr[[0, 2, 3], [1, 2, 3]]

# Boolean operations
arr = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
greater_than_5 = arr > 5
print(f"Sum of elements > 5: {arr[greater_than_5].sum()}")
combined = (arr >= 3) & (arr <= 7)
print(f"Elements between 3 and 7: {arr[combined]}")

# Using where for conditional operations
arr = np.array([1, 2, 3, 4, 5])
result = np.where(arr > 3, 'big', 'small')
matrix = np.array([[1, 2], [3, 4], [5, 6]])
condition = matrix > 3
replaced = np.where(condition, matrix, 0)
```

```python
import numpy as np

# Statistical operations
data = np.random.randn(1000, 5)
mean_per_column = data.mean(axis=0)
std_per_row = data.std(axis=1)
median = np.median(data)
percentiles = np.percentile(data, [25, 50, 75], axis=0)
correlation_matrix = np.corrcoef(data.T)
covariance_matrix = np.cov(data.T)

# Random number generation with reproducibility
rng = np.random.RandomState(42)
random_values = rng.rand(100)
normal_samples = rng.randn(1000)
random_integers = rng.randint(0, 100, size=(100, 10))
shuffled = rng.permutation(data)
sampled = rng.choice(data, size=50, replace=False)

# Random samples from distributions
uniform = rng.uniform(0, 1, 10000)
exponential = rng.exponential(scale=1.0, size=10000)
normal = rng.normal(loc=0, scale=1, size=10000)
poisson = rng.poisson(lam=5, size=10000)
binomial = rng.binomial(n=10, p=0.5, size=1000)

# Linear algebra operations
A = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
b = np.array([1, 2, 3])
solution = np.linalg.solve(A[:2, :2], b[:2])  # 2x2 system
least_squares, residuals, rank, s = np.linalg.lstsq(A, b, rcond=None)
pseudo_inverse = np.linalg.pinv(A)

# Norms and distances
vector = np.array([3, 4])
l2_norm = np.linalg.norm(vector)
l1_norm = np.linalg.norm(vector, ord=1)
infinity_norm = np.linalg.norm(vector, ord=np.inf)
matrix_norm = np.linalg.norm(A, ord='fro')

# FFT and signal processing
t = np.linspace(0, 1, 1000)
signal = np.sin(2 * np.pi * 5 * t) + 0.5 * np.sin(2 * np.pi * 10 * t)
fft_result = np.fft.fft(signal)
frequencies = np.fft.fftfreq(len(signal), d=t[1] - t[0])
power_spectrum = np.abs(fft_result) ** 2
```

```python
import numpy as np

# Reshaping and manipulation
arr = np.arange(24)
reshaped = arr.reshape(2, 3, 4)
flattened = reshaped.reshape(-1)  # -1 infers dimension
raveled = arr.ravel()  # Returns flattened array
transposed = reshaped.transpose((2, 0, 1))
swapped = reshaped.swapaxes(1, 2)
expanded = np.expand_dims(arr, axis=0)
squeezed = np.squeeze(expanded)

# Stacking and splitting
a = np.array([1, 2, 3])
b = np.array([4, 5, 6])
vstacked = np.vstack([a, b])
hstacked = np.hstack([a, b])
dstack = np.dstack([a, b])
concatenated = np.concatenate([a, b, a], axis=0)

# Split operations
arr = np.arange(12)
split_in_three = np.split(arr, 3)
split_at_indices = np.split(arr, [2, 5, 8])

# Fancy indexing and advanced operations
arr = np.arange(20).reshape(4, 5)
rows = np.array([0, 2])
cols = np.array([1, 3])
fancy_result = arr[rows, cols]  # [arr[0,1], arr[2,3]]
take_values = arr.take([0, 5, 10, 15])
put_values = arr.put([0, 5, 10, 15], [100, 200, 300, 400])

# Structured arrays and record arrays
dt = np.dtype([('name', 'U20'), ('age', 'i4'), ('salary', 'f8')])
structured = np.array([
    ('Alice', 25, 75000.0),
    ('Bob', 30, 65000.0)
], dtype=dt)
names = structured['name']
ages = structured['age']

# Memory layout and performance
arr = np.arange(1000000)
c_contiguous = np.ascontiguousarray(arr)
f_contiguous = np.asfortranarray(arr)

# Viewing same data with different dtype
int_arr = np.arange(8, dtype=np.int32)
float_view = int_arr.view(np.float32)
```

## Best Practices

Always create arrays with explicit dtypes when precision matters, as default dtypes can vary between systems and operations, potentially causing subtle bugs in numerical computations. Use `np.zeros_like()` or `np.ones_like()` with explicit dtype parameters when creating arrays based on existing ones. Prefer `np.arange()` over `np.array(range())` for numeric ranges as it's more efficient. When working with large arrays, be mindful of memory usage by choosing appropriate dtypes: use `np.float32` instead of `float64` when precision allows, and consider `np.int8` or `np.int16` for categorical or bounded integer data. Use views whenever possible by slicing without copying, and access the `.base` attribute to check if an array is a view of another array. Understand broadcasting rules completely: arrays can broadcast when their shapes are either equal or one equals 1, and broadcasting adds a new dimension to the smaller array to match the larger one. Use `np.newaxis` or `np.expand_dims()` to add dimensions explicitly for broadcasting. For performance-critical code, preallocate arrays rather than growing them in loops, use in-place operations like `+=` instead of creating new arrays, and consider `np.fromiter()` for creating arrays from iterators. When debugging, use `np.set_printoptions()` to control array display and `np.allclose()` for floating-point comparison with tolerance. Remember that `np.dot()` is optimized for matrix multiplication, while `*` performs element-wise multiplication, which is a common source of bugs.
