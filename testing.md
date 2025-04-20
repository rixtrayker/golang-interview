# Testing Questions

## Basic Concepts

### 1. What are the basic components of Go's testing package?

* **Answer:** The `testing` package provides:
    * `testing.T` for unit tests
    * `testing.B` for benchmarks
    * `testing.M` for test main
    * Helper functions like `t.Log`, `t.Error`, `t.Fatal`
    * Table-driven test support
    * Test coverage tools

### 2. How do you write a basic unit test in Go?

* **Answer:** Unit tests in Go:
    * Are in files ending with `_test.go`
    * Have functions starting with `Test`
    * Take a `*testing.T` parameter
    * Use `t.Error` or `t.Fatal` to report failures
* **Example:**
    ```go
    func TestAdd(t *testing.T) {
        result := Add(2, 3)
        if result != 5 {
            t.Errorf("Add(2, 3) = %d; want 5", result)
        }
    }
    ```

### 3. What are table-driven tests and why are they useful?

* **Answer:** Table-driven tests use a slice of test cases to run the same test logic with different inputs and expected outputs.
* **Advantages:**
    * Reduces code duplication
    * Makes it easy to add new test cases
    * Provides clear test coverage
    * Makes test failures easier to diagnose
* **Example:**
    ```go
    func TestAdd(t *testing.T) {
        cases := []struct {
            a, b, want int
        }{
            {1, 1, 2},
            {2, 3, 5},
            {0, 0, 0},
            {-1, 1, 0},
        }
        
        for _, tc := range cases {
            got := Add(tc.a, tc.b)
            if got != tc.want {
                t.Errorf("Add(%d, %d) = %d; want %d", tc.a, tc.b, got, tc.want)
            }
        }
    }
    ```

### 4. How do you write benchmarks in Go?

* **Answer:** Benchmarks:
    * Are in files ending with `_test.go`
    * Have functions starting with `Benchmark`
    * Take a `*testing.B` parameter
    * Use `b.N` for iteration count
    * Use `b.ResetTimer()` to exclude setup time
* **Example:**
    ```go
    func BenchmarkAdd(b *testing.B) {
        for i := 0; i < b.N; i++ {
            Add(2, 3)
        }
    }
    ```

### 5. How do you write example tests in Go?

* **Answer:** Example tests:
    * Are in files ending with `_test.go`
    * Have functions starting with `Example`
    * Show up in package documentation
    * Can include `// Output:` comments to verify output
* **Example:**
    ```go
    func ExampleAdd() {
        fmt.Println(Add(2, 3))
        // Output: 5
    }
    ```

### 6. How do you use test coverage in Go?

* **Answer:** Test coverage:
    * Use `go test -cover` for basic coverage
    * Use `go test -coverprofile=coverage.out` to generate coverage profile
    * Use `go tool cover -html=coverage.out` to view coverage in browser
    * Use `go test -covermode=atomic` for concurrent tests
* **Example:**
    ```bash
    go test -coverprofile=coverage.out ./...
    go tool cover -html=coverage.out
    ```

### 7. How do you handle test dependencies in Go?

* **Answer:** Test dependencies:
    * Use interfaces to decouple dependencies
    * Use dependency injection
    * Use test doubles (mocks, stubs, fakes)
    * Use build tags to separate test files
* **Example:**
    ```go
    type Database interface {
        Query(query string) ([]Row, error)
    }
    
    func ProcessData(db Database) error {
        // Use db interface
    }
    
    // Test implementation
    type TestDB struct{}
    func (db *TestDB) Query(query string) ([]Row, error) {
        return []Row{}, nil
    }
    ```

### 8. What is the difference between Mocks, Stubs, and Fakes in Go testing?

* **Answer:** These are all types of test doubles used to replace real dependencies during testing:
    * **Stub:** Provides canned answers to calls made during the test. It doesn't usually respond to anything outside what's programmed for the test. Often used for simple state verification (e.g., returning a specific value or error).
    * **Fake:** Objects that have working implementations, but are simplified versions of the real dependency, often using in-memory data structures instead of external systems. They mimic the real object's behavior but are not suitable for production (e.g., an in-memory database instead of a real SQL database).
    * **Mock:** Objects pre-programmed with expectations which form a specification of the calls they are expected to receive. They verify that the expected interactions occurred (e.g., asserting a specific method was called exactly once with specific arguments). Mocking libraries often help generate these.
* **When to Use:**
    * Use **Stubs** for simple return value control.
    * Use **Fakes** when you need more complex, stateful interactions that mimic the real dependency closely.
    * Use **Mocks** when you need to verify *interactions* between your system under test and its dependencies (behavior verification).
* **Go Context:** Go's interfaces make creating test doubles relatively straightforward. You can often create simple stubs or fakes by manually implementing the required interface. Mocking libraries (like `gomock` or `testify/mock`) can automate mock creation and expectation setting.

## Intermediate Concepts

### 9. How do you test concurrent code in Go?

* **Answer:** Testing concurrent code:
    * Use `-race` flag to detect race conditions
    * Use `sync.WaitGroup` to wait for goroutines
    * Use channels for synchronization
    * Use `testing.T.Parallel()` for parallel tests
* **Example:**
    ```go
    func TestConcurrent(t *testing.T) {
        t.Parallel()
        var wg sync.WaitGroup
        wg.Add(2)
        
        go func() {
            defer wg.Done()
            // Test code
        }()
        
        go func() {
            defer wg.Done()
            // Test code
        }()
        
        wg.Wait()
    }
    ```

