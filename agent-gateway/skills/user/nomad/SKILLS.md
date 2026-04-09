# Nomad Skill

Nomad workload orchestrator.

## Commands

### Job List
```
/nomad jobs
```
List all jobs.

### Job Status
```
/nomad status <job>
```
Show job status.

### Job Run
```
/nomad run <file>
```
Run job from file.

### Job Stop
```
/nomad stop <job>
```
Stop job.

### Job Scale
```
/nomad scale <job> <count>
```
Scale job.

### Job Inspect
```
/nomad inspect <job>
```
Inspect job definition.

### Job Logs
```
/nomad logs <job> [alloc]
```
Get job logs.

### Allocation Status
```
/nomad alloc <id>
```
Show allocation status.

### Allocation Stop
```
/nomad alloc-stop <id>
```
Stop allocation.

### Node List
```
/nomad nodes
```
List client nodes.

### Node Status
```
/nomad node <id>
```
Show node status.

### Node Drain
```
/nomad drain <id>
```
Drain node.

### Eval Status
```
/nomad eval <id>
```
Show evaluation status.

### Plan
```
/nomad plan <file>
```
Run job plan.

## Examples

```
/nomad jobs
/nomad status myapp
/nomad run job.nomad
/nomad stop myapp
/nomad scale myapp 5
/nomad inspect myapp
/nomad logs myapp
/nomad alloc a1b2c3d4
/nomad nodes
/nomad node node-id
/nomad drain node-id
/nomad eval eval-id
/nomad plan job.nomad
```
