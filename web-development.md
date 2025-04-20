# Web Development & APIs Questions

## Basic Concepts

### 1. What are the main Go web frameworks and their key differences?

Popular Go web frameworks include:
* **net/http (Standard Library):**
  * Pros: Built-in, stable, no external dependencies
  * Cons: More boilerplate needed for common tasks
* **Gin:**
  * Pros: High performance, minimal overhead, good middleware support
  * Cons: More dependencies than net/http
* **Echo:**
  * Pros: Similar to Gin, good middleware ecosystem
  * Cons: Slightly more opinionated
* **Fiber:**
  * Pros: Very fast, built on fasthttp
  * Cons: Uses different underlying network library

### 2. How do you handle routing in Go web applications?

Routing can be handled in several ways:
* **Standard net/http:**
  * Use `http.ServeMux` for basic routing
  * Use third-party routers like Gorilla Mux for advanced features
* **Frameworks:**
  * Use framework-specific routing (e.g., `gin.Engine`)
  * Define routes with HTTP methods and paths
  * Handle path parameters and query strings

### 3. How do you handle JSON request/response marshaling in Go?

JSON handling in Go:
* **Unmarshaling (JSON to Go):**
  ```go
  var data MyStruct
  body, err := io.ReadAll(r.Body)
  if err != nil { /* handle error */ }
  err = json.Unmarshal(body, &data)
  ```
* **Marshaling (Go to JSON):**
  ```go
  responseStruct := MyResponse{...}
  jsonBytes, err := json.Marshal(responseStruct)
  w.Header().Set("Content-Type", "application/json")
  w.Write(jsonBytes)
  ```

### 4. How do you create a basic HTTP server in Go?

### Comparison Table: Web Development Features Across Languages

| Feature | Go | Node.js | Python | Java |
|---------|----|---------|--------|------|
| Built-in HTTP Server | Yes | Yes | No | Yes |
| Popular Frameworks | Gin, Echo | Express | Django, Flask | Spring |
| Performance | High | High | Medium | High |
| Concurrency Model | Goroutines | Event Loop | WSGI/ASGI | Threads |
| Memory Usage | Low | Medium | Medium | High |
| Learning Curve | Moderate | Low | Low | High |
| Deployment | Binary | Runtime | Runtime | Runtime |
| Hot Reloading | 3rd party | Built-in | Built-in | 3rd party |
| API Documentation | Swagger | Swagger | Swagger | Swagger |
| WebSocket Support | Yes | Yes | Yes | Yes |

### Comparison Questions

1. How does Go's built-in HTTP server compare to Node.js's in terms of performance and ease of use?
2. What are the advantages and disadvantages of Go's goroutine-based concurrency model compared to Node.js's event loop for web applications?
3. Compare Go's web frameworks (Gin, Echo) with Python's Django and Flask in terms of features and development speed.
4. How does Go's binary deployment model compare to runtime-based deployment in other languages?
5. What are the trade-offs between Go's static typing and dynamic typing in web development?
6. Compare Go's approach to middleware with Express.js middleware. Which is more flexible and why?
7. How does Go's memory management compare to Java's in web applications?
8. What are the advantages and disadvantages of Go's standard library approach compared to framework-heavy approaches in other languages?

### 5. What is the difference between `http.Handle` and `http.HandleFunc`?

* **Answer:** 
    * `http.Handle` takes an `http.Handler` interface
    * `http.HandleFunc` takes a function with signature `func(w http.ResponseWriter, r *http.Request)`
* **Example:**
    ```go
    // Using http.Handle
    type MyHandler struct{}
    
    func (h *MyHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello from Handler!")
    }
    
    // Using http.HandleFunc
    func handlerFunc(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello from HandlerFunc!")
    }
    
    func main() {
        http.Handle("/handler", &MyHandler{})
        http.HandleFunc("/handlerfunc", handlerFunc)
        
        http.ListenAndServe(":8080", nil)
    }
    ```

### 6. How do you handle different HTTP methods in Go?

