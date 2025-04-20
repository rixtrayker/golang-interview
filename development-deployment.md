# Development and Deployment Questions

This section covers questions related to Go development workflow, building, deployment, and monitoring practices.

## Development Workflow

### 1. How do you manage dependencies in a Go project using Go modules?

* **Answer:** Go modules provide dependency management through the `go.mod` file. Key commands include:
    * `go mod init` - Initialize a new module
    * `go mod tidy` - Add missing and remove unused dependencies
    * `go mod download` - Download dependencies
    * `go mod vendor` - Create a vendor directory
* **Example:**
    ```bash
    # Initialize a new module
    go mod init github.com/username/project

    # Add a dependency
    go get github.com/gorilla/mux@v1.8.0

    # Update dependencies
    go get -u ./...
    ```
* **Best Practices:**
    - Use semantic versioning
    - Pin specific versions in go.mod
    - Use `go mod tidy` before commits
    - Consider using a vendor directory for reproducible builds

### 2. How do you implement continuous integration for a Go project?

* **Answer:** A typical CI pipeline for Go includes:
    1. Code formatting and linting
    2. Dependency management
    3. Testing
    4. Building
    5. Code coverage
* **Example (GitHub Actions):**
    ```yaml
    name: Go CI

    on: [push, pull_request]

    jobs:
      build:
        runs-on: ubuntu-latest
        steps:
        - uses: actions/checkout@v2

        - name: Set up Go
          uses: actions/setup-go@v2
          with:
            go-version: 1.21

        - name: Install dependencies
          run: go mod download

        - name: Run tests
          run: go test -v ./...

        - name: Check formatting
          run: go fmt ./...

        - name: Run linter
          run: go vet ./...

        - name: Build
          run: go build -v ./...
    ```

### 3. How do you handle code formatting and linting in a Go project?

* **Answer:** Go provides built-in tools and popular third-party tools for code quality:
    * `go fmt` - Standard formatting
    * `go vet` - Static analysis
    * `golangci-lint` - Popular linter aggregator
* **Example (pre-commit hook):**
    ```bash
    #!/bin/sh
    go fmt ./...
    go vet ./...
    golangci-lint run
    ```
* **Best Practices:**
    - Use editor integration for automatic formatting
    - Run linters in CI pipeline
    - Configure linters to match team standards
    - Use consistent formatting rules across the project

## Building and Packaging

### 4. How do you implement cross-compilation in Go?

* **Answer:** Go's cross-compilation is built-in using environment variables:
    * `GOOS` - Target operating system
    * `GOARCH` - Target architecture
* **Example:**
    ```bash
    # Build for Linux
    GOOS=linux GOARCH=amd64 go build -o app-linux-amd64

    # Build for Windows
    GOOS=windows GOARCH=amd64 go build -o app-windows-amd64.exe

    # Build for macOS
    GOOS=darwin GOARCH=amd64 go build -o app-darwin-amd64
    ```
* **Example (Makefile):**
    ```makefile
    build:
        GOOS=linux GOARCH=amd64 go build -o bin/app-linux-amd64
        GOOS=windows GOARCH=amd64 go build -o bin/app-windows-amd64.exe
        GOOS=darwin GOARCH=amd64 go build -o bin/app-darwin-amd64
    ```

### 5. How do you use build tags in Go?

* **Answer:** Build tags control which files are included in a build:
    * Add comments at the top of files: `//go:build tag`
    * Use `-tags` flag when building
* **Example:**
    ```go
    //go:build debug
    // +build debug

    package main

    func init() {
        // Debug-specific initialization
    }
    ```
* **Usage:**
    ```bash
    # Build with debug tag
    go build -tags debug

    # Build with multiple tags
    go build -tags "debug test"
    ```

### 6. How do you optimize Go binaries for production?

* **Answer:** Several techniques can optimize Go binaries:
    * Strip debug information
    * Disable CGO
    * Use upx for compression
    * Set appropriate build flags
* **Example:**
    ```bash
    # Build optimized binary
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o app

    # Compress with upx
    upx --brute app
    ```
* **Best Practices:**
    - Use `-s -w` flags to strip debug info
    - Disable CGO when possible
    - Consider using upx for smaller binaries
    - Test the optimized binary thoroughly

## Deployment Strategies

### 7. How do you implement zero-downtime deployments in Go?

* **Answer:** Zero-downtime deployments can be achieved using:
    * Graceful shutdown
    * Process management
    * Load balancing
