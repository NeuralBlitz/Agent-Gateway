# Make Skill

Make build automation.

## Commands

### Build Target
```
/make [target]
```
Build target. Default: all.

### Clean
```
/make clean
```
Clean build artifacts.

### Install
```
/make install
```
Install built files.

### Rebuild
```
/make rebuild
```
Clean and build.

### Debug
```
/make debug
```
Build with debug symbols.

### Release
```
/make release
```
Build release version.

### Parallel
```
/make -j<jobs>
```
Parallel build.

### Dry Run
```
/make -n
```
Show commands without running.

### Force
```
/make -B
```
Force rebuild.

### Keep Going
```
/make -k
```
Keep going on errors.

### Variables
```
/make vars
```
Show variables.

### Targets
```
/make targets
```
List available targets.

### Phony
```
/make .phony
```
List phony targets.

## Examples

```
/make
/make all
/make clean
/make install
/make rebuild
/make debug CFLAGS="-g -O0"
/make release
/make -j4
/make -n
/make -B
/make -k
/make vars
/make targets
```
