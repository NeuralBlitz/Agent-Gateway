---
name: quantum-computing
description: Quantum computing concepts and NeuralBlitz quantum neuron implementation
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: domain-specific
---
## What I do
- Implement quantum-inspired neural networks
- Model quantum spiking neurons
- Handle quantum state evolution
- Manage superposition and entanglement
- Implement quantum tunneling behavior
- Handle coherence and decoherence
- Work with multi-reality networks
- Optimize quantum circuit simulation

## When to use me
When working with the NeuralBlitz quantum computing components or implementing quantum-inspired algorithms.

## Quantum State Representation
```python
import numpy as np
from typing import Optional, Tuple
from scipy.linalg import expm


class QuantumState:
    """
    Quantum state vector in Hilbert space.
    
    The state is represented as a normalized complex vector.
    For n qubits, the state space has dimension 2^n.
    """
    
    def __init__(self, num_qubits: int) -> None:
        """
        Initialize quantum state to |0⟩^n.
        
        Args:
            num_qubits: Number of qubits (must be positive integer)
        """
        self.num_qubits = num_qubits
        self.dim = 2 ** num_qubits
        self.state = np.zeros(self.dim, dtype=complex)
        self.state[0] = 1.0  # |0⟩ state
    
    @property
    def data(self) -> np.ndarray:
        """Return the state vector (read-only view)."""
        return self.state.copy()
    
    def normalize(self) -> None:
        """Normalize state vector to unit length."""
        norm = np.linalg.norm(self.state)
        if norm > 0:
            self.state /= norm
    
    def measure(self) -> int:
        """
        Measure state in computational basis.
        
        Returns:
            Measured basis state index with probability = |<x|ψ⟩|²
        """
        probs = np.abs(self.state) ** 2
        probs /= probs.sum()
        return np.random.choice(len(self.state), p=probabilities)
    
    def fidelity(self, other: 'QuantumState') -> float:
        """
        Calculate fidelity between two quantum states.
        
        Fidelity = |⟨ψ|φ⟩|² for pure states.
        
        Args:
            other: Another quantum state to compare
            
        Returns:
            Fidelity value between 0 and 1
        """
        overlap = np.vdot(self.state, other.state)
        return np.abs(overlap) ** 2
```

## Quantum Gates
```python
class QuantumGate:
    """Quantum gate operations on state vectors."""
    
    @staticmethod
    def hadamard(num_qubits: int, target: int) -> np.ndarray:
        """
        Create Hadamard gate for superposition.
        
        H|0⟩ = (|0⟩ + |1⟩)/√2
        H|1⟩ = (|0⟩ - |1⟩)/√2
        """
        H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
        return QuantumGate.expand_gate(H, num_qubits, target)
    
    @staticmethod
    def pauli_x(num_qubits: int, target: int) -> np.ndarray:
        """Pauli-X (NOT) gate: |0⟩→|1⟩, |1⟩→|0⟩"""
        X = np.array([[0, 1], [1, 0]])
        return QuantumGate.expand_gate(X, num_qubits, target)
    
    @staticmethod
    def pauli_z(num_qubits: int, target: int) -> np.ndarray:
        """Pauli-Z gate: |1⟩→-|1⟩, |0⟩→|0⟩"""
        Z = np.array([[1, 0], [0, -1]])
        return QuantumGate.expand_gate(Z, num_qubits, target)
    
    @staticmethod
    def cnot(num_qubits: int, control: int, target: int) -> np.ndarray:
        """Controlled-NOT gate (CNOT)."""
        dim = 2 ** num_qubits
        matrix = np.eye(dim, dtype=complex)
        
        for i in range(dim):
            if (i >> control) & 1 and not (i >> target) & 1:
                j = i | (1 << target)
                k = i & ~(1 << target)
                matrix[j, i] = 1
                matrix[k, i] = 0
        
        return matrix
    
    @staticmethod
    def rz(angle: float, num_qubits: int, target: int) -> np.ndarray:
        """
        Rotation around Z-axis by angle.
        
        Rz(θ) = exp(-iθZ/2)
        """
        RZ = np.array([
            [np.exp(-1j * angle / 2), 0],
            [0, np.exp(1j * angle / 2)]
        ])
        return QuantumGate.expand_gate(RZ, num_qubits, target)
    
    @staticmethod
    def expand_gate(
        gate: np.ndarray,
        num_qubits: int,
        target: int
    ) -> np.ndarray:
        """
        Expand single-qubit gate to full operator.
        
        Uses tensor product to embed single-qubit operation
        into larger Hilbert space.
        """
        dim = 2 ** num_qubits
        
        if target < 0 or target >= num_qubits:
            raise ValueError(f"Invalid target qubit: {target}")
        
        result = np.eye(1, dtype=complex)
        
        for i in range(num_qubits):
            if i == target:
                result = np.kron(result, gate)
            else:
                result = np.kron(result, np.eye(2, dtype=complex))
        
        return result
```

