# Redis Questions

This section covers questions related to using Redis as a cache, message broker, or data store within Go applications. Examples often use the `go-redis/redis` client library.

## Basic Concepts

### 1. How do you connect to a Redis instance from a Go application?

* **Answer:** You typically use a Redis client library for Go, such as `go-redis/redis`. You create a client instance by providing connection options (address, password, database number).
* **Example (`go-redis/redis`):**
    ```go
    package main

    import (
        "context"
        "fmt"
        "log"

        "github.com/go-redis/redis/v8"
    )

    var ctx = context.Background()

    func main() {
        rdb := redis.NewClient(&redis.Options{
            Addr:     "localhost:6379", // Redis server address
            Password: "",               // No password set
            DB:       0,                // Use default DB
        })

        // Ping the server to check the connection
        pong, err := rdb.Ping(ctx).Result()
        if err != nil {
            log.Fatalf("Could not connect to Redis: %v", err)
        }
        fmt.Println("Connected to Redis:", pong)

        // Example usage (Set/Get)
        err = rdb.Set(ctx, "mykey", "myvalue", 0).Err()
        if err != nil {
            log.Printf("Failed to set key: %v", err)
        }

        val, err := rdb.Get(ctx, "mykey").Result()
        if err == redis.Nil {
            fmt.Println("mykey does not exist")
        } else if err != nil {
            log.Printf("Failed to get key: %v", err)
        } else {
            fmt.Println("mykey:", val)
        }
    }
    ```

### 2. What are some common Redis commands you might use in a Go backend (e.g., for caching)?

* **Answer:** Common commands include:
    * `SET key value [EX seconds]`: Set a key with an optional expiration time.
    * `GET key`: Retrieve the value of a key.
    * `DEL key [key ...]`: Delete one or more keys.
    * `EXPIRE key seconds`: Set an expiration time on a key.
    * `TTL key`: Get the remaining time to live for a key.
    * `INCR key` / `DECR key`: Increment/decrement an integer value.
    * `EXISTS key [key ...]`: Check if one or more keys exist.
    * `KEYS pattern`: Find keys matching a pattern (use with caution in production).
    * `FLUSHDB` / `FLUSHALL`: Remove keys from the current DB or all DBs (use with extreme caution).

### 3. Why is connection pooling important when interacting with Redis from a high-concurrency Go application?

* **Answer:** Establishing a TCP connection can be relatively slow. Connection pooling maintains a pool of ready-to-use Redis connections. When your application needs to interact with Redis, it borrows a connection from the pool and returns it when done. This avoids the overhead of creating and tearing down connections for every command, significantly improving performance and reducing latency in high-concurrency applications. Most Go Redis client libraries handle connection pooling automatically. You usually configure pool parameters like max size, idle connections, and timeouts.

### 4. How do you handle Redis key expiration and TTL in Go applications?

* **Answer:** Redis provides several ways to handle key expiration:
    * **Setting Expiration:**
        ```go
        // Set key with expiration in seconds
        err := rdb.Set(ctx, "key", "value", 10*time.Second).Err()
        
        // Set expiration on existing key
        err := rdb.Expire(ctx, "key", 10*time.Second).Err()
        
        // Set expiration at specific time
        err := rdb.ExpireAt(ctx, "key", time.Now().Add(10*time.Second)).Err()
        ```
    * **Checking TTL:**
        ```go
        // Get remaining time to live
        ttl, err := rdb.TTL(ctx, "key").Result()
        if err != nil {
            log.Printf("Error getting TTL: %v", err)
        }
        if ttl < 0 {
            if ttl == -1 {
                fmt.Println("Key exists but has no expiration")
            } else if ttl == -2 {
                fmt.Println("Key does not exist")
            }
        } else {
            fmt.Printf("Key will expire in %v seconds\n", ttl.Seconds())
        }
        ```
    * **Using PTTL for milliseconds precision:**
        ```go
        ttl, err := rdb.PTTL(ctx, "key").Result()
        ```

### 5. How do you implement basic caching patterns in Go using Redis?

* **Answer:** Here are two common caching patterns:
    * **Cache-Aside (Lazy Loading):**
        ```go
        func GetWithCache(rdb *redis.Client, key string) (string, error) {
            // Try to get from cache first
            val, err := rdb.Get(ctx, key).Result()
            if err == nil {
                return val, nil // Cache hit
            }
            if err != redis.Nil {
                return "", err // Real error
            }
            
            // Cache miss - get from database
            val, err = getFromDatabase(key)
            if err != nil {
                return "", err
            }
            
            // Store in cache with expiration
            err = rdb.Set(ctx, key, val, 5*time.Minute).Err()
            if err != nil {
                log.Printf("Failed to cache value: %v", err)
            }
            
            return val, nil
        }
        ```
    * **Write-Through:**
        ```go
        func SetWithCache(rdb *redis.Client, key, value string) error {
            // Write to cache first
            err := rdb.Set(ctx, key, value, 5*time.Minute).Err()
            if err != nil {
                return fmt.Errorf("cache write failed: %v", err)
            }
            
            // Then write to database
            err = writeToDatabase(key, value)
            if err != nil {
                // Optionally: Invalidate cache on DB write failure
                rdb.Del(ctx, key)
                return fmt.Errorf("database write failed: %v", err)
            }
            
            return nil
        }
        ```

## Intermediate Concepts

### 6. How do you use Redis data structures (Lists, Hashes, Sets, Sorted Sets) from Go? Provide a brief example for one.