* **Answer:** Check the `r.Method` field in the request handler to determine the HTTP method.
* **Example:**
    ```go
    func handleRequest(w http.ResponseWriter, r *http.Request) {
        switch r.Method {
        case "GET":
            // Handle GET request
            fmt.Fprintf(w, "GET request received")
        case "POST":
            // Handle POST request
            var data map[string]string
            if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
                http.Error(w, "Bad request", http.StatusBadRequest)
                return
            }
            fmt.Fprintf(w, "POST request received with data: %v", data)
        case "PUT":
            // Handle PUT request
            fmt.Fprintf(w, "PUT request received")
        case "DELETE":
            // Handle DELETE request
            fmt.Fprintf(w, "DELETE request received")
        default:
            http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        }
    }
    ```

### 7. How do you parse query parameters in Go?

* **Answer:** Use `r.URL.Query()` to get a `url.Values` map of query parameters.
* **Example:**
    ```go
    func searchHandler(w http.ResponseWriter, r *http.Request) {
        query := r.URL.Query()
        
        // Get single parameter
        q := query.Get("q")
        if q == "" {
            http.Error(w, "Missing query parameter", http.StatusBadRequest)
            return
        }
        
        // Get multiple values for same parameter
        tags := query["tag"]
        
        // Get with default value
        page := query.Get("page")
        if page == "" {
            page = "1"
        }
        
        fmt.Fprintf(w, "Searching for '%s' with tags %v on page %s", q, tags, page)
    }
    ```

### 8. How do you handle form data in Go?

* **Answer:** Use `r.ParseForm()` to parse form data, then access it through `r.Form` or `r.PostForm`.
* **Example:**
    ```go
    func formHandler(w http.ResponseWriter, r *http.Request) {
        if err := r.ParseForm(); err != nil {
            http.Error(w, "Error parsing form", http.StatusBadRequest)
            return
        }
        
        // Get form values
        name := r.Form.Get("name")
        email := r.Form.Get("email")
        
        // Get multiple values for same field
        interests := r.Form["interests"]
        
        fmt.Fprintf(w, "Name: %s\nEmail: %s\nInterests: %v", name, email, interests)
    }
    ```

### 9. How do you handle file uploads in Go?

* **Answer:** Use `r.ParseMultipartForm()` to parse multipart form data, then access files through `r.MultipartForm.File`.
* **Example:**
    ```go
    func uploadHandler(w http.ResponseWriter, r *http.Request) {
        // Parse multipart form
        if err := r.ParseMultipartForm(10 << 20); err != nil { // 10 MB max
            http.Error(w, "Error parsing form", http.StatusBadRequest)
            return
        }
        
        // Get file from form
        file, handler, err := r.FormFile("file")
        if err != nil {
            http.Error(w, "Error retrieving file", http.StatusBadRequest)
            return
        }
        defer file.Close()
        
        // Create new file
        f, err := os.Create("/tmp/" + handler.Filename)
        if err != nil {
            http.Error(w, "Error creating file", http.StatusInternalServerError)
            return
        }
        defer f.Close()
        
        // Copy file
        if _, err := io.Copy(f, file); err != nil {
            http.Error(w, "Error saving file", http.StatusInternalServerError)
            return
        }
        
        fmt.Fprintf(w, "File %s uploaded successfully", handler.Filename)
    }
    ```

### 10. How do you set cookies in Go?

* **Answer:** Use `http.SetCookie()` to set cookies and `r.Cookie()` to read them.
* **Example:**
    ```go
    func setCookieHandler(w http.ResponseWriter, r *http.Request) {
        // Set cookie
        cookie := http.Cookie{
            Name:     "session",
            Value:    "abc123",
            Path:     "/",
            MaxAge:   3600,
            HttpOnly: true,
            Secure:   true,
            SameSite: http.SameSiteLaxMode,
        }
        http.SetCookie(w, &cookie)
        
        fmt.Fprintf(w, "Cookie set successfully")
    }
    
    func readCookieHandler(w http.ResponseWriter, r *http.Request) {
        // Read cookie
        cookie, err := r.Cookie("session")
        if err != nil {
            if err == http.ErrNoCookie {
                http.Error(w, "No cookie found", http.StatusBadRequest)
                return
            }
            http.Error(w, "Error reading cookie", http.StatusInternalServerError)
            return
        }
        
        fmt.Fprintf(w, "Cookie value: %s", cookie.Value)
    }
    ```

### 11. How do you handle sessions in Go?

