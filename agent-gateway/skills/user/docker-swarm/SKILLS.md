# Docker-Swarm Skill

Docker Swarm orchestration.

## Commands

### Init
```
/docker-swarm init
```
Initialize swarm.

### Join
```
/docker-swarm join <manager>
```
Join swarm.

### Leave
```
/docker-swarm leave
```
Leave swarm.

### Nodes
```
/docker-swarm nodes
```
List nodes.

### Services
```
/docker-swarm services
```
List services.

### Create Service
```
/docker-swarm service create <name> <image>
```
Create service.

### Update Service
```
/docker-swarm service update <name>
```
Update service.

### Scale Service
```
/docker-swarm service scale <name> <replicas>
```
Scale service.

### Remove Service
```
/docker-swarm service rm <name>
```
Remove service.

### Stacks
```
/docker-swarm stack ls
```
List stacks.

### Deploy Stack
```
/docker-swarm stack deploy <name>
```
Deploy stack.

### Remove Stack
```
/docker-swarm stack rm <name>
```
Remove stack.

### Tasks
```
/docker-swarm tasks
```
List tasks.

### Logs
```
/docker-swarm service logs <service>
```
Get service logs.

### Configs
```
/docker-swarm config ls
```
List configs.

### Secrets
```
/docker-swarm secret ls
```
List secrets.

## Examples

```
/docker-swarm init
/docker-swarm join --token SWMTKN-1-xxx manager:2377
/docker-swarm leave
/docker-swarm nodes
/docker-swarm services
/docker-swarm service create web nginx
/docker-swarm service update web --replicas 5
/docker-swarm service scale web 3
/docker-swarm service rm web
/docker-swarm stack ls
/docker-swarm stack deploy myapp
/docker-swarm stack rm myapp
/docker-swarm tasks
/docker-swarm service logs web
/docker-swarm config ls
/docker-swarm secret ls
```
