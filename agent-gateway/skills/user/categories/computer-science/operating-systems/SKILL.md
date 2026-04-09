---
name: Operating Systems
description: Design and implementation of operating system kernels, process management, memory management, file systems, device drivers, and system-level programming for resource allocation and hardware abstraction
license: MIT
compatibility: universal
audience: Systems Programmers, Kernel Developers, Embedded Engineers
category: Computer Science

---

# Operating Systems

## What I Do

I specialize in the design, implementation, and optimization of operating systems—the fundamental software layer that manages hardware resources and provides services for applications. My expertise spans kernel architecture (monolithic, microkernel, hybrid), process and thread management, virtual memory systems, file systems, device drivers, interrupt handling, and system call interfaces. I work with concurrency patterns, scheduling algorithms, memory protection mechanisms, and kernel synchronization primitives. I develop both traditional general-purpose operating systems and real-time/embedded OS variants, focusing on performance, reliability, and security.

## When to Use Me

- Developing or modifying operating system kernels
- Writing device drivers for new hardware
- Implementing real-time or safety-critical systems
- Optimizing system performance and resource utilization
- Designing embedded systems with custom OS requirements
- Building virtualization layers or hypervisors
- Debugging system-level issues and race conditions
- Implementing secure operating system features

## Core Concepts

1. **Process Management**: Creation, scheduling, termination of processes and threads with various scheduling algorithms
2. **Virtual Memory**: Paging, segmentation, page tables, TLB management, and demand paging strategies
3. **System Calls**: Kernel-user boundary, syscall interfaces, and privilege transitions
4. **File Systems**: Inodes, directories, journaling, caching, and various FS implementations (ext4, NTFS, F2FS)
5. **Kernel Architecture**: Monolithic vs microkernel designs, loadable modules, and kernel space vs user space
6. **Concurrency**: Locks, mutexes, semaphores, condition variables, and lock-free algorithms
7. **Interrupt Handling**: ISR design, deferred processing (tasklets, workqueues), and interrupt nesting
8. **Device Drivers**: Character and block devices, driver models, and hardware abstraction layers
9. **Scheduling**: Preemptive vs cooperative, real-time scheduling (Rate Monotonic, EDF), and load balancing
10. **Memory Protection**: MMU configuration, user/kernel isolation, and address space layout

## Code Examples

```c
// Simple Process Management in Linux
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>
#include <sys/types.h>

pid_t create_child_process(const char *program, char *const argv[]) {
    pid_t pid = fork();
    
    if (pid < 0) {
        perror("fork failed");
        return -1;
    }
    
    if (pid == 0) {
        // Child process
        execvp(program, argv);
        perror("execvp failed");
        exit(EXIT_FAILURE);
    }
    
    // Parent process returns child's PID
    return pid;
}

int wait_for_process(pid_t pid, int *status) {
    int wstatus;
    if (waitpid(pid, &wstatus, 0) == -1) {
        perror("waitpid failed");
        return -1;
    }
    
    if (WIFEXITED(wstatus)) {
        printf("Child exited with status: %d\n", WEXITSTATUS(wstatus));
    } else if (WIFSIGNALED(wstatus)) {
        printf("Child killed by signal: %d\n", WTERMSIG(wstatus));
    }
    
    if (status) *status = wstatus;
    return 0;
}

// Usage example
int main() {
    pid_t pid = create_child_process("/bin/ls", (char *[]){ "ls", "-l", NULL });
    if (pid > 0) {
        wait_for_process(pid, NULL);
    }
    return 0;
}
```

```c
// Thread Synchronization with Mutex and Condition Variable
#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

#define BUFFER_SIZE 10

typedef struct {
    int buffer[BUFFER_SIZE];
    int head;
    int tail;
    int count;
    pthread_mutex_t mutex;
    pthread_cond_t not_full;
    pthread_cond_t not_empty;
} bounded_buffer_t;

int buffer_init(bounded_buffer_t *bb) {
    bb->head = 0;
    bb->tail = 0;
    bb->count = 0;
    
    if (pthread_mutex_init(&bb->mutex, NULL) != 0) return -1;
    if (pthread_cond_init(&bb->not_full, NULL) != 0) return -1;
    if (pthread_cond_init(&bb->not_empty, NULL) != 0) return -1;
    
    return 0;
}

void buffer_destroy(bounded_buffer_t *bb) {
    pthread_mutex_destroy(&bb->mutex);
    pthread_cond_destroy(&bb->not_full);
    pthread_cond_destroy(&bb->not_empty);
}

int buffer_produce(bounded_buffer_t *bb, int item) {
    pthread_mutex_lock(&bb->mutex);
    
    while (bb->count == BUFFER_SIZE) {
        pthread_cond_wait(&bb->not_full, &bb->mutex);
    }
    
    bb->buffer[bb->tail] = item;
    bb->tail = (bb->tail + 1) % BUFFER_SIZE;
    bb->count++;
    
    pthread_cond_signal(&bb->not_empty);
    pthread_mutex_unlock(&bb->mutex);
    
    return 0;
}

int buffer_consume(bounded_buffer_t *bb, int *item) {
    pthread_mutex_lock(&bb->mutex);
    
    while (bb->count == 0) {
        pthread_cond_wait(&bb->not_empty, &bb->mutex);
    }
    
    *item = bb->buffer[bb->head];
    bb->head = (bb->head + 1) % BUFFER_SIZE;
    bb->count--;
    
    pthread_cond_signal(&bb->not_full);
    pthread_mutex_unlock(&bb->mutex);
    
    return 0;
}
```

