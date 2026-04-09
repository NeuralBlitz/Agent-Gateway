---
name: Debugging
description: Systematic identification and resolution of software defects including debugging techniques, tools, logging strategies, and diagnostic methodologies for production issues
license: MIT
compatibility: universal
audience: Software Engineers, SREs, DevOps Engineers
category: Computer Science

---

# Debugging

## What I Do

I specialize in debugging—the systematic process of identifying, isolating, and fixing software defects. My expertise spans debugging techniques for various paradigms (concurrent, distributed, embedded), debugging tools (debuggers, profilers, logging), crash analysis, memory debugging, network debugging, and production incident response. I apply scientific method principles to efficiently trace bugs to their root causes and implement lasting fixes.

## When to Use Me

- Reproducing and fixing hard-to-reproduce bugs
- Debugging concurrent and race conditions
- Analyzing production crashes and core dumps
- Debugging performance issues
- Debugging distributed system failures
- Setting up effective logging and monitoring
- Conducting post-mortems and root cause analysis
- Building debugging tooling and automation

## Core Concepts

1. **Scientific Method**: Form hypothesis, test, refine
2. **Reproducibility**: Creating reliable test cases
3. **Isolation**: Reducing search space systematically
4. **Binary Search**: Divide and conquer debugging
5. **Debuggers**: Breakpoints, watchpoints, stepping
6. **Logging**: Structured logging, log levels, correlation IDs
7. **Tracing**: Distributed tracing, span correlation
8. **Memory Debugging**: Valgrind, AddressSanitizer, memory leaks
9. **Core Dump Analysis**: Post-mortem debugging
10. **Root Cause Analysis**: 5 Whys, fishbone diagrams

## Code Examples

```python
# Debugging Techniques and Tools

import logging
import sys
from typing import Any, Dict
from functools import wraps
import time
from contextlib import contextmanager
import json

# Structured Logging Setup
class StructuredLogger:
    """Structured JSON logging for production debugging."""
    
    def __init__(self, name: str, level: int = logging.INFO):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(level)
        
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter('%(message)s'))
        self.logger.addHandler(handler)
    
    def log(self, level: int, message: str, **kwargs):
        """Log with structured context."""
        log_entry = {
            'timestamp': time.time(),
            'level': logging.getLevelName(level),
            'message': message,
            **kwargs
        }
        
        if level == logging.ERROR:
            self.logger.error(json.dumps(log_entry))
        elif level == logging.WARNING:
            self.logger.warning(json.dumps(log_entry))
        else:
            self.logger.info(json.dumps(log_entry))

logger = StructuredLogger(__name__)

# Decorator for function tracing
def trace(function_name: str = None):
    """Decorator to trace function entry/exit and arguments."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            func_name = function_name or func.__name__
            
            logger.info(
                f"ENTER {func_name}",
                function=func_name,
                args=str(args),
                kwargs=str(kwargs)
            )
            
            try:
                result = func(*args, **kwargs)
                
                logger.info(
                    f"EXIT {func_name}",
                    function=func_name,
                    result=str(result)
                )
                
                return result
            except Exception as e:
                logger.error(
                    f"EXCEPTION in {func_name}",
                    function=func_name,
                    exception_type=type(e).__name__,
                    exception_message=str(e),
                    traceback=True
                )
                raise
        
        return wrapper
    return decorator

# Context manager for timing and debugging
@contextmanager
def debug_section(name: str, verbose: bool = True):
    """Context manager to track section execution."""
    logger.info(f"SECTION START: {name}", section=name)
    start_time = time.perf_counter()
    
    try:
        yield
        elapsed = time.perf_counter() - start_time
        
        if verbose:
            logger.info(
                f"SECTION END: {name}",
                section=name,
                duration_seconds=elapsed
            )
    except Exception as e:
        elapsed = time.perf_counter() - start_time
        
        logger.error(
            f"SECTION FAILED: {name}",
            section=name,
            exception_type=type(e).__name__,
            exception_message=str(e),
            duration_seconds=elapsed
        )
        raise

# Example usage
@trace()
def process_order(order_id: str, items: list):
    with debug_section(f"Processing order {order_id}"):
        # Process each item
        for item in items:
            with debug_section(f"Processing item {item['id']}"):
                validate_item(item)
                check_inventory(item)
                calculate_price(item)
        
        with debug_section("Finalizing order"):
            apply_discount(order_id)
            save_order(order_id)
        
        return {"order_id": order_id, "status": "processed"}

def validate_item(item):
    if not item.get('id'):
        raise ValueError(f"Item missing ID: {item}")
    if item.get('quantity', 0) <= 0:
        raise ValueError(f"Invalid quantity: {item.get('quantity')}")

def check_inventory(item):
    # Simulate check
    pass

def calculate_price(item):
    # Simulate calculation
    pass

def apply_discount(order_id):
    pass

def save_order(order_id):
    pass
```

