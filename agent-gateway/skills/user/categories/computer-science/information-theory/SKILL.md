---
name: Information Theory
description: Quantitative study of information including entropy, channel capacity, compression, error-correcting codes, and information-theoretic security
license: MIT
compatibility: universal
audience: Cryptographers, Communications Engineers, Data Scientists
category: Computer Science

---

# Information Theory

## What I Do

I specialize in information theory—the mathematical study of information quantification, transmission, and compression. My expertise spans Shannon entropy, mutual information, channel capacity, source coding (compression), channel coding (error correction), rate-distortion theory, and information-theoretic security. I apply these concepts to design efficient communication systems, optimize data compression, build error-correcting codes, and analyze cryptographic security.

## When to Use Me

- Designing efficient data compression algorithms
- Analyzing communication channel capacity
- Building error-correcting codes
- Understanding cryptographic security guarantees
- Optimizing data transmission protocols
- Analyzing uncertainty and information content
- Designing protocols with information-theoretic security
- Evaluating compression efficiency

## Core Concepts

1. **Shannon Entropy**: Measure of uncertainty/information content H(X) = -Σ p(x) log₂ p(x)
2. **Joint and Conditional Entropy**: Information in combined and conditional distributions
3. **Mutual Information**: Shared information between random variables
4. **Data Compression**: Huffman coding, arithmetic coding, Shannon-Fano
5. **Channel Capacity**: Maximum error-free communication rate (C = B log₂(1 + SNR))
6. **Error-Correcting Codes**: Hamming codes, Reed-Solomon, LDPC, Turbo codes
7. **Rate-Distortion Theory**: Trade-off between compression and quality
8. **Information-Theoretic Security**: Unconditional security independent of computation
9. **Kolmogorov Complexity**: Algorithmic information content
10. **Typical Sequences**: Sets of probable sequences for source coding

## Code Examples

