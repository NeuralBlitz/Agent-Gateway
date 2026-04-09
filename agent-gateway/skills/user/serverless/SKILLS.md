# Serverless Skill

Serverless Framework management.

## Commands

### Create
```
/serverless create [template]
```
Create serverless project.

### Deploy
```
/serverless deploy [stage]
```
Deploy to stage.

### Deploy Function
```
/serverless deploy function <function>
```
Deploy single function.

### Invoke
```
/serverless invoke <function> [data]
```
Invoke function.

### Invoke Local
```
/serverless invoke local <function> <data>
```
Invoke locally.

### Remove
```
/serverless remove [stage]
```
Remove deployment.

### Logs
```
/serverless logs <function>
```
Get function logs.

### Info
```
/serverless info
```
Show deployment info.

### Package
```
/serverless package
```
Package deployment.

### Config Credentials
```
/serverless config credentials --provider <provider> --key <key> --secret <secret>
```
Configure credentials.

### Plugin Install
```
/serverless plugin install <plugin>
```
Install plugin.

### Login
```
/serverless login
```
Login to serverless dashboard.

### Metrics
```
/serverless metrics <function>
```
Show metrics.

## Examples

```
/serverless create
/serverless create -t aws-python3
/serverless deploy
/serverless deploy production
/serverless deploy function myFunction
/serverless invoke myFunction
/serverless invoke local myFunction '{"key": "value"}'
/serverless remove
/serverless remove prod
/serverless logs -f myFunction
/serverless info
/serverless package
/serverless plugin install serverless-webpack
/serverless login
/serverless metrics myFunction
```
