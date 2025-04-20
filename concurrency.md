# Concurrency Questions

## Basic Concepts

### 1. What are goroutines and how do they differ from OS threads?

* **Answer:** Goroutines are lightweight threads managed by the Go runtime, not the operating system. They are much cheaper to create and manage than OS threads because:
    * They use a small, fixed stack size (starting at 2KB, growing as needed)
    * They are multiplexed onto a smaller number of OS threads
    * They use cooperative scheduling (goroutines yield control at specific points)
    * They have fast creation and teardown

| Feature | Goroutines | OS Threads |
|---------|------------|------------|
| Creation Cost | ~2KB initial stack | ~1MB stack |
| Scheduling | Cooperative (Go runtime) | Preemptive (OS) |
| Context Switching | Fast (runtime) | Slow (OS) |
| Memory Usage | Low | High |
| Creation Time | Microseconds | Milliseconds |
| Maximum Count | Thousands | Hundreds |

* **Example:**
    ```go
    func main() {
        // Create 1000 goroutines
        for i := 0; i < 1000; i++ {
            go func(id int) {
                fmt.Printf("Goroutine %d running\n", id)
                time.Sleep(time.Second)
                fmt.Printf("Goroutine %d done\n", id)
            }(i)
        }
        
        // Wait for all goroutines to complete
        time.Sleep(2 * time.Second)
    }
    ```

### 2. What are channels and how do they enable communication between goroutines?

* **Answer:** Channels are typed conduits for communication between goroutines. They provide a safe way to send and receive values, ensuring synchronization between goroutines.

| Channel Type | Description | Use Case |
|-------------|-------------|----------|
| Unbuffered | Synchronous communication | Direct goroutine coordination |
| Buffered | Asynchronous communication | Producer-consumer patterns |
| Directional | Send-only or receive-only | API design and safety |
| Closed | Signals completion | Broadcast patterns |

* **Key Characteristics:**
    * Typed: `chan T` for type `T`
    * Can be buffered or unbuffered
    * Send and receive operations block until the other side is ready
    * Can be closed to signal completion

### 3. What is the difference between buffered and unbuffered channels?

* **Answer:** The key difference is in how they handle send operations:

| Feature | Unbuffered Channel | Buffered Channel |
|---------|-------------------|------------------|
| Blocking | Blocks until receiver ready | Blocks only when buffer full |
| Synchronization | Strong | Weak |
| Use Case | Direct coordination | Producer-consumer |
| Performance | Lower throughput | Higher throughput |
| Memory Usage | Minimal | Depends on buffer size |

* **Example:**
    ```go
    func main() {
        // Unbuffered channel
        ch1 := make(chan int)
        go func() {
            ch1 <- 42  // Blocks until receiver is ready
        }()
        fmt.Println(<-ch1)  // Blocks until sender is ready
        
        // Buffered channel
        ch2 := make(chan int, 2)
        ch2 <- 1  // Doesn't block
        ch2 <- 2  // Doesn't block
        // ch2 <- 3  // Would block - buffer full
        fmt.Println(<-ch2)  // 1
        fmt.Println(<-ch2)  // 2
    }
    ```

### 4. How do you use the `select` statement for channel operations?

* **Answer:** The `select` statement lets a goroutine wait on multiple communication operations. It blocks until one of its cases can run, then it executes that case. If multiple cases are ready, it chooses one at random.

| Select Pattern | Description | Use Case |
|---------------|-------------|----------|
| Default Case | Non-blocking operations | Polling |
| Timeout | Operation with deadline | Resource limits |
| Cancellation | Context cancellation | Graceful shutdown |
| Priority | Multiple operations | Event handling |

* **Common Uses:**
    * Non-blocking channel operations
    * Timeouts
    * Cancellation

### 5. What is the `sync.WaitGroup` and how do you use it?

* **Answer:** `WaitGroup` is used to wait for a collection of goroutines to finish. It maintains a counter that can be incremented, decremented, and waited on.

