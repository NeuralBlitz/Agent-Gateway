# Docker Compose Skill

Docker Compose orchestration.

## Commands

### Up
```
/compose up [service]
```
Start services.

### Down
```
/compose down
```
Stop services.

### Build
```
/compose build [service]
```
Build images.

### Start
```
/compose start [service]
```
Start containers.

### Stop
```
/compose stop [service]
```
Stop containers.

### Restart
```
/compose restart [service]
```
Restart containers.

### Logs
```
/compose logs [service]
```
View logs.

### Ps
```
/compose ps
```
List containers.

### Exec
```
/compose exec <service> <command>
```
Execute command.

### Run
```
/compose run <service> <command>
```
Run one-off command.

### Pull
```
/compose pull [service]
```
Pull images.

### Config
```
/compose config
```
Validate and show config.

### Scale
```
/compose scale <service>=<count>
```
Scale service.

### Kill
```
/compose kill
```
Kill containers.

### Pull
```
/compose pull
```
Pull service images.

### Top
```
/compose top
```
Show processes.

### Images
```
/compose images
```
List images.

## Examples

```
/compose up
/compose up -d
/compose up api
/compose down
/compose build
/compose build web
/compose start
/compose stop
/compose restart nginx
/compose logs -f
/compose ps
/compose exec web bash
/compose run db psql
/compose config
/compose scale worker=3
/compose kill
/compose top
```
