---
name: High-Performance Computing
description: Design and implementation of massively parallel computing systems including MPI, GPU computing (CUDA/OpenCL), vectorization, parallel algorithms, and distributed memory programming
license: MIT
compatibility: universal
audience: Scientific Computing Engineers, Performance Engineers, Research Scientists
category: Computer Science

---

# High-Performance Computing

## What I Do

I specialize in high-performance computing (HPC)—the use of parallel processing, supercomputers, and specialized hardware to solve complex computational problems. My expertise spans MPI (Message Passing Interface) programming, GPU computing with CUDA and OpenCL, parallel algorithm design, distributed memory systems, vectorization (SIMD), performance profiling, and scalable scientific computing. I work with large-scale simulations, data-intensive computations, and performance-critical applications that require efficient utilization of modern parallel architectures.

## When to Use Me

- Accelerating scientific simulations (weather, molecular dynamics, CFD)
- Building machine learning training infrastructure
- Processing large datasets in parallel
- Optimizing compute-intensive kernels
- Developing for GPU clusters or supercomputers
- Implementing parallel data processing pipelines
- Scaling algorithms to multiple nodes
- Profiling and optimizing parallel applications

## Core Concepts

1. **MPI Programming**: Point-to-point communication, collective operations, communicators
2. **GPU Architecture**: CUDA threads, blocks, grids, memory hierarchy (global, shared, registers)
3. **Parallel Patterns**: Map, Reduce, Scatter, Gather, stencil computations
4. **Load Balancing**: Static and dynamic work distribution strategies
5. **Memory Access Patterns**: Coalesced memory access, bank conflicts, cache utilization
6. **Strong vs Weak Scaling**: Performance characteristics as problem size grows
7. **Parallel Efficiency**: Speedup, Amdahl's law, strong/weak scaling analysis
8. **Vectorization**: SIMD instructions, auto-vectorization, intrinsics
9. **Communication Overlap**: Hiding latency with computation using asynchronous ops
10. **Checkpoint/Restart**: Fault tolerance for long-running computations

## Code Examples

```c
// MPI Matrix-Vector Multiplication
#include <mpi.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MATRIX_TAG 1
#define VECTOR_TAG 2
#define RESULT_TAG 3

void matvec_mult(double *local_matrix, double *vector, double *result, 
                int local_rows, int n) {
    for (int i = 0; i < local_rows; i++) {
        result[i] = 0.0;
        for (int j = 0; j < n; j++) {
            result[i] += local_matrix[i * n + j] * vector[j];
        }
    }
}

int main(int argc, char *argv[]) {
    int rank, size;
    int n = 1000;  // Matrix dimension
    
    MPI_Init(&argc, &argv);
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);
    
    // Calculate row distribution
    int base_rows = n / size;
    int extra_rows = n % size;
    int local_rows = (rank < extra_rows) ? base_rows + 1 : base_rows;
    int local_offset = (extra_rows * (base_rows + 1)) + 
                       ((rank > extra_rows) ? extra_rows : 0) +
                       (rank > extra_rows ? (rank - extra_rows) * base_rows : 0);
    
    double *matrix = NULL;
    double *vector = NULL;
    double *local_matrix = malloc(local_rows * n * sizeof(double));
    double *local_result = malloc(local_rows * sizeof(double));
    
    if (rank == 0) {
        // Master: allocate and distribute
        matrix = malloc(n * n * sizeof(double));
        vector = malloc(n * sizeof(double));
        
        // Initialize matrix and vector
        for (int i = 0; i < n; i++) {
            vector[i] = 1.0;
            for (int j = 0; j < n; j++) {
                matrix[i * n + j] = i + j;
            }
        }
        
        // Distribute matrix rows
        int offset = 0;
        for (int dest = 0; dest < size; dest++) {
            int rows = (dest < extra_rows) ? base_rows + 1 : base_rows;
            MPI_Send(&matrix[offset], rows * n, MPI_DOUBLE, dest, MATRIX_TAG, 
                    MPI_COMM_WORLD);
            offset += rows * n;
        }
        
        // Distribute vector to all
        for (int dest = 1; dest < size; dest++) {
            MPI_Send(vector, n, MPI_DOUBLE, dest, VECTOR_TAG, MPI_COMM_WORLD);
        }
        memcpy(vector, vector, n * sizeof(double));  // Keep copy
    } else {
        // Workers: receive matrix rows
        MPI_Recv(local_matrix, local_rows * n, MPI_DOUBLE, 0, MATRIX_TAG, 
                MPI_COMM_WORLD, MPI_STATUS_IGNORE);
        
        vector = malloc(n * sizeof(double));
        MPI_Recv(vector, n, MPI_DOUBLE, 0, VECTOR_TAG, MPI_COMM_WORLD, 
                MPI_STATUS_IGNORE);
    }
    
    // Perform local computation
    matvec_mult(local_matrix, vector, local_result, local_rows, n);
    
    // Gather results
    int *recvcounts = malloc(size * sizeof(int));
    int *displs = malloc(size * sizeof(int));
    
    for (int i = 0; i < size; i++) {
        int rows = (i < extra_rows) ? base_rows + 1 : base_rows;
        recvcounts[i] = rows;
        displs[i] = (i == 0) ? 0 : displs[i-1] + recvcounts[i-1];
    }
    
    double *result = NULL;
    if (rank == 0) {
        result = malloc(n * sizeof(double));
    }
    
    MPI_Gatherv(local_result, local_rows, MPI_DOUBLE, 
               result, recvcounts, displs, MPI_DOUBLE, 0, MPI_COMM_WORLD);
    
    if (rank == 0) {
        // Verify result
        double expected = (n - 1) * (n - 1 + 1.0) / 2.0;  // Sum of 0 to n-1
        int correct = 1;
        for (int i = 0; i < n; i++) {
            if (result[i] != expected) {
                correct = 0;
                break;
            }
        }
        printf("Result %s\n", correct ? "CORRECT" : "INCORRECT");
        
        free(matrix);
        free(result);
    }
    
    free(vector);
    free(local_matrix);
    free(local_result);
    free(recvcounts);
    free(displs);
    
    MPI_Finalize();
    return 0;
}
```

