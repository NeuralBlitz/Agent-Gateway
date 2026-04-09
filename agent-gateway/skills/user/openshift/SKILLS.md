# OpenShift Skill

OpenShift container platform.

## Commands

### Projects
```
/oc projects
```
List projects.

### New Project
```
/oc new-project <name>
```
Create project.

### Apps
```
/oc apps
```
List applications.

### New App
```
/oc new-app <image>
```
Create new app.

### Start Build
```
/oc start-build <bc>
```
Start build.

### Logs Build
```
/oc build-logs <bc>
```
Build logs.

### Routes
```
/oc routes
```
List routes.

### Create Route
```
/oc expose <service>
```
Expose service.

### Templates
```
/oc templates
```
List templates.

### Process Template
```
/oc process <template>
```
Process template.

### Create
```
/oc create -f <file>
```
Create resource.

### Apply
```
/oc apply -f <file>
```
Apply resource.

### Delete
```
/oc delete <resource>
```
Delete resource.

### Get
```
/oc get <resource>
```
Get resources.

### Describe
```
/oc describe <resource>
```
Describe resource.

### Logs
```
/oc logs <pod>
```
Pod logs.

### RSH
```
/oc rsh <pod>
```
Shell to pod.

## Examples

```
/oc projects
/oc new-project myproject
/oc apps
/oc new-app nginx
/oc start-build myapp
/oc build-logs myapp-1
/oc routes
/oc expose service myapp
/oc templates
/oc process template
/oc create -f deployment.yaml
/oc apply -f configmap.yaml
/oc delete pod myapp
/oc get pods
/oc describe deployment myapp
/oc logs myapp-abc123
/oc rsh myapp-abc123
```
