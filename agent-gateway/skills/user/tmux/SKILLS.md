# Tmux Skill

Terminal multiplexer commands.

## Commands

### New Session
```
/tmux new <name>
```
Create new tmux session.

### Attach
```
/tmux attach <session>
```
Attach to session.

### Detach
```
/tmux detach
```
Detach from session (Ctrl+b d).

### List Sessions
```
/tmux sessions
```
List all sessions.

### Split Horizontal
```
/tmux split
```
Split pane horizontally.

### Split Vertical
```
/tmux vsplit
```
Split pane vertically.

### Navigate Panes
```
/tmux next-pane
```
Move to next pane.

### Resize Pane
```
/tmux resize <direction> <size>
```
Resize pane (up, down, left, right).

### Kill Pane
```
/tmux kill-pane
```
Close current pane.

### New Window
```
/tmux window <name>
```
Create new window.

### List Windows
```
/tmux windows
```
List windows.

### Next Window
```
/tmux next-window
```
Switch to next window.

### Previous Window
```
/tmux prev-window
```
Switch to previous window.

### Rename Window
```
/tmux rename <name>
```
Rename current window.

### Scroll Mode
```
/tmux scroll
```
Enter scroll mode (Ctrl+b [).

## Examples

```
/tmux new myproject
/tmux attach myproject
/tmux sessions
/tmux split
/tmux vsplit
/tmux windows
/tmux resize up 10
```
