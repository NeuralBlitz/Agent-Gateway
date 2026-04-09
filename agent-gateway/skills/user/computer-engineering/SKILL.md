---
name: Computer Engineering
description: Computer engineering fundamentals including digital logic, computer architecture, memory systems, I/O interfaces, and embedded systems for computing applications.
license: MIT
compatibility: python>=3.8
audience: computer-engineers, embedded-developers, researchers, students
category: engineering
---

# Computer Engineering

## What I Do

I provide comprehensive computer engineering tools including digital logic design, computer architecture, memory hierarchy, I/O systems, and embedded system design for computing applications.

## When to Use Me

- Digital circuit design
- Microprocessor architecture
- Memory system design
- I/O interface design
- Embedded system development
- Hardware-software codesign

## Core Concepts

- **Digital Logic**: Gates, flip-flops, combinational/sequential
- **Computer Architecture**: Pipeline, hazards, ISA
- **Memory Systems**: Cache, virtual memory, DRAM
- **I/O Systems**: DMA, interrupts, buses
- **Embedded Systems**: Microcontrollers, RTOS
- **Hardware Description**: HDL, RTL, synthesis
- **Performance**: CPI, Amdahl's law
- **Parallelism**: Multicore, SIMD, out-of-order

## Code Examples

### Digital Logic

```python
import numpy as np

def truth_table_to_expression(table, output_col):
    expressions = []
    for row in table:
        if row[output_col] == 1:
            terms = []
            for i, val in enumerate(row[:-1]):
                if val == 1:
                    terms.append(f'A{i}')
                elif val == 0:
                    terms.append(f'~A{i}')
            expressions.append(' & '.join(terms))
    return ' | '.join(expressions) if expressions else '0'

def karnaugh_map_grouping(groups):
    return {'minterms': [], 'dont_cares': []}

def timing_analysis(t_comb, t_setup, t_hold, clock_period):
    t_comb_max = clock_period - t_setup
    t_comb_min = t_hold
    return {'max_comb': t_comb_max, 'min_comb': t_comb_min}

def carry_lookahead_adder(n_bits, A, B):
    G = np.zeros(n_bits, dtype=bool)
    P = np.zeros(n_bits, dtype=bool)
    
    for i in range(n_bits):
        G[i] = A[i] & B[i]
        P[i] = A[i] | B[i]
    
    C = np.zeros(n_bits + 1, dtype=bool)
    for i in range(n_bits):
        C[i+1] = G[i] | (P[i] & C[i])
    
    S = np.zeros(n_bits, dtype=bool)
    for i in range(n_bits):
        S[i] = P[i] ^ C[i]
    
    return S, C

clock_period = 10  # ns
t_setup = 1.5
t_hold = 0.5
timing = timing_analysis(5, t_setup, t_hold, clock_period)
print(f"Max combinational delay: {timing['max_comb']:.1f} ns")
```

### Computer Architecture

```python
def cpi_calculator(base_cpi, stalls, instructions):
    total_cycles = instructions * base_cpi + stalls
    return total_cycles / instructions

def amdahl_speedup(s_parallel, p_parallel):
    return 1 / ((1 - s_parallel) + s_parallel / p_parallel)

def memory_access_time(T_cache, miss_rate, T_memory):
    return T_cache + miss_rate * T_memory

def instruction_throughput(CPI, clock_frequency):
    return clock_frequency / CPI

def pipeline_stalls(hazard_type, frequency):
    stall_cycles = {'RAW': 2, 'WAR': 1, 'WAW': 1}
    return frequency * stall_cycles.get(hazard_type, 0)

def branch_prediction_accuracy(prediction_rate, mispredict_penalty):
    return prediction_rate - (1 - prediction_rate) * mispredict_penalty

base_cpi = 1.2
stalls = 50000
instructions = 1000000
CPI = cpi_calculator(base_cpi, stalls, instructions)
print(f"Effective CPI: {CPI:.2f}")
speedup = amdahl_speedup(0.8, 4)
print(f"Amdahl speedup (4 cores): {speedup:.2f}x")
```

### Cache Analysis

```python
def cache_hit_time(T_hit, miss_rate, T_miss):
    return T_hit + miss_rate * T_miss

def average_memory_access_time(cache_access, main_memory_access):
    return cache_access + (1 - cache_access/mem_access) * main_memory_access

def miss_penalty_cycles(miss_rate, miss_latency):
    return miss_rate * miss_latency

def set_associativity_hits(sets, ways, capacity):
    return sets * ways == capacity

def write_back_dirty_bits(dirty_rate, write_back_cycles):
    return dirty_rate * write_back_cycles

def victim_cache_size(victim_cache_misses, victim_cache_size):
    return victim_cache_misses / victim_cache_size

cache_size = 32 * 1024  # 32 KB
block_size = 64
associativity = 8
num_sets = cache_size // (block_size * associativity)
print(f"Number of sets: {num_sets}")
```

### Memory Systems

```python
def dram_refresh_interval(refresh_commands, tREFI):
    return tREFI / refresh_commands

def virtual_to_physical(page_table, virtual_address):
    vpn = virtual_address // page_size
    offset = virtual_address % page_size
    pfn = page_table.get(vpn, None)
    if pfn is None:
        raise PageFaultError
    return pfn * page_size + offset

def tlb_hit_rate(hits, misses):
    return hits / (hits + misses)

def memory_bandwidth(bytes_transferred, time_interval):
    return bytes_transferred / time_interval

def page_fault_rate(page_faults, memory_references):
    return page_faults / memory_references

page_size = 4096
TLB_hits, TLB_misses = 950, 50
TLB_rate = tlb_hit_rate(TLB_hits, TLB_misses)
print(f"TLB hit rate: {TLB_rate:.2%}")
```

### Embedded Systems

```python
def real_time_task_scheduling(deadline, execution_time, period):
    utilization = execution_time / period
    return utilization

def interrupt_latency(max_ISR_time, nested_interrupts):
    return max_ISR_time + nested_interrupts * interrupt_overhead

def adc_resolution(bits, reference_voltage):
    return reference_voltage / (2**bits)

def pwm_duty_cycle(duty_cycle, frequency, timer_frequency):
    period_cycles = timer_frequency / frequency
    on_cycles = duty_cycle * period_cycles
    return on_cycles

def uart_baud_rate(baud_error, clock_frequency, desired_baud):
    ubrr = clock_frequency // (16 * desired_baud) - 1
    actual_baud = clock_frequency / (16 * (ubrr + 1))
    baud_error = abs(actual_baud - desired_baud) / desired_baud
    return ubrr, baud_error

def watchdog_timeout(prescaler, counter_max, clock_freq):
    timeout_ms = prescaler * counter_max * 1000 / clock_freq
    return timeout_ms
```

## Best Practices

1. **Timing Closure**: Meet all timing constraints
2. **Power Optimization**: Clock gating, power domains
3. **Reliability**: ECC, redundancy
4. **Verification**: RTL simulation, formal verification
5. **Debugging**: Logic analyzers, JTAG

## Common Patterns

```python
# FSM implementation
class FSM:
    def __init__(self, states, transitions):
        self.states = states
        self.transitions = transitions
        self.current = states[0]
    
    def next_state(self, input):
        return self.transitions[self.current].get(input, self.current)
```

## Core Competencies

1. Digital logic design
2. Computer architecture
3. Memory system design
4. Embedded systems
5. Performance optimization