```c
// Memory-Mapped I/O and Device Driver Skeleton
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/fs.h>
#include <linux/cdev.h>
#include <linux/device.h>
#include <linux/uaccess.h>
#include <linux/mm.h>

#define DEVICE_NAME "mychar"
#define CLASS_NAME "mychar_class"

static int major_number;
static struct class *device_class;
static struct device *device_node;
static dev_t dev_num;

static int device_open(struct inode *inode, struct file *file) {
    pr_info("mychar: device opened\n");
    return 0;
}

static int device_release(struct inode *inode, struct file *file) {
    pr_info("mychar: device closed\n");
    return 0;
}

static ssize_t device_read(struct file *file, char __user *buf, 
                           size_t len, loff_t *offset) {
    char message[] = "Hello from kernel!\n";
    size_t msg_len = strlen(message);
    
    if (*offset >= msg_len) return 0;
    
    if (len > msg_len - *offset) len = msg_len - *offset;
    
    if (copy_to_user(buf, message + *offset, len)) return -EFAULT;
    
    *offset += len;
    return len;
}

static ssize_t device_write(struct file *file, const char __user *buf,
                            size_t len, loff_t *offset) {
    char kbuf[256];
    
    if (len > sizeof(kbuf) - 1) len = sizeof(kbuf) - 1;
    
    if (copy_from_user(kbuf, buf, len)) return -EFAULT;
    
    kbuf[len] = '\0';
    pr_info("mychar: received %zu bytes: %s\n", len, kbuf);
    
    return len;
}

static struct file_operations fops = {
    .owner = THIS_MODULE,
    .open = device_open,
    .release = device_release,
    .read = device_read,
    .write = device_write,
};

static int __init mychar_init(void) {
    if (alloc_chrdev_region(&dev_num, 0, 1, DEVICE_NAME) < 0) {
        pr_err("Failed to allocate major number\n");
        return -1;
    }
    
    major_number = MAJOR(dev_num);
    
    cdev_init(&fops.cdev, &fops);
    fops.cdev.owner = THIS_MODULE;
    
    if (cdev_add(&fops.cdev, dev_num, 1) < 0) {
        pr_err("Failed to add cdev\n");
        unregister_chrdev_region(dev_num, 1);
        return -1;
    }
    
    device_class = class_create(CLASS_NAME);
    device_node = device_create(device_class, NULL, dev_num, NULL, DEVICE_NAME);
    
    pr_info("mychar: registered with major number %d\n", major_number);
    return 0;
}

static void __exit mychar_exit(void) {
    device_destroy(device_class, dev_num);
    class_destroy(device_class);
    cdev_del(&fops.cdev);
    unregister_chrdev_region(dev_num, 1);
    pr_info("mychar: unregistered\n");
}

module_init(mychar_init);
module_exit(mychar_exit);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Example");
MODULE_DESCRIPTION("Simple character device driver");
```