```python
# Debugging Concurrent Code

import threading
import time
from collections import defaultdict
from dataclasses import dataclass
from typing import List, Dict
import queue

class ConcurrentDebugger:
    """Tools for debugging concurrent code."""
    
    def __init__(self):
        self.event_log: List[Dict] = []
        self.lock = threading.Lock()
        self.thread_activity: Dict[str, List] = defaultdict(list)
    
    def log_event(self, thread_name: str, event_type: str, **kwargs):
        """Log thread events with timestamps."""
        with self.lock:
            event = {
                'timestamp': time.time(),
                'thread': thread_name,
                'type': event_type,
                **kwargs
            }
            self.event_log.append(event)
            
            self.thread_activity[thread_name].append({
                'event': event_type,
                'timestamp': event['timestamp']
            })
    
    def check_for_races(self) -> List[Dict]:
        """Detect potential race conditions."""
        race_warnings = []
        
        # Group events by shared resource access
        resource_access = defaultdict(list)
        
        for event in self.event_log:
            if 'resource' in event:
                resource = event['resource']
                resource_access[resource].append(event)
        
        # Check for unsynchronized writes
        for resource, events in resource_access.items():
            write_events = [e for e in events if e.get('access') == 'write']
            
            if len(write_events) > 1:
                # Check if any writes occurred concurrently
                for i, e1 in enumerate(write_events):
                    for e2 in write_events[i+1:]:
                        if abs(e1['timestamp'] - e2['timestamp']) < 0.001:
                            race_warnings.append({
                                'resource': resource,
                                'events': [e1, e2]
                            })
        
        return race_warnings
    
    def detect_deadlock(self, wait_graph: Dict[str, List[str]]) -> List[List[str]]:
        """Detect potential deadlocks using wait-for graph."""
        visited = set()
        cycles = []
        
        def dfs(node, path, stack):
            visited.add(node)
            stack.add(node)
            
            for neighbor in wait_graph.get(node, []):
                if neighbor not in visited:
                    dfs(neighbor, path + [neighbor], stack)
                elif neighbor in stack:
                    cycles.append(path + [neighbor])
            
            stack.remove(node)
        
        for node in wait_graph:
            if node not in visited:
                dfs(node, [node], set())
        
        return cycles

# Thread-safe debugging wrapper
class DebuggedThread(threading.Thread):
    """Thread with built-in debugging."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.debugger = kwargs.get('debugger', None)
        self.thread_name = kwargs.get('name', self.name)
    
    def run(self):
        if self.debugger:
            self.debugger.log_event(self.thread_name, "THREAD_START")
        
        try:
            super().run()
            
            if self.debugger:
                self.debugger.log_event(self.thread_name, "THREAD_COMPLETE")
        except Exception as e:
            if self.debugger:
                self.debugger.log_event(
                    self.thread_name,
                    "THREAD_EXCEPTION",
                    exception=str(e)
                )
            raise

# Example: Deadlock debugger
def demonstrate_deadlock_detection():
    debugger = ConcurrentDebugger()
    
    # Simulate wait-for graph
    # Thread A waits for resource held by B
    # Thread B waits for resource held by A
    wait_graph = {
        'Thread-A': ['Thread-B'],  # A waits for B
        'Thread-B': ['Thread-A'],  # B waits for A
    }
    
    deadlock_detector = ConcurrentDebugger()
    cycles = deadlock_detector.detect_deadlock(wait_graph)
    
    if cycles:
        print(f"DEADLOCK DETECTED! Cycle: {cycles}")
    else:
        print("No deadlock detected")
```

