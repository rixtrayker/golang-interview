# Testing Questions

## Basic Concepts

### 1. What are the basic components of Go's testing package?

* **Answer:** The `testing` package provides:

| Component | Description | Use Case |
|-----------|-------------|----------|
| testing.T | Unit test runner | Basic testing |
| testing.B | Benchmark runner | Performance testing |
| testing.M | Test main | Setup/teardown |
| Helper functions | Logging, errors | Test output |
| Table-driven tests | Multiple cases | Data-driven testing |
| Coverage tools | Code coverage | Quality metrics |

* **Key Features:**
    * `testing.T` for unit tests
    * `testing.B` for benchmarks
    * `testing.M` for test main
    * Helper functions like `t.Log`, `t.Error`, `t.Fatal`
    * Table-driven test support
    * Test coverage tools

### 2. How do you write a basic unit test in Go?

* **Answer:** Unit tests in Go follow specific conventions:

| Convention | Description | Example |
|------------|-------------|---------|
| File naming | `_test.go` suffix | `math_test.go` |
| Function naming | `Test` prefix | `TestAdd` |
| Parameters | `*testing.T` | `func TestAdd(t *testing.T)` |
| Error reporting | `t.Error`, `t.Fatal` | `t.Errorf("got %v, want %v", got, want)` |
| Testing package | `testing` | `import "testing"` |

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

| Aspect | Description | Benefit |
|--------|-------------|---------|
| Code reuse | Single test function | DRY principle |
| Test coverage | Multiple cases | Better coverage |
| Maintenance | Centralized cases | Easy updates |
| Readability | Clear structure | Self-documenting |
| Error diagnosis | Specific cases | Easy debugging |

* **Advantages:**
    * Reduces code duplication
    * Makes it easy to add new test cases
    * Provides clear test coverage
    * Makes test failures easier to diagnose

### 4. How do you write benchmarks in Go?

* **Answer:** Benchmarks follow specific patterns:

| Pattern | Description | Example |
|---------|-------------|---------|
| Function naming | `Benchmark` prefix | `BenchmarkAdd` |
| Parameters | `*testing.B` | `func BenchmarkAdd(b *testing.B)` |
| Iteration count | `b.N` | `for i := 0; i < b.N; i++` |
| Timer control | `b.ResetTimer()` | Exclude setup time |
| Memory allocation | `b.ReportAllocs()` | Track allocations |

* **Example:**
    ```go
    func BenchmarkAdd(b *testing.B) {
        for i := 0; i < b.N; i++ {
            Add(2, 3)
        }
    }
    ```

### 5. How do you write example tests in Go?

* **Answer:** Example tests serve as documentation and verification:

| Feature | Description | Example |
|---------|-------------|---------|
| Function naming | `Example` prefix | `ExampleAdd` |
| Output comments | `// Output:` | `// Output: 5` |
| Documentation | Shows in godoc | Public examples |
| Verification | Checks output | Ensures accuracy |
| Package examples | `Example` | Package-level |

* **Example:**
    ```go
    func ExampleAdd() {
        fmt.Println(Add(2, 3))
        // Output: 5
    }
    ```

### 6. How do you use test coverage in Go?

* **Answer:** Test coverage tools provide insights into code testing:

| Tool | Description | Command |
|------|-------------|---------|
| Basic coverage | Simple coverage | `go test -cover` |
| Coverage profile | Detailed data | `go test -coverprofile=coverage.out` |
| HTML report | Visual coverage | `go tool cover -html=coverage.out` |
| Atomic coverage | Concurrent tests | `go test -covermode=atomic` |
| Coverage threshold | Minimum coverage | Custom script |

* **Example:**
    ```bash
    go test -coverprofile=coverage.out ./...
    go tool cover -html=coverage.out
    ```

### 7. How do you handle test dependencies in Go?

* **Answer:** Test dependencies require careful management:

| Approach | Description | Use Case |
|----------|-------------|----------|
| Interfaces | Decoupling | Dependency injection |
| Test doubles | Mocks, stubs | Isolated testing |
| Build tags | Conditional compilation | Test-specific code |
| Test helpers | Common setup | Code reuse |
| Test fixtures | Test data | Consistent state |

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

