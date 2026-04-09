# CI Skill

CI/CD pipeline management.

## Commands

### List Pipelines
```
/ci list
```
List CI pipelines.

### Run Pipeline
```
/ci run <branch>
```
Run pipeline for branch.

### Pipeline Status
```
/ci status <pipeline>
```
Check pipeline status.

### Pipeline Logs
```
/ci logs <pipeline>
```
Get pipeline logs.

### Cancel Pipeline
```
/ci cancel <pipeline>
```
Cancel running pipeline.

### Retry Pipeline
```
/ci retry <pipeline>
```
Retry failed pipeline.

### Artifacts
```
/ci artifacts <pipeline>
```
List pipeline artifacts.

### Download Artifact
```
/ci download <pipeline> <artifact>
```
Download artifact.

### Trigger
```
/ci trigger <event>
```
Trigger pipeline event.

## Examples

```
/ci list
/ci run main
/ci status 12345
/ci logs 12345
/ci cancel 12345
/ci retry 12345
/ci artifacts 12345
/ci trigger deploy
```