* **Answer:** Redis offers versatile data structures beyond simple key-value strings. Client libraries provide functions to interact with them:
    * **Lists:** Ordered sequences (e.g., `LPUSH`, `RPUSH`, `LPOP`, `RPOP`, `LRANGE`). Useful for queues, timelines.
    * **Hashes:** Maps stored at a key (e.g., `HSET`, `HGET`, `HGETALL`, `HDEL`). Good for storing object-like data.
    * **Sets:** Unordered collections of unique strings (e.g., `SADD`, `SREM`, `SMEMBERS`, `SISMEMBER`). Useful for tracking unique items, tags.
    * **Sorted Sets (ZSets):** Sets where each member has an associated score, ordered by score (e.g., `ZADD`, `ZRANGE`, `ZRANK`, `ZSCORE`). Ideal for leaderboards, rate limiters, priority queues.
* **Example (Using Hashes with `go-redis/redis`):**
    ```go
    func hashExample(rdb *redis.Client) {
        userKey := "user:1001"

        // Set multiple fields in a hash
        err := rdb.HSet(ctx, userKey, map[string]interface{}{
            "name":  "Alice",
            "email": "alice@example.com",
            "age":   30,
        }).Err()
        if err != nil {
            log.Printf("HSet failed: %v", err)
            return
        }

        // Get a single field
        name, err := rdb.HGet(ctx, userKey, "name").Result()
        if err != nil {
            log.Printf("HGet failed: %v", err)
        } else {
            fmt.Println("Name:", name)
        }

        // Get all fields
        allFields, err := rdb.HGetAll(ctx, userKey).Result()
        if err != nil {
            log.Printf("HGetAll failed: %v", err)
        } else {
            fmt.Println("All Fields:", allFields) // map[string]string
        }
    }
    ```

### 7. What is Redis Pipelining and how can it improve performance in Go?

* **Answer:** Pipelining allows a client to send multiple commands to the Redis server without waiting for the reply to each command individually. The server processes the commands sequentially and sends back all the replies together. This significantly reduces the impact of network latency, as multiple round trips are combined into one.
* **Benefit:** It drastically improves performance when you need to execute many commands in succession, especially if network latency is a factor.
* **Example (`go-redis/redis`):**
    ```go
    func pipelineExample(rdb *redis.Client) {
        pipe := rdb.Pipeline()

        // Queue commands
        incrCmd := pipe.Incr(ctx, "counter")
        pipe.Expire(ctx, "counter", time.Hour)
        getCmd := pipe.Get(ctx, "some_other_key")

        // Execute commands
        // Exec sends all queued commands and returns replies in order
        cmders, err := pipe.Exec(ctx)
        if err != nil && err != redis.Nil { // Allow redis.Nil for GET
            log.Printf("Pipeline failed: %v", err)
            return
        }

        // Process results (check individual command errors if needed)
        fmt.Println("Counter after Incr:", incrCmd.Val())
        fmt.Println("Get result:", getCmd.Val()) // Will be empty string if key doesn't exist

        // Example checking individual errors
        for _, cmd := range cmders {
             if cmd.Err() != nil && cmd.Err() != redis.Nil {
                 log.Printf("Command failed in pipeline: %v", cmd.Err())
             }
        }
    }
    ```

### 8. Explain Redis Pub/Sub. How would you implement a simple publisher and subscriber in Go?

* **Answer:** Redis Pub/Sub (Publish/Subscribe) is a messaging pattern where publishers send messages to named channels, without knowledge of specific subscribers. Subscribers express interest in one or more channels and receive messages sent to those channels. It's useful for broadcasting events, real-time notifications, etc.
* **Go Implementation (`go-redis/redis`):**
    ```go
    // Publisher
    func publishMessage(rdb *redis.Client, channel string, message string) {
        err := rdb.Publish(ctx, channel, message).Err()
        if err != nil {
            log.Printf("Publish failed: %v", err)
        } else {
            fmt.Printf("Published '%s' to channel '%s'\n", message, channel)
        }
    }

    // Subscriber
    func subscribeMessages(rdb *redis.Client, channel string) {
        pubsub := rdb.Subscribe(ctx, channel)
        defer pubsub.Close() // Ensure Close is called

        // Wait for confirmation that subscription is created before publishing
        _, err := pubsub.Receive(ctx)
        if err != nil {
            log.Fatalf("Error receiving subscription confirmation: %v", err)
        }

        // Go channel which receives messages.
        ch := pubsub.Channel()

        fmt.Printf("Subscribed to channel '%s'. Waiting for messages...\n", channel)

        // Consume messages
        for msg := range ch {
            fmt.Printf("Received message from '%s': %s\n", msg.Channel, msg.Payload)
            // Add logic to stop subscribing if needed
        }

        fmt.Println("Subscription channel closed.")
    }

    func main() {
        // ... (setup rdb client) ...

        go subscribeMessages(rdb, "my-channel")

        // Give subscriber time to start
        time.Sleep(100 * time.Millisecond)

        publishMessage(rdb, "my-channel", "Hello Redis!")
        publishMessage(rdb, "my-channel", "Pub/Sub is cool.")

        // Keep main running to allow subscriber to receive
        time.Sleep(2 * time.Second)
    }
    ```

### 9. How do you handle transactions (MULTI/EXEC) in Redis using Go?

