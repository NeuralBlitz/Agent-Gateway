---
name: Computer Architecture
description: Design and understanding of computer hardware organization including CPU design, memory hierarchies, instruction sets, pipelining, cache memory, and performance optimization at the hardware level
license: MIT
compatibility: universal
audience: Systems Programmers, Hardware Engineers, Performance Engineers
category: Computer Science

---

# Computer Architecture

## What I Do

I specialize in computer architecture—the design and organization of computer systems at the hardware level. My expertise spans CPU design principles, instruction set architectures (RISC, CISC, VLIW), memory hierarchy design (caches, TLB, main memory), pipelining and superscalar execution, branch prediction, out-of-order execution, and performance optimization techniques. I work with hardware description languages (Verilog, VHDL), processor microarchitecture analysis, and understanding the interplay between hardware and software for optimal system performance.

## When to Use Me

- Writing performance-critical low-level code (kernels, embedded systems)
- Optimizing compiler passes for target architectures
- Designing embedded systems and selecting appropriate hardware
- Understanding CPU bottlenecks and cache behavior
- Implementing hardware-software interfaces and drivers
- Evaluating processor architectures for specific workloads
- Building simulators or emulators for computer architectures
- Designing custom accelerators or specialized hardware

## Core Concepts

1. **Instruction Set Architecture (ISA)**: RISC vs CISC, operand addressing modes, instruction encoding, and conventions
2. **Pipeline Hazards**: Structural, data, and control hazards with forwarding and stall strategies
3. **Cache Memory**: Cache levels (L1, L2, L3), replacement policies, write policies, and coherence
4. **Branch Prediction**: Static and dynamic prediction, two-bit counters, branch target buffers
5. **Superscalar Execution**: Multiple issue, out-of-order execution, register renaming, ROB
6. **Memory Hierarchy**: DRAM organization, memory controllers, prefetching, and memory ordering
7. **Virtual Memory**: Page tables, TLB, page faults, and address translation
8. **I/O Architecture**: Bus protocols (PCIe), DMA, interrupt handling, and device communication
9. **Performance Metrics**: CPI, IPC, throughput, latency, and energy efficiency (EDP)
10. **Parallelism**: SIMD, multithreading (SMT), multicore, and NUMA effects

## Code Examples

```python
# Cache Simulator with Set-Associative Design
from typing import List, Tuple, Optional
from dataclasses import dataclass
import random

@dataclass
class CacheLine:
    tag: int
    valid: bool = False
    dirty: bool = False
    lru_counter: int = 0

class CacheSimulator:
    def __init__(self, capacity: int, block_size: int, associativity: int):
        self.capacity = capacity  # in bytes
        self.block_size = block_size
        self.associativity = associativity
        
        self.num_sets = capacity // (block_size * associativity)
        self.sets: List[List[CacheLine]] = [
            [CacheLine(tag=0) for _ in range(associativity)]
            for _ in range(self.num_sets)
        ]
        
        self.hits = 0
        self.misses = 0
        self.evictions = 0
        self.writes = 0
        self.reads = 0
    
    def _get_set_index(self, address: int) -> int:
        """Extract cache set index from address."""
        offset_bits = (self.block_size - 1).bit_length()
        index_bits = (self.num_sets - 1).bit_length()
        return (address >> offset_bits) & ((1 << index_bits) - 1)
    
    def _get_tag(self, address: int) -> int:
        """Extract tag from address."""
        offset_bits = (self.block_size - 1).bit_length()
        index_bits = (self.num_sets - 1).bit_length()
        return address >> (offset_bits + index_bits)
    
    def access(self, address: int, is_write: bool = False) -> bool:
        """Access cache. Returns True on hit, False on miss."""
        if is_write:
            self.writes += 1
        else:
            self.reads += 1
        
        set_idx = self._get_set_index(address)
        tag = self._get_tag(address)
        cache_set = self.sets[set_idx]
        
        # Check for hit
        for line in cache_set:
            if line.valid and line.tag == tag:
                self.hits += 1
                self._update_lru(cache_set, line)
                if is_write:
                    line.dirty = True
                return True
        
        # Miss - need to load block
        self.misses += 1
        
        # Find victim for eviction
        victim = self._find_victim(cache_set)
        
        if victim.valid:
            self.evictions += 1
            if victim.dirty:
                # Write back would happen here
                pass
        
        # Load new block
        victim.tag = tag
        victim.valid = True
        victim.dirty = is_write
        self._update_lru(cache_set, victim)
        
        return False
    
    def _find_victim(self, cache_set: List[CacheLine]) -> CacheLine:
        """Find LRU victim line."""
        return min(cache_set, key=lambda line: line.lru_counter)
    
    def _update_lru(self, cache_set: List[CacheLine], accessed: CacheLine):
        """Update LRU counters after access."""
        for line in cache_set:
            if line.lru_counter < accessed.lru_counter:
                line.lru_counter += 1
        accessed.lru_counter = 0
    
    def hit_rate(self) -> float:
        total = self.hits + self.misses
        return self.hits / total if total > 0 else 0.0
    
    def print_stats(self):
        total = self.hits + self.misses
        print(f"Cache Statistics:")
        print(f"  Capacity: {self.capacity} bytes, Block: {self.block_size}")
        print(f"  Associativity: {self.associativity}")
        print(f"  Hits: {self.hits}, Misses: {self.misses}")
        print(f"  Hit Rate: {self.hit_rate():.2%}")
        print(f"  Evictions: {self.evictions}")
        print(f"  Reads: {self.reads}, Writes: {self.writes}")

# Usage example
cache = CacheSimulator(capacity=32768, block_size=64, associativity=4)

# Sample access pattern
addresses = [0x1000, 0x1004, 0x2000, 0x1000, 0x1004, 0x1008]
for addr in addresses:
    cache.access(addr, is_write=False)

cache.print_stats()
```

