# Maven Skill

Apache Maven build tool.

## Commands

### Compile
```
/mvn compile
```
Compile source.

### Test
```
/mvn test
```
Run tests.

### Package
```
/mvn package
```
Build package.

### Install
```
/mvn install
```
Install locally.

### Deploy
```
/mvn deploy
```
Deploy to remote.

### Clean
```
/mvn clean
```
Clean build.

### Clean Package
```
/mvn clean package
```
Clean and package.

### Skip Tests
```
/mvn package -DskipTests
```
Package without tests.

### Dependency Tree
```
/mvn dependency:tree
```
Show dependency tree.

### Analyze
```
/mvn dependency:analyze
```
Analyze dependencies.

### Run
```
/mvn exec:java
```
Run main class.

### archetype
```
/mvn archetype:generate
```
Generate project.

### Plugin List
```
/mvn help:describe -Dplugin=<plugin>
```
Describe plugin.

### Versions
```
/mvn versions:display-dependency-updates
```
Check updates.

## Examples

```
/mvn compile
/mvn test
/mvn package
/mvn install
/mvn deploy
/mvn clean
/mvn clean package
/mvn package -DskipTests
/mvn dependency:tree
/mvn dependency:analyze
/mvn exec:java -Dexec.mainClass=com.app.Main
/mvn archetype:generate
/mvn versions:display-dependency-updates
```
