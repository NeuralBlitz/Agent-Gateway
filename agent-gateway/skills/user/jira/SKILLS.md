# Jira Skill

Jira project management and issue tracking.

## Commands

### List Issues
```
/jira issues [project]
```
List issues for project.

### Create Issue
```
/jira create <project> <type> <summary>
```
Create new issue. Types: bug, task, story, epic.

### Get Issue
```
/jira get <issue-key>
```
Get issue details.

### Update Issue
```
/jira update <issue-key> <field> <value>
```
Update issue field.

### Assign Issue
```
/jira assign <issue-key> <user>
```
Assign issue to user.

### Comment
```
/jira comment <issue-key> <text>
```
Add comment to issue.

### Transition
```
/jira transition <issue-key> <status>
```
Transition issue. Status: todo, in-progress, done.

### Search
```
/jira search <query>
```
Search issues with JQL.

### List Projects
```
/jira projects
```
List all projects.

### Create Project
```
/jira create-project <name> <key>
```
Create new project.

### Sprints
```
/jira sprints <board>
```
List sprints for board.

### Add to Sprint
```
/jira add-sprint <issue> <sprint>
```
Add issue to sprint.

### Backlog
```
/jira backlog <project>
```
Show project backlog.

### Epics
```
/jira epics <project>
```
List epics for project.

### Attach File
```
/jira attach <issue> <file>
```
Attach file to issue.

## Examples

```
/jira issues PROJ
/jira create PROJ bug "Fix login error"
/jira get PROJ-123
/jira update PROJ-123 priority high
/jira assign PROJ-123 john
/jira comment PROJ-123 "Working on this"
/jira transition PROJ-123 done
/jira search "assignee = currentUser()"
/jira projects
/jira sprints board
```
