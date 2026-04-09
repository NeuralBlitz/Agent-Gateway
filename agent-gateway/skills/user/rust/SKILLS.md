# Rust Skill

Rust package and project management.

## Commands

### New Project
```
/rust new <name>
```
Create new project.

### Build
```
/rust build [target]
```
Build project.

### Run
```
/rust run [args]
```
Run project.

### Test
```
/rust test [args]
```
Run tests.

### Doc
```
/rust doc [open]
```
Generate documentation.

### Check
```
/rust check
```
Check code without building.

### Format
```
/rust format
```
Format code.

### Lint
```
/rust clippy
```
Run linter.

### Add Dependency
```
/rust add <crate>
```
Add dependency.

### Remove Dependency
```
/rust remove <crate>
```
Remove dependency.

### Update
```
/rust update
```
Update dependencies.

### Build Release
```
/rust release
```
Build for release.

### Benchmark
```
/rust bench
```
Run benchmarks.

### Clean
```
/rust clean
```
Clean build artifacts.

### Publish
```
/rust publish
```
Publish to crates.io.

## Examples

```
/rust new myproject
/rust build
/rust run
/rust run -- --arg
/rust test
/rust doc
/rust doc --open
/rust check
/rust format
/rust clippy
/rust add serde
/rust remove old-crate
/rust update
/rust release
/rust bench
/rust clean
/rust publish
```
