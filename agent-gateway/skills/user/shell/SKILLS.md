# Shell Skill

Shell scripting and automation.

## Commands

### Run Command
```
/shell run <command>
```
Run shell command.

### Script
```
/shell script <code>
```
Execute inline script.

### Eval
```
/shell eval <expression>
```
Evaluate expression.

### Background Job
```
/shell bg <command>
```
Run command in background.

### Foreground Job
```
/shell fg <job>
```
Bring job to foreground.

### List Jobs
```
/shell jobs
```
List background jobs.

### Wait Job
```
/shell wait <job>
```
Wait for job.

### Pipe
```
/shell pipe <cmd1> <cmd2>
```
Pipe commands.

### Chain
```
/shell chain <cmd1> <cmd2>
```
Chain commands (cmd1 && cmd2).

### Or Chain
```
/shell or <cmd1> <cmd2>
```
Or chain (cmd1 || cmd2).

### Subshell
```
/shell sub <command>
```
Run in subshell.

### Environment
```
/shell env <var=value>
```
Set environment variable.

### Alias
```
/shell alias <name> <command>
```
Create alias.

### History
```
/shell history [count]
```
Show command history.

### Complete
```
/shell complete <command>
```
Show completions.

## Examples

```
/shell run "ls -la"
/shell script "for i in {1..5}; do echo $i; done"
/shell bg "while true; do date; sleep 10; done"
/shell jobs
/shell pipe "ls" "grep .txt"
/shell chain "make" "make test"
/shell env "DEBUG=true"
/shell alias ll "ls -la"
/shell history 20
```