```cuda
// CUDA Matrix Multiplication with Shared Memory
#include <cuda_runtime.h>
#include <stdio.h>

#define TILE_SIZE 16
#define CHECK(call) \
    do { \
        cudaError_t err = call; \
        if (err != cudaSuccess) { \
            printf("CUDA error at %s:%d: %s\n", __FILE__, __LINE__, \
                   cudaGetErrorString(err)); \
            exit(EXIT_FAILURE); \
        } \
    } while (0)

__global__ void matmul_tiled(float *A, float *B, float *C, int N) {
    __shared__ float As[TILE_SIZE][TILE_SIZE];
    __shared__ float Bs[TILE_SIZE][TILE_SIZE];
    
    int bx = blockIdx.x;
    int by = blockIdx.y;
    int tx = threadIdx.x;
    int ty = threadIdx.y;
    
    int row = by * TILE_SIZE + ty;
    int col = bx * TILE_SIZE + tx;
    
    float Cvalue = 0.0f;
    
    for (int k = 0; k < N; k += TILE_SIZE) {
        // Load tiles into shared memory
        if (row < N && k + tx < N) {
            As[ty][tx] = A[row * N + k + tx];
        } else {
            As[ty][tx] = 0.0f;
        }
        
        if (k + ty < N && col < N) {
            Bs[ty][tx] = B[(k + ty) * N + col];
        } else {
            Bs[ty][tx] = 0.0f;
        }
        
        __syncthreads();
        
        // Compute partial product
        for (int i = 0; i < TILE_SIZE; i++) {
            Cvalue += As[ty][i] * Bs[i][tx];
        }
        
        __syncthreads();
    }
    
    if (row < N && col < N) {
        C[row * N + col] = Cvalue;
    }
}

void matmul_cpu(float *A, float *B, float *C, int N) {
    for (int i = 0; i < N; i++) {
        for (int j = 0; j < N; j++) {
            float sum = 0.0f;
            for (int k = 0; k < N; k++) {
                sum += A[i * N + k] * B[k * N + j];
            }
            C[i * N + j] = sum;
        }
    }
}

float *allocate_device_memory(size_t size) {
    float *d_ptr;
    CHECK(cudaMalloc(&d_ptr, size));
    return d_ptr;
}

void copy_to_device(float *d_ptr, float *h_ptr, size_t size) {
    CHECK(cudaMemcpy(d_ptr, h_ptr, size, cudaMemcpyHostToDevice));
}

void copy_from_device(float *h_ptr, float *d_ptr, size_t size) {
    CHECK(cudaMemcpy(h_ptr, d_ptr, size, cudaMemcpyDeviceToHost));
}

int main(int argc, char *argv[]) {
    int N = 1024;
    size_t bytes = N * N * sizeof(float);
    
    // Allocate host memory
    float *h_A = (float *)malloc(bytes);
    float *h_B = (float *)malloc(bytes);
    float *h_C = (float *)malloc(bytes);
    float *h_C_ref = (float *)malloc(bytes);
    
    // Initialize matrices
    for (int i = 0; i < N * N; i++) {
        h_A[i] = (float)(i % N) / N;
        h_B[i] = (float)(i / N) / N;
    }
    
    // Compute reference on CPU
    matmul_cpu(h_A, h_B, h_C_ref, N);
    
    // Allocate device memory
    float *d_A = allocate_device_memory(bytes);
    float *d_B = allocate_device_memory(bytes);
    float *d_C = allocate_device_memory(bytes);
    
    // Copy to device
    copy_to_device(d_A, h_A, bytes);
    copy_to_device(d_B, h_B, bytes);
    
    // Launch kernel
    dim3 threads(TILE_SIZE, TILE_SIZE);
    dim3 blocks((N + TILE_SIZE - 1) / TILE_SIZE, (N + TILE_SIZE - 1) / TILE_SIZE);
    
    cudaEvent_t start, stop;
    CHECK(cudaEventCreate(&start));
    CHECK(cudaEventCreate(&stop));
    
    CHECK(cudaEventRecord(start));
    matmul_tiled<<<blocks, threads>>>(d_A, d_B, d_C, N);
    CHECK(cudaEventRecord(stop));
    CHECK(cudaEventSynchronize(stop));
    
    float milliseconds = 0;
    CHECK(cudaEventElapsedTime(&milliseconds, start, stop));
    printf("CUDA kernel time: %.3f ms\n", milliseconds);
    
    // Copy result back
    copy_from_device(h_C, d_C, bytes);
    
    // Verify result
    int errors = 0;
    for (int i = 0; i < N * N; i++) {
        if (fabsf(h_C[i] - h_C_ref[i]) > 1e-4) {
            errors++;
            if (errors < 5) {
                printf("Error at %d: %f vs %f\n", i, h_C[i], h_C_ref[i]);
            }
        }
    }
    
    printf("Errors: %d\n", errors);
    
    // Cleanup
    cudaFree(d_A);
    cudaFree(d_B);
    cudaFree(d_C);
    free(h_A);
    free(h_B);
    free(h_C);
    free(h_C_ref);
    
    return 0;
}
```

