# Git Skill

Git version control operations.

## Commands

### Repository Status
```
/git status
```
Show working tree status.

### Stage Changes
```
/git add <files>
```
Stage files for commit. Use "." for all.

### Commit
```
/git commit <message>
```
Commit staged changes.

### Push
```
/git push [remote] [branch]
```
Push to remote repository.

### Pull
```
/git pull [remote] [branch]
```
Pull from remote repository.

### Branch List
```
/git branch
```
List local branches.

### Create Branch
```
/git branch-create <name>
```
Create new branch.

### Switch Branch
```
/git checkout <branch>
```
Switch to branch.

### Merge Branch
```
/git merge <branch>
```
Merge branch into current.

### View Log
```
/git log [count]
```
Show commit history. Default: 10 commits.

### Diff
```
/git diff [file]
```
Show unstaged changes.

### Stash
```
/git stash [message]
```
Stash changes.

### Unstash
```
/git stash pop
```
Apply stashed changes.

### Reset
```
/git reset [mode] [commit]
```
Reset HEAD. Modes: soft, mixed, hard.

### Tag
```
/git tag <name> [message]
```
Create annotated tag.

## Examples

```
/git status
/git add .
/git commit "Fix bug in login"
/git push origin main
/git branch
/git checkout feature/new-login
/git merge develop
/git log
/git stash "WIP"
```