* **Answer:** Use a session manager like `gorilla/sessions` to handle sessions.
* **Example:**
    ```go
    var store = sessions.NewCookieStore([]byte("secret-key"))
    
    func loginHandler(w http.ResponseWriter, r *http.Request) {
        session, _ := store.Get(r, "session-name")
        
        // Set session values
        session.Values["authenticated"] = true
        session.Values["user_id"] = 123
        session.Save(r, w)
        
        fmt.Fprintf(w, "Logged in successfully")
    }
    
    func protectedHandler(w http.ResponseWriter, r *http.Request) {
        session, _ := store.Get(r, "session-name")
        
        // Check authentication
        if auth, ok := session.Values["authenticated"].(bool); !ok || !auth {
            http.Error(w, "Unauthorized", http.StatusUnauthorized)
            return
        }
        
        userID := session.Values["user_id"]
        fmt.Fprintf(w, "Protected content for user %v", userID)
    }
    ```

### 12. How do you implement middleware in Go?

* **Answer:** Middleware is implemented as a function that takes and returns an `http.Handler`.
* **Example:**
    ```go
    func loggingMiddleware(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            start := time.Now()
            
            // Call the next handler
            next.ServeHTTP(w, r)
            
            // Log the request
            log.Printf(
                "%s %s %s %v",
                r.Method,
                r.RequestURI,
                r.RemoteAddr,
                time.Since(start),
            )
        })
    }
    
    func authMiddleware(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            token := r.Header.Get("Authorization")
            if token != "valid-token" {
                http.Error(w, "Unauthorized", http.StatusUnauthorized)
                return
            }
            next.ServeHTTP(w, r)
        })
    }
    
    func main() {
        mux := http.NewServeMux()
        mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
            fmt.Fprintf(w, "Hello, World!")
        })
        
        // Apply middleware
        handler := loggingMiddleware(authMiddleware(mux))
        
        http.ListenAndServe(":8080", handler)
    }
    ```

## Intermediate Concepts

### 13. How do you implement middleware in Go web applications?

Middleware in Go:
* **Standard net/http:**
  ```go
  func LoggingMiddleware(next http.Handler) http.Handler {
      return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
          start := time.Now()
          next.ServeHTTP(w, r)
          log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
      })
  }
  ```
* **Frameworks:** Use framework-specific middleware interfaces

### 14. How do you handle authentication and authorization in Go web applications?

Authentication/Authorization approaches:
* JWT (JSON Web Tokens)
* Session-based authentication
* OAuth2 integration
* Role-based access control (RBAC)
* Middleware for protecting routes

### 15. How do you handle graceful shutdown of an HTTP server?

Graceful shutdown involves:
1. Using `http.Server` instead of `http.ListenAndServe`
2. Listening for termination signals
3. Using `server.Shutdown(ctx)` with timeout
4. Waiting for active connections to finish

## Advanced Concepts

### 16. How do you implement rate limiting in a Go web service?

Rate limiting can be implemented using:
* Token bucket algorithm
* Sliding window counters
* Middleware to track and limit requests
* Distributed rate limiting for microservices

### 17. How do you handle WebSocket connections in Go?

WebSocket handling:
* Use `golang.org/x/net/websocket` or third-party packages
* Implement connection upgrade
* Handle message reading/writing
* Manage connection lifecycle
* Handle concurrent connections

### 18. How do you implement API versioning in Go?

API versioning approaches:
* URL path versioning (`/v1/users`, `/v2/users`)
* Header-based versioning
* Content negotiation
* Backward compatibility strategies

## Expert Concepts

### 19. How do you implement a robust error handling system for a REST API?

Robust error handling includes:
* Custom error types
* Consistent error response format
* Error wrapping for context
* Error logging and monitoring
* Client-friendly error messages
* HTTP status code mapping

### 20. How do you implement caching in a Go web application?

Caching strategies:
* In-memory caching with `sync.Map` or custom solutions
* Redis integration
* HTTP caching headers
* Cache invalidation strategies
* Distributed caching

### 21. How do you implement a robust testing strategy for a Go web application?

Testing strategy should include:
* Unit tests for handlers and business logic
* Middleware testing
* Integration tests
* API endpoint testing
* Mocking external dependencies
* Performance testing
* Security testing 