```python
# Information Theory Fundamentals
import numpy as np
from typing import Dict, List, Tuple
import math

class InformationTheory:
    @staticmethod
    def entropy(probabilities: List[float]) -> float:
        """Calculate Shannon entropy H(X) in bits."""
        entropy = 0.0
        for p in probabilities:
            if p > 0:
                entropy -= p * math.log2(p)
        return entropy
    
    @staticmethod
    def joint_entropy(joint_probs: Dict[Tuple, float]) -> float:
        """Calculate joint entropy H(X, Y)."""
        entropy = 0.0
        for p in joint_probs.values():
            if p > 0:
                entropy -= p * math.log2(p)
        return entropy
    
    @staticmethod
    def conditional_entropy(joint_probs: Dict[Tuple, float], 
                           marginal_probs: Dict,
                           given_var: str = 'Y') -> float:
        """Calculate conditional entropy H(X|Y) = H(X,Y) - H(Y)."""
        h_y = InformationTheory.entropy(list(marginal_probs.values()))
        h_xy = InformationTheory.joint_entropy(joint_probs)
        return h_xy - h_y
    
    @staticmethod
    def mutual_information(prob_x: Dict, prob_y: Dict, 
                          joint_probs: Dict[Tuple, float]) -> float:
        """Calculate mutual information I(X;Y)."""
        h_x = InformationTheory.entropy(list(prob_x.values()))
        h_y = InformationTheory.entropy(list(prob_y.values()))
        h_xy = InformationTheory.joint_entropy(joint_probs)
        return h_x + h_y - h_xy
    
    @staticmethod
    def kl_divergence(p: Dict, q: Dict) -> float:
        """Calculate KL divergence D_KL(P || Q)."""
        kl = 0.0
        for x in p:
            if p[x] > 0:
                if x not in q or q[x] == 0:
                    return float('inf')
                kl += p[x] * math.log2(p[x] / q[x])
        return kl

# Example: Binary Symmetric Channel Capacity
class ChannelCapacity:
    @staticmethod
    def binary_symmetric_channel(p: float) -> float:
        """Calculate capacity of BSC with crossover probability p.
        C = 1 - H_b(p) where H_b is binary entropy function.
        """
        def binary_entropy(x):
            if x <= 0 or x >= 1:
                return 0
            return -x * math.log2(x) - (1 - x) * math.log2(1 - x)
        
        return 1 - binary_entropy(p)
    
    @staticmethod
    def awgn_channel(snr_db: float, bandwidth: float = 1.0) -> float:
        """Calculate capacity of AWGN channel.
        C = B * log2(1 + SNR) bits per second.
        """
        snr = 10 ** (snr_db / 10)
        return bandwidth * math.log2(1 + snr)
    
    @staticmethod
    def binary_erasure_channel(epsilon: float) -> float:
        """Calculate capacity of BEC with erasure probability epsilon.
        C = 1 - epsilon.
        """
        return 1 - epsilon

# Example calculations
p_cross = 0.11  # 11% crossover probability
bsc_capacity = ChannelCapacity.binary_symmetric_channel(p_cross)
print(f"BSC Capacity (p={p_cross}): {bsc_capacity:.4f} bits/transmission")

snr_db = 10  # 10 dB SNR
awgn_capacity = ChannelCapacity.awgn_channel(snr_db, bandwidth=1e6)
print(f"AWGN Capacity (10 dB, 1 MHz): {awgn_capacity:.2e} bits/sec")

bec_capacity = ChannelCapacity.binary_erasure_channel(0.2)
print(f"BEC Capacity (epsilon=0.2): {bec_capacity:.4f}")

# Huffman Coding Implementation
from collections import Counter
import heapq

class HuffmanCoding:
    class Node:
        def __init__(self, char: str, freq: float):
            self.char = char
            self.freq = freq
            self.left = None
            self.right = None
        
        def __lt__(self, other):
            return self.freq < other.freq
    
    def __init__(self, text: str):
        self.text = text
        self.frequencies = Counter(text)
        self.codes = {}
        self.heap = []
    
    def build_tree(self):
        """Build Huffman tree from character frequencies."""
        for char, freq in self.frequencies.items():
            heapq.heappush(self.heap, self.Node(char, freq))
        
        while len(self.heap) > 1:
            left = heapq.heappop(self.heap)
            right = heapq.heappop(self.heap)
            
            merged = self.Node(None, left.freq + right.freq)
            merged.left = left
            merged.right = right
            
            heapq.heappush(self.heap, merged)
    
    def build_codes(self, node: 'HuffmanCoding.Node', current: str = ''):
        """Generate codes from tree."""
        if node is None:
            return
        
        if node.char is not None:
            self.codes[node.char] = current if current else '0'
            return
        
        self.build_codes(node.left, current + '0')
        self.build_codes(node.right, current + '1')
    
    def encode(self) -> Tuple[str, Dict[str, str]]:
        """Return encoded string and code table."""
        self.build_tree()
        root = self.heap[0] if self.heap else None
        self.build_codes(root)
        
        encoded = ''.join(self.codes[char] for char in self.text)
        return encoded, self.codes
    
    def decode(self, encoded: str) -> str:
        """Decode string using code table."""
        if not self.heap:
            return ''
        
        decoded = []
        current = self.heap[0]
        
        for bit in encoded:
            if bit == '0':
                current = current.left
            else:
                current = current.right
            
            if current.char is not None:
                decoded.append(current.char)
                current = self.heap[0]
        
        return ''.join(decoded)
    
    def compression_ratio(self, encoded: str) -> float:
        """Calculate compression ratio."""
        original_bits = len(self.text) * 8
        encoded_bits = len(encoded)
        return original_bits / encoded_bits
    
    def entropy_rate(self) -> float:
        """Calculate entropy of the source."""
        probs = [freq / sum(self.frequencies.values()) 
                for freq in self.frequencies.values()]
        return InformationTheory.entropy(probs)

# Example Huffman coding
text = "this is an example for huffman coding"
huffman = HuffmanCoding(text)
encoded, codes = huffman.encode()
decoded = huffman.decode(encoded)

print(f"\nHuffman Coding:")
print(f"  Original: '{text}'")
print(f"  Original size: {len(text)} bytes")
print(f"  Encoded size: {len(encoded)} bits")
print(f"  Compression ratio: {huffman.compression_ratio(encoded):.2f}")
print(f"  Entropy rate: {huffman.entropy_rate():.4f} bits/symbol")
print(f"  Codes: {codes}")
```