* **Answer:** Redis transactions allow executing a group of commands atomically using `MULTI`, `EXEC`, `DISCARD`, and `WATCH`. `MULTI` starts a transaction block, commands are queued, and `EXEC` executes them all. `WATCH` provides optimistic locking. Client libraries typically offer a way to wrap this.
* **Example (`go-redis/redis` using `TxPipeline`):**
    ```go
    func transactionExample(rdb *redis.Client) error {
        pipe := rdb.TxPipeline() // Use TxPipeline for transactions

        // Queue commands within the transaction
        incr := pipe.Incr(ctx, "tx_counter")
        pipe.Expire(ctx, "tx_counter", time.Hour)

        // Execute the transaction
        _, err := pipe.Exec(ctx)
        if err != nil {
            // Transaction failed (e.g., connection error, WATCH failure)
            log.Printf("Transaction failed: %v", err)
            return err
        }

        // Results are available after Exec succeeds
        fmt.Println("Counter after Tx Incr:", incr.Val())
        return nil
    }

    // Example with WATCH (Optimistic Locking)
    func watchExample(rdb *redis.Client, key string, expectedValue string, newValue string) error {
        // Use Watch which wraps the logic in a retry loop
        err := rdb.Watch(ctx, func(tx *redis.Tx) error {
            // Get current value within the transaction
            val, err := tx.Get(ctx, key).Result()
            if err != nil && err != redis.Nil {
                return err // Error getting value
            }

            // Check if value matches expectation
            if val != expectedValue {
                return fmt.Errorf("key '%s' has unexpected value '%s'", key, val)
            }

            // Proceed with MULTI/EXEC logic (queued by TxPipeline)
            _, err = tx.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
                pipe.Set(ctx, key, newValue, 0)
                return nil
            })
            return err // Return error from Pipelined, Watch will retry if it's redis.TxFailedErr

        }, key) // Pass the key(s) to WATCH

        if err == redis.TxFailedErr {
             log.Printf("Optimistic lock failed for key '%s', value changed concurrently.", key)
             return err
        } else if err != nil {
             log.Printf("Error during WATCH transaction: %v", err)
             return err
        }

        fmt.Printf("Successfully updated key '%s' using WATCH.\n", key)
        return nil
    }
    ```

### 10. How do you implement rate limiting using Redis in Go?

* **Answer:** Redis is excellent for implementing rate limiting due to its atomic operations and expiration features. Here's an example using the token bucket algorithm:
    ```go
    func IsRateLimited(rdb *redis.Client, key string, limit int, window time.Duration) (bool, error) {
        // Use a Lua script for atomic operations
        script := `
            local current = redis.call('INCR', KEYS[1])
            if current == 1 then
                redis.call('EXPIRE', KEYS[1], ARGV[1])
            end
            return current <= tonumber(ARGV[2])
        `
        
        // Execute the script
        result, err := rdb.Eval(ctx, script, []string{key}, 
            window.Seconds(), // ARGV[1]: window in seconds
            limit,           // ARGV[2]: limit
        ).Result()
        
        if err != nil {
            return false, err
        }
        
        // result is a boolean indicating if the request is allowed
        return !result.(bool), nil
    }

    // Usage example
    func main() {
        // ... (setup rdb client) ...
        
        key := "rate_limit:user:123"
        limit := 100 // 100 requests
        window := time.Minute // per minute
        
        limited, err := IsRateLimited(rdb, key, limit, window)
        if err != nil {
            log.Printf("Error checking rate limit: %v", err)
            return
        }
        
        if limited {
            fmt.Println("Rate limit exceeded")
        } else {
            fmt.Println("Request allowed")
        }
    }
    ```

## Advanced Concepts

### 11. Describe common caching patterns using Redis (e.g., Cache-Aside, Write-Through).

* **Answer:**
    * **Cache-Aside (Lazy Loading):**
        1.  Application tries to read data from Redis.
        2.  **Cache Hit:** If data is in Redis, return it.
        3.  **Cache Miss:** If data is not in Redis, read it from the primary database.
        4.  Store the data read from the database into Redis (with an appropriate TTL).
        5.  Return the data to the application.
        *   *Pros:* Resilient to Redis failures (app can still hit DB), only caches requested data.
        *   *Cons:* Cache misses result in higher latency (DB + Redis write). Potential for stale data between DB write and cache update.
    * **Write-Through:**
        1.  Application writes data.
        2.  Write the data to Redis *first*.
        3.  If the Redis write succeeds, write the data to the primary database.
        *   *Pros:* Cache is always consistent with the database (assuming both writes succeed). Reads are fast if data is cached.
        *   *Cons:* Writes have higher latency (Redis + DB write). If Redis fails, the write fails.
    * **Write-Back (Write-Behind):**
        1.  Application writes data only to Redis.
        2.  Redis write is acknowledged quickly.
        3.  Another process or mechanism asynchronously writes the data from Redis to the primary database later.
        *   *Pros:* Very fast writes. Resilient to temporary DB failures.
        *   *Cons:* Risk of data loss if Redis fails before data is persisted to DB. More complex to implement. Cache and DB are eventually consistent.
    * **Read-Through:** Similar to Cache-Aside, but the caching logic is often encapsulated within the data access layer or a dedicated caching library/provider, making it more transparent to the application.

### 12. How can you execute Lua scripts in Redis from Go? Why might you do this?

* **Answer:** Redis allows executing Lua scripts atomically on the server side using the `EVAL` or `EVALSHA` commands. Go client libraries provide methods to run these scripts.
* **Why Use Lua Scripts?**
    * **Atomicity:** Execute multiple Redis commands as a single atomic operation, avoiding the need for `MULTI`/`EXEC` in some cases or implementing logic not possible with standard transactions.
    * **Performance:** Reduce network round trips by performing complex logic directly on the Redis server.
    * **Encapsulation:** Move data-local logic closer to the data itself.
