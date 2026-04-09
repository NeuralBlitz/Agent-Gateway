---
name: Real-Time Systems
description: Design and implementation of time-critical computing systems with guaranteed response times, scheduling theory, resource management, and safety certification requirements
license: MIT
compatibility: universal
audience: Embedded Engineers, Systems Architects, Safety-Critical Developers
category: Computer Science

---

# Real-Time Systems

## What I Do

I specialize in real-time systems—computing systems that must produce correct results within strictly defined time constraints. My expertise spans real-time scheduling algorithms (Rate Monotonic, Earliest Deadline First), timing analysis (worst-case execution time), resource allocation, priority inversion solutions, safety-critical system design, and certification standards (DO-178C, ISO 26262, IEC 61508). I work with real-time operating systems (RTOS), deterministic communication protocols, and fault-tolerance mechanisms required for aerospace, automotive, medical, and industrial control applications.

## When to Use Me

- Developing safety-critical systems (aerospace, automotive, medical)
- Building industrial control systems with hard timing requirements
- Implementing robotics systems with sensor-actuator loops
- Designing automotive ECUs and ADAS systems
- Creating telecommunications systems with latency guarantees
- Building high-frequency trading systems
- Implementing audio/video streaming with jitter requirements
- Achieving DO-178C, ISO 26262, or IEC 61508 certification

## Core Concepts

1. **Hard vs Soft Real-Time**: Guaranteed deadlines vs probabilistic fulfillment
2. **Rate Monotonic Scheduling (RMS)**: Static priority assignment based on period
3. **Earliest Deadline First (EDF)**: Dynamic priority scheduling by deadline
4. **Worst-Case Execution Time (WCET)**: Analysis of maximum task execution time
5. **Priority Inversion**: Mars Pathfinder problem and priority inheritance solutions
6. **Schedulability Analysis**: Response time analysis and utilization bounds
7. **Real-Time Communication**: TTEthernet, CAN, FlexRay, and time-triggered protocols
8. **Safety Integrity Levels (SIL)**: Risk classification and assurance levels
9. **Deterministic Memory**: Memory pools, no dynamic allocation in critical tasks
10. **Watchdog Timers**: Hardware and software watchdogs for fault detection

## Code Examples

```c
// Rate Monotonic Scheduling Analysis
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

typedef struct {
    int id;
    int period;          // T_i
    int execution_time;  // C_i (worst-case)
    int deadline;        // D_i (typically = period for RMS)
    int priority;        // Lower number = higher priority
} Task;

int calculate_response_time(Task task, Task *higher_tasks, int num_higher) {
    int response = task.execution_time;
    int iteration = 0;
    
    while (1) {
        int interference = 0;
        for (int i = 0; i < num_higher; i++) {
            int num_jobs = (response + higher_tasks[i].period - 1) / higher_tasks[i].period;
            interference += num_jobs * higher_tasks[i].execution_time;
        }
        
        int new_response = task.execution_time + interference;
        
        if (new_response > task.deadline) {
            return -1;  // Deadline missed
        }
        
        if (new_response == response) {
            return response;  // Converged
        }
        
        response = new_response;
        
        if (iteration++ > 1000) {
            return -1;  // Non-convergent
        }
    }
}

int check_schedulability_rms(Task *tasks, int num_tasks) {
    // Sort by period (shorter period = higher priority)
    for (int i = 0; i < num_tasks - 1; i++) {
        for (int j = 0; j < num_tasks - i - 1; j++) {
            if (tasks[j].period > tasks[j + 1].period) {
                Task temp = tasks[j];
                tasks[j] = tasks[j + 1];
                tasks[j + 1] = temp;
            }
        }
    }
    
    // Assign priorities (1 = highest)
    for (int i = 0; i < num_tasks; i++) {
        tasks[i].priority = i + 1;
    }
    
    // Check utilization bound
    double total_utilization = 0.0;
    for (int i = 0; i < num_tasks; i++) {
        total_utilization += (double)tasks[i].execution_time / tasks[i].period;
    }
    
    double utilization_bound = num_tasks * (pow(2.0, 1.0 / num_tasks) - 1);
    
    printf("Total utilization: %.4f\n", total_utilization);
    printf("Utilization bound: %.4f\n", utilization_bound);
    
    if (total_utilization > utilization_bound) {
        printf("Warning: Exceeds RMS utilization bound, checking response times...\n");
    }
    
    // Response time analysis
    for (int i = 0; i < num_tasks; i++) {
        Task *higher_tasks = tasks;
        int num_higher = i;
        
        int response = calculate_response_time(tasks[i], higher_tasks, num_higher);
        
        if (response < 0) {
            printf("Task %d: UNSCHEDULABLE (deadline missed)\n", tasks[i].id);
            return 0;
        } else {
            printf("Task %d: Response time = %d (deadline = %d)\n", 
                   tasks[i].id, response, tasks[i].deadline);
        }
    }
    
    return 1;
}

// Usage example
int main() {
    Task tasks[] = {
        {1, 10, 3, 10},   // Task 1: C=3, T=10, D=10
        {2, 20, 5, 20},   // Task 2: C=5, T=20, D=20
        {3, 40, 8, 40},   // Task 3: C=8, T=40, D=40
    };
    
    int num_tasks = sizeof(tasks) / sizeof(tasks[0]);
    
    if (check_schedulability_rms(tasks, num_tasks)) {
        printf("\nTask set is schedulable under RMS\n");
    } else {
        printf("\nTask set is NOT schedulable\n");
    }
    
    return 0;
}
```

