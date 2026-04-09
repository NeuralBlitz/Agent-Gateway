# Tekton Skill

Tekton CI/CD pipelines.

## Commands

### List Tasks
```
/tekton tasks
```
List tasks.

### Get Task
```
/tekton task <name>
```
Get task details.

### Run Task
```
/tekton taskrun <task> <params>
```
Run task.

### List Pipelines
```
/tekton pipelines
```
List pipelines.

### Run Pipeline
```
/tekton pipelinerun <pipeline>
```
Run pipeline.

### List Runs
```
/tekton runs
```
List task/pipeline runs.

### Delete Run
```
/tekton delete-run <name>
```
Delete run.

### Cancel Run
```
/tekton cancel <name>
```
Cancel run.

### Logs
```
/tekton logs <run>
```
Get run logs.

### Describe
```
/tekton describe <resource>
```
Describe resource.

### Export
```
/tekton export <resource>
```
Export YAML.

### Install
```
/tekton install
```
Install Tekton.

### Uninstall
```
/tekton uninstall
```
Uninstall Tekton.

### Version
```
/tekton version
```
Show version.

## Examples

```
/tekton tasks
/tekton task mytask
/tekton taskrun mytask param1=value1
/tekton pipelines
/tekton pipelinerun mypipeline
/tekton runs
/tekton delete-run myrun
/tekton cancel myrun
/tekton logs myrun
/tekton describe task mytask
/tekton export task mytask
/tekton install
/tekton version
```