### 10. How do you test HTTP handlers in Go?

* **Answer:** Testing HTTP handlers:
    * Use `net/http/httptest` package
    * Create test requests with `httptest.NewRequest`
    * Create test response recorder with `httptest.NewRecorder`
    * Check response status, headers, body
* **Example:**
    ```go
    func TestHandler(t *testing.T) {
        req := httptest.NewRequest("GET", "/", nil)
        w := httptest.NewRecorder()
        
        handler(w, req)
        
        if w.Code != http.StatusOK {
            t.Errorf("got status %d; want %d", w.Code, http.StatusOK)
        }
        
        if w.Body.String() != "expected" {
            t.Errorf("got body %q; want %q", w.Body.String(), "expected")
        }
    }
    ```

### 11. How do you test database code in Go?

* **Answer:** Testing database code:
    * Use test databases or in-memory databases
    * Use transactions for test isolation
    * Clean up test data
    * Use interfaces for database access
* **Example:**
    ```go
    func TestDB(t *testing.T) {
        db, err := sql.Open("sqlite3", ":memory:")
        if err != nil {
            t.Fatal(err)
        }
        defer db.Close()
        
        // Setup test schema
        _, err = db.Exec("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)")
        if err != nil {
            t.Fatal(err)
        }
        
        // Run tests
        // ...
    }
    ```

## Advanced Concepts

### 12. How do you implement custom test helpers in Go?

* **Answer:** Custom test helpers:
    * Use `t.Helper()` to mark helper functions
    * Return errors instead of calling `t.Fatal`
    * Use interfaces for flexibility
    * Document expected behavior
* **Example:**
    ```go
    func assertEqual(t *testing.T, got, want interface{}) {
        t.Helper()
        if got != want {
            t.Errorf("got %v; want %v", got, want)
        }
    }
    ```

### 13. How do you test time-dependent code in Go?

* **Answer:** Testing time-dependent code:
    * Use interfaces for time operations
    * Use test clocks
    * Use `time.After` for timeouts
    * Use `time.Sleep` carefully
* **Example:**
    ```go
    type Clock interface {
        Now() time.Time
        Sleep(d time.Duration)
    }
    
    type realClock struct{}
    func (c *realClock) Now() time.Time { return time.Now() }
    func (c *realClock) Sleep(d time.Duration) { time.Sleep(d) }
    
    type testClock struct {
        now time.Time
    }
    func (c *testClock) Now() time.Time { return c.now }
    func (c *testClock) Sleep(d time.Duration) { c.now = c.now.Add(d) }
    ```

### 14. How do you test error conditions in Go?

* **Answer:** Testing error conditions:
    * Use table-driven tests
    * Test both error and non-error cases
    * Check error messages
    * Use error wrapping
* **Example:**
    ```go
    func TestError(t *testing.T) {
        cases := []struct {
            input string
            want  error
        }{
            {"valid", nil},
            {"", errors.New("empty input")},
        }
        
        for _, tc := range cases {
            err := Process(tc.input)
            if (err == nil) != (tc.want == nil) {
                t.Errorf("Process(%q) error = %v; want %v", tc.input, err, tc.want)
            }
        }
    }
    ```

## Expert Concepts

### 15. How do you implement test fixtures in Go?

* **Answer:** Test fixtures:
    * Use `TestMain` for setup/teardown
    * Use build tags for different environments
    * Use temporary directories
    * Use environment variables
* **Example:**
    ```go
    var db *sql.DB
    
    func TestMain(m *testing.M) {
        // Setup
        var err error
        db, err = sql.Open("sqlite3", ":memory:")
        if err != nil {
            log.Fatal(err)
        }
        
        // Run tests
        code := m.Run()
        
        // Teardown
        db.Close()
        
        os.Exit(code)
    }
    ```

### 16. How do you test network code in Go?

* **Answer:** Testing network code:
    * Use `net.Listen` for test servers
    * Use `net.Dial` for test clients
    * Use `context` for timeouts
    * Use `net.Listener` for port selection
* **Example:**
    ```go
    func TestServer(t *testing.T) {
        l, err := net.Listen("tcp", "localhost:0")
        if err != nil {
            t.Fatal(err)
        }
        defer l.Close()
        
        go func() {
            conn, err := l.Accept()
            if err != nil {
                return
            }
            defer conn.Close()
            // Handle connection
        }()
        
        conn, err := net.Dial("tcp", l.Addr().String())
        if err != nil {
            t.Fatal(err)
        }
        defer conn.Close()
        // Test connection
    }
    ```

### 17. How do you test file operations in Go?

* **Answer:** Testing file operations:
    * Use `ioutil.TempDir` and `ioutil.TempFile`
    * Use `os.RemoveAll` for cleanup
    * Use `os.Chdir` carefully
    * Use file system interfaces
* **Example:**
    ```go
    func TestFile(t *testing.T) {
        dir, err := ioutil.TempDir("", "test")
        if err != nil {
            t.Fatal(err)
        }
        defer os.RemoveAll(dir)
        
        file := filepath.Join(dir, "test.txt")
        if err := ioutil.WriteFile(file, []byte("test"), 0644); err != nil {
            t.Fatal(err)
        }
        
        // Test file operations
    }
    ``` 