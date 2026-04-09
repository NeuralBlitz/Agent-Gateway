# Kind Skill

Kubernetes in Docker.

## Commands

### Create Cluster
```
/kind create cluster <name>
```
Create cluster.

### Delete Cluster
```
/kind delete <cluster>
```
Delete cluster.

### List Clusters
```
/kind get clusters
```
List clusters.

### Get Kubeconfig
```
/kind get kubeconfig <cluster>
```
Get kubeconfig.

### Load Image
```
/kind load docker-image <image>
```
Load image into cluster.

### Load Image Archive
```
/kind load image-archive <file>
```
Load image archive.

### Export Logs
```
/kind export logs <dir>
```
Export logs.

### Build Node Image
```
/kind build node-image
```
Build node image.

### Config
```
/kind get clusters -o kind
```
Get cluster config.

### Create Config
```
/kind create config
```
Generate config.

### Node Logs
```
/kind logs <node>
```
Get node logs.

### Test
```
/kind test
```
Run tests.

## Examples

```
/kind create cluster
/kind create cluster mycluster
/kind delete mycluster
/kind get clusters
/kind get kubeconfig kind
/kind load docker-image nginx:latest
/kind load image-archive /tmp/image.tar
/kind export logs ./logs
/kind build node-image
/kind get clusters -o kind
/kind create config
/kind logs kind-control-plane
/kind test
```