```c
// CPU Pipeline Simulator
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define IF_STAGE 0
#define ID_STAGE 1
#define EX_STAGE 2
#define MEM_STAGE 3
#define WB_STAGE 4
#define NUM_STAGES 5

typedef struct {
    int pc;
    int opcode;
    int rd, rs1, rs2;
    int imm;
    int valid;
    int hazard_detected;
} Instruction;

typedef struct {
    Instruction inst;
    int stall;
    int bubble;
} PipelineRegister;

typedef struct {
    PipelineRegister IF_ID;
    PipelineRegister ID_EX;
    PipelineRegister EX_MEM;
    PipelineRegister MEM_WB;
} Pipeline;

void init_instruction(Instruction *inst, int pc, int opcode, 
                      int rd, int rs1, int rs2, int imm) {
    inst->pc = pc;
    inst->opcode = opcode;
    inst->rd = rd;
    inst->rs1 = rs1;
    inst->rs2 = rs2;
    inst->imm = imm;
    inst->valid = 1;
    inst->hazard_detected = 0;
}

int get_register(Pipeline *pipe, int stage, int reg_num) {
    if (stage == ID_EX) {
        if (pipe->ID_EX.inst.rs1 == reg_num) return 1;
        if (pipe->ID_EX.inst.rs2 == reg_num) return 1;
    }
    if (stage == EX_MEM) {
        if (pipe->EX_MEM.inst.rd == reg_num) return 1;
    }
    return 0;
}

void detect_hazards(Pipeline *pipe) {
    // Reset hazards
    pipe->IF_ID.inst.hazard_detected = 0;
    pipe->ID_EX.inst.hazard_detected = 0;
    pipe->EX_MEM.inst.hazard_detected = 0;
    
    // RAW hazard detection
    if (pipe->ID_EX.inst.valid) {
        // Check if ID_EX writes register that IF_ID reads
        if (pipe->ID_EX.inst.rd != 0) {
            // Load-use hazard (simplified)
            if (pipe->ID_EX.inst.opcode == 0x03) { // Load
                pipe->IF_ID.inst.hazard_detected = 1;
            }
        }
    }
}

void pipeline_cycle(Pipeline *pipe, Instruction *new_inst) {
    // Detect hazards first
    detect_hazards(pipe);
    
    // Stall if hazard detected
    if (pipe->IF_ID.inst.hazard_detected) {
        pipe->ID_EX.inst.valid = 0;
        pipe->ID_EX.inst.bubble = 1;
    } else if (new_inst) {
        pipe->IF_ID.inst = (PipelineRegister){*new_inst, 0, 0};
    }
    
    // Advance pipeline
    pipe->MEM_WB = pipe->EX_MEM;
    pipe->EX_MEM = pipe->ID_EX;
    pipe->ID_EX = pipe->IF_ID;
    
    // IF stage - fetch new instruction
    if (!pipe->IF_ID.inst.hazard_detected && new_inst) {
        printf("Fetched instruction at PC 0x%x\n", new_inst->pc);
    }
}

void print_pipeline(Pipeline *pipe) {
    printf("Pipeline State:\n");
    printf("  IF/ID: PC=0x%x, opcode=0x%02x, valid=%d\n",
           pipe->IF_ID.inst.pc, pipe->IF_ID.inst.opcode, pipe->IF_ID.inst.valid);
    printf("  ID/EX: rd=%d, rs1=%d, rs2=%d, valid=%d\n",
           pipe->ID_EX.inst.rd, pipe->ID_EX.inst.rs1, pipe->ID_EX.inst.rs2, 
           pipe->ID_EX.inst.valid);
    printf("  EX/MEM: rd=%d, valid=%d\n", pipe->EX_MEM.inst.rd, pipe->EX_MEM.inst.valid);
    printf("  MEM/WB: rd=%d, valid=%d\n", pipe->MEM_WB.inst.rd, pipe->MEM_WB.inst.valid);
}
```