| Type | Description | Use Case |
|------|-------------|----------|
| Stub | Canned answers | Simple returns |
| Fake | Working implementation | Complex behavior |
| Mock | Expectation verification | Interaction testing |
| Spy | Recorded calls | Call verification |
| Dummy | Placeholder | Required parameter |

* **When to Use:**
    * Use **Stubs** for simple return value control
    * Use **Fakes** when you need more complex, stateful interactions
    * Use **Mocks** when you need to verify interactions
    * Use **Spies** to record and verify method calls
    * Use **Dummies** for required parameters you don't care about

## Intermediate Concepts

### 9. How do you test concurrent code in Go?

* **Answer:** Testing concurrent code requires special considerations:

| Technique | Description | Use Case |
|-----------|-------------|----------|
| Race detection | `-race` flag | Data races |
| Wait groups | Synchronization | Goroutine completion |
| Channels | Communication | Message passing |
| Parallel tests | `t.Parallel()` | Concurrent tests |
| Timeouts | Context | Deadlock prevention |

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

* **Answer:** HTTP handler testing requires specific tools:

| Tool | Description | Use Case |
|------|-------------|----------|
| httptest | Test requests | Handler testing |
| ResponseRecorder | Capture output | Response testing |
| TestServer | Real server | Integration testing |
| Client | HTTP client | API testing |
| Middleware | Request/response | Filter testing |

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

* **Answer:** Database testing requires isolation and control:

| Approach | Description | Use Case |
|----------|-------------|----------|
| In-memory DB | SQLite | Fast tests |
| Test containers | Docker | Real DB testing |
| Transactions | Rollback | Clean state |
| Mock DB | Interface | Controlled behavior |
| Fixtures | Test data | Known state |

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

* **Answer:** Custom test helpers improve test organization:

| Helper Type | Description | Use Case |
|-------------|-------------|----------|
| Setup/teardown | Environment | Test preparation |
| Assertions | Common checks | Test validation |
| Fixtures | Test data | State management |
| Mocks | Test doubles | Dependency control |
| Utilities | Common code | Code reuse |

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

* **Answer:** Time-dependent code requires special testing approaches:

| Approach | Description | Use Case |
|----------|-------------|----------|
| Interface | Time abstraction | Controlled time |
| Test clock | Mock time | Time manipulation |
| Timeouts | Context | Deadline testing |
| Sleep | Delays | Timing tests |
| Ticker | Periodic events | Interval testing |

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

* **Answer:** Error testing requires comprehensive coverage:

| Approach | Description | Use Case |
|----------|-------------|----------|
| Table tests | Multiple cases | Error scenarios |
| Error wrapping | Context | Error chains |
| Error types | Custom errors | Specific handling |
| Panic recovery | Exception handling | Crash prevention |
| Error messages | Validation | User feedback |

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

* **Answer:** Test fixtures provide consistent test environments:

| Fixture Type | Description | Use Case |
|--------------|-------------|----------|
| TestMain | Global setup | Package-level |
| Build tags | Conditional code | Environment-specific |
| Temp directories | File system | File operations |
| Environment vars | Configuration | Runtime settings |
| Database state | Data setup | DB testing |

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

* **Answer:** Network testing requires careful setup:

| Approach | Description | Use Case |
|----------|-------------|----------|
| Test server | Local server | Service testing |
| Test client | HTTP client | Client testing |
| Timeouts | Context | Network delays |
| Port selection | Dynamic ports | Conflict avoidance |
| Protocol testing | Custom protocols | Network protocols |

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

* **Answer:** File testing requires temporary resources:

| Approach | Description | Use Case |
|----------|-------------|----------|
| Temp files | Temporary storage | File operations |
| Temp directories | Workspace | Directory operations |
| Cleanup | Resource management | Memory safety |
| File system | Interface | Mock filesystem |
| Permissions | Access control | Security testing |

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