```c
// Priority Inheritance Mutex Implementation
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <unistd.h>
#include <sys/time.h>

#define HIGH_PRIORITY 10
#define MEDIUM_PRIORITY 5
#define LOW_PRIORITY 1

typedef struct {
    pthread_mutex_t mutex;
    pthread_t owner;
    int owner_priority;
    int blocked_count;
} priority_mutex_t;

void priority_mutex_init(priority_mutex_t *pmutex) {
    pthread_mutex_init(&pmutex->mutex, NULL);
    pmutex->owner = 0;
    pmutex->owner_priority = 0;
    pmutex->blocked_count = 0;
}

void priority_mutex_lock(priority_mutex_t *pmutex, int priority) {
    pthread_mutex_lock(&pmutex->mutex);
    
    if (pmutex->owner == 0) {
        // No owner, acquire mutex
        pmutex->owner = pthread_self();
        pmutex->owner_priority = priority;
        pthread_mutex_unlock(&pmutex->mutex);
    } else {
        // Already owned, block
        pmutex->blocked_count++;
        
        // Priority inheritance: boost owner priority if needed
        if (priority > pmutex->owner_priority) {
            printf("Priority inheritance: boosting owner from %d to %d\n",
                   pmutex->owner_priority, priority);
            // In real implementation: raise pthread priority of owner
            pmutex->owner_priority = priority;
        }
        
        pthread_mutex_unlock(&pmutex->mutex);
        
        // Block until mutex available
        pthread_mutex_lock(&pmutex->mutex);
        
        // We've acquired the mutex
        pmutex->owner = pthread_self();
        pmutex->owner_priority = priority;
        pmutex->blocked_count--;
        pthread_mutex_unlock(&pmutex->mutex);
    }
}

void priority_mutex_unlock(priority_mutex_t *pmutex) {
    pthread_mutex_lock(&pmutex->mutex);
    
    if (pmutex->owner == pthread_self()) {
        pmutex->owner = 0;
        pmutex->owner_priority = 0;
        
        // In real implementation: restore original priority of owner thread
    }
    
    pthread_mutex_unlock(&pmutex->mutex);
}

// Example: Simulating priority inversion scenario
void *low_priority_task(void *arg) {
    priority_mutex_t *mutex = (priority_mutex_t *)arg;
    
    printf("Low priority task: acquiring mutex\n");
    priority_mutex_lock(mutex, LOW_PRIORITY);
    
    // Critical section
    sleep(1);
    
    printf("Low priority task: releasing mutex\n");
    priority_mutex_unlock(mutex);
    
    return NULL;
}

void *high_priority_task(void *arg) {
    priority_mutex_t *mutex = (priority_mutex_t *)arg;
    
    sleep(0.1);  // Let low priority task acquire mutex first
    
    printf("High priority task: acquiring mutex\n");
    priority_mutex_lock(mutex, HIGH_PRIORITY);
    
    printf("High priority task: in critical section\n");
    priority_mutex_unlock(mutex);
    
    return NULL;
}
```