* **Example (`go-redis/redis`):**
    ```go
    func luaScriptExample(rdb *redis.Client) {
        // Lua script: Atomically increment a key only if it exists
        script := `
            if redis.call("EXISTS", KEYS[1]) == 1 then
                return redis.call("INCRBY", KEYS[1], ARGV[1])
            else
                return 0
            end
        `
        // Load script into Redis cache and get its SHA1 hash
        // Do this once during application startup ideally
        sha1, err := rdb.ScriptLoad(ctx, script).Result()
        if err != nil {
            log.Fatalf("Failed to load script: %v", err)
        }

        // Execute script using EVALSHA (more efficient after loading)
        key := "lua_counter"
        increment := 10
        rdb.Set(ctx, key, "5", 0) // Ensure key exists for this example

        // EVALSHA takes: context, sha1, keys_slice, args_slice...
        result, err := rdb.EvalSha(ctx, sha1, []string{key}, increment).Int64()
        if err != nil {
            // Handle potential "NOSCRIPT" error by falling back to EVAL
            if redis.HasErrorPrefix(err, "NOSCRIPT") {
                log.Println("Script not cached, using EVAL...")
                result, err = rdb.Eval(ctx, script, []string{key}, increment).Int64()
                if err != nil {
                     log.Printf("EVAL failed: %v", err)
                     return
                }
            } else {
                log.Printf("EVALSHA failed: %v", err)
                return
            }
        }

        fmt.Printf("Result of Lua script execution: %d\n", result) // Should be 15
    }
    ```

### 13. How do you handle errors and potential retries when interacting with Redis from Go?

* **Answer:** Robust Redis interaction requires proper error handling:
    * **Check Errors:** Always check the `error` returned by client library calls.
    * **Specific Errors:** Check for specific errors like `redis.Nil` (key not found), which often isn't a "real" error but a normal condition.
    * **Network Errors:** Network issues (timeouts, connection refused, broken pipe) can occur. These often warrant retries.
    * **Retry Logic:** Implement a retry mechanism (e.g., exponential backoff) for transient network errors or temporary Redis unavailability. Libraries like `go-redis` might have some built-in retry capabilities, but custom logic might be needed. Use `context` for timeout/cancellation within retry loops.
    * **Circuit Breaker:** For critical dependencies, consider implementing a circuit breaker pattern to prevent repeatedly hitting a failing Redis instance.
    * **Logging:** Log errors appropriately, especially persistent ones.

### 14. How do you implement a Redis-backed session store in Go?

* **Answer:** Here's an example of implementing a session store using Redis:
    ```go
    type Session struct {
        ID        string
        UserID    string
        Data      map[string]interface{}
        ExpiresAt time.Time
    }

    type SessionStore struct {
        rdb    *redis.Client
        prefix string
    }

    func NewSessionStore(rdb *redis.Client) *SessionStore {
        return &SessionStore{
            rdb:    rdb,
            prefix: "session:",
        }
    }

    func (s *SessionStore) Create(userID string, ttl time.Duration) (*Session, error) {
        session := &Session{
            ID:        uuid.New().String(),
            UserID:    userID,
            Data:      make(map[string]interface{}),
            ExpiresAt: time.Now().Add(ttl),
        }

        // Marshal session data
        data, err := json.Marshal(session)
        if err != nil {
            return nil, err
        }

        // Store in Redis with TTL
        key := s.prefix + session.ID
        err = s.rdb.Set(ctx, key, data, ttl).Err()
        if err != nil {
            return nil, err
        }

        return session, nil
    }

    func (s *SessionStore) Get(sessionID string) (*Session, error) {
        key := s.prefix + sessionID
        data, err := s.rdb.Get(ctx, key).Bytes()
        if err == redis.Nil {
            return nil, fmt.Errorf("session not found")
        }
        if err != nil {
            return nil, err
        }

        var session Session
        if err := json.Unmarshal(data, &session); err != nil {
            return nil, err
        }

        return &session, nil
    }

    func (s *SessionStore) Update(session *Session) error {
        data, err := json.Marshal(session)
        if err != nil {
            return err
        }

        key := s.prefix + session.ID
        ttl := time.Until(session.ExpiresAt)
        return s.rdb.Set(ctx, key, data, ttl).Err()
    }

    func (s *SessionStore) Delete(sessionID string) error {
        key := s.prefix + sessionID
        return s.rdb.Del(ctx, key).Err()
    }
    ```

## Expert Concepts

### 15. Explain Redis Sentinel and Redis Cluster. When would you choose one over the other for high availability?

* **Answer:** Both provide high availability (HA) for Redis, but differ in their approach:
    * **Redis Sentinel:**
        * Provides HA for a master-replica setup.
        * Sentinels are separate processes that monitor Redis instances (master and replicas).
        * If the master fails, Sentinels agree on the failure (quorum) and promote one of the replicas to be the new master.
        * They reconfigure other replicas to follow the new master and update clients about the new master address.
        * *Pros:* Simpler setup for basic HA, mature technology.
        * *Cons:* Master holds the entire dataset (limited by single node memory/CPU), failover involves promoting a replica.
    * **Redis Cluster:**
        * Provides HA *and* automatic sharding (data partitioning).
        * Data is split across multiple master nodes based on key hash slots.
        * Each master can have replicas for HA.
        * Nodes communicate directly using a gossip protocol to detect failures.
        * If a master fails, one of its replicas is automatically promoted.
        * Clients need to be cluster-aware to handle redirects (`-MOVED`, `-ASK`).
        * *Pros:* Horizontal scalability (dataset size and throughput), automatic sharding, built-in HA without separate Sentinel processes.
        * *Cons:* More complex setup and management, certain operations (multi-key across different slots) are restricted or complex.
* **Choosing:**
    * Choose **Sentinel** if your dataset fits on a single master node and you primarily need automatic failover for a master-replica setup.
    * Choose **Cluster** if you need horizontal scalability for large datasets or high throughput that exceeds a single node's capacity, along with built-in HA and sharding.

### 16. How can you implement distributed locking using Redis? What are potential pitfalls?