```python
# Branch Predictor Simulation
from typing import List, Tuple
import random

class TwoBitCounter:
    def __init__(self):
        self.state = 0  # 0-3: strongly not taken -> strongly taken
    
    def predict(self) -> bool:
        return self.state >= 2
    
    def update(self, actual: bool):
        if actual:
            self.state = min(3, self.state + 1)
        else:
            self.state = max(0, self.state - 1)

class BranchPredictor:
    def __init__(self, num_entries: int = 64):
        self.num_entries = num_entries
        self.counters = [TwoBitCounter() for _ in range(num_entries)]
        self.history_bits = 2 * num_entries
        self.global_history = 0
        self.history_length = 8
        
        self.predictions = 0
        self.correct = 0
    
    def _get_index(self, pc: int) -> int:
        return (pc ^ (self.global_history & ((1 << self.history_length) - 1))) % self.num_entries
    
    def predict(self, pc: int) -> bool:
        index = self._get_index(pc)
        return self.counters[index].predict()
    
    def update(self, pc: int, actual: bool):
        self.predictions += 1
        index = self._get_index(pc)
        
        if self.counters[index].predict() == actual:
            self.correct += 1
        
        self.counters[index].update(actual)
        
        # Update global history
        self.global_history = ((self.global_history << 1) | (1 if actual else 0)) & \
                              ((1 << self.history_length) - 1)
    
    def accuracy(self) -> float:
        return self.correct / self.predictions if self.predictions > 0 else 0.0

class BranchTargetBuffer:
    def __init__(self, num_entries: int = 64):
        self.num_entries = num_entries
        self.btb: List[Tuple[int, int, bool]] = [(0, 0, False)] * num_entries
        # (pc, target, valid)
    
    def _get_index(self, pc: int) -> int:
        return (pc >> 2) % self.num_entries
    
    def get_target(self, pc: int) -> Tuple[int, bool]:
        idx = self._get_index(pc)
        entry = self.btb[idx]
        if entry[2]:  # valid
            return entry[1], True
        return 0, False
    
    def update(self, pc: int, target: int):
        idx = self._get_index(pc)
        self.btb[idx] = (pc, target, True)

# Simulate branch prediction
predictor = BranchPredictor(num_entries=128)
btb = BranchTargetBuffer(128)

# Sample branch instruction trace: (pc, taken, target)
branch_trace = [
    (0x1000, True, 0x2000), (0x1004, False, 0x1008), 
    (0x1008, True, 0x3000), (0x100c, True, 0x2000),
    (0x1010, False, 0x1014), (0x1014, False, 0x1018),
]

for pc, taken, target in branch_trace:
    pred = predictor.predict(pc)
    predictor.update(pc, taken)
    btb.update(pc, target)

print(f"Branch prediction accuracy: {predictor.accuracy():.2%}")
```