## Quantum Spiking Neuron
```python
class QuantumSpikingNeuron:
    """
    Quantum-inspired spiking neuron model.
    
    Combines quantum mechanics with spiking neural network principles:
    - Quantum superposition for input integration
    - Quantum tunneling for spike generation
    - Coherence time limiting neural activity
    """
    
    def __init__(
        self,
        num_qubits: int = 4,
        coherence_time: float = 100.0,
        tunneling: float = 0.1,
        threshold: float = 0.5,
    ) -> None:
        self.num_qubits = num_qubits
        self.coherence_time = coherence_time
        self.tunneling = tunneling
        self.threshold = threshold
        self.state = QuantumState(num_qubits)
        self.weights = np.random.randn(num_qubits) * 0.1
        self.spike_history: list[float] = []
        self.last_update: float = 0.0
    
    def evolve(
        self,
        inputs: np.ndarray,
        dt: float,
        hamiltonian: Optional[np.ndarray] = None
    ) -> Tuple[np.ndarray, bool]:
        """
        Evolve quantum state and potentially spike.
        
        Args:
            inputs: Input currents from connected neurons
            dt: Time step in milliseconds
            hamiltonian: Optional custom Hamiltonian matrix
            
        Returns:
            Tuple of (output_state, did_spike)
        """
        if len(inputs) != self.num_qubits:
            raise ValueError(f"Expected {self.num_qubits} inputs, got {len(inputs)}")
        
        self.last_update = dt
        
        # Create Hamiltonian from inputs (H = -Σ w_i |i⟩⟨i|)
        if hamiltonian is None:
            hamiltonian = np.diag(-self.weights * inputs)
        
        # Time evolution operator: U(t) = exp(-iHt)
        evolution = expm(-1j * hamiltonian * dt)
        
        # Apply evolution
        self.state.state = evolution @ self.state.state
        
        # Apply tunneling (stochastic spike mechanism)
        spike_probability = self._calculate_spike_probability()
        should_spike = np.random.random() < spike_probability
        
        if should_spike:
            self._emit_spike()
            return self.state.state, True
        
        return self.state.state, False
    
    def _calculate_spike_probability(self) -> float:
        """
        Calculate spike probability based on quantum state.
        
        Uses probability amplitude in excited states
        modulated by tunneling rate.
        """
        excited_prob = np.sum(np.abs(self.state.state[2 ** (self.num_qubits - 1):]) ** 2)
        coherence_factor = np.exp(-self.last_update / self.coherence_time)
        
        return excited_prob * self.tunneling * coherence_factor
    
    def _emit_spike(self) -> None:
        """Reset state after spike emission."""
        self.spike_history.append(self.last_update)
        
        # Collapse to ground state (reset)
        self.state = QuantumState(self.num_qubits)
        
        # Keep last spike time for refractory period
        self._refractory_timer = 5.0  # ms
    
    def get_membrane_potential(self) -> float:
        """Estimate membrane potential from state vector."""
        return np.sum(
            np.arange(2 ** self.num_qubits) * 
            np.abs(self.state.state) ** 2
        )
```

## Multi-Reality Network
```python
class MultiRealityNetwork:
    """
    Network that spans multiple parallel realities.
    
    Each reality maintains its own quantum state,
    and entanglement allows correlation between realities.
    """
    
    def __init__(
        self,
        num_realities: int = 4,
        neurons_per_reality: int = 20,
        entanglement_strength: float = 0.1,
    ) -> None:
        self.num_realities = num_realities
        self.neurons_per_reality = neurons_per_reality
        self.entanglement_strength = entanglement_strength
        
        self.neurons: list[list[QuantumSpikingNeuron]] = []
        self.entanglement_matrix: np.ndarray
        
        self._initialize_network()
    
    def _initialize_network(self) -> None:
        """Initialize neurons in each reality."""
        for r in range(self.num_realities):
            reality_neurons = [
                QuantumSpikingNeuron(
                    num_qubits=4,
                    coherence_time=100.0,
                    tunneling=0.1,
                )
                for _ in range(self.neurons_per_reality)
            ]
            self.neurons.append(reality_neurons)
        
        self.entanglement_matrix = np.eye(self.num_realities)
    
    def evolve_cycle(self, dt: float) -> list[list[bool]]:
        """
        Evolve all neurons across all realities.
        
        Returns:
            Matrix of spike events (reality × neuron)
        """
        spike_matrix = []
        
        for r in range(self.num_realities):
            reality_spikes = []
            
            for neuron in self.neurons[r]:
                inputs = self._get_inputs(r, neuron)
                _, spiked = neuron.evolve(inputs, dt)
                reality_spikes.append(spiked)
            
            spike_matrix.append(reality_spikes)
        
        self._apply_entanglement(spike_matrix)
        
        return spike_matrix
    
    def _get_inputs(
        self,
        reality: int,
        target_neuron: QuantumSpikingNeuron
    ) -> np.ndarray:
        """Get inputs from neurons in same reality."""
        inputs = np.zeros(target_neuron.num_qubits)
        
        for i, neuron in enumerate(self.neurons[reality]):
            if neuron is not target_neuron:
                inputs[i] = neuron.get_membrane_potential()
        
        return inputs
    
    def _apply_entanglement(self, spike_matrix: list[list[bool]]) -> None:
        """
        Apply quantum entanglement between realities.
        
        Correlates activity across realities based on
        entanglement matrix.
        """
        spike_array = np.array(spike_matrix)
        
        for i in range(self.num_realities):
            for j in range(i + 1, self.num_realities):
                correlation = self.entanglement_matrix[i, j]
                
                if correlation > 0:
                    self._entangle_realities(
                        spike_array[i],
                        spike_array[j],
                        correlation
                    )
    
    def _entangle_realities(
        self,
        spikes_a: np.ndarray,
        spikes_b: np.ndarray,
        strength: float
    ) -> None:
        """
        Entangle activity between two realities.
        
        Adjusts spike probabilities based on correlated
        activity patterns.
        """
        agreement = np.sum(spikes_a == spikes_b) / len(spikes_a)
        
        if agreement > 0.8:
            # Strong correlation - reinforce
            adjustment = strength * (1 - agreement)
        elif agreement < 0.2:
            # Strong anti-correlation
            adjustment = -strength * (0.5 - agreement)
        else:
            adjustment = 0
        
        self.entanglement_matrix = np.clip(
            self.entanglement_matrix + adjustment * 0.01,
            0, 1
        )
```