* **Answer:** Distributed locking prevents multiple processes/nodes from concurrently accessing a shared resource. A common Redis approach uses `SET key value NX EX seconds`:
    * `SET resource_name random_value NX EX lock_timeout`:
        * `NX`: Set only if the key does not already exist. This ensures only one client gets the lock.
        * `EX lock_timeout`: Set an expiration time to prevent deadlocks if the lock holder crashes.
        * `random_value`: A unique value per lock attempt, used for safe unlocking.
    * **Unlocking:** Use a Lua script to atomically check if the key exists and holds the expected `random_value` before deleting it. This prevents accidentally deleting a lock acquired by another client after the original lock expired and was re-acquired.
        ```lua
        -- Lua script for safe unlock
        if redis.call("GET", KEYS[1]) == ARGV[1] then
            return redis.call("DEL", KEYS[1])
        else
            return 0
        end
        ```
* **Pitfalls:**
    * **Clock Drift:** Relies on synchronized time across nodes and Redis for expiration.
    * **Lock Timeout:** Choosing the right timeout is critical. Too short risks work not finishing; too long risks slow recovery if a holder crashes.
    * **Atomicity:** Unlocking *must* be atomic (using Lua) to prevent race conditions. Simple `GET` then `DEL` is unsafe.
    * **Network Issues:** Failures during lock acquisition or release.
    * **Redlock Algorithm:** For higher safety guarantees across multiple independent Redis nodes, the Redlock algorithm exists but is complex and debated regarding its actual safety guarantees under certain failure modes.
* **Libraries:** Consider using established Go libraries that implement distributed locking patterns correctly, as getting it right manually is tricky.

### 17. How do you implement Redis-backed leader election in a distributed Go application?

* **Answer:** Redis can be used to implement leader election in a distributed system. Here's an example using Redis's atomic operations:
    ```go
    type LeaderElection struct {
        rdb     *redis.Client
        key     string
        id      string
        ttl     time.Duration
        stop    chan struct{}
        isLeader bool
    }

    func NewLeaderElection(rdb *redis.Client, key, id string, ttl time.Duration) *LeaderElection {
        return &LeaderElection{
            rdb:  rdb,
            key:  key,
            id:   id,
            ttl:  ttl,
            stop: make(chan struct{}),
        }
    }

    func (le *LeaderElection) Start() {
        go le.run()
    }

    func (le *LeaderElection) Stop() {
        close(le.stop)
        if le.isLeader {
            le.rdb.Del(ctx, le.key)
        }
    }

    func (le *LeaderElection) IsLeader() bool {
        return le.isLeader
    }

    func (le *LeaderElection) run() {
        ticker := time.NewTicker(le.ttl / 2)
        defer ticker.Stop()

        for {
            select {
            case <-le.stop:
                return
            case <-ticker.C:
                le.elect()
            }
        }
    }

    func (le *LeaderElection) elect() {
        // Try to acquire leadership
        acquired, err := le.rdb.SetNX(ctx, le.key, le.id, le.ttl).Result()
        if err != nil {
            log.Printf("Error acquiring leadership: %v", err)
            return
        }

        if acquired {
            // We became the leader
            if !le.isLeader {
                log.Printf("Became leader: %s", le.id)
                le.isLeader = true
            }
            return
        }

        // Check if we're still the leader
        currentLeader, err := le.rdb.Get(ctx, le.key).Result()
        if err != nil && err != redis.Nil {
            log.Printf("Error checking leadership: %v", err)
            return
        }

        if currentLeader == le.id {
            // We're still the leader, extend our term
            le.rdb.Expire(ctx, le.key, le.ttl)
            if !le.isLeader {
                log.Printf("Regained leadership: %s", le.id)
                le.isLeader = true
            }
        } else {
            // We're not the leader
            if le.isLeader {
                log.Printf("Lost leadership: %s", le.id)
                le.isLeader = false
            }
        }
    }
    ```

### 18. How do you implement Redis-backed job queues in Go?

* **Answer:** Redis is commonly used to implement job queues. Here's an example using Redis Lists:
    ```go
    type JobQueue struct {
        rdb     *redis.Client
        queue   string
        workers int
    }

    type Job struct {
        ID        string
        Type      string
        Data      []byte
        CreatedAt time.Time
    }

    func NewJobQueue(rdb *redis.Client, queue string, workers int) *JobQueue {
        return &JobQueue{
            rdb:     rdb,
            queue:   queue,
            workers: workers,
        }
    }

    func (q *JobQueue) Enqueue(job *Job) error {
        data, err := json.Marshal(job)
        if err != nil {
            return err
        }

        return q.rdb.LPush(ctx, q.queue, data).Err()
    }

    func (q *JobQueue) Dequeue() (*Job, error) {
        // Use BRPop to block until a job is available
        result, err := q.rdb.BRPop(ctx, 0, q.queue).Result()
        if err != nil {
            return nil, err
        }

        var job Job
        if err := json.Unmarshal([]byte(result[1]), &job); err != nil {
            return nil, err
        }

        return &job, nil
    }

    func (q *JobQueue) Start(handler func(*Job) error) {
        for i := 0; i < q.workers; i++ {
            go func(workerID int) {
                for {
                    job, err := q.Dequeue()
                    if err != nil {
                        log.Printf("Worker %d: Error dequeuing job: %v", workerID, err)
                        continue
                    }

                    log.Printf("Worker %d: Processing job %s", workerID, job.ID)
                    if err := handler(job); err != nil {
                        log.Printf("Worker %d: Error processing job %s: %v", workerID, job.ID, err)
                    }
                }
            }(i)
        }
    }

    // Usage example
    func main() {
        rdb := redis.NewClient(&redis.Options{
            Addr: "localhost:6379",
        })

        queue := NewJobQueue(rdb, "jobs", 5)

        // Start workers
        queue.Start(func(job *Job) error {
            log.Printf("Processing job: %+v", job)
            // Process the job
            return nil
        })

        // Enqueue some jobs
        for i := 0; i < 10; i++ {
            job := &Job{
                ID:        uuid.New().String(),
                Type:      "example",
                Data:      []byte(fmt.Sprintf("job data %d", i)),
                CreatedAt: time.Now(),
            }
            if err := queue.Enqueue(job); err != nil {
                log.Printf("Error enqueueing job: %v", err)
            }
        }

        // Keep the program running
        select {}
    }
    ```

