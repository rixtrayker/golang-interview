# Concurrency Questions

## Basic Concepts

### 1. What are goroutines and how do they differ from OS threads?

* **Answer:** Goroutines are lightweight threads managed by the Go runtime, not the operating system. They are much cheaper to create and manage than OS threads because:
    * They use a small, fixed stack size (starting at 2KB, growing as needed)
    * They are multiplexed onto a smaller number of OS threads
    * They use cooperative scheduling (goroutines yield control at specific points)
    * They have fast creation and teardown
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
* **Key Characteristics:**
    * Typed: `chan T` for type `T`
    * Can be buffered or unbuffered
    * Send and receive operations block until the other side is ready
    * Can be closed to signal completion
* **Example:**
    ```go
    func worker(id int, jobs <-chan int, results chan<- int) {
        for j := range jobs {
            fmt.Printf("Worker %d processing job %d\n", id, j)
            time.Sleep(time.Second)
            results <- j * 2
        }
    }
    
    func main() {
        jobs := make(chan int, 100)
        results := make(chan int, 100)
        
        // Start workers
        for w := 1; w <= 3; w++ {
            go worker(w, jobs, results)
        }
        
        // Send jobs
        for j := 1; j <= 5; j++ {
            jobs <- j
        }
        close(jobs)
        
        // Collect results
        for a := 1; a <= 5; a++ {
            <-results
        }
    }
    ```

### 3. What is the difference between buffered and unbuffered channels?

* **Answer:** The key difference is in how they handle send operations:
    * **Unbuffered Channels:**
        * Send blocks until a receiver is ready
        * Receive blocks until a sender is ready
        * Provides strong synchronization
    * **Buffered Channels:**
        * Send blocks only when the buffer is full
        * Receive blocks only when the buffer is empty
        * Provides weaker synchronization but better performance
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
* **Common Uses:**
    * Non-blocking channel operations
    * Timeouts
    * Cancellation
* **Example:**
    ```go
    func main() {
        ch1 := make(chan string)
        ch2 := make(chan string)
        
        go func() {
            time.Sleep(time.Second)
            ch1 <- "one"
        }()
        
        go func() {
            time.Sleep(2 * time.Second)
            ch2 <- "two"
        }()
        
        for i := 0; i < 2; i++ {
            select {
            case msg1 := <-ch1:
                fmt.Println("Received", msg1)
            case msg2 := <-ch2:
                fmt.Println("Received", msg2)
            case <-time.After(3 * time.Second):
                fmt.Println("Timeout")
            }
        }
    }
    ```

### 5. What is the `sync.WaitGroup` and how do you use it?

* **Answer:** `WaitGroup` is used to wait for a collection of goroutines to finish. It maintains a counter that can be incremented, decremented, and waited on.
* **Key Methods:**
    * `Add(delta int)`: Increment counter
    * `Done()`: Decrement counter (same as Add(-1))
    * `Wait()`: Block until counter is zero
* **Example:**
    ```go
    func worker(id int, wg *sync.WaitGroup) {
        defer wg.Done()
        fmt.Printf("Worker %d starting\n", id)
        time.Sleep(time.Second)
        fmt.Printf("Worker %d done\n", id)
    }
    
    func main() {
        var wg sync.WaitGroup
        
        for i := 1; i <= 5; i++ {
            wg.Add(1)
            go worker(i, &wg)
        }
        
        wg.Wait()
        fmt.Println("All workers done")
    }
    ```

### 6. What are mutexes and how do you use them to protect shared resources?

* **Answer:** Mutexes (mutual exclusion locks) are used to protect shared resources from concurrent access. They ensure that only one goroutine can access the resource at a time.
* **Key Methods:**
    * `Lock()`: Acquire the lock
    * `Unlock()`: Release the lock
