# Kubesec Skill

Kubernetes security scanning.

## Commands

### Scan Resource
```
/kubesec scan <resource-file>
```
Scan Kubernetes resource.

### Scan Deployment
```
/kubesec deployment <file>
```
Scan deployment YAML.

### Scan Pod
```
/kubesec pod <file>
```
Scan pod spec.

### Scan All
```
/kubesec scan-dir <directory>
```
Scan directory.

### Score
```
/kubesec score <file>
```
Show security score.

### Report JSON
```
/kubesec json <file>
```
Output JSON report.

### Critical Issues
```
/kubesec critical <file>
```
Show only critical issues.

### Docker Image Scan
```
/kubesec image <image>
```
Scan Docker image.

### CIS Benchmark
```
/kubesec cis <resource>
```
Run CIS benchmark check.

### Recommendations
```
/kubesec recommend <file>
```
Show recommendations.

## Examples

```
/kubesec scan deployment.yaml
/kubesec deployment pod.yaml
/kubesec pod podspec.yaml
/kubesec scan-dir ./manifests
/kubesec score deployment.yaml
/kubesec json deployment.yaml
/kubesec critical deployment.yaml
/kubesec image nginx:latest
/kubesec cis pod.yaml
/kubesec recommend deployment.yaml
```
