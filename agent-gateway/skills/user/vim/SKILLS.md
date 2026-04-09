# Vim Skill

Vim editor commands and workflows.

## Commands

### Open File
```
/vim <file>
```
Open file in vim.

### Save & Quit
```
/vim save-quit
```
Save and quit (:wq).

### Quit
```
/vim quit
```
Quit without saving (:q!).

### Find
```
/vim find <pattern>
```
Find pattern in file.

### Replace
```
/vim replace <from> <to>
```
Replace all occurrences.

### Go to Line
```
/vim goto <line>
```
Jump to line number.

### Delete Line
```
/vim dline
```
Delete current line (dd).

### Copy Line
```
/vim yank
```
Copy current line (yy).

### Paste
```
/vim paste
```
Paste after cursor (p).

### Undo
```
/vim undo
```
Undo last change (u).

### Redo
```
/vim redo
```
Redo (Ctrl+r).

### Split
```
/vim split
```
Split window horizontally.

### Vertical Split
```
/vim vsplit
```
Split window vertically.

### Buffer List
```
/vim buffers
```
List open buffers.

### Next Buffer
```
/vim next
```
Switch to next buffer.

### Format Code
```
/vim format
```
Format code (==).

### Toggle Line Numbers
```
/vim numbers
```
Toggle line numbers.

### Search Word
```
/vim word <word>
```
Search for word under cursor.

## Examples

```
/vim config.yml
/vim find function_name
/vim replace old new
/vim goto 100
/vim split
/vim buffers
```