* **Example:**
    ```go
    type SafeCounter struct {
        mu sync.Mutex
        v  map[string]int
    }
    
    func (c *SafeCounter) Inc(key string) {
        c.mu.Lock()
        c.v[key]++
        c.mu.Unlock()
    }
    
    func (c *SafeCounter) Value(key string) int {
        c.mu.Lock()
        defer c.mu.Unlock()
        return c.v[key]
    }
    
    func main() {
        c := SafeCounter{v: make(map[string]int)}
        for i := 0; i < 1000; i++ {
            go c.Inc("somekey")
        }
        time.Sleep(time.Second)
        fmt.Println(c.Value("somekey"))
    }
    ```

### 7. What is the difference between `sync.Mutex` and `sync.RWMutex`?

* **Answer:** 
    * `sync.Mutex`: Provides exclusive access to a resource
    * `sync.RWMutex`: Provides shared read access and exclusive write access
* **Key Methods:**
    * `RWMutex`:
        * `RLock()`: Acquire read lock
        * `RUnlock()`: Release read lock
        * `Lock()`: Acquire write lock
        * `Unlock()`: Release write lock
* **Example:**
    ```go
    type SafeMap struct {
        mu sync.RWMutex
        m  map[string]string
    }
    
    func (sm *SafeMap) Set(key, value string) {
        sm.mu.Lock()
        sm.m[key] = value
        sm.mu.Unlock()
    }
    
    func (sm *SafeMap) Get(key string) string {
        sm.mu.RLock()
        defer sm.mu.RUnlock()
        return sm.m[key]
    }
    
    func main() {
        sm := SafeMap{m: make(map[string]string)}
        
        // Multiple readers
        for i := 0; i < 10; i++ {
            go func() {
                fmt.Println(sm.Get("key"))
            }()
        }
        
        // Single writer
        sm.Set("key", "value")
        
        time.Sleep(time.Second)
    }
    ```

### 8. How do you implement a worker pool pattern in Go?

* **Answer:** A worker pool is a pattern where a fixed number of worker goroutines process tasks from a queue. It's useful for controlling resource usage and managing concurrent workloads.
* **Key Components:**
    * Task queue (channel)
    * Worker goroutines
    * Results channel
* **Example:**
    ```go
    type Task struct {
        ID   int
        Data string
    }
    
    func worker(id int, tasks <-chan Task, results chan<- int) {
        for task := range tasks {
            fmt.Printf("Worker %d processing task %d: %s\n", id, task.ID, task.Data)
            time.Sleep(time.Second)
            results <- task.ID
        }
    }
    
    func main() {
        numWorkers := 3
        numTasks := 10
        
        tasks := make(chan Task, numTasks)
        results := make(chan int, numTasks)
        
        // Start workers
        for w := 1; w <= numWorkers; w++ {
            go worker(w, tasks, results)
        }
        
        // Send tasks
        for j := 1; j <= numTasks; j++ {
            tasks <- Task{ID: j, Data: fmt.Sprintf("data-%d", j)}
        }
        close(tasks)
        
        // Collect results
        for a := 1; a <= numTasks; a++ {
            <-results
        }
    }
    ```

### 9. What is the `context` package and how do you use it for cancellation and timeouts?

* **Answer:** The `context` package provides a way to carry deadlines, cancellation signals, and other request-scoped values across API boundaries and between processes.
* **Key Functions:**
    * `WithCancel`: Creates a context that can be cancelled
    * `WithTimeout`: Creates a context that cancels after a timeout
    * `WithDeadline`: Creates a context that cancels at a specific time
* **Example:**
    ```go
    func worker(ctx context.Context, id int) {
        for {
            select {
            case <-ctx.Done():
                fmt.Printf("Worker %d cancelled\n", id)
                return
            default:
                fmt.Printf("Worker %d working\n", id)
                time.Sleep(time.Second)
            }
        }
    }
    
    func main() {
        ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
        defer cancel()
        
        for i := 1; i <= 3; i++ {
            go worker(ctx, i)
        }
        
        time.Sleep(5 * time.Second)
    }
    ```

### 10. How do you implement a rate limiter in Go?

