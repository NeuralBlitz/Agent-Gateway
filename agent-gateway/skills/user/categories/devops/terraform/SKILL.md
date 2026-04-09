# Terraform

Terraform is an infrastructure as code tool that enables declarative provisioning of cloud resources. It uses HashiCorp Configuration Language (HCL) to define infrastructure across multiple providers.

## Key Concepts

- Providers and resources
- State management (remote backends)
- Variables and outputs
- Modules for reusability
- Workspaces for environments

## Common Use Cases

- Cloud provisioning (AWS, GCP, Azure)
- Multi-cloud deployments
- Infrastructure automation
- Configuration management
- Disaster recovery

## Best Practices

- Use remote state with locking
- Implement state isolation (workspaces)
- Pin provider versions
- Use modules for reusability
- Enable terraform linting (tflint)

## Resources

- Terraform.io: terraform.io/docs
- Registry: registry.terraform.io
- Related Skills: aws, gcp, azure, infrastructure-as-code
