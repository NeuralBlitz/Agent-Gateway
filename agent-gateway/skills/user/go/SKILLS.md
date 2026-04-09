# Go Skill

Go programming language.

## Commands

### New Project
```
/go new <module>
```
Initialize new module.

### Build
```
/go build [package]
```
Build package.

### Run
```
/go run <file>
```
Run file.

### Test
```
/go test [package]
```
Run tests.

### Get
```
/go get <package>
```
Get package.

### Install
```
/go install <package>
```
Install binary.

### Mod Init
```
/go mod init <name>
```
Initialize go.mod.

### Mod Download
```
/go mod download
```
Download dependencies.

### Mod Tidy
```
/go mod tidy
```
Tidy go.mod.

### Mod Verify
```
/go mod verify
```
Verify dependencies.

### Vet
```
/go vet <package>
```
Run vet.

### Fmt
```
/go fmt <file>
```
Format code.

### Generate
```
/go generate <file>
```
Run generate.

### Build Tag
```
/go build -tags <tags>
```
Build with tags.

### Race
```
/go test -race <package>
```
Test with race detector.

### Cover
```
/go test -cover <package>
```
Test with coverage.

### Doc
```
/go doc <package>
```
Show documentation.

### Env
```
/go env
```
Show environment.

## Examples

```
/go new mymodule
/go build ./...
/go run main.go
/go test ./...
/go get github.com/gin-gonic/gin
/go install github.com/example/cmd
/go mod init myapp
/go mod download
/go mod tidy
/go mod verify
/go vet ./...
/go fmt main.go
/go generate ./...
/go build -tags prod main.go
/go test -race ./...
/go test -cover ./...
/go doc fmt
/go env
```