* **Answer:** A rate limiter controls how often an operation can be performed. Common implementations use channels or the `time.Ticker` type.
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
    
    func main() {
        limiter := NewRateLimiter(100 * time.Millisecond)
        
        for i := 0; i < 10; i++ {
            limiter.Wait()
            fmt.Printf("Request %d\n", i)
        }
    }
    ```

### 11. How do you implement a semaphore in Go?

* **Answer:** A semaphore controls access to a resource by maintaining a set of permits. In Go, it can be implemented using a buffered channel.
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
    
    func worker(id int, sem *Semaphore) {
        sem.Acquire()
        defer sem.Release()
        
        fmt.Printf("Worker %d acquired semaphore\n", id)
        time.Sleep(time.Second)
        fmt.Printf("Worker %d released semaphore\n", id)
    }
    
    func main() {
        sem := NewSemaphore(3)
        
        for i := 1; i <= 10; i++ {
            go worker(i, sem)
        }
        
        time.Sleep(5 * time.Second)
    }
    ```

### 12. How do you implement a barrier synchronization in Go?

* **Answer:** A barrier is a synchronization point where multiple goroutines must all reach before any of them can proceed. It can be implemented using a combination of `sync.WaitGroup` and channels.
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
    
    func worker(id int, b *Barrier) {
        fmt.Printf("Worker %d starting\n", id)
        time.Sleep(time.Duration(id) * time.Second)
        fmt.Printf("Worker %d reached barrier\n", id)
        b.Wait()
        fmt.Printf("Worker %d continuing\n", id)
    }
    
    func main() {
        b := NewBarrier(3)
        
        for i := 1; i <= 3; i++ {
            go worker(i, b)
        }
        
        b.wg.Wait()
        fmt.Println("All workers completed")
    }
    ```

## Intermediate Concepts

### 4. What is a deadlock and how can you prevent it?

A deadlock is a situation where two or more goroutines are blocked indefinitely, waiting for each other to release a resource or perform an action. Prevention strategies:
* Consistent lock ordering
* Timeouts
* Avoid circular dependencies
* Careful channel design

### 5. What is a race condition and how can you detect it?

A race condition occurs when the behavior of a program depends on the unpredictable order in which multiple goroutines access and modify shared memory. Detection methods:
* Go race detector (`-race` flag)
* Code review
* Testing under load
* Profiling

### 6. How do you handle cancellation and timeouts in concurrent operations?

Cancellation and timeouts are handled using the `context` package:
* Create contexts with deadlines or cancellation
* Pass contexts through your application
* Check `ctx.Done()` in loops
* Use `select` with `ctx.Done()` and other operations

## Advanced Concepts

### 7. Explain the Go scheduler's components: G, M, and P.

* **G (Goroutine):** The fundamental unit of concurrent execution
* **M (Machine):** Represents an OS thread
* **P (Processor):** Represents a logical processor or scheduling context

### 8. What is work stealing in the Go scheduler?

Work stealing is a mechanism where an idle P (Processor) can "steal" half of the runnable goroutines from another P's run queue. This helps balance the load across available processors and prevents goroutine starvation.

### 9. How does the Go scheduler handle blocking system calls?

When a goroutine executes a blocking system call:
1. The M (OS thread) executing that syscall blocks in the kernel
2. The scheduler detaches the P from the blocking M
3. A new M is paired with the now-free P
4. Other goroutines can continue running on the new M
5. When the syscall returns, the original M tries to acquire a free P

## Expert Concepts

### 10. How would you implement a rate limiter for concurrent requests?

A rate limiter can be implemented using:
* Buffered channels to control concurrency
* Token bucket algorithm
* Sliding window counters
* Leaky bucket algorithm

### 11. How do you handle graceful shutdown of goroutines processing tasks?

Graceful shutdown involves:
1. Listening for termination signals
2. Creating a cancellation context
3. Propagating the context to goroutines
4. Using `sync.WaitGroup` to track active goroutines
5. Stopping new task acceptance
6. Waiting for current tasks to complete
7. Closing resources

### 12. What is goroutine starvation and how can it occur?

Goroutine starvation occurs when one or more goroutines are prevented from making progress. Causes include:
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