| Method | Description | Thread Safety |
|--------|-------------|---------------|
| Add(delta) | Increment counter | Safe |
| Done() | Decrement counter | Safe |
| Wait() | Block until zero | Safe |

* **Key Methods:**
    * `Add(delta int)`: Increment counter
    * `Done()`: Decrement counter (same as Add(-1))
    * `Wait()`: Block until counter is zero

### 6. What are mutexes and how do you use them to protect shared resources?

* **Answer:** Mutexes (mutual exclusion locks) are used to protect shared resources from concurrent access. They ensure that only one goroutine can access the resource at a time.

| Mutex Type | Description | Use Case |
|------------|-------------|----------|
| sync.Mutex | Basic mutual exclusion | General purpose |
| sync.RWMutex | Read-write lock | Read-heavy workloads |
| sync.Map | Concurrent map | Key-value storage |
| atomic.Value | Atomic operations | Single value updates |

* **Key Methods:**
    * `Lock()`: Acquire the lock
    * `Unlock()`: Release the lock

### 7. What is the difference between `sync.Mutex` and `sync.RWMutex`?

* **Answer:** 
    * `sync.Mutex`: Provides exclusive access to a resource
    * `sync.RWMutex`: Provides shared read access and exclusive write access

| Feature | sync.Mutex | sync.RWMutex |
|---------|------------|--------------|
| Read Access | Exclusive | Shared |
| Write Access | Exclusive | Exclusive |
| Performance | Lower | Higher (read-heavy) |
| Use Case | General purpose | Read-heavy workloads |
| Complexity | Simple | More complex |

* **Key Methods:**
    * `RWMutex`:
        * `RLock()`: Acquire read lock
        * `RUnlock()`: Release read lock
        * `Lock()`: Acquire write lock
        * `Unlock()`: Release write lock

### 8. How do you implement a worker pool pattern in Go?

* **Answer:** A worker pool is a pattern where a fixed number of worker goroutines process tasks from a queue. It's useful for controlling resource usage and managing concurrent workloads.

| Component | Description | Implementation |
|-----------|-------------|----------------|
| Task Queue | Channel for tasks | `chan Task` |
| Workers | Processing goroutines | Fixed number |
| Results | Channel for results | `chan Result` |
| Control | Coordination | `sync.WaitGroup` |

* **Key Components:**
    * Task queue (channel)
    * Worker goroutines
    * Results channel

### 9. What is the `context` package and how do you use it for cancellation and timeouts?

* **Answer:** The `context` package provides a way to carry deadlines, cancellation signals, and other request-scoped values across API boundaries and between processes.

| Context Type | Description | Use Case |
|-------------|-------------|----------|
| Background | Empty context | Root context |
| WithCancel | Cancellation | Manual control |
| WithTimeout | Time-based cancellation | Resource limits |
| WithDeadline | Absolute deadline | Scheduled tasks |
| WithValue | Request-scoped values | Data passing |

* **Key Functions:**
    * `WithCancel`: Creates a context that can be cancelled
    * `WithTimeout`: Creates a context that cancels after a timeout
    * `WithDeadline`: Creates a context that cancels at a specific time

### 10. How do you implement a rate limiter in Go?

* **Answer:** A rate limiter controls how often an operation can be performed. Common implementations use channels or the `time.Ticker` type.

| Rate Limiter Type | Description | Implementation |
|------------------|-------------|----------------|
| Token Bucket | Fixed rate | Channel + Ticker |
| Leaky Bucket | Smooth rate | Channel + Timer |
| Sliding Window | Dynamic rate | Time-based counters |
| Distributed | Cluster-wide | Redis + Lua |

* **Example:**
    ```go
    type RateLimiter struct {
        rate time.Duration
        ch   chan struct{}
    }
    
    func NewRateLimiter(rate time.Duration) *RateLimiter {
        rl := &RateLimiter{
            rate: rate,
            ch:   make(chan struct{}, 1),
        }
        go rl.run()
        return rl
    }
    
    func (rl *RateLimiter) run() {
        ticker := time.NewTicker(rl.rate)
        for range ticker.C {
            select {
            case rl.ch <- struct{}{}:
            default:
            }
        }
    }
    
    func (rl *RateLimiter) Wait() {
        <-rl.ch
    }
    ```

