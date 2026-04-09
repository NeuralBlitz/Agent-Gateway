# SSH Skill

SSH connection and key management.

## Commands

### Connect
```
/ssh connect <host>
```
Connect to host.

### Connect User
```
/ssh connect-user <user> <host>
```
Connect as user.

### Copy ID
```
/ssh copy-id <host>
```
Copy SSH key to host.

### Key Gen
```
/ssh keygen [type]
```
Generate SSH key. Types: rsa, ed25519, ecdsa.

### Key List
```
/ssh keys
```
List SSH keys.

### Key Add
```
/ssh add <key>
```
Add key to agent.

### Key Remove
```
/ssh remove <key>
```
Remove key from agent.

### Config
```
/ssh config
```
Show SSH config.

### Add Config
```
/ssh add-config <host> <options>
```
Add host to config.

### Test Connection
```
/ssh test <host>
```
Test SSH connection.

### Forward Port
```
/ssh forward <host> <local> <remote>
```
Setup port forwarding.

## Examples

```
/ssh connect server1
/ssh connect-user admin 192.168.1.1
/ssh copy-id webserver
/ssh keygen ed25519
/ssh keys
/ssh add ~/.ssh/id_ed25519
/ssh config
/ssh test app-server
/ssh forward localhost 8080 remote:80
```
