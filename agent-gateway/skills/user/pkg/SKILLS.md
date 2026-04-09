# Package Manager Skill

System package management (apt, yum, pacman, brew).

## Commands

### Install Package
```
/pkg install <package>
```
Install package.

### Remove Package
```
/pkg remove <package>
```
Remove package.

### Update Package
```
/pkg update <package>
```
Update specific package.

### Upgrade All
```
/pkg upgrade
```
Upgrade all packages.

### Search
```
/pkg search <query>
```
Search for package.

### Info
```
/pkg info <package>
```
Show package information.

### List Installed
```
/pkg list [pattern]
```
List installed packages.

### List Updates
```
/pkg updates
```
List available updates.

### Clean Cache
```
/pkg clean
```
Clean package cache.

### Fix Broken
```
/pkg fix
```
Fix broken dependencies.

### Add Repository
```
/pkg add-repo <repo>
```
Add package repository.

### List Repos
```
/pkg repos
```
List configured repositories.

### Depends
```
/pkg depends <package>
```
Show package dependencies.

### Reverse Depends
```
/pkg rdepends <package>
```
Show packages depending on this.

## Examples

```
/pkg install nginx
/pkg remove old-package
/pkg update vim
/pkg upgrade
/pkg search "python"
/pkg info nginx
/pkg list
/pkg updates
/pkg clean
/pkg fix
/pkg repos
/pkg depends nginx
```