### 19. How do you implement Redis-backed search functionality in Go?

* **Answer:** Redis can be used to implement basic search functionality using Sorted Sets and Hashes. Here's an example of implementing a simple search index:
    ```go
    type SearchIndex struct {
        rdb     *redis.Client
        prefix  string
    }

    func NewSearchIndex(rdb *redis.Client) *SearchIndex {
        return &SearchIndex{
            rdb:    rdb,
            prefix: "search:",
        }
    }

    func (s *SearchIndex) IndexDocument(docID string, text string) error {
        // Split text into words
        words := strings.Fields(strings.ToLower(text))
        
        // Add each word to the index
        for _, word := range words {
            key := s.prefix + word
            err := s.rdb.SAdd(ctx, key, docID).Err()
            if err != nil {
                return err
            }
        }
        
        // Store the document text
        return s.rdb.HSet(ctx, s.prefix+"docs", docID, text).Err()
    }

    func (s *SearchIndex) Search(query string) ([]string, error) {
        words := strings.Fields(strings.ToLower(query))
        if len(words) == 0 {
            return nil, nil
        }

        // Get the first word's documents
        firstKey := s.prefix + words[0]
        docIDs, err := s.rdb.SMembers(ctx, firstKey).Result()
        if err != nil {
            return nil, err
        }

        // Intersect with other words' documents
        for _, word := range words[1:] {
            key := s.prefix + word
            docIDs, err = s.rdb.SInter(ctx, firstKey, key).Result()
            if err != nil {
                return nil, err
            }
        }

        return docIDs, nil
    }

    // Usage example
    func main() {
        rdb := redis.NewClient(&redis.Options{
            Addr: "localhost:6379",
        })

        index := NewSearchIndex(rdb)

        // Index some documents
        index.IndexDocument("doc1", "Redis is a great database")
        index.IndexDocument("doc2", "Go is a great programming language")
        index.IndexDocument("doc3", "Redis and Go work well together")

        // Search
        results, err := index.Search("redis go")
        if err != nil {
            log.Fatal(err)
        }

        fmt.Println("Search results:", results)
    }
    ```

### 20. How do you implement Redis-backed real-time analytics in Go?

* **Answer:** Redis is excellent for real-time analytics due to its atomic operations and data structures. Here's an example of implementing page view analytics:
    ```go
    type Analytics struct {
        rdb    *redis.Client
        prefix string
    }

    func NewAnalytics(rdb *redis.Client) *Analytics {
        return &Analytics{
            rdb:    rdb,
            prefix: "analytics:",
        }
    }

    func (a *Analytics) TrackPageView(pageID string, userID string) error {
        now := time.Now()
        
        // Increment total views
        totalKey := a.prefix + "total:" + pageID
        err := a.rdb.Incr(ctx, totalKey).Err()
        if err != nil {
            return err
        }

        // Track unique visitors using HyperLogLog
        uniqueKey := a.prefix + "unique:" + pageID
        err = a.rdb.PFAdd(ctx, uniqueKey, userID).Err()
        if err != nil {
            return err
        }

        // Track hourly views using sorted sets
        hourlyKey := a.prefix + "hourly:" + pageID
        score := float64(now.Unix())
        err = a.rdb.ZAdd(ctx, hourlyKey, &redis.Z{
            Score:  score,
            Member: now.Format("2006-01-02-15"),
        }).Err()
        if err != nil {
            return err
        }

        return nil
    }

    func (a *Analytics) GetStats(pageID string) (map[string]interface{}, error) {
        stats := make(map[string]interface{})

        // Get total views
        totalKey := a.prefix + "total:" + pageID
        total, err := a.rdb.Get(ctx, totalKey).Int64()
        if err != nil && err != redis.Nil {
            return nil, err
        }
        stats["total_views"] = total

        // Get unique visitors
        uniqueKey := a.prefix + "unique:" + pageID
        unique, err := a.rdb.PFCount(ctx, uniqueKey).Result()
        if err != nil {
            return nil, err
        }
        stats["unique_visitors"] = unique

        // Get hourly views for last 24 hours
        hourlyKey := a.prefix + "hourly:" + pageID
        now := time.Now()
        start := now.Add(-24 * time.Hour)
        hourly, err := a.rdb.ZRangeByScore(ctx, hourlyKey, &redis.ZRangeBy{
            Min: fmt.Sprintf("%d", start.Unix()),
            Max: fmt.Sprintf("%d", now.Unix()),
        }).Result()
        if err != nil {
            return nil, err
        }
        stats["hourly_views"] = hourly

        return stats, nil
    }
    ```

### 21. How do you implement Redis-backed feature flags in Go?

