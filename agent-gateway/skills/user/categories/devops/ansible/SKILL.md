---
name: ansible
description: Ansible automation and configuration management
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: devops
---
## What I do
- Write Ansible playbooks for automation
- Manage infrastructure as code
- Configure servers and applications
- Handle deployments with Ansible
- Use roles and collections
- Manage secrets with Ansible Vault
- Implement idempotent automation
- Create dynamic inventories

## When to use me
When automating infrastructure or configuring servers with Ansible.

## Playbook Structure
```yaml
# playbook.yml
---
- name: Configure Web Servers
  hosts: web
  become: yes
  vars:
    app_path: /opt/myapp
    nginx_config: files/nginx.conf
  
  pre_tasks:
    - name: Update apt cache
      apt:
        update_cache: yes
        cache_valid_time: 3600
      when: ansible_os_family == "Debian"
    
    - name: Show inventory hostname
      debug:
        msg: "Configuring {{ ansible_hostname }}"
  
  roles:
    - common
    - nginx
    - app
  
  tasks:
    - name: Ensure nginx is started
      service:
        name: nginx
        state: started
        enabled: yes
    
    - name: Deploy application
      copy:
        src: files/myapp/
        dest: "{{ app_path }}/"
        owner: www-data
        group: www-data
        mode: '0755'
      notify: Restart application
  
  handlers:
    - name: Restart application
      service:
        name: myapp
        state: restarted
```

## Roles Structure
```
roles/
├── common/
│   ├── defaults/
│   │   └── main.yml
│   ├── handlers/
│   │   └── main.yml
│   ├── tasks/
│   │   └── main.yml
│   ├── templates/
│   │   └── logrotate.conf.j2
│   ├── files/
│   │   └── sysctl.conf
│   └── vars/
│       └── main.yml
├── nginx/
└── app/
```

## Dynamic Inventory
```python
#!/usr/bin/env python3
# plugins/inventory/dynamic_inventory.py

import boto3
import json
from collections import defaultdict


class EC2Inventory:
    def __init__(self):
        self.ec2 = boto3.resource('ec2')
    
    def get_inventory(self):
        inventory = {
            'all': {
                'hosts': [],
                'vars': {}
            },
            '_meta': {
                'hostvars': {}
            }
        }
        
        instances = self.ec2.instances.filter(
            Filters=[{'Name': 'instance-state-name', 'Values': ['running']}]
        )
        
        by_tag = defaultdict(list)
        
        for instance in instances:
            # Get tags
            name = instance.tags.get('Name', instance.id)
            role = instance.tags.get('Role', 'default')
            
            by_tag[role].append(instance.public_ip_address or instance.private_ip_address)
            
            # Host variables
            inventory['_meta']['hostvars'][instance.id] = {
                'ansible_host': instance.public_ip_address or instance.private_ip_address,
                'ec2_instance_id': instance.id,
                'ec2_tags': instance.tags,
                'ec2_vpc_id': instance.vpc_id,
            }
        
        # Group by tags
        for role, hosts in by_tag.items():
            inventory[role] = {'hosts': hosts}
        
        return inventory


# aws_ec2.yml inventory plugin
plugin: aws_ec8 regions: [us-east-1, us-west-2]

filters:
  tag:Environment: production

hostnames:
  - instance-id
  - private-ip-address

keyed_groups:
  - key: tags['Role']
    prefix: role
  - key: tags['Environment']
    prefix: env

compose:
  ansible_host: public_ip_address
```

## Ansible Vault
```yaml
# encrypt_string for secrets
ansible-vault encrypt_string 'my_secret_password' --name 'db_password'

# playbook with vault
---
- name: Database Setup
  hosts: db
  vars_files:
    - vault.yml  # Contains encrypted variables
  
  vars:
    db_password: "{{ vault_db_password }}"
  
  tasks:
    - name: Create database user
      postgresql_user:
        name: appuser
        password: "{{ db_password }}"
        role_attr_flags: CREATEDB
        encrypted: yes
```

## Best Practices
```
1. Use roles for organization
   Reusable components
   
2. Idempotent playbooks
   Can be run multiple times
   
3. Use tags for control
   --tags for selective runs
   
4. Test with molecule
   Validate roles
   
5. Use check mode
   --check for dry runs
   
6. Manage secrets properly
   Ansible Vault for secrets
   
7. Version control
   Git for playbooks
   
8. Use dynamic inventories
   Cloud discovery
```
