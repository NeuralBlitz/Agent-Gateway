# Apache Skill

Apache HTTP server management.

## Commands

### Start
```
/apache start
```
Start Apache.

### Stop
```
/apache stop
```
Stop Apache.

### Restart
```
/apache restart
```
Restart Apache.

### Reload
```
/apache reload
```
Reload configuration.

### Test Config
```
/apache test
```
Test configuration.

### Show Version
```
/apache version
```
Show Apache version.

### Modules
```
/apache modules
```
List loaded modules.

### Enable Module
```
/apache enable-module <module>
```
Enable module.

### Disable Module
```
/apache disable-module <module>
```
Disable module.

### List Sites
```
/apache sites
```
List virtual hosts.

### Enable Site
```
/apache enable-site <site>
```
Enable site.

### Disable Site
```
/apache disable-site <site>
```
Disable site.

### Logs
```
/apache logs [type]
```
Show logs.

## Examples

```
/apache start
/apache stop
/apache restart
/apache test
/apache version
/apache modules
/apache sites
/apache enable-site mysite
/apache logs error
```