### 11. How do you implement a semaphore in Go?

* **Answer:** A semaphore controls access to a resource by maintaining a set of permits. In Go, it can be implemented using a buffered channel.

| Semaphore Type | Description | Implementation |
|----------------|-------------|----------------|
| Binary | Single permit | `chan struct{}` |
| Counting | Multiple permits | `chan struct{}` |
| Weighted | Variable permits | Custom struct |
| Fair | FIFO ordering | Queue + channel |

* **Example:**
    ```go
    type Semaphore struct {
        ch chan struct{}
    }
    
    func NewSemaphore(n int) *Semaphore {
        return &Semaphore{
            ch: make(chan struct{}, n),
        }
    }
    
    func (s *Semaphore) Acquire() {
        s.ch <- struct{}{}
    }
    
    func (s *Semaphore) Release() {
        <-s.ch
    }
    ```

### 12. How do you implement a barrier synchronization in Go?

* **Answer:** A barrier is a synchronization point where multiple goroutines must all reach before any of them can proceed. It can be implemented using a combination of `sync.WaitGroup` and channels.

| Barrier Type | Description | Implementation |
|--------------|-------------|----------------|
| Simple | Fixed count | `sync.WaitGroup` |
| Reusable | Multiple phases | Channel + counter |
| Dynamic | Variable count | Channel + atomic |
| Timeout | With deadline | Context + channel |

* **Example:**
    ```go
    type Barrier struct {
        n      int
        wg     sync.WaitGroup
        ch     chan struct{}
        mu     sync.Mutex
        count  int
    }
    
    func NewBarrier(n int) *Barrier {
        b := &Barrier{
            n:  n,
            ch: make(chan struct{}),
        }
        b.wg.Add(n)
        return b
    }
    
    func (b *Barrier) Wait() {
        b.mu.Lock()
        b.count++
        if b.count == b.n {
            close(b.ch)
        }
        b.mu.Unlock()
        
        <-b.ch
        b.wg.Done()
    }
    ```

## Intermediate Concepts

### 13. What is a deadlock and how can you prevent it?

* **Answer:** A deadlock is a situation where two or more goroutines are blocked indefinitely, waiting for each other to release a resource or perform an action.

| Deadlock Type | Description | Prevention |
|---------------|-------------|------------|
| Resource | Waiting for resources | Consistent ordering |
| Communication | Channel deadlock | Timeouts |
| Circular | Mutual waiting | Break cycles |
| Livelock | Active but stuck | Backoff |

Prevention strategies:
* Consistent lock ordering
* Timeouts
* Avoid circular dependencies
* Careful channel design

### 14. What is a race condition and how can you detect it?

* **Answer:** A race condition occurs when the behavior of a program depends on the unpredictable order in which multiple goroutines access and modify shared memory.

| Race Type | Description | Detection |
|-----------|-------------|-----------|
| Data Race | Concurrent access | `-race` flag |
| Time Race | Timing dependent | Testing |
| Order Race | Operation order | Code review |
| Memory Race | Memory access | Profiling |

Detection methods:
* Go race detector (`-race` flag)
* Code review
* Testing under load
* Profiling

### 15. How do you handle cancellation and timeouts in concurrent operations?

* **Answer:** Cancellation and timeouts are handled using the `context` package:

| Cancellation Type | Description | Implementation |
|-------------------|-------------|----------------|
| Manual | User-initiated | `context.WithCancel` |
| Timeout | Duration-based | `context.WithTimeout` |
| Deadline | Time-based | `context.WithDeadline` |
| Parent | Child context | `context.WithCancel` |

Cancellation and timeouts are handled using the `context` package:
* Create contexts with deadlines or cancellation
* Pass contexts through your application
* Check `ctx.Done()` in loops
* Use `select` with `ctx.Done()` and other operations

