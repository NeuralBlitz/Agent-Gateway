---
name: ansible
description: Open-source automation platform for configuration management, application deployment, and IT orchestration
category: devops
---

# Ansible

## What I Do

I am an open-source automation platform that simplifies configuration management, application deployment, and infrastructure orchestration through human-readable YAML playbooks. I use an agentless architecture with SSH for communication.

## When to Use Me

- Configuration management across servers
- Application deployment automation
- Infrastructure provisioning
- Security compliance automation
- Multi-tier application deployments
- Cloud resource orchestration
- One-time ad-hoc automation tasks

## Core Concepts

- **Playbook**: YAML file defining automation tasks
- **Play**: Collection of tasks for specific hosts
- **Task**: Single unit of work
- **Module**: Reusable unit of automation
- **Inventory**: List of managed hosts
- **Role**: Reusable collection of tasks, handlers, files
- **Handler**: Task triggered by notifications
- **Vault**: Encrypted sensitive data
- **Facts**: System information gathered by Ansible
- **Templates**: Jinja2 templating for configuration files

## Code Examples

**Basic Playbook:**
```yaml
---
- name: Web Server Configuration
  hosts: webservers
  become: yes
  vars:
    http_port: 8080
    app_directory: /opt/myapp
  
  pre_tasks:
    - name: Update apt cache
      apt:
        update_cache: yes
        cache_valid_time: 3600
      when: ansible_os_family == "Debian"
  
  tasks:
    - name: Install required packages
      apt:
        name:
          - nginx
          - python3-pip
          - docker.io
        state: present
        update_cache: yes
    
    - name: Ensure nginx is running
      service:
        name: nginx
        state: started
        enabled: yes
    
    - name: Create application directory
      file:
        path: "{{ app_directory }}"
        state: directory
        owner: www-data
        group: www-data
        mode: '0755'
    
    - name: Deploy application files
      copy:
        src: files/myapp/
        dest: "{{ app_directory }}/"
        owner: www-data
        group: www-data
        mode: '0644'
      notify: Restart nginx
  
  handlers:
    - name: Restart nginx
      service:
        name: nginx
        state: restarted
    
    - name: Reload nginx
      service:
        name: nginx
        state: reloaded

  post_tasks:
    - name: Verify nginx is listening
      wait_for:
        port: "{{ http_port }}"
        timeout: 5
```

**Role-based Playbook:**
```yaml
---
# site.yml
- name: Configure production infrastructure
  hosts: all
  gather_facts: yes
  become: yes
  
  roles:
    - common
    - base_security
    - monitoring
  
- name: Configure application servers
  hosts: app_servers
  become: yes
  
  vars_files:
    - vars/app-secrets.yml
  
  roles:
    - docker
    - application
    - nginx
  
- name: Configure database servers
  hosts: db_servers
  become: yes
  
  roles:
    - postgresql
    - backup

- name: Configure load balancers
  hosts: load_balancers
  become: yes
  
  roles:
    - haproxy
    - ssl_certs
```

**Ansible Role (tasks/main.yml):**
```yaml
---
- name: Ensure Docker is installed
  apt:
    name: docker.io
    state: present
  notify: Start docker service

- name: Add user to docker group
  user:
    name: "{{ deploy_user }}"
    groups: docker
    append: yes

- name: Create Docker configuration directory
  file:
    path: /etc/docker
    state: directory
    mode: '0755'

- name: Configure Docker daemon
  template:
    src: templates/daemon.json.j2
    dest: /etc/docker/daemon.json
    mode: '0644'
    backup: yes
  notify: Restart docker

- name: Ensure Docker service is started
  service:
    name: docker
    state: started
    enabled: yes
```

**Template (templates/daemon.json.j2):**
```json
{
  "storage-driver": "overlay2",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  },
  "live-restore": true,
  "metrics-addr": "0.0.0.0:9323",
  "experimental": {{ docker_experimental | default('false') }}
}
```

**Dynamic Inventory (aws_ec2.yml):**
```yaml
plugin: aws_ec2
regions:
  - us-east-1
  - us-west-2

filters:
  tag:Environment: production
  tag:Ansible: "true"

hostnames:
  - private-ip-address
  - dns-name
  - private-dns-name

compose:
  ansible_host: public_ip_address if public_ip_address else private_ip_address
  ansible_user: ec2-user if "amazon" in image_id else ubuntu

keyed_groups:
  - key: tags.Environment
    prefix: env_
  - key: tags.Application
    prefix: app_
  - key: instance_type
    prefix: type_
```

**Cloud Provisioning (provision-aws.yml):**
```yaml
---
- name: Provision AWS Infrastructure
  hosts: localhost
  connection: local
  gather_facts: no
  
  vars:
    region: us-east-1
    vpc_cidr: 10.0.0.0/16
    
  tasks:
    - name: Create VPC
      ec2_vpc_net:
        name: production-vpc
        cidr_block: "{{ vpc_cidr }}"
        region: "{{ region }}"
        dns_hostnames: yes
        dns_support: yes
        tags:
          Environment: production
      register: vpc
    
    - name: Create Internet Gateway
      ec2_vpc_igw:
        vpc_id: "{{ vpc.vpc.id }}"
        region: "{{ region }}"
        tags:
          Name: production-igw
      register: igw
    
    - name: Create public subnets
      ec2_vpc_subnet:
        vpc_id: "{{ vpc.vpc.id }}"
        cidr: "{{ item.cidr }}"
        az: "{{ item.az }}"
        region: "{{ region }}"
        tags:
          Name: "{{ item.name }}"
          Type: public
      loop:
        - { name: public-1a, cidr: 10.0.1.0/24, az: us-east-1a }
        - { name: public-1b, cidr: 10.0.2.0/24, az: us-east-1b }
      register: public_subnets
    
    - name: Create private subnets
      ec2_vpc_subnet:
        vpc_id: "{{ vpc.vpc.id }}"
        cidr: "{{ item.cidr }}"
        az: "{{ item.az }}"
        region: "{{ region }}"
        tags:
          Name: "{{ item.name }}"
          Type: private
      loop:
        - { name: private-1a, cidr: 10.0.11.0/24, az: us-east-1a }
        - { name: private-1b, cidr: 10.0.12.0/24, az: us-east-1b }
```

## Best Practices

1. **Use roles for organization** - Modular, reusable automation
2. **Keep playbooks idempotent** - Safe to run multiple times
3. **Use check mode** - Test changes before applying
4. **Implement error handling** - ignore_errors, failed_when
5. **Use tags for selective execution** - Run specific task groups
6. **Encrypt sensitive data** - ansible-vault for secrets
7. **Write descriptive tasks** - Clear names and documentation
8. **Use dynamic inventories** - Auto-discover infrastructure
9. **Gather facts strategically** - Disable when not needed
10. **Test playbooks with molecule** - Validate role behavior
