---
name: quantum-computational
description: Quantum computing for computational chemistry
license: MIT
compatibility: opencode
metadata:
  audience: quantum chemists, computational scientists, researchers
  category: chemistry
---

## What I do

- Apply quantum computing to chemical problems
- Simulate quantum systems on quantum hardware
- Develop quantum algorithms for chemistry
- Calculate strongly correlated systems
- Research quantum machine learning
- Explore quantum advantage in chemistry

## When to use me

- When simulating quantum chemistry problems
- When exploring quantum computing applications
- When calculating strongly correlated systems
- When developing quantum algorithms
- When studying quantum advantage
- When modeling molecular quantum dynamics

## Key Concepts

### Quantum Computing Basics

**Qubits**: |0⟩, |1⟩, or superposition
**Quantum Gates**: Hadamard, CNOT, Pauli, rotation
**Quantum Circuits**: Sequence of gates

### Variational Quantum Eigensolver (VQE)

```python
# Example: VQE framework for quantum chemistry
def vqe(ansatz, hamiltonian, optimizer):
    """
    Find ground state energy using quantum computer.
    ansatz: Parameterized quantum circuit
    hamiltonian: Molecular Hamiltonian
    optimizer: Classical optimizer
    """
    def objective(params):
        # Prepare quantum state
        state = ansatz.apply(params)
        
        # Measure expectation value
        energy = hamiltonian.expectation(state)
        
        return energy
    
    return optimizer.minimize(objective)

# Ansatz circuits
ansatz_types = {
    'UCCSD': 'Unitary coupled cluster',
    'Hardware Efficient': 'Hardware-adapted layers',
    'ADAPT': 'Iterative ansatz construction'
}
```

### Quantum Chemistry on Quantum Computers

- Hamiltonian mapping: Jordan-Wigner, Bravyi-Kitaev
- State preparation: Adiabatic, variational
- Measurement reduction: Grouping techniques
- Error mitigation: ZS, PEC, TMR

### Applications

- Ground state energy
- Excited states
- Molecular dynamics
- Reaction rates
- Excited states
- Catalyst design

### Available Frameworks

- Qiskit Nature
- Cirq
- PennyLane
- Amazon Braket
- IBM Quantum
