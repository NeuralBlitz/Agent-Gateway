---
name: go
description: Go programming language best practices and patterns
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: programming
---
## What I do
- Write idiomatic Go code following effective Go guidelines
- Handle errors explicitly, never ignore them
- Use interfaces for abstraction
- Manage concurrency with goroutines and channels
- Follow Go module dependency management
- Use context for cancellation and timeouts
- Write table-driven tests
- Implement proper error wrapping

## When to use me
When writing or reviewing Go code. All Go code should follow standard Go conventions.

## Error Handling
```go
func (s *Service) Process(ctx context.Context, input string) error {
    if err := ctx.Err(); err != nil {
        return fmt.Errorf("context cancelled: %w", err)
    }
    if input == "" {
        return ErrInvalidInput
    }
    result, err := s.backend.Process(input)
    if err != nil {
        return fmt.Errorf("backend processing failed: %w", err)
    }
    return nil
}
```

## Concurrency
```go
func ProcessAll(ctx context.Context, items []Item) []Result {
    results := make(chan Result, len(items))
    var wg sync.WaitGroup

    for _, item := range items {
        wg.Add(1)
        go func(it Item) {
            defer wg.Done()
            result, err := ProcessItem(it)
            if err != nil {
                log.Printf("item %s: %v", it.ID, err)
                return
            }
            results <- result
        }(item)
    }

    go func() {
        wg.Wait()
        close(results)
    }()

    var out []Result
    for r := range results {
        out = append(out, r)
    }
    return out
}
```

## Interfaces
```go
type Processor interface {
    Process(ctx context.Context, data []byte) ([]byte, error)
    Name() string
}

func NewProcessor(p Processor) *ProcessorWrapper {
    return &ProcessorWrapper{p: p}
}
```

## Testing
```go
func TestProcess(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        want    string
        wantErr bool
    }{
        {"valid input", "hello", "HELLO", false},
        {"empty input", "", "", true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := Process(tt.input)
            if (err != nil) != tt.wantErr {
                t.Errorf("Process() error = %v, wantErr %v", err, tt.wantErr)
                return
            }
            if got != tt.want {
                t.Errorf("Process() = %v, want %v", got, tt.want)
            }
        })
    }
}
```

## Go Modules
```bash
go mod init github.com/user/repo
go get package@version
go mod tidy
go list -m all
```
