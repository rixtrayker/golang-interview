# Tricky Go Code Questions

## Basic Concepts

### 1. What are common pitfalls with nil interfaces in Go?

* **Answer:** Nil interfaces can be tricky because they have two components:
    * A type component
    * A value component
    * Common pitfalls:
        ```go
        var i interface{}  // i is nil
        var s *string      // s is nil
        i = s             // i is not nil! (type: *string, value: nil)
        
        if i != nil {
            // This will execute!
        }
        ```
    * Best practice: Always check both components:
        ```go
        if i == nil || reflect.ValueOf(i).IsNil() {
            // Truly nil
        }
        ```

### 2. How can you accidentally create memory leaks with goroutines?

* **Answer:** Common goroutine leak scenarios:
    * Unbuffered channels with no receiver:
        ```go
        func leak() {
            ch := make(chan int)
            go func() {
                ch <- 42  // Blocked forever
            }()
            // Forgot to receive from ch
        }
        ```
    * Blocked goroutines in select:
        ```go
        func leak() {
            ch := make(chan int)
            go func() {
                select {
                case <-ch:  // Blocked forever
                }
            }()
        }
        ```
    * Prevention:
        * Use context for cancellation
        * Add timeouts
        * Use buffered channels appropriately
        * Track goroutine lifecycle

### 3. What are common mistakes with slice operations?

* **Answer:** Common slice pitfalls:
    * Appending to shared slices:
        ```go
        func main() {
            s1 := []int{1, 2, 3}
            s2 := s1[:2]  // Shares underlying array
            s2 = append(s2, 4)
            fmt.Println(s1)  // [1 2 4] - s1 changed!
        }
        ```
    * Capacity surprises:
        ```go
        s := make([]int, 0, 5)
        s = s[:5]  // Length is now 5, filled with zeros
        ```
    * Best practices:
        * Copy slices when needed
        * Be explicit about capacity
        * Use append carefully
        * Understand underlying array sharing

## Intermediate Concepts

### 4. How can defer statements cause unexpected behavior?

* **Answer:** Defer pitfalls:
    * Argument evaluation:
        ```go
        func main() {
            i := 0
            defer fmt.Println(i)  // Prints 0, not 1
            i++
        }
        ```
    * Loop variables:
        ```go
        func main() {
            for i := 0; i < 3; i++ {
                defer fmt.Println(i)  // Prints 2, 1, 0
            }
        }
        ```
    * Resource cleanup:
        ```go
        func process() error {
            f, err := os.Open("file")
            if err != nil {
                return err  // File not closed!
            }
            defer f.Close()
            // Process file
            return nil
        }
        ```

### 5. What are common race conditions in Go code?

* **Answer:** Common race scenarios:
    * Map access:
        ```go
        m := make(map[string]int)
        go func() {
            m["key"] = 1  // Race!
        }()
        go func() {
            m["key"] = 2  // Race!
        }()
        ```
    * Slice append:
        ```go
        s := make([]int, 0)
        go func() {
            s = append(s, 1)  // Race!
        }()
        go func() {
            s = append(s, 2)  // Race!
        }()
        ```
    * Prevention:
        * Use mutexes
        * Use channels
        * Use atomic operations
        * Use sync.Map for concurrent map access

### 6. How can error handling become problematic?

* **Answer:** Error handling pitfalls:
    * Error shadowing:
        ```go
        func process() error {
            err := doSomething()
            if err != nil {
                err := handleError()  // Shadows outer err
                if err != nil {
                    return err  // Returns wrong error
                }
            }
            return err
        }
        ```
    * Nil error interfaces:
        ```go
        func returnsError() error {
            var p *MyError = nil
            return p  // Not nil!
        }
        ```
    * Best practices:
        * Use named return values
        * Wrap errors with context
        * Check error types carefully
        * Use error variables consistently

## Advanced Concepts

### 7. How can channel operations become deadlocked?

* **Answer:** Common deadlock scenarios:
    * Unbuffered channel with no receiver:
        ```go
        ch := make(chan int)
        ch <- 42  // Deadlock!
        ```
    * Circular channel dependencies:
        ```go
        func main() {
            ch1 := make(chan int)
            ch2 := make(chan int)
            go func() {
                <-ch1
                ch2 <- 1
            }()
            go func() {
                <-ch2
                ch1 <- 1
            }()
            // Both goroutines blocked
        }
        ```
    * Prevention:
        * Use select with default cases
        * Add timeouts
        * Use buffered channels appropriately
        * Design channel patterns carefully

### 8. What are common performance traps in Go?