```python
# OpenMP Parallel Computation
import numpy as np
from numba import jit, prange

@jit(nopython=True, parallel=True)
def compute_mandelbrot(width, height, max_iter):
    """Compute Mandelbrot set with parallelization."""
    mandelbrot = np.zeros((height, width), dtype=np.int32)
    x_min, x_max = -2.0, 1.0
    y_min, y_max = -1.5, 1.5
    
    for py in prange(height):
        y = y_min + (y_max - y_min) * py / height
        for px in range(width):
            x = x_min + (x_max - x_min) * px / width
            
            x0, y0 = x, y
            iteration = 0
            
            while x*x + y*y <= 4.0 and iteration < max_iter:
                x_new = x*x - y*y + x0
                y = 2*x*y + y0
                x = x_new
                iteration += 1
            
            mandelbrot[py, px] = iteration
    
    return mandelbrot

# Usage
width, height = 2000, 2000
max_iter = 255

result = compute_mandelbrot(width, height, max_iter)
print(f"Computed {width}x{height} Mandelbrot set")
```

```c
// OpenACC GPU Offloading
#include <stdio.h>
#include <openacc.h>

#define N 10000000

void compute_heat_diffusion(double *temperature, double *new_temperature, int n) {
    #pragma acc parallel loop copyin(temperature[0:n]) \
                        copyout(new_temperature[0:n])
    for (int i = 1; i < n - 1; i++) {
        new_temperature[i] = 0.25 * (temperature[i-1] + 
                                    temperature[i+1] + 
                                    temperature[i] + 
                                    temperature[i]);
    }
    
    #pragma acc parallel loop copy(temperature[0:n], new_temperature[0:n])
    for (int i = 1; i < n - 1; i++) {
        temperature[i] = new_temperature[i];
    }
}

int main() {
    double *temperature = (double *)malloc(N * sizeof(double));
    double *new_temperature = (double *)malloc(N * sizeof(double));
    
    // Initialize
    for (int i = 0; i < N; i++) {
        temperature[i] = (i < N/2) ? 100.0 : 0.0;
    }
    
    // Initialize OpenACC
    acc_init(acc_device_default);
    
    // Copy data to GPU
    #pragma acc data copy(temperature[0:N], new_temperature[0:N])
    {
        for (int step = 0; step < 1000; step++) {
            compute_heat_diffusion(temperature, new_temperature, N);
        }
    }
    
    printf("Final max temperature: %f\n", temperature[N/2]);
    
    free(temperature);
    free(new_temperature);
    
    acc_shutdown(acc_device_default);
    return 0;
}
```

## Best Practices

1. **Minimize Communication**: Amortize communication costs with larger messages
2. **Overlap Computation and Communication**: Use asynchronous operations
3. **Locality Matters**: Process data where it resides to minimize transfer
4. **Load Balancing**: Profile and redistribute work based on actual performance
5. **Memory Access Patterns**: Ensure coalesced access on GPU, cache-friendly on CPU
6. **Strong vs Weak Scaling**: Choose appropriate scaling for your problem
7. **Fault Tolerance**: Implement checkpointing for long-running jobs
8. **Profiling**: Use tools like VTune, Nsight, Scalasca for bottlenecks
9. **Floating-Point Consistency**: Be aware of different floating-point results
10. **Scalable Algorithms**: Choose algorithms with O(n) or O(n log n) communication