## Advanced Concepts

### 16. Explain the Go scheduler's components: G, M, and P.

* **Answer:** The Go scheduler manages goroutines using three main components:

| Component | Description | Role |
|-----------|-------------|------|
| G (Goroutine) | Lightweight thread | Execution unit |
| M (Machine) | OS thread | Runtime thread |
| P (Processor) | Logical processor | Scheduling context |

* **G (Goroutine):** The fundamental unit of concurrent execution
* **M (Machine):** Represents an OS thread
* **P (Processor):** Represents a logical processor or scheduling context

### 17. What is work stealing in the Go scheduler?

* **Answer:** Work stealing is a mechanism where an idle P (Processor) can "steal" half of the runnable goroutines from another P's run queue.

| Work Stealing Aspect | Description | Benefit |
|----------------------|-------------|---------|
| Load Balancing | Distributes work | Better utilization |
| Goroutine Migration | Moves goroutines | Reduced starvation |
| Queue Management | Handles run queues | Improved scheduling |
| Processor Utilization | Uses idle processors | Higher throughput |

This helps balance the load across available processors and prevents goroutine starvation.

### 18. How does the Go scheduler handle blocking system calls?

* **Answer:** When a goroutine executes a blocking system call:

| System Call Handling | Description | Impact |
|----------------------|-------------|--------|
| Thread Detachment | M detaches from P | Resource management |
| New Thread Creation | New M paired with P | Continuity |
| Goroutine Migration | G moved to new M | Execution |
| Resource Cleanup | Old M cleanup | Efficiency |

When a goroutine executes a blocking system call:
1. The M (OS thread) executing that syscall blocks in the kernel
2. The scheduler detaches the P from the blocking M
3. A new M is paired with the now-free P
4. Other goroutines can continue running on the new M
5. When the syscall returns, the original M tries to acquire a free P

## Expert Concepts

### 19. How would you implement a rate limiter for concurrent requests?

* **Answer:** A rate limiter can be implemented using:

| Rate Limiter Implementation | Description | Use Case |
|----------------------------|-------------|----------|
| Token Bucket | Fixed rate tokens | API limiting |
| Leaky Bucket | Smooth rate | Traffic shaping |
| Sliding Window | Time-based window | Dynamic limits |
| Distributed | Shared state | Cluster-wide |

A rate limiter can be implemented using:
* Buffered channels to control concurrency
* Token bucket algorithm
* Sliding window counters
* Leaky bucket algorithm

### 20. How do you handle graceful shutdown of goroutines processing tasks?

* **Answer:** Graceful shutdown involves:

| Shutdown Component | Description | Implementation |
|-------------------|-------------|----------------|
| Signal Handling | OS signals | `signal.Notify` |
| Context Cancellation | Propagation | `context.WithCancel` |
| Wait Group | Task tracking | `sync.WaitGroup` |
| Resource Cleanup | Finalization | `defer` statements |

Graceful shutdown involves:
1. Listening for termination signals
2. Creating a cancellation context
3. Propagating the context to goroutines
4. Using `sync.WaitGroup` to track active goroutines
5. Stopping new task acceptance
6. Waiting for current tasks to complete
7. Closing resources

### 21. What is goroutine starvation and how can it occur?

* **Answer:** Goroutine starvation occurs when one or more goroutines are prevented from making progress.

| Starvation Cause | Description | Solution |
|------------------|-------------|----------|
| Busy Loops | No yielding | Add yields |
| Lock Contention | Long-held locks | Reduce critical sections |
| Scheduler Issues | Poor scheduling | Work stealing |
| Resource Contention | Shared resources | Better design |

Causes include:
* Busy loops without yielding
* Holding locks for too long
* Scheduler limitations
* Resource contention

Mitigation strategies:
* Avoid busy loops
* Minimize critical sections
* Design for concurrency
* Use non-blocking operations
* Monitor and profile 