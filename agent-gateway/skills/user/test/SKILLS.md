# Test Skill

Testing framework and test execution.

## Commands

### Run All Tests
```
/test run [args]
```
Run all tests.

### Run Specific
```
/test run <pattern> [args]
```
Run tests matching pattern.

### Run Unit
```
/test unit
```
Run unit tests only.

### Run Integration
```
/test integration
```
Run integration tests only.

### Run E2E
```
/test e2e
```
Run end-to-end tests.

### Coverage
```
/test coverage
```
Run tests with coverage report.

### Watch Tests
```
/test watch
```
Run tests in watch mode.

### Test File
```
/test file <path>
```
Run tests in specific file.

### List Tests
```
/test list
```
List all test cases.

### Debug Test
```
/test debug <test_name>
```
Debug specific test.

## Examples

```
/test run
/test run user_auth
/test unit
/test integration
/test coverage
/test watch
/test file tests/api.test.ts
/test list
```
