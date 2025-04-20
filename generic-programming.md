# Generic Programming in Go

## Basic Concepts

### 1. What are type parameters in Go and how do you use them?

* **Answer:** Type parameters allow functions and types to work with multiple types:
    * Syntax: `func F[T any](t T) T`
    * `any` is a constraint that allows any type
    * Can be used with functions, structs, and interfaces
    * Example:
        ```go
        func Min[T constraints.Ordered](a, b T) T {
            if a < b {
                return a
            }
            return b
        }
        ```

### 2. How do you define and use generic types in Go?

* **Answer:** Generic types are defined using type parameters:
    * Syntax: `type Container[T any] struct { ... }`
    * Can be used with methods
    * Example:
        ```go
        type Stack[T any] struct {
            items []T
        }
        
        func (s *Stack[T]) Push(item T) {
            s.items = append(s.items, item)
        }
        
        func (s *Stack[T]) Pop() T {
            item := s.items[len(s.items)-1]
            s.items = s.items[:len(s.items)-1]
            return item
        }
        ```

### 3. What are type constraints and how do you use them?

* **Answer:** Type constraints limit the types that can be used with generics:
    * Built-in constraints: `any`, `comparable`
    * Custom constraints using interfaces
    * Example:
        ```go
        type Number interface {
            int | float64
        }
        
        func Sum[T Number](numbers []T) T {
            var sum T
            for _, n := range numbers {
                sum += n
            }
            return sum
        }
        ```

## Intermediate Concepts

### 4. How do you implement generic interfaces in Go?

* **Answer:** Generic interfaces allow methods to work with type parameters:
    * Syntax: `type Interface[T any] interface { ... }`
    * Can be used with type assertions
    * Example:
        ```go
        type Container[T any] interface {
            Add(T)
            Get() T
        }
        
        type Box[T any] struct {
            value T
        }
        
        func (b *Box[T]) Add(v T) {
            b.value = v
        }
        
        func (b *Box[T]) Get() T {
            return b.value
        }
        ```

### 5. How do you handle type inference with generics?

* **Answer:** Type inference allows omitting type arguments:
    * Compiler infers types from function arguments
    * Works with function calls and variable declarations
    * Example:
        ```go
        func Print[T any](v T) {
            fmt.Println(v)
        }
        
        func main() {
            Print(42)        // T inferred as int
            Print("hello")   // T inferred as string
        }
        ```

### 6. What are the limitations of Go generics?

* **Answer:** Go generics have several limitations:
    * No operator overloading
    * No method constraints
    * No generic methods
    * No generic type aliases
    * No generic type switches
    * Example of what's not possible:
        ```go
        // Not possible: generic method
        type Container[T any] struct{}
        func (c Container[T]) GenericMethod[U any](u U) {} // Error
        
        // Not possible: operator overloading
        func (c Container[T]) + (other Container[T]) Container[T] {} // Error
        ```

## Advanced Concepts

### 7. How do you implement generic algorithms in Go?

* **Answer:** Generic algorithms can be implemented using type parameters:
    * Example with sorting:
        ```go
        func Sort[T constraints.Ordered](slice []T) {
            sort.Slice(slice, func(i, j int) bool {
                return slice[i] < slice[j]
            })
        }
        
        func main() {
            ints := []int{3, 1, 4, 1, 5, 9}
            Sort(ints)
            
            strings := []string{"banana", "apple", "cherry"}
            Sort(strings)
        }
        ```

### 8. How do you handle generic collections in Go?

* **Answer:** Generic collections can be implemented using type parameters:
    * Example with a generic map:
        ```go
        type Map[K comparable, V any] struct {
            data map[K]V
        }
        
        func NewMap[K comparable, V any]() *Map[K, V] {
            return &Map[K, V]{
                data: make(map[K]V),
            }
        }
        
        func (m *Map[K, V]) Set(key K, value V) {
            m.data[key] = value
        }
        
        func (m *Map[K, V]) Get(key K) (V, bool) {
            v, ok := m.data[key]
            return v, ok
        }
        ```

### 9. How do you implement generic error handling in Go?

* **Answer:** Generic error handling can be implemented using type parameters:
    * Example with a Result type:
        ```go
        type Result[T any] struct {
            value T
            err   error
        }
        
        func (r Result[T]) Unwrap() (T, error) {
            return r.value, r.err
        }
        
        func Map[T, U any](r Result[T], f func(T) U) Result[U] {
            if r.err != nil {
                return Result[U]{err: r.err}
            }
            return Result[U]{value: f(r.value)}
        }
        ```

## Expert Concepts

### 10. How do you implement generic concurrency patterns in Go?

* **Answer:** Generic concurrency patterns can be implemented using type parameters:
    * Example with a generic worker pool:
        ```go
        type WorkerPool[T any] struct {
            tasks chan T
            workers int
        }
        
        func NewWorkerPool[T any](workers int) *WorkerPool[T] {
            return &WorkerPool[T]{
                tasks: make(chan T),
                workers: workers,
            }
        }
        
        func (wp *WorkerPool[T]) Run(process func(T)) {
            for i := 0; i < wp.workers; i++ {
                go func() {
                    for task := range wp.tasks {
                        process(task)
                    }
                }()
            }
        }
        ```

### 11. How do you implement generic middleware in Go?

* **Answer:** Generic middleware can be implemented using type parameters:
    * Example with HTTP middleware:
        ```go
        type Middleware[T any] func(http.Handler) http.Handler
        
        func LoggingMiddleware[T any](logger func(T)) Middleware[T] {
            return func(next http.Handler) http.Handler {
                return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
                    // Log request
                    next.ServeHTTP(w, r)
                    // Log response
                })
            }
        }
        ```

### 12. How do you implement generic dependency injection in Go?

* **Answer:** Generic dependency injection can be implemented using type parameters:
    * Example with a container:
        ```go
        type Container struct {
            services map[reflect.Type]interface{}
        }
        
        func (c *Container) Register[T any](service T) {
            c.services[reflect.TypeOf((*T)(nil)).Elem()] = service
        }
        
        func (c *Container) Resolve[T any]() T {
            t := reflect.TypeOf((*T)(nil)).Elem()
            service, ok := c.services[t]
            if !ok {
                panic("service not found")
            }
            return service.(T)
        }
        