```python
# Error-Correcting Codes: Hamming Code
class HammingCode:
    def __init__(self, m: int = 3):
        """Hamming code with m parity bits, n = 2^m - 1 total bits."""
        self.m = m
        self.n = 2 ** m - 1
        self.k = self.n - m  # Data bits
    
    def encode(self, data: int) -> int:
        """Encode k-bit data using Hamming code."""
        # Position parity bits at powers of 2
        encoded = 0
        data_bits = []
        parity_count = 0
        
        for i in range(1, self.n + 1):
            if i & (i - 1) == 0:  # Power of 2 = parity bit position
                parity_count += 1
                encoded |= 0  # Will compute parity later
            else:
                if data_bits:
                    data = data >> 1
                data_bits.append(data & 1)
        
        data_bits.reverse()
        
        # Compute parity bits
        parity_bits = []
        for p in range(self.m):
            parity_pos = 2 ** p
            parity = 0
            
            for i in range(1, self.n + 1):
                if i & parity_pos and i != parity_pos:
                    # Check this bit for parity
                    bit_pos = i - 1
                    if bit_pos < len(data_bits):
                        parity ^= data_bits[bit_pos]
            
            parity_bits.append(parity)
        
        # Insert parity bits
        result = 0
        data_idx = 0
        for i in range(1, self.n + 1):
            if i & (i - 1) == 0:  # Parity bit
                p_idx = int(math.log2(i))
                result |= (parity_bits[p_idx] << (i - 1))
            else:
                result |= (data_bits[data_idx] << (i - 1))
                data_idx += 1
        
        return result
    
    def decode(self, received: int) -> Tuple[int, int]:
        """Decode and correct single-bit errors."""
        # Calculate syndrome
        syndrome = 0
        
        for p in range(self.m):
            parity_pos = 2 ** p
            parity = 0
            
            for i in range(1, self.n + 1):
                if i & parity_pos:
                    parity ^= ((received >> (i - 1)) & 1)
            
            if parity:
                syndrome |= parity_pos
        
        # Correct error if syndrome != 0
        if syndrome != 0:
            received ^= (1 << (syndrome - 1))  # Flip erroneous bit
        
        # Extract data bits
        data = 0
        data_idx = 0
        for i in range(1, self.n + 1):
            if i & (i - 1) != 0:  # Not parity bit
                if (received >> (i - 1)) & 1:
                    data |= (1 << data_idx)
                data_idx += 1
        
        return data, syndrome

# Example: Hamming(7,4) code
hamming = HammingCode(m=3)
data = 0b1101  # 4-bit data

print(f"\nHamming Code (7,4):")
print(f"  Original data: {data:04b}")
encoded = hamming.encode(data)
print(f"  Encoded: {encoded:07b}")

# Simulate single-bit error at position 3
error_pos = 3
corrupted = encoded ^ (1 << (error_pos - 1))
print(f"  Corrupted (error at pos {error_pos}): {corrupted:07b}")

decoded, syndrome = hamming.decode(corrupted)
print(f"  Decoded data: {decoded:04b}")
print(f"  Syndrome: {syndrome:03b} (0 = no error)")
```

## Best Practices

1. **Match Code to Channel**: Choose codes with rates near channel capacity
2. **Use Entropy for Compression Limit**: Entropy gives theoretical minimum size
3. **Combine Compression and Encryption**: Order matters for security
4. **Consider Rate-Distortion**: Trading quality for size in lossy compression
5. **Use Strong Error Correction**: Add redundancy proportional to noise level
6. **Leverage Mutual Information**: For feature selection and relevance
7. **Apply to Cryptanalysis**: Information leakage reveals vulnerabilities
8. **Consider Computational Limits**: Information-theoretic vs computational security
9. **Use Typical Sequences**: For efficient source coding
10. **Profile Compression**: Measure entropy, not just file size