```python
# Memory Access Latency Analysis
import time
from typing import List, Callable
import numpy as np

class MemoryLatencyAnalyzer:
    def __init__(self, iterations: int = 1000):
        self.iterations = iterations
    
    def measure_latency(self, access_func: Callable, args: tuple = ()) -> float:
        """Measure average memory access latency."""
        times = []
        
        for _ in range(self.iterations):
            start = time.perf_counter_ns()
            access_func(*args)
            end = time.perf_counter_ns()
            times.append(end - start)
        
        return {
            'min': min(times),
            'max': max(times),
            'mean': np.mean(times),
            'median': np.median(times),
            'p99': np.percentile(times, 99),
            'std': np.std(times)
        }
    
    def measure_cache_levels(self):
        """Measure cache access latencies at different levels."""
        sizes = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384,
                 32768, 65536, 131072, 262144, 524288, 1048576]
        
        results = {}
        
        for size in sizes:
            # Allocate array of given size
            arr = np.zeros(size, dtype=np.float64)
            
            # Sequential access
            start = time.perf_counter_ns()
            for i in range(0, len(arr), 64):  # Cache line stride
                arr[i] = i * 0.1
            end = time.perf_counter_ns()
            
            sequential_ns = (end - start) / (len(arr) // 64)
            results[size] = {
                'sequential': sequential_ns,
                'element_ns': (end - start) / len(arr)
            }
        
        return results
    
    def cache_miss_analysis(self, arr: np.ndarray, strides: List[int]):
        """Analyze cache behavior with different strides."""
        import matplotlib.pyplot as plt
        
        miss_rates = []
        
        for stride in strides:
            accesses = []
            last_cache_line = -1
            
            for i in range(0, len(arr), stride):
                cache_line = i // 64
                if cache_line != last_cache_line:
                    accesses.append(1)  # Cache miss
                    last_cache_line = cache_line
                else:
                    accesses.append(0)  # Cache hit
            
            miss_rate = sum(accesses) / len(accesses)
            miss_rates.append(miss_rate)
        
        return dict(zip(strides, miss_rates))

# Usage example
analyzer = MemoryLatencyAnalyzer(iterations=1000)

# Measure array access latency
small_arr = np.zeros(1024, dtype=np.float64)
small_result = analyzer.measure_latency(lambda: small_arr[0])

# Sequential vs random access
large_arr = np.zeros(8 * 1024 * 1024, dtype=np.float64)

def sequential_access():
    for i in range(0, len(large_arr), 64):
        large_arr[i] = i * 0.1

def random_access():
    indices = np.random.choice(len(large_arr), len(large_arr) // 64, replace=False)
    for idx in indices:
        large_arr[idx] = idx * 0.1

seq_result = analyzer.measure_latency(sequential_access)
rand_result = analyzer.measure_latency(random_access)

print(f"Sequential access: {seq_result['mean']:.0f} ns")
print(f"Random access: {rand_result['mean']:.0f} ns")
```

## Best Practices

1. **Cache Awareness**: Design data structures and access patterns for cache locality
2. **Alignment**: Align data structures on cache line boundaries to prevent false sharing
3. **Branch Prediction**: Organize branches predictably; avoid complex branch conditions in hot paths
4. **Prefetching**: Use software prefetch hints for regular access patterns
5. **SIMD Utilization**: Use vector instructions for data-parallel operations
6. **Memory Ordering**: Use appropriate memory barriers only when necessary
7. **Avoid Unnecessary Loads**: Cache frequently accessed values in registers
8. **Understand Your Hardware**: Profile on target architecture, not just development machine
9. **Instruction Mix**: Balance computation, memory access, and control flow
10. **Energy Efficiency**: Consider performance-per-watt for battery-powered systems
