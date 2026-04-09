# File Skill

File and directory operations.

## Commands

### List Files
```
/file ls [path]
```
List files. Default: current directory.

### Find File
```
/file find <pattern>
```
Find files by name pattern.

### File Info
```
/file info <path>
```
Show file details (size, permissions, dates).

### Copy
```
/file copy <source> <dest>
```
Copy file or directory.

### Move
```
/file move <source> <dest>
```
Move file or directory.

### Delete
```
/file delete <path>
```
Delete file or directory.

### Create Dir
```
/file mkdir <path>
```
Create directory.

### Read File
```
/file read <path>
```
Read file contents.

### Write File
```
/file write <path> <content>
```
Write content to file.

### Append
```
/file append <path> <content>
```
Append to file.

### Permissions
```
/file chmod <path> <mode>
```
Change permissions.

### Owner
```
/file chown <path> <owner>
```
Change owner.

## Examples

```
/file ls
/file find "*.log"
/file info myfile.txt
/file copy a.txt b.txt
/file move old new
/file delete temp.txt
/file mkdir newdir
/file read config.json
/file write output.txt "Hello"
/file chmod script.sh 755
```
