# Code Skill

Code analysis, formatting, and quality tools.

## Commands

### Find Files
```
/code find <pattern>
```
Find files matching pattern.

### Search Code
```
/code search <query>
```
Search code for string or regex.

### Find Functions
```
/code functions <file>
```
List functions/methods in file.

### Code Stats
```
/code stats [path]
```
Show code statistics (lines, files, language).

### Format Code
```
/code format <file>
```
Format code using appropriate formatter.

### Lint Code
```
/code lint <file>
```
Lint code for errors.

### Find TODO
```
/code todos
```
Find all TODO/FIXME comments.

### Count Lines
```
/code lines [path]
```
Count lines of code.

### Find Duplicates
```
/code duplicates
```
Find duplicate code blocks.

### Show Imports
```
/code imports <file>
```
Show import statements.

### Dependencies
```
/code deps [file]
```
Show dependencies for file/project.

## Examples

```
/code find "*.py"
/code search "function_name"
/code functions main.py
/code stats src/
/code format app.js
/code lint component.tsx
/code todos
/code lines
```
