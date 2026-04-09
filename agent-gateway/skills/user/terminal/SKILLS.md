# Terminal Skill

Terminal operations and configuration.

## Commands

### Open Terminal
```
/terminal open
```
Open new terminal.

### List Sessions
```
/terminal list
```
List terminal sessions.

### Send Command
```
/terminal send <session> <command>
```
Send command to session.

### Kill Session
```
/terminal kill <session>
```
Kill terminal session.

### Rename
```
/terminal rename <old> <new>
```
Rename session.

### Split
```
/terminal split [direction]
```
Split terminal (horizontal/vertical).

### Layout
```
/terminal layout <type>
```
Set layout (tiled, stacked).

### Font Size
```
/terminal font <size>
```
Change font size.

### Theme
```
/terminal theme <name>
```
Set theme.

### Copy/Paste
```
/terminal copy
```
Copy selection.

### Paste
```
/terminal paste
```
Paste clipboard.

### Clear
```
/terminal clear
```
Clear terminal.

### Reset
```
/terminal reset
```
Reset terminal.

### Scroll Up/Down
```
/terminal scroll <lines>
```
Scroll up/down.

## Examples

```
/terminal open
/terminal list
/terminal send main "ls -la"
/terminal kill old-session
/terminal rename session1 work
/terminal split horizontal
/terminal layout tiled
/terminal font 14
/terminal theme dracula
/terminal clear
```
