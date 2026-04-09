# Cluster-API Skill

Cluster API management.

## Commands

### List Clusters
```
/cluster-api clusters
```
List clusters.

### Get Cluster
```
/cluster-api cluster <name>
```
Get cluster details.

### Create Cluster
```
/cluster-api create cluster <name>
```
Create cluster.

### Delete Cluster
```
/cluster-api delete cluster <name>
```
Delete cluster.

### List Machines
```
/cluster-api machines
```
List machines.

### List MachineDeployments
```
/cluster-api machine-deployments
```
List machine deployments.

### List MachineSets
```
/cluster-api machine-sets
```
List machine sets.

### Get Kubeconfig
```
/cluster-api kubeconfig <cluster>
```
Get kubeconfig.

### List Bootstrap
```
/cluster-api bootstrap
```
List bootstrap configs.

### List ControlPlane
```
/cluster-api controlplane
```
List control planes.

### List Infra
```
/cluster-api infra
```
List infrastructure machines.

### Pause
```
/cluster-api pause <cluster>
```
Pause reconciliation.

### Resume
```
/cluster-api resume <cluster>
```
Resume reconciliation.

### Set Scale
```
/cluster-api scale <deployment> <replicas>
```
Scale machine deployment.

## Examples

```
/cluster-api clusters
/cluster-api cluster mycluster
/cluster-api create cluster mycluster
/cluster-api delete cluster mycluster
/cluster-api machines
/cluster-api machine-deployments
/cluster-api machine-sets
/cluster-api kubeconfig mycluster
/cluster-api bootstrap
/cluster-api controlplane
/cluster-api infra
/cluster-api pause mycluster
/cluster-api resume mycluster
/cluster-api scale mydeployment 3
```