```python
# Earliest Deadline First (EDF) Scheduler
import heapq
from typing import Optional, List, Dict
from dataclasses import dataclass, field
from enum import Enum
import time

class TaskState(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    MISSED_DEADLINE = "missed_deadline"

@dataclass
class RealTimeTask:
    task_id: str
    execution_time: float  # C_i
    period: float          # T_i
    deadline: float        # D_i (relative to release)
    release_time: float    # r_i
    priority: int = 0
    state: TaskState = TaskState.PENDING
    remaining_time: float = 0.0
    start_time: Optional[float] = None
    
    def absolute_deadline(self) -> float:
        return self.release_time + self.deadline
    
    def utilization(self) -> float:
        return self.execution_time / self.period

class EDFScheduler:
    def __init__(self):
        self.ready_queue: List[RealTimeTask] = []
        self.current_task: Optional[RealTimeTask] = None
        self.current_time: float = 0.0
        self.heap: List[tuple] = []  # (deadline, release_time, task)
        self.completed_tasks: List[RealTimeTask] = []
        self.missed_deadlines: List[RealTimeTask] = []
    
    def add_task(self, task: RealTimeTask):
        """Add a task to be scheduled."""
        task.priority = -int(task.absolute_deadline())  # EDF: earlier deadline = higher priority
        task.remaining_time = task.execution_time
        heapq.heappush(self.ready_queue, (task.priority, task.task_id, task))
    
    def schedule(self, max_time: float) -> List[Dict]:
        """Run the scheduler for max_time."""
        schedule_log = []
        
        while self.current_time < max_time:
            # Release new job instances for periodic tasks
            while (self.ready_queue and 
                   self.ready_queue[0][2].release_time <= self.current_time):
                priority, tid, task = heapq.heappop(self.ready_queue)
                if task.remaining_time <= 0:
                    task.remaining_time = task.execution_time
                heapq.heappush(self.heap, (task.absolute_deadline(), task))
            
            # Check for overdue tasks
            overdue = []
            while self.heap and self.heap[0][0] < self.current_time:
                deadline, task = self.heap[0]
                task.state = TaskState.MISSED_DEADLINE
                self.missed_deadlines.append(task)
                heapq.heappop(self.heap)
            
            # Get highest priority (earliest deadline) task
            if self.heap:
                deadline, task = self.heap[0]
                
                # Check deadline before execution
                if self.current_time + task.remaining_time > deadline:
                    task.state = TaskState.MISSED_DEADLINE
                    self.missed_deadlines.append(task)
                    heapq.heappop(self.heap)
                    continue
                
                # Execute task
                self.current_task = task
                task.state = TaskState.RUNNING
                
                time_slice = min(task.remaining_time, 
                                min(t.period for t in self.ready_queue) 
                                if self.ready_queue else 0.1)
                
                self.current_time += time_slice
                task.remaining_time -= time_slice
                
                schedule_log.append({
                    'time': self.current_time - time_slice,
                    'task': task.task_id,
                    'executed': time_slice,
                    'remaining': task.remaining_time
                })
                
                # Check if task completed
                if task.remaining_time <= 0:
                    task.state = TaskState.COMPLETED
                    task.start_time = None
                    self.completed_tasks.append(task)
                    heapq.heappop(self.heap)
                    
                    # Schedule next period
                    next_release = task.release_time + task.period
                    task.release_time = next_release
                    self.add_task(task)
            else:
                # Idle
                if self.ready_queue:
                    next_release = self.ready_queue[0][2].release_time
                    self.current_time = next_release
                else:
                    self.current_time += 0.1
        
        return schedule_log
    
    def schedulability_report(self) -> Dict:
        """Generate schedulability analysis report."""
        return {
            'completed': len(self.completed_tasks),
            'missed_deadlines': len(self.missed_deadlines),
            'missed_list': [t.task_id for t in self.missed_deadlines]
        }

# Usage example
tasks = [
    RealTimeTask("T1", execution_time=3, period=10, deadline=10, release_time=0),
    RealTimeTask("T2", execution_time=2, period=20, deadline=20, release_time=0),
    RealTimeTask("T3", execution_time=5, period=40, deadline=40, release_time=0),
]

scheduler = EDFScheduler()
for task in tasks:
    scheduler.add_task(task)

log = scheduler.schedule(100)
report = scheduler.schedulability_report()

print(f"Completed: {report['completed']}, Missed: {report['missed_deadlines']}")
```

## Best Practices

1. **No Dynamic Memory in Critical Code**: Use memory pools instead of malloc/new
2. **Stack Size Analysis**: Verify stack usage fits within available stack space
3. **Interrupt Latency**: Minimize time spent in interrupt handlers
4. **Watchdog Integration**: Always use hardware watchdogs for safety-critical systems
5. **Separation of Concerns**: Isolate real-time and non-real-time code paths
6. **WCET Analysis**: Use formal methods or measurement-based WCET estimation
7. **Priority Ceilings**: Use priority ceiling protocol to prevent deadlocks
8. **Defensive Timing Checks**: Verify timing constraints at runtime
9. **Traceability**: Maintain requirements-to-code traceability for certification
10. **Clear Timing Budgets**: Document worst-case timing for all code paths