```python
# Production Debugging with Core Dump Analysis

import gdb
import struct
from typing import Any, Dict, List, Optional
from dataclasses import dataclass

class CoreDumpAnalyzer:
    """Analyze core dumps to understand crash state."""
    
    def __init__(self, executable: str, core_file: str):
        self.executable = executable
        self.core_file = core_file
        self.gdb = gdb
    
    def analyze_crash(self) -> Dict[str, Any]:
        """Extract crash information from core dump."""
        # Load core dump
        self.gdb.execute(f"file {self.executable}")
        self.gdb.execute(f"core-file {self.core_file}")
        
        # Get crash signal and location
        info = {
            'signal': self._get_signal(),
            'crash_location': self._get_crash_location(),
            'registers': self._get_registers(),
            'stack_trace': self._get_stack_trace(),
            'threads': self._get_all_threads(),
        }
        
        return info
    
    def _get_signal(self) -> str:
        """Get the signal that caused the crash."""
        output = self.gdb.execute("info signal", to_string=True)
        return output
    
    def _get_crash_location(self) -> Dict[str, str]:
        """Get where the crash occurred."""
        try:
            frame = gdb.newest_frame()
            return {
                'function': frame.name(),
                'file': frame.find_sal_line().symtab.filename,
                'line': str(frame.find_sal_line().line),
                'address': hex(int(frame.pc()))
            }
        except:
            return {'error': 'Could not determine crash location'}
    
    def _get_registers(self) -> Dict[str, str]:
        """Get register values at crash."""
        registers = {}
        for reg in ['rax', 'rbx', 'rcx', 'rdx', 'rsp', 'rbp', 'rip']:
            try:
                value = gdb.parse_and_eval(f"${reg}")
                registers[reg] = hex(int(value))
            except:
                registers[reg] = 'unknown'
        return registers
    
    def _get_stack_trace(self) -> List[Dict]:
        """Get stack trace."""
        trace = []
        frame = gdb.newest_frame()
        
        while frame:
            try:
                trace.append({
                    'function': frame.name(),
                    'file': frame.find_sal_line().symtab.filename,
                    'line': str(frame.find_sal_line().line),
                })
                frame = frame older()
            except:
                break
        
        return trace
    
    def _get_all_threads(self) -> List[Dict]:
        """Get info about all threads."""
        threads = []
        self.gdb.execute("thread apply all bt", to_string=True)
        return threads

# Post-Mortem Debugging Analysis
class PostMortemAnalyzer:
    """Analyze root causes of failures."""
    
    @staticmethod
    def five_whys(causes: List[str]) -> Dict[str, str]:
        """Apply 5 Whys method to find root cause."""
        analysis = {}
        current_level = causes[0]
        
        for i, cause in enumerate(causes[1:], 1):
            analysis[f"Why {i}"] = f"{current_level} because {cause}"
            current_level = cause
        
        analysis["Root Cause"] = current_level
        return analysis
    
    @staticmethod
    def fishbone_causes(effect: str, categories: Dict[str, List[str]]) -> Dict:
        """Categorize causes using fishbone (Ishikawa) diagram."""
        return {
            'effect': effect,
            'categories': categories
        }

# Example 5 Whys analysis
incident_causes = [
    "Service responded with 500 error",
    "Database connection pool was exhausted",
    "Connections were not being released",
    "Error handler in API endpoint did not close connection",
    "The error handler had a bug that skipped the cleanup code"
]

root_cause = PostMortemAnalyzer.five_whys(incident_causes)
print("Root Cause Analysis:")
for level, explanation in root_cause.items():
    print(f"  {level}: {explanation}")
```

## Best Practices

1. **Reproduce First**: Never fix without reliable reproduction
2. **Isolate Systematically**: Binary search through code/inputs
3. **Use Debuggers**: Set breakpoints, inspect state
4. **Instrument with Logging**: Structured, level-based logging
5. **Log Context**: Include request IDs, user IDs for correlation
6. **Automate Debugging**: Scripts for common investigation steps
7. **Preserve Evidence**: Save logs, core dumps, screenshots
8. **Document Everything**: Post-mortems prevent recurrence
9. **Learn from Failures**: Each bug is a learning opportunity
10. **Prevention over Cure**: Fix root causes, not symptoms
