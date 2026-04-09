# Docker Skill

Docker container management and operations.

## Commands

### List Containers
```
/docker ps [all]
```
List running containers. Use "all" to include stopped.

### List Images
```
/docker images
```
List local Docker images.

### Pull Image
```
/docker pull <image>
```
Pull a Docker image from registry.

### Run Container
```
/docker run <image> [command]
```
Run a container from an image.

### Stop Container
```
/docker stop <container>
```
Stop a running container.

### Remove Container
```
/docker rm <container>
```
Remove a stopped container.

### Container Logs
```
/docker logs <container> [lines]
```
View container logs. Default: 50 lines.

### Container Exec
```
/docker exec <container> <command>
```
Execute command in running container.

### Container Stats
```
/docker stats [container]
```
Show container resource usage.

### Clean Up
```
/docker clean
```
Remove stopped containers and dangling images.

### Build Image
```
/docker build <path> [tag]
```
Build Docker image from Dockerfile.

### Docker Compose
```
/docker compose <command> [args]
```
Run docker-compose commands.

## Examples

```
/docker ps
/docker images
/docker pull nginx:latest
/docker run nginx
/docker stop mycontainer
/docker logs webapp 100
/docker exec webapp bash
/docker clean
/docker build . myapp:latest
```