```python
# Virtual Memory Page Table Simulation
class PageTable:
    def __init__(self, num_levels=2, page_size=4096, va_bits=32):
        self.num_levels = num_levels
        self.page_size = page_size
        self.offset_bits = (page_size - 1).bit_length()
        self.va_bits = va_bits
        self.pte_size = 8  # 64-bit PTE
        self.tables = [{} for _ in range(num_levels)]
    
    def _extract_vpn(self, virtual_addr):
        """Extract virtual page number from virtual address."""
        vpn = virtual_addr >> self.offset_bits
        vpn_bits = self.va_bits - self.offset_bits
        level_bits = vpn_bits // self.num_levels
        
        levels = []
        for i in range(self.num_levels):
            mask = (1 << level_bits) - 1
            level_vpn = vpn & mask
            levels.append(level_vpn)
            vpn >>= level_bits
        
        return levels
    
    def translate(self, virtual_addr):
        """Translate virtual address to physical address."""
        levels = self._extract_vpn(virtual_addr)
        current_table = self.tables[0]
        
        for level, vpn in enumerate(levels):
            if vpn not in current_table:
                return None  # Page fault
            
            pte = current_table[vpn]
            if not pte['present']:
                return None  # Page fault
            
            if level < self.num_levels - 1:
                # Walk to next level
                next_table_addr = pte['frame'] * self.page_size
                current_table = self.tables[level + 1]
            else:
                # Leaf PTE - compute physical address
                offset = virtual_addr & ((1 << self.offset_bits) - 1)
                physical_addr = (pte['frame'] << self.offset_bits) | offset
                return physical_addr
        
        return None
    
    def map_page(self, virtual_addr, physical_addr, flags=None):
        """Create or update a page table entry."""
        levels = self._extract_vpn(virtual_addr)
        current_table = self.tables[0]
        
        for level, vpn in enumerate(levels):
            if vpn not in current_table:
                if level < self.num_levels - 1:
                    # Create intermediate table
                    new_frame = self._allocate_frame()
                    current_table[vpn] = {'present': True, 'frame': new_frame >> self.offset_bits}
                    current_table = self.tables[level + 1]
                else:
                    current_table[vpn] = {'present': True}
            elif level < self.num_levels - 1:
                next_table_addr = current_table[vpn]['frame'] << self.offset_bits
                current_table = self.tables[level + 1]
        
        # Set frame number and flags at leaf
        pte = current_table[levels[-1]]
        pte['frame'] = physical_addr >> self.offset_bits
        pte['present'] = True
        pte['writable'] = flags.get('writable', True) if flags else True
        pte['executable'] = flags.get('executable', True) if flags else True
    
    def _allocate_frame(self):
        """Allocate a physical frame (simplified)."""
        import random
        return random.randint(0, 1023) * self.page_size

# Usage example
pt = PageTable(num_levels=2, page_size=4096, va_bits=32)
pt.map_page(0x1000, 0x50000)
pt.map_page(0x2000, 0x60000)
physical = pt.translate(0x1000 + 100)
print(f"Virtual 0x1000 + 100 -> Physical 0x{physical:x}")
```

```c
// Scheduler Implementation - Round Robin
#include <linux/sched.h>
#include <linux/list.h>
#include <linux/slab.h>

#define TIME_SLICE (HZ / 100)  // 10ms time slice

struct my_scheduler_data {
    struct list_head runqueue;
    struct task_struct *current;
    unsigned long nr_running;
};

int my_scheduler_init(void) {
    struct my_scheduler_data *data = kmalloc(sizeof(*data), GFP_KERNEL);
    INIT_LIST_HEAD(&data->runqueue);
    data->nr_running = 0;
    return 0;
}

void my_scheduler_tick(struct task_struct *task) {
    if (--task->time_slice == 0) {
        task->time_slice = TIME_SLICE;
        set_tsk_need_resched(task);
    }
}

void my_scheduler_enqueue(struct task_struct *task) {
    struct my_scheduler_data *data = &task->cpu_sched_data;
    list_add_tail(&task->run_list, &data->runqueue);
    data->nr_running++;
}

void my_scheduler_dequeue(struct task_struct *task) {
    struct my_scheduler_data *data = &task->cpu_sched_data;
    list_del_init(&task->run_list);
    data->nr_running--;
}

struct task_struct *my_scheduler_pick_next(struct task_struct *prev) {
    struct my_scheduler_data *data = &prev->cpu_sched_data;
    
    if (list_empty(&data->runqueue)) return NULL;
    
    struct task_struct *next = list_first_entry(&data->runqueue, 
                                                  struct task_struct, run_list);
    return next;
}

void my_scheduler_switch(struct task_struct *prev, struct task_struct *next) {
    my_scheduler_dequeue(prev);
    my_scheduler_enqueue(next);
}
```

## Best Practices

1. **Minimal Kernel Space**: Keep kernel code small and well-contained to reduce attack surface
2. **Defensive Programming**: Validate all inputs, check return values, handle edge cases
3. **Proper Locking**: Use fine-grained locks and avoid nested locking to prevent deadlocks
4. **Lock-Free Where Possible**: Design lock-free data structures for hot paths
5. **Interrupt Context Safety**: Never sleep or block in interrupt context handlers
6. **Memory Allocation**: Use appropriate allocation functions (GFP_KERNEL vs GFP_ATOMIC)
7. **Error Handling**: Clean up resources properly on failure paths
8. **Code Review**: Kernel code requires thorough review due to system-wide impact
9. **Testing**: Use kmemleak, kmemleak, lockdep, and other kernel debugging tools
10. **Documentation**: Document design decisions, assumptions, and interface contracts
