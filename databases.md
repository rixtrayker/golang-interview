# Databases Questions

## Basic Concepts

### 1. How do you connect to a database in Go?

Database connection in Go:
```go
import (
    "database/sql"
    _ "github.com/lib/pq" // PostgreSQL driver
)

func main() {
    db, err := sql.Open("postgres", "user=postgres dbname=mydb sslmode=disable")
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()
}
```

### 2. How do you prevent SQL injection in Go?

Prevent SQL injection by:
* Using prepared statements
* Using parameterized queries
* Never concatenating user input into SQL queries
* Using ORMs or query builders that use prepared statements

### 3. How do you handle database transactions in Go?

Transactions in Go:
```go
tx, err := db.Begin()
if err != nil {
    log.Fatal(err)
}
defer tx.Rollback() // Rollback if not committed

// Execute queries within transaction
_, err = tx.Exec("INSERT INTO users (name) VALUES ($1)", "John")
if err != nil {
    return err
}

err = tx.Commit()
if err != nil {
    return err
}
```

## Intermediate Concepts

### 4. How do you manage database connections in a Go application?

Connection management:
* Use connection pooling (built into `database/sql`)
* Configure pool settings:
  * `SetMaxOpenConns`
  * `SetMaxIdleConns`
  * `SetConnMaxLifetime`
* Share the `*sql.DB` instance
* Close rows and statements properly

### 5. How do you handle database migrations in Go?

Migration approaches:
* Use migration libraries (e.g., `migrate`, `goose`)
* Maintain SQL scripts
* Use ORM-based migrations
* Implement version control for schema changes

### 6. How do you implement database connection retries and timeouts?

Connection retry and timeout handling:
* Use `context` for timeouts
* Implement exponential backoff
* Handle connection errors gracefully
* Use connection pooling effectively

## Advanced Concepts

### 7. How do you implement database sharding in Go?

Database sharding strategies:
* Horizontal partitioning
* Consistent hashing
* Shard key selection
* Query routing
* Cross-shard transactions

### 8. How do you handle database replication and failover in Go?

Replication and failover:
* Read/write splitting
* Connection pooling with multiple hosts
* Health checks
* Automatic failover
* Consistency guarantees

### 9. How do you implement database caching in Go?

Database caching strategies:
* Query result caching
* Object caching
* Cache invalidation
* Distributed caching
* Cache warming

## Expert Concepts

### 10. How do you implement database connection pooling with custom behavior?

Custom connection pooling:
* Implement custom `sql.DB` wrapper
* Add connection validation
* Implement custom retry logic
* Add metrics and monitoring
* Handle connection lifecycle

### 11. How do you implement database query optimization in Go?

Query optimization:
* Use prepared statements
* Implement query caching
* Use appropriate indexes
* Optimize JOIN operations
* Use EXPLAIN ANALYZE
* Implement query rewriting

### 12. How do you implement database monitoring and observability in Go?

Monitoring and observability:
* Query performance metrics
* Connection pool metrics
* Error tracking
* Slow query logging
* Distributed tracing
* Health checks 