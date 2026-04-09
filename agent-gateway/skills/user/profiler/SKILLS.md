# Profiler Skill

Performance profiling and analysis.

## Commands

### CPU Profile
```
/profiler cpu <pid>
```
Profile CPU usage.

### Memory Profile
```
/profiler memory <pid>
```
Profile memory usage.

### Heap Dump
```
/profiler heap <pid>
```
Capture heap dump.

### Trace
```
/profiler trace <pid>
```
Trace system calls.

### Network Profile
```
/profiler network
```
Profile network usage.

### IO Profile
```
/profiler io <pid>
```
Profile I/O operations.

### Flame Graph
```
/profiler flame <pid>
```
Generate flame graph.

### Top Functions
```
/profiler top <pid>
```
Show top functions.

### Sample
```
/profiler sample <pid> <duration>
```
Sample for duration.

### Report
```
/profiler report
```
Show profiler report.

### Stop
```
/profiler stop
```
Stop profiling.

## Examples

```
/profiler cpu 12345
/profiler memory 12345
/profiler heap 12345
/profiler trace 12345
/profiler network
/profiler io 12345
/profiler flame 12345
/profiler top 12345
/profiler sample 12345 30
/profiler report
```