* **Answer:** Feature flags allow enabling/disabling features without deploying new code. Here's an implementation using Redis:
    ```go
    type FeatureFlags struct {
        rdb    *redis.Client
        prefix string
    }

    func NewFeatureFlags(rdb *redis.Client) *FeatureFlags {
        return &FeatureFlags{
            rdb:    rdb,
            prefix: "feature:",
        }
    }

    func (f *FeatureFlags) Enable(feature string, percentage float64) error {
        key := f.prefix + feature
        return f.rdb.Set(ctx, key, percentage, 0).Err()
    }

    func (f *FeatureFlags) Disable(feature string) error {
        key := f.prefix + feature
        return f.rdb.Del(ctx, key).Err()
    }

    func (f *FeatureFlags) IsEnabled(feature string, userID string) (bool, error) {
        key := f.prefix + feature
        percentage, err := f.rdb.Get(ctx, key).Float64()
        if err == redis.Nil {
            return false, nil // Feature not configured
        }
        if err != nil {
            return false, err
        }

        // Use consistent hashing to determine if user should see the feature
        hash := fnv.New32a()
        hash.Write([]byte(userID + feature))
        userHash := float64(hash.Sum32()) / float64(^uint32(0))
        
        return userHash < percentage, nil
    }

    // Usage example
    func main() {
        rdb := redis.NewClient(&redis.Options{
            Addr: "localhost:6379",
        })

        flags := NewFeatureFlags(rdb)

        // Enable feature for 50% of users
        flags.Enable("new_ui", 0.5)

        // Check if feature is enabled for a user
        enabled, err := flags.IsEnabled("new_ui", "user123")
        if err != nil {
            log.Fatal(err)
        }

        if enabled {
            fmt.Println("New UI is enabled for this user")
        } else {
            fmt.Println("New UI is disabled for this user")
        }
    }
    ```

### 22. How do you implement Redis-backed circuit breakers in Go?

* **Answer:** Circuit breakers help prevent cascading failures in distributed systems. Here's an implementation using Redis:
    ```go
    type CircuitBreaker struct {
        rdb     *redis.Client
        name    string
        prefix  string
        config  CircuitBreakerConfig
    }

    type CircuitBreakerConfig struct {
        FailureThreshold int
        ResetTimeout     time.Duration
        SuccessThreshold int
    }

    func NewCircuitBreaker(rdb *redis.Client, name string, config CircuitBreakerConfig) *CircuitBreaker {
        return &CircuitBreaker{
            rdb:     rdb,
            name:    name,
            prefix:  "circuit:" + name + ":",
            config:  config,
        }
    }

    func (cb *CircuitBreaker) Execute(fn func() error) error {
        state, err := cb.getState()
        if err != nil {
            return err
        }

        switch state {
        case "open":
            return fmt.Errorf("circuit breaker is open")
        case "half-open":
            // Allow one request to test if service is back
            err := fn()
            if err == nil {
                cb.recordSuccess()
            } else {
                cb.recordFailure()
            }
            return err
        default: // closed
            err := fn()
            if err != nil {
                cb.recordFailure()
            } else {
                cb.recordSuccess()
            }
            return err
        }
    }

    func (cb *CircuitBreaker) getState() (string, error) {
        state, err := cb.rdb.Get(ctx, cb.prefix+"state").Result()
        if err == redis.Nil {
            return "closed", nil
        }
        return state, err
    }

    func (cb *CircuitBreaker) recordFailure() error {
        failures, err := cb.rdb.Incr(ctx, cb.prefix+"failures").Result()
        if err != nil {
            return err
        }

        if failures >= int64(cb.config.FailureThreshold) {
            // Open the circuit
            err = cb.rdb.Set(ctx, cb.prefix+"state", "open", cb.config.ResetTimeout).Err()
            if err != nil {
                return err
            }
            
            // Reset failures counter
            return cb.rdb.Del(ctx, cb.prefix+"failures").Err()
        }

        return nil
    }

    func (cb *CircuitBreaker) recordSuccess() error {
        successes, err := cb.rdb.Incr(ctx, cb.prefix+"successes").Result()
        if err != nil {
            return err
        }

        if successes >= int64(cb.config.SuccessThreshold) {
            // Close the circuit
            err = cb.rdb.Set(ctx, cb.prefix+"state", "closed", 0).Err()
            if err != nil {
                return err
            }
            
            // Reset counters
            return cb.rdb.Del(ctx, cb.prefix+"successes", cb.prefix+"failures").Err()
        }

        return nil
    }

    // Usage example
    func main() {
        rdb := redis.NewClient(&redis.Options{
            Addr: "localhost:6379",
        })

        cb := NewCircuitBreaker(rdb, "external-service", CircuitBreakerConfig{
            FailureThreshold: 5,
            ResetTimeout:     30 * time.Second,
            SuccessThreshold: 3,
        })

        err := cb.Execute(func() error {
            // Call external service
            return nil
        })

        if err != nil {
            log.Printf("Error: %v", err)
        }
    }
    ```

### 23. How do you implement Redis-backed distributed counters in Go?

* **Answer:** Distributed counters are useful for tracking metrics across multiple instances. Here's an implementation:
    ```go
    type DistributedCounter struct {
        rdb     *redis.Client
        name    string
        prefix  string
        shards  int
    }

    func NewDistributedCounter(rdb *redis.Client, name string, shards int) *DistributedCounter {
        return &DistributedCounter{
            rdb:     rdb,
            name:    name,
            prefix:  "counter:" + name + ":",
            shards:  shards,
        }
    }

    func (c *DistributedCounter) Increment(amount int64) error {
        // Choose a random shard
        shard := rand.Intn(c.shards)
        key := fmt.Sprintf("%sshard:%d", c.prefix, shard)
        
        return c.rdb.IncrBy(ctx, key, amount).Err()
    }

    func (c *DistributedCounter) Get() (int64, error) {
        var total int64
        
        // Sum all shards
        for i := 0; i < c.shards; i++ {
            key := fmt.Sprintf("%sshard:%d", c.prefix, i)
            count, err := c.rdb.Get(ctx, key).Int64()
            if err != nil && err != redis.Nil {
                return 0, err
            }
            total += count
        }
        
        return total, nil
    }

    // Usage example
    func main() {
        rdb := redis.NewClient(&redis.Options{
            Addr: "localhost:6379",
        })

        counter := NewDistributedCounter(rdb, "page-views", 10)

        // Increment counter
        err := counter.Increment(1)
        if err != nil {
            log.Fatal(err)
        }

        // Get total
        total, err := counter.Get()
        if err != nil {
            log.Fatal(err)
        }

        fmt.Printf("Total page views: %d\n", total)
    }
    ```

