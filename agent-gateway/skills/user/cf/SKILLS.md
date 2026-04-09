# CloudFormation Skill

AWS CloudFormation templates.

## Commands

### Stack List
```
/cf list
```
List stacks.

### Stack Create
```
/cf create <template>
```
Create stack.

### Stack Update
```
/cf update <stack>
```
Update stack.

### Stack Delete
```
/cf delete <stack>
```
Delete stack.

### Stack Status
```
/cf status <stack>
```
Show stack status.

### Stack Events
```
/cf events <stack>
```
Show stack events.

### Stack Resources
```
/cf resources <stack>
```
List stack resources.

### Stack Output
```
/cf output <stack>
```
Show outputs.

### Validate
```
/cf validate <template>
```
Validate template.

### Describe
```
/cf describe <stack>
```
Describe stack.

### Drift
```
/cf drift <stack>
```
Check drift.

### Package
```
/cf package <template>
```
Package template.

### Deploy
```
/cf deploy <template>
```
Package and deploy.

### Estimate
```
/cf estimate <template>
```
Estimate cost.

## Examples

```
/cf list
/cf create my-stack template.yaml
/cf update my-stack
/cf delete my-stack
/cf status my-stack
/cf events my-stack
/cf resources my-stack
/cf output my-stack
/cf validate template.yaml
/cf describe my-stack
/cf drift my-stack
/cf package template.yaml
/cf deploy my-stack template.yaml
/cf estimate template.yaml
```