* **Example (Graceful Shutdown):**
    ```go
    func main() {
        // Create server
        srv := &http.Server{
            Addr: ":8080",
            Handler: router,
        }

        // Channel to listen for errors
        errChan := make(chan error)

        // Start server
        go func() {
            if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
                errChan <- err
            }
        }()

        // Wait for interrupt signal
        quit := make(chan os.Signal, 1)
        signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

        select {
        case err := <-errChan:
            log.Printf("Server error: %v", err)
        case sig := <-quit:
            log.Printf("Received signal: %v", sig)
            
            // Create shutdown context with timeout
            ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
            defer cancel()
            
            // Attempt graceful shutdown
            if err := srv.Shutdown(ctx); err != nil {
                log.Printf("Server forced to shutdown: %v", err)
            }
        }
    }
    ```

### 8. How do you implement blue-green deployment in Go?

* **Answer:** Blue-green deployment requires:
    * Two identical environments
    * Load balancer configuration
    * Health checks
    * Traffic switching
* **Example (Health Check):**
    ```go
    func healthCheck(w http.ResponseWriter, r *http.Request) {
        // Check database connection
        if err := db.Ping(); err != nil {
            w.WriteHeader(http.StatusServiceUnavailable)
            return
        }

        // Check cache connection
        if err := cache.Ping(); err != nil {
            w.WriteHeader(http.StatusServiceUnavailable)
            return
        }

        w.WriteHeader(http.StatusOK)
    }
    ```

## Monitoring and Observability

### 9. How do you implement structured logging in Go?

* **Answer:** Structured logging can be implemented using packages like `logrus` or `zap`:
* **Example (Using logrus):**
    ```go
    import (
        "github.com/sirupsen/logrus"
    )

    func main() {
        // Configure logger
        log := logrus.New()
        log.SetFormatter(&logrus.JSONFormatter{})

        // Add fields
        log.WithFields(logrus.Fields{
            "user_id": 123,
            "action": "login",
        }).Info("User logged in")

        // Add context
        logger := log.WithFields(logrus.Fields{
            "service": "auth",
            "version": "1.0",
        })

        logger.Info("Service started")
        logger.Error("Failed to connect to database")
    }
    ```

### 10. How do you implement metrics collection in Go?

* **Answer:** Prometheus is a popular choice for metrics collection in Go:
* **Example:**
    ```go
    import (
        "github.com/prometheus/client_golang/prometheus"
        "github.com/prometheus/client_golang/prometheus/promhttp"
    )

    var (
        httpRequestsTotal = prometheus.NewCounterVec(
            prometheus.CounterOpts{
                Name: "http_requests_total",
                Help: "Total number of HTTP requests",
            },
            []string{"method", "path", "status"},
        )
    )

    func init() {
        prometheus.MustRegister(httpRequestsTotal)
    }

    func main() {
        // Start metrics server
        go func() {
            http.Handle("/metrics", promhttp.Handler())
            http.ListenAndServe(":2112", nil)
        }()

        // Record metrics
        http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
            // ... handle request ...

            // Record metric
            httpRequestsTotal.WithLabelValues(
                r.Method,
                r.URL.Path,
                "200",
            ).Inc()
        })
    }
    ```

### 11. How do you implement distributed tracing in Go?

* **Answer:** OpenTelemetry is a popular choice for distributed tracing:
* **Example:**
    ```go
    import (
        "go.opentelemetry.io/otel"
        "go.opentelemetry.io/otel/exporters/jaeger"
        "go.opentelemetry.io/otel/sdk/resource"
        sdktrace "go.opentelemetry.io/otel/sdk/trace"
        semconv "go.opentelemetry.io/otel/semconv/v1.4.0"
    )

    func initTracer() (*sdktrace.TracerProvider, error) {
        // Create Jaeger exporter
        exp, err := jaeger.New(jaeger.WithCollectorEndpoint(
            jaeger.WithEndpoint("http://localhost:14268/api/traces"),
        ))
        if err != nil {
            return nil, err
        }

        // Create tracer provider
        tp := sdktrace.NewTracerProvider(
            sdktrace.WithBatcher(exp),
            sdktrace.WithResource(resource.NewWithAttributes(
                semconv.SchemaURL,
                semconv.ServiceNameKey.String("my-service"),
            )),
        )

        // Set global tracer provider
        otel.SetTracerProvider(tp)

        return tp, nil
    }

    func main() {
        tp, err := initTracer()
        if err != nil {
            log.Fatal(err)
        }
        defer tp.Shutdown(context.Background())

        // Create a span
        tracer := otel.Tracer("my-tracer")
        ctx, span := tracer.Start(context.Background(), "my-operation")
        defer span.End()

        // ... do work ...
    }
    ``` 