### 24. How do you implement Redis-backed bloom filters in Go?

* **Answer:** Bloom filters are space-efficient probabilistic data structures. Here's an implementation using Redis:
    ```go
    type BloomFilter struct {
        rdb     *redis.Client
        name    string
        size    int64
        hashes  int
    }

    func NewBloomFilter(rdb *redis.Client, name string, size int64, hashes int) *BloomFilter {
        return &BloomFilter{
            rdb:     rdb,
            name:    name,
            size:    size,
            hashes:  hashes,
        }
    }

    func (b *BloomFilter) Add(item string) error {
        for i := 0; i < b.hashes; i++ {
            hash := b.hash(item, i)
            bit := hash % b.size
            err := b.rdb.SetBit(ctx, b.name, bit, 1).Err()
            if err != nil {
                return err
            }
        }
        return nil
    }

    func (b *BloomFilter) Contains(item string) (bool, error) {
        for i := 0; i < b.hashes; i++ {
            hash := b.hash(item, i)
            bit := hash % b.size
            val, err := b.rdb.GetBit(ctx, b.name, bit).Result()
            if err != nil {
                return false, err
            }
            if val == 0 {
                return false, nil
            }
        }
        return true, nil
    }

    func (b *BloomFilter) hash(item string, seed int) int64 {
        h := fnv.New64a()
        h.Write([]byte(item))
        h.Write([]byte(strconv.Itoa(seed)))
        return int64(h.Sum64())
    }

    // Usage example
    func main() {
        rdb := redis.NewClient(&redis.Options{
            Addr: "localhost:6379",
        })

        bf := NewBloomFilter(rdb, "usernames", 1000000, 5)

        // Add items
        bf.Add("alice")
        bf.Add("bob")

        // Check if items exist
        exists, err := bf.Contains("alice")
        if err != nil {
            log.Fatal(err)
        }
        fmt.Println("Alice exists:", exists)

        exists, err = bf.Contains("charlie")
        if err != nil {
            log.Fatal(err)
        }
        fmt.Println("Charlie exists:", exists)
    }
    ```

### Comparison Table: Redis Client Packages in Go

| Feature | go-redis/redis | redigo | radix | rueidis |
|---------|---------------|--------|-------|---------|
| Active Maintenance | Yes | Yes | Yes | Yes |
| Connection Pooling | Yes | Yes | Yes | Yes |
| Pipelining | Yes | Yes | Yes | Yes |
| Pub/Sub | Yes | Yes | Yes | Yes |
| Transactions | Yes | Yes | Yes | Yes |
| Lua Scripting | Yes | Yes | Yes | Yes |
| Cluster Support | Yes | Yes | Yes | Yes |
| Sentinel Support | Yes | Yes | Yes | Yes |
| Performance | High | Medium | High | Very High |
| API Style | Modern | Traditional | Modern | Modern |
| Type Safety | Strong | Weak | Strong | Strong |
| Error Handling | Return values | Return values | Return values | Return values |
| Documentation | Excellent | Good | Good | Good |
| Community Size | Large | Large | Medium | Growing |
| Learning Curve | Moderate | Low | Moderate | Moderate |
| Production Ready | Yes | Yes | Yes | Yes |

### Comparison Questions

1. How does go-redis/redis compare to redigo in terms of API design and ease of use?
2. What are the advantages and disadvantages of rueidis's performance optimizations compared to other clients?
3. Compare the connection pooling implementations across these Redis clients. Which is most efficient?
4. How does the type safety of go-redis/redis and radix compare to redigo's more traditional approach?
5. What are the trade-offs between the modern API style of go-redis/redis and the traditional style of redigo?
6. Compare the cluster support implementations across these clients. Which provides the most robust solution?
7. How does the error handling approach differ between these clients, and which is most developer-friendly?
8. What are the advantages and disadvantages of each client's approach to pipelining and transactions?

### Detailed Feature Comparison

#### go-redis/redis
- Most popular Redis client for Go
- Modern, type-safe API
- Excellent documentation and examples
- Built-in support for all Redis features
- Active maintenance and community support
- Good performance characteristics

#### redigo
- Traditional, simple API
- Lightweight implementation
- Stable and battle-tested
- Good for simple use cases
- Extensive documentation
- Large community support

#### radix
- Modern, type-safe API
- Focus on performance
- Clean, idiomatic Go code
- Good documentation
- Growing community
- Built-in support for advanced features

#### rueidis
- Newest of the clients
- Focus on maximum performance
- Modern API design
- Good documentation
- Growing community
- Built-in support for all Redis features

### Use Case Recommendations

1. **General Purpose**: go-redis/redis
   - Most feature-complete
   - Excellent documentation
   - Large community
   - Good balance of features and performance

2. **Simple Applications**: redigo
   - Lightweight
   - Simple API
   - Proven reliability
   - Good for basic Redis operations

3. **High Performance**: rueidis
   - Optimized for performance
   - Modern API
   - Good for high-throughput applications
   - Suitable for microservices

4. **Type-Safe Applications**: radix
   - Strong type safety
   - Clean API design
   - Good performance
   - Suitable for large applications

// ... existing code ... 