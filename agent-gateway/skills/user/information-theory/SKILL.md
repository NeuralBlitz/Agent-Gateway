---
name: information-theory
description: Information theory fundamentals
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: computer-science
---

## What I do
- Calculate entropy and information content
- Design efficient encodings
- Analyze channel capacity
- Implement compression algorithms

## When to use me
When working with data compression, encoding, or communication systems.

## Entropy

### Shannon Entropy
```python
import math
from collections import Counter

class InformationTheory:
    """Information theory calculations"""
    
    @staticmethod
    def entropy(probabilities: List[float]) -> float:
        """Calculate Shannon entropy H(X) = -Σ p(x) log₂ p(x)"""
        return -sum(p * math.log2(p) 
                   for p in probabilities if p > 0)
    
    @staticmethod
    def entropy_from_frequencies(data: List) -> float:
        """Calculate entropy from data"""
        counter = Counter(data)
        total = len(data)
        probabilities = [count / total for count in counter.values()]
        return InformationTheory.entropy(probabilities)
    
    @staticmethod
    def joint_entropy(data: List[tuple]) -> float:
        """Calculate joint entropy H(X,Y)"""
        counter = Counter(data)
        total = len(data)
        probabilities = [count / total for count in counter.values()]
        return InformationTheory.entropy(probabilities)
    
    @staticmethod
    def conditional_entropy(data: List[tuple]) -> float:
        """Calculate conditional entropy H(Y|X)"""
        # H(Y|X) = H(X,Y) - H(X)
        return InformationTheory.joint_entropy(data) - \
               InformationTheory.entropy([x[0] for x in data])
    
    @staticmethod
    def mutual_information(x: List, y: List) -> float:
        """Calculate mutual information I(X;Y) = H(X) + H(Y) - H(X,Y)"""
        data = list(zip(x, y))
        
        h_x = InformationTheory.entropy_from_frequencies(x)
        h_y = InformationTheory.entropy_from_frequencies(y)
        h_xy = InformationTheory.joint_entropy(data)
        
        return h_x + h_y - h_xy


# Example: Entropy of English alphabet
english_freqs = {
    'E': 0.127, 'T': 0.091, 'A': 0.082, 'O': 0.075, 'I': 0.070,
    'N': 0.067, 'S': 0.063, 'R': 0.060, 'H': 0.059, 'L': 0.040
}

entropy = InformationTheory.entropy(list(english_freqs.values()))
# ~3.1 bits per character
```

### Information Content
```python
class InformationContent:
    """Information content and surprise"""
    
    @staticmethod
    def self_information(p: float) -> float:
        """Self-information: I(x) = -log₂ p(x)"""
        return -math.log2(p) if p > 0 else 0
    
    @staticmethod
    def bits_needed(probability: float) -> int:
        """Minimum bits to encode event"""
        return math.ceil(-math.log2(probability))
```

## Coding

### Huffman Coding
```python
import heapq
from collections import Counter

class HuffmanCoding:
    """Huffman coding for compression"""
    
    class Node:
        def __init__(self, char: str, freq: int):
            self.char = char
            self.freq = freq
            self.left = None
            self.right = None
        
        def __lt__(self, other):
            return self.freq < other.freq
    
    def __init__(self):
        self.codes = {}
    
    def build_tree(self, data: str) -> 'HuffmanCoding.Node':
        """Build Huffman tree"""
        freq = Counter(data)
        heap = [self.Node(char, f) for char, f in freq.items()]
        heapq.heapify(heap)
        
        while len(heap) > 1:
            left = heapq.heappop(heap)
            right = heapq.heappop(heap)
            
            merged = self.Node(None, left.freq + right.freq)
            merged.left = left
            merged.right = right
            
            heapq.heappush(heap, merged)
        
        return heap[0]
    
    def build_codes(self, node: 'HuffmanCoding.Node', 
                   prefix: str = ""):
        """Build codes by traversing tree"""
        if node is None:
            return
        
        if node.char is not None:
            self.codes[node.char] = prefix
            return
        
        self.build_codes(node.left, prefix + "0")
        self.build_codes(node.right, prefix + "1")
    
    def encode(self, data: str) -> tuple:
        """Encode data using Huffman coding"""
        tree = self.build_tree(data)
        self.build_codes(tree)
        
        encoded = "".join(self.codes[char] for char in data)
        return encoded, tree
    
    def decode(self, encoded: str, tree: 'HuffmanCoding.Node') -> str:
        """Decode Huffman-encoded data"""
        result = []
        node = tree
        
        for bit in encoded:
            if bit == "0":
                node = node.left
            else:
                node = node.right
            
            if node.char is not None:
                result.append(node.char)
                node = tree
        
        return "".join(result)
```

### Arithmetic Coding
```python
class ArithmeticCoding:
    """Arithmetic coding"""
    
    def __init__(self):
        self.range_start = 0.0
        self.range_end = 1.0
    
    def encode(self, data: str, frequencies: dict) -> float:
        """Arithmetic encoding"""
        total = sum(frequencies.values())
        cumulative = {}
        
        start = 0.0
        for char, freq in frequencies.items():
            end = start + freq / total
            cumulative[char] = (start, end)
            start = end
        
        low = 0.0
        high = 1.0
        
        for char in data:
            range_size = high - low
            char_range = cumulative[char]
            
            low = low + range_size * char_range[0]
            high = low + range_size * char_range[1]
        
        return (low + high) / 2
```

## Channel Capacity

### Channel Capacity (Shannon)
```python
class ChannelCapacity:
    """Calculate channel capacity"""
    
    @staticmethod
    def binary_symmetric_channel(p: float) -> float:
        """Capacity of BSC with crossover probability p
        C = 1 + p*log₂(p) + (1-p)*log₂(1-p)
        """
        if p == 0 or p == 1:
            return 0
        return 1 + p * math.log2(p) + (1 - p) * math.log2(1 - p)
    
    @staticmethod
    def awgn_channel(snr_db: float) -> float:
        """Capacity of AWGN channel
        C = B * log₂(1 + SNR)
        """
        snr = 10 ** (snr_db / 10)
        return math.log2(1 + snr)
    
    @staticmethod
    def shannon_hartley(snr_db: float, bandwidth: float) -> float:
        """Shannon-Hartley theorem
        C = B * log₂(1 + S/N)
        """
        snr = 10 ** (snr_db / 10)
        return bandwidth * math.log2(1 + snr)
```

## Compression

### LZW Compression
```python
class LZWCompression:
    """LZW compression algorithm"""
    
    def compress(self, data: str) -> list:
        """Compress data using LZW"""
        dictionary = {chr(i): i for i in range(256)}
        result = []
        current = ""
        
        for char in data:
            combined = current + char
            
            if combined in dictionary:
                current = combined
            else:
                result.append(dictionary[current])
                dictionary[combined] = len(dictionary)
                current = char
        
        if current:
            result.append(dictionary[current])
        
        return result
    
    def decompress(self, compressed: list) -> str:
        """Decompress LZW data"""
        dictionary = {i: chr(i) for i in range(256)}
        result = []
        current = chr(compressed[0])
        result.append(current)
        
        for code in compressed[1:]:
            if code in dictionary:
                entry = dictionary[code]
            elif code == len(dictionary):
                entry = current + current[0]
            
            result.append(entry)
            
            dictionary[len(dictionary)] = current + entry[0]
            current = entry
        
        return "".join(result)
```
