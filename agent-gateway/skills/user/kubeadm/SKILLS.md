# Kubeadm Skill

Kubernetes cluster bootstrapping.

## Commands

### Init
```
/kubeadm init
```
Initialize control plane.

### Join
```
/kubeadm join <token>
```
Join node to cluster.

### Join Control Plane
```
/kubeadm join control-plane
```
Join as control plane.

### Token
```
/kubeadm token list
```
List join tokens.

### Token Create
```
/kubeadm token create
```
Create new token.

### CA Cert
```
/kubeadm certs check-expiration
```
Check certificate expiration.

### Certs Rotate
```
/kubeadm certs rotate
```
Rotate certificates.

### Upgrade Plan
```
/kubeadm upgrade plan
```
Show upgrade plan.

### Upgrade Apply
```
/kubeadm upgrade apply <version>
```
Upgrade cluster.

### Reset
```
/kubeadm reset
```
Reset cluster.

### Config View
```
/kubeadm config view
```
View kubeadm config.

### Config Print
```
/kubeadm config print <type>
```
Print component configs.

### Init Phase
```
/kubeadm init phase <phase>
```
Run specific init phase.

### Join Phase
```
/kubeadm join phase <phase>
```
Run specific join phase.

### Version
```
/kubeadm version
```
Show version.

## Examples

```
/kubeadm init
/kubeadm join 192.168.1.10:6443 --token abc123
/kubeadm join control-plane --certificate-key def456
/kubeadm token list
/kubeadm token create
/kubeadm certs check-expiration
/kubeadm certs rotate
/kubeadm upgrade plan
/kubeadm upgrade apply 1.28.0
/kubeadm reset
/kubeadm config view
/kubeadm config print init-defaults
/kubeadm init phase etcd
/kubeadm version
```
