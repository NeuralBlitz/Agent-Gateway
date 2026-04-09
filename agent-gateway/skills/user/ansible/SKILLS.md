# Ansible Skill

Ansible automation.

## Commands

### Ping
```
/ansible ping <host>
```
Ping hosts.

### Playbook
```
/ansible playbook <file>
```
Run playbook.

### Ad-hoc
```
/ansible <host> -m <module> -a <args>
```
Run ad-hoc command.

### Galaxy Install
```
/ansible install <role>
```
Install role.

### Galaxy List
```
/ansible list
```
List installed roles.

### Galaxy Remove
```
/ansible remove <role>
```
Remove role.

### Vault
```
/ansible vault encrypt <file>
```
Encrypt file.

### Vault Decrypt
```
/ansible vault decrypt <file>
```
Decrypt file.

### Validate
```
/ansible validate <playbook>
```
Validate playbook.

### Syntax Check
```
/ansible syntax <playbook>
```
Check syntax.

### List Hosts
```
/ansible list <pattern>
```
List matching hosts.

### Facts
```
/ansible facts <host>
```
Gather facts.

### Template
```
/ansible template <src> <dest>
```
Deploy template.

### Copy
```
/ansible copy <src> <dest>
```
Copy file.

### Service
```
/ansible service <name> <state>
```
Manage service.

### User
```
/ansible user <name> <state>
```
Manage user.

## Examples

```
/ansible all -m ping
/ansible playbook site.yml
/ansible webserver -m yum -a "name=nginx state=present"
/ansible install geerlingguy.docker
/ansible list
/ansible vault encrypt secrets.yml
/ansible vault decrypt secrets.yml
/ansible validate playbook.yml
/ansible syntax playbook.yml
/ansible list "*"
/ansible localhost -m setup
/ansible webserver -m template -a "src=nginx.conf dest=/etc/nginx/nginx.conf"
/ansible all -m copy -a "src=app dest=/opt/app"
/ansible all -m service -a "name=nginx state=restarted"
```
