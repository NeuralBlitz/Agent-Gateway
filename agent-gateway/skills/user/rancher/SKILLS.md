# Rancher Skill

Rancher management.

## Commands

### Clusters
```
/rancher clusters
```
List clusters.

### Create Cluster
```
/rancher cluster create <name>
```
Create cluster.

### Delete Cluster
```
/rancher cluster delete <cluster>
```
Delete cluster.

### Projects
```
/rancher projects
```
List projects.

### Create Project
```
/rancher project create <name>
```
Create project.

### Workloads
```
/rancher workloads <project>
```
List workloads.

### Apps
```
/rancher apps <project>
```
List apps.

### Catalog
```
/rancher catalog
```
List catalogs.

### Users
```
/rancher users
```
List users.

### Nodes
```
/rancher nodes <cluster>
```
List nodes.

### Node Pools
```
/rancher nodepools
```
List node pools.

### Settings
```
/rancher settings
```
Show settings.

### Monitoring
```
/rancher monitoring <cluster>
```
Enable/disable monitoring.

### Logging
```
/rancher logging <cluster>
```
Enable/disable logging.

## Examples

```
/rancher clusters
/rancher cluster create mycluster
/rancher cluster delete old-cluster
/rancher projects
/rancher project create myproject
/rancher workloads myproject
/rancher apps myproject
/rancher catalog
/rancher users
/rancher nodes mycluster
/rancher nodepools
/rancher settings
/rancher monitoring mycluster enable
/rancher logging mycluster enable
```
