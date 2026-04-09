# Sentry Skill

Application monitoring and error tracking.

## Commands

### List Issues
```
/sentry issues [project]
```
List issues.

### Issue Details
```
/sentry issue <id>
```
Show issue details.

### Resolve
```
/sentry resolve <issue>
```
Resolve issue.

### Breadcrumbs
```
/sentry breadcrumbs <event>
```
Show event breadcrumbs.

### Events
```
/sentry events <issue>
```
List events for issue.

### Deploys
```
/sentry deploys <project>
```
List deploys.

### Releases
```
/sentry releases <project>
```
List releases.

### Create Release
```
/sentry release <version>
```
Create release.

### Assign
```
/sentry assign <issue> <user>
```
Assign issue.

### Comments
```
/sentry comment <issue> <text>
```
Add comment.

### Search
```
/sentry search <query>
```
Search issues.

### Stats
```
/sentry stats
```
Show statistics.

### Projects
```
/sentry projects
```
List projects.

### Teams
```
/sentry teams
```
List teams.

## Examples

```
/sentry issues myproject
/sentry issue ABC123
/sentry resolve ABC123
/sentry breadcrumbs event-id
/sentry events ABC123
/sentry deploys myproject
/sentry releases myproject
/sentry release 1.0.0
/sentry assign ABC123 john
/sentry comment ABC123 "Fixed in PR"
/sentry search "is:unresolved"
/sentry stats
/sentry projects
```
