---
name: real-time-systems
description: Real-time system design
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: computer-science
---

## What I do
- Design hard/soft real-time systems
- Implement scheduling algorithms
- Ensure timing constraints
- Handle interrupts safely

## When to use me
When building systems with strict timing requirements.

## Real-Time Concepts

### Task Scheduling
```python
from enum import Enum
from typing import List
import heapq

class TaskPriority(Enum):
    CRITICAL = 0  # Hard real-time
    HIGH = 1
    NORMAL = 2
    LOW = 3

class RealTimeTask:
    """Real-time task representation"""
    
    def __init__(self, name: str, period: float, 
                 execution_time: float, deadline: float,
                 priority: TaskPriority = TaskPriority.NORMAL):
        self.name = name
        self.period = period
        self.execution_time = execution_time
        self.deadline = deadline
        self.priority = priority
        self.release_time = 0.0
        self.completion_time = None
    
    def utilization(self) -> float:
        """CPU utilization of task"""
        return self.execution_time / self.period


class RateMonotonicScheduler:
    """Rate Monotonic Scheduling (RMS)"""
    
    def __init__(self):
        self.tasks: List[RealTimeTask] = []
    
    def add_task(self, task: RealTimeTask):
        self.tasks.append(task)
    
    def is_schedulable(self) -> bool:
        """Check schedulability using RMS"""
        n = len(self.tasks)
        
        # Sort by period (shorter = higher priority)
        sorted_tasks = sorted(self.tasks, 
                            key=lambda t: t.period)
        
        # Utilization bound test
        total_util = sum(t.utilization() for t in sorted_tasks)
        bound = n * (2 ** (1/n) - 1)
        
        if total_util <= bound:
            return True
        
        # Response time analysis
        return all(self._response_time(t, sorted_tasks) 
                  <= t.deadline for t in sorted_tasks)
    
    def _response_time(self, task: RealTimeTask,
                      tasks: List[RealTimeTask]) -> float:
        """Calculate worst-case response time"""
        # Response time = execution + interference
        response = task.execution_time
        
        for higher in tasks:
            if higher.period < task.period:
                response += higher.execution_time
        
        return response


class EarliestDeadlineFirst:
    """EDF Scheduling"""
    
    def __init__(self):
        self.ready_queue = []
        self.current_time = 0.0
    
    def schedule(self, tasks: List[RealTimeTask]) -> List[tuple]:
        """EDF schedule"""
        schedule = []
        
        for task in tasks:
            heapq.heappush(
                self.ready_queue,
                (task.deadline, task)
            )
        
        while self.ready_queue:
            deadline, task = heapq.heappop(self.ready_queue)
            schedule.append((self.current_time, task.name))
            self.current_time += task.execution_time
        
        return schedule
```

### Priority Inheritance
```python
class PriorityInheritance:
    """Priority inheritance protocol"""
    
    def __init__(self):
        self.locks = {}
    
    def acquire(self, task: str, lock_id: str, 
               task_priority: int):
        """Acquire lock with priority inheritance"""
        if lock_id in self.locks:
            # Lock held by another task
            holder = self.locks[lock_id]
            
            # Boost holder's priority
            holder.inherited_priority = max(
                holder.priority, task_priority
            )
        
        self.locks[lock_id] = TaskContext(task, task_priority)
    
    def release(self, task: str, lock_id: str):
        """Release lock and reset priority"""
        if lock_id in self.locks:
            ctx = self.locks[lock_id]
            ctx.priority = ctx.original_priority
            del self.locks[lock_id]


class TaskContext:
    def __init__(self, task: str, priority: int):
        self.task = task
        self.original_priority = priority
        self.priority = priority
        self.inherited_priority = priority
```

### Real-Time Mutex
```python
import threading
import ctypes

class RealTimeMutex:
    """Priority ceiling protocol mutex"""
    
    def __init__(self, ceiling_priority: int):
        self.ceiling_priority = ceiling_priority
        self.lock = threading.Lock()
        self.owner = None
        self.original_priority = None
    
    def acquire(self, task_priority: int):
        """Acquire with priority ceiling"""
        # Boost priority to ceiling
        if self.owner is None:
            self.owner = threading.current_thread()
        
        self.lock.acquire()
    
    def release(self):
        """Release mutex"""
        self.lock.release()
```

### Interrupt Handling
```python
class InterruptHandler:
    """Real-time interrupt handling"""
    
    def __init__(self):
        self.handlers = {}
        self.interrupt_level = 0
    
    def register_handler(self, interrupt_number: int, 
                       handler: Callable, priority: int):
        """Register interrupt handler"""
        self.handlers[interrupt_number] = {
            "handler": handler,
            "priority": priority,
            "enabled": True
        }
    
    def handle_interrupt(self, interrupt_number: int):
        """Handle interrupt"""
        if interrupt_number not in self.handlers:
            return
        
        info = self.handlers[interrupt_number]
        
        if not info["enabled"]:
            return
        
        # Disable interrupts at same or lower priority
        self._disable_interrupts(info["priority"])
        
        try:
            info["handler"]()
        finally:
            self._enable_interrupts(info["priority"])
    
    def _disable_interrupts(self, priority: int):
        """Disable interrupts up to priority level"""
        self.interrupt_level = priority
    
    def _enable_interrupts(self, priority: int):
        """Re-enable interrupts"""
        self.interrupt_level = 0
```

### Timing Analysis
```python
class TimingAnalysis:
    """Real-time timing analysis"""
    
    @staticmethod
    def wcet_analysis(code: List[str]) -> float:
        """Worst-Case Execution Time analysis"""
        # Static analysis of code
        wcet = 0.0
        
        for instruction in code:
            if "loop" in instruction:
                wcet += 10.0  # Conservative estimate
            elif "branch" in instruction:
                wcet += 2.0
            else:
                wcet += 1.0
        
        return wcet
    
    @staticmethod
    def schedulability_test(tasks: List[RealTimeTask]) -> Dict:
        """Test if task set is schedulable"""
        rms = RateMonotonicScheduler()
        for task in tasks:
            rms.add_task(task)
        
        return {
            "schedulable": rms.is_schedulable(),
            "total_utilization": sum(t.utilization() for t in tasks),
            "theoretical_bound": len(tasks) * (2**(1/len(tasks)) - 1)
        }
```
