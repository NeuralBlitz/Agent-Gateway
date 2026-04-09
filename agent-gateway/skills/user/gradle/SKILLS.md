# Gradle Skill

Gradle build automation.

## Commands

### Build
```
/gradle build
```
Build project.

### Run
```
/gradle run [args]
```
Run application.

### Test
```
/gradle test
```
Run tests.

### Clean
```
/gradle clean
```
Clean build.

### Dependencies
```
/gradle deps
```
Show dependencies.

### Projects
```
/gradle projects
```
List projects.

### Tasks
```
/gradle tasks [group]
```
List tasks.

### Wrapper
```
/gradle wrapper
```
Generate wrapper.

### Publish
```
/gradle publish
```
Publish artifacts.

### Artifacts
```
/gradle artifacts
```
Show artifacts.

### Build Dashboard
```
/gradle buildEnvironment
```
Show build environment.

### Dependencies
```
/gradle dependencyInsight <dep>
```
Insight on dependency.

### Java Version
```
/gradle java
```
Setup Java.

### Kotlin DSL
```
/gradle kts
```
Convert to Kotlin DSL.

## Examples

```
/gradle build
/gradle run --args="arg1 arg2"
/gradle test
/gradle test --tests "*Test"
/gradle clean
/gradle dependencies
/gradle projects
/gradle tasks
/gradle tasks --group build
/gradle wrapper --gradle-version 8.0
/gradle publish
/gradle artifacts
/gradle dependencyInsight log4j
```