* **Answer:** Performance pitfalls:
    * String concatenation in loops:
        ```go
        var s string
        for i := 0; i < 1000; i++ {
            s += "a"  // Creates new string each time
        }
        ```
    * Unnecessary allocations:
        ```go
        func process(s []byte) {
            str := string(s)  // Unnecessary allocation
            // Use str
        }
        ```
    * Best practices:
        * Use strings.Builder
        * Pre-allocate slices
        * Avoid unnecessary conversions
        * Use sync.Pool for object reuse

### 9. How can reflection cause runtime panics?

* **Answer:** Reflection pitfalls:
    * Type assertions:
        ```go
        var i interface{} = 42
        s := i.(string)  // Panic!
        ```
    * Invalid value access:
        ```go
        var i int
        v := reflect.ValueOf(i)
        v.SetInt(42)  // Panic! Can't set unaddressable value
        ```
    * Best practices:
        * Use type switches
        * Check types before conversion
        * Use Value.CanSet()
        * Handle panics gracefully

## Expert Concepts

### 10. How can cgo cause memory management issues?

* **Answer:** CGO pitfalls:
    * Memory leaks:
        ```go
        // #include <stdlib.h>
        import "C"
        
        func leak() {
            p := C.malloc(100)
            // Forgot to free!
        }
        ```
    * Go pointer rules:
        ```go
        // #include <stdlib.h>
        import "C"
        
        func invalid() {
            s := "hello"
            C.processString(&s)  // Invalid! Can't pass Go pointer to C
        }
        ```
    * Best practices:
        * Use defer C.free()
        * Follow Go pointer rules
        * Use C.CString carefully
        * Handle memory explicitly

### 11. How can interface type assertions become problematic?

* **Answer:** Type assertion pitfalls:
    * Nil interface assertions:
        ```go
        var i interface{} = nil
        s := i.(string)  // Panic!
        ```
    * Interface method sets:
        ```go
        type Reader interface {
            Read([]byte) (int, error)
        }
        
        type MyReader struct{}
        
        func (r *MyReader) Read(p []byte) (int, error) {
            return 0, nil
        }
        
        var r Reader = MyReader{}  // Error! Need pointer receiver
        ```
    * Best practices:
        * Use type switches
        * Check ok value
        * Understand method sets
        * Handle nil cases

### 12. How can context usage become problematic?

* **Answer:** Context pitfalls:
    * Context cancellation:
        ```go
        func process(ctx context.Context) error {
            ch := make(chan int)
            go func() {
                ch <- doWork()  // Might block after ctx.Done()
            }()
            select {
            case <-ctx.Done():
                return ctx.Err()
            case result := <-ch:
                return nil
            }
        }
        ```
    * Context propagation:
        ```go
        func handler(w http.ResponseWriter, r *http.Request) {
            ctx := r.Context()
            go process(ctx)  // Context might be cancelled
        }
        ```
    * Best practices:
        * Check ctx.Done() in loops
        * Propagate contexts properly
        * Handle cancellation gracefully
        * Use context.WithTimeout 

### Comparison Table: Common Pitfalls Across Languages

| Pitfall | Go | Java | Python | JavaScript |
|---------|----|------|--------|------------|
| Nil/Null Handling | Interface nil | NullPointerException | NoneType | undefined/null |
| Memory Leaks | Goroutine leaks | Thread leaks | Reference cycles | Closure leaks |
| Concurrency Issues | Race conditions | Deadlocks | GIL limitations | Callback hell |
| Type System | Interface nil | Null safety | Dynamic typing | Type coercion |
| Error Handling | Panic/recover | Exceptions | Exceptions | Try/catch |
| Memory Management | GC pauses | GC pauses | Reference counting | GC pauses |
| Scope Issues | Closure variables | Lambda capture | Global scope | Hoisting |
| Type Conversion | Interface assertion | Casting | Dynamic | Type coercion |
| Resource Cleanup | defer | try-with-resources | context managers | finally |
| Concurrency Primitives | Channels | Locks | Async/await | Promises |

### Comparison Questions

1. How does Go's interface nil behavior compare to null handling in other languages?
2. What are the advantages and disadvantages of Go's goroutine leaks compared to thread leaks in Java?
3. Compare Go's race conditions with Python's GIL limitations in terms of debugging difficulty.
4. How does Go's type system help prevent common pitfalls compared to dynamically typed languages?
5. What are the trade-offs between Go's panic/recover and exception-based error handling?
6. Compare Go's memory management pitfalls with manual memory management in C++.
7. How does Go's closure behavior compare to JavaScript's closure-related issues?
8. What are the advantages and disadvantages of Go's resource cleanup (defer) compared to other languages' approaches? 