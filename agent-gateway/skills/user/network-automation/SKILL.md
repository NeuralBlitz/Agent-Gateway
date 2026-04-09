---
name: network-automation
description: Network automation practices
license: MIT
compatibility: opencode
metadata:
  audience: network-engineers
  category: networking
---

## What I do

- Automate network configuration and management
- Write scripts for network device provisioning
- Implement infrastructure as code for networks
- Build network CI/CD pipelines
- Manage network state declaratively
- Automate network testing and validation
- Handle multi-vendor network automation

## When to use me

Use me when:
- Managing large network infrastructures
- Reducing manual configuration errors
- Implementing consistent network policies
- Automating routine network tasks
- Building network CI/CD pipelines
- Scaling network operations

## Key Concepts

### Network Automation Tools
- **Ansible**: Agentless, YAML playbooks
- **Python (Netmiko, NAPALM)**: Scripting
- **Terraform**: Infrastructure as code
- **Nornir**: Python-based automation
- **StackStorm**: Event-driven automation

### Ansible Network Example
```yaml
---
- name: Configure network devices
  hosts: switches
  gather_facts: no
  
  tasks:
    - name: Configure VLANs
      cisco.ios.ios_vlans:
        config:
          - vlan_id: 10
            name: Management
          - vlan_id: 20
            name: Data
          
    - name: Configure interfaces
      cisco.ios.ios_l2_interfaces:
        config:
          - name: GigabitEthernet0/1
            mode: access
            access:
              vlan: 20
```

### NAPALM for Multi-Vendor
```python
from napalm import get_network_driver

driver = get_network_driver('ios')
device = driver('192.168.1.1', 'admin', 'password')
device.open()

# Get facts
facts = device.get_facts()
print(facts['hostname'], facts['model'])

# Get config
config = device.get_config()
print(config['running'])

# Compare configs
device.load_merge_candidate(config='new_config.txt')
device.compare_config()
device.commit_config()
```

### Network CI/CD Pipeline
1. **Commit**: Code changes to version control
2. **Lint**: Validate syntax and templates
3. **Test**: Dry-run, sanity checks
4. **Stage**: Apply to staging network
5. **Verify**: Automated testing
6. **Production**: Deploy with rollback plan
