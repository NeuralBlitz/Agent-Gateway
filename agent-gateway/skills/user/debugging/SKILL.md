---
name: debugging
description: Debugging techniques and tools
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: code-quality
---
## What I do
- Debug application issues effectively
- Use debugging tools and techniques
- Analyze crash dumps and stack traces
- Profile performance bottlenecks
- Debug network issues
- Handle production incidents
- Use logging for debugging
- Write debuggable code

## When to use me
When debugging issues or troubleshooting problems.

## Debugging Techniques

### Scientific Method for Debugging
```
1. Observe the symptom
   - What error message?
   - What was the input?
   - When does it happen?

2. Form a hypothesis
   - What could cause this?
   - What's the most likely cause?

3. Test hypothesis
   - Can I reproduce it?
   - What changes the behavior?

4. Refine hypothesis
   - Narrow down the cause
   - Test edge cases

5. Fix the bug
   - Make minimal change
   - Verify the fix

6. Prevent regression
   - Add test case
   - Document the issue
```

## Python Debugging
```python
import pdb
from typing import Any


# Interactive debugging with pdb
def debug_with_pdb():
    """Start interactive debugger."""
    breakpoint()  # Python 3.7+


# pdb commands
# n (next) - execute current line
# s (step) - step into function
# c (continue) - run to breakpoint
# l (list) - show source
# p (print) - print variable
# pp (pretty print) - pretty print
# w (where) - show stack trace
# u (up) - go up stack
# d (down) - go down stack
# q (quit) - quit debugger


# Remote debugging with rpdb
import rpdb


def start_remote_debugger(port=4444):
    """Start debugger on specified port."""
    rpdb.set_trace(port=port)


# Using icecream for debugging
from icecream import ic


def debug_with_icecream():
    """Print variable values with expressions."""
    x = 10
    y = 20
    z = x + y
    
    ic(x)  # ic| x = 10
    ic(y)  # ic| y = 20
    ic(z)  # ic| z = 30
    ic(x + y)  # ic| x + y = 30


# Logging for debugging
import logging


logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


def debug_with_logging(data: dict) -> dict:
    """Debug with structured logging."""
    logger.debug("Processing data", extra={
        'data_keys': list(data.keys()),
        'data_size': len(data),
    })
    
    result = {k: v * 2 for k, v in data.items()}
    
    logger.debug("Processed result", extra={
        'result': result,
        'result_keys': list(result.keys()),
    })
    
    return result


# Better debugging with rich
from rich import print as rprint
from rich.pretty import pprint


def debug_with_rich():
    """Pretty print with rich."""
    data = {'name': 'test', 'values': [1, 2, 3], 'nested': {'a': 1}}
    
    pprint(data)  # Beautiful syntax-highlighted output
```

## JavaScript Debugging
```javascript
// Console debugging
function debugWithConsole() {
  const data = { name: 'test', value: 42 };
  
  // Basic logging
  console.log('Data:', data);
  
  // Grouped logs
  console.group('Processing');
  console.log('Start');
  console.log('Processing...');
  console.log('Done');
  console.groupEnd();
  
  // Table
  const users = [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 },
  ];
  console.table(users);
  
  // Stack trace
  console.trace('Stack trace');
  
  // Timing
  console.time('operation');
  // ... code ...
  console.timeEnd('operation');
}

// Chrome DevTools debugging
// 1. Open DevTools (F12)
// 2. Sources panel
// 3. Set breakpoints
// 4. Use debugger statement
function buggyFunction() {
  debugger;  // Breakpoint
  // Step through code
}

// VS Code debugging
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug",
      "program": "${workspaceFolder}/app.js",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

## Performance Profiling
```python
import cProfile
import pstats
from memory_profiler import profile, memory_usage
import time


def profile_code():
    """Profile CPU usage."""
    profiler = cProfile.Profile()
    profiler.enable()
    
    # Code to profile
    result = [i * 2 for i in range(10000)]
    
    profiler.disable()
    
    # Print stats
    stats = pstats.Stats(profiler)
    stats.sort_stats('cumulative')
    stats.print_stats(20)  # Top 20 functions


@profile  # Memory profiler decorator
def profile_memory():
    """Profile memory usage."""
    data = [i * 2 for i in range(100000)]
    time.sleep(0.1)
    return data


# Line-by-line profiling
from line_profiler import LineProfiler


def profile_lines():
    profiler = LineProfiler()
    profiler.add_function(slow_function)
    profiler.enable_by_count()
    
    slow_function()
    
    profiler.disable()
    profiler.print_stats()
```

## Debugging Production Issues
```python
import sys
import traceback


class ProductionDebugger:
    """Debug issues in production safely."""
    
    def __init__(self, log_file: str = '/var/log/app/debug.log') -> None:
        self.log_file = log_file
    
    def setup_error_handling(self) -> None:
        """Setup comprehensive error handling."""
        sys.excepthook = self.handle_exception
    
    def handle_exception(self, exc_type, exc_value, exc_traceback) -> None:
        """Log exceptions with full context."""
        import os
        
        # Log to file
        with open(self.log_file, 'a') as f:
            f.write(f"\n{'='*60}\n")
            f.write(f"Exception: {exc_type.__name__}\n")
            f.write(f"Message: {exc_value}\n")
            f.write(f"Traceback:\n")
            
            tb = traceback.format_exception(exc_type, exc_value, exc_traceback)
            f.write(''.join(tb))
            
            # Add context
            f.write(f"\nProcess ID: {os.getpid()}\n")
            f.write(f"Working Directory: {os.getcwd()}\n")
    
    def add_context(self, key: str, value: Any) -> None:
        """Add context to error messages."""
        # Store in thread-local or async context
        pass
    
    def capture_state(self) -> dict:
        """Capture current application state."""
        import gc
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        
        return {
            'memory_mb': process.memory_info().rss / 1024 / 1024,
            'cpu_percent': process.cpu_percent(),
            'open_files': len(process.open_files()),
            'threads': len(process.threads()),
            'gc_stats': gc.get_stats(),
        }


# Debug endpoint for live inspection
from flask import Flask, jsonify


app = Flask(__name__)

@app.route('/debug/state')
def debug_state():
    """Expose debug state for inspection."""
    debugger = ProductionDebugger()
    return jsonify({
        'state': debugger.capture_state(),
        'config': {
            'debug_mode': True,  # Only in debug
        },
        'environment': {
            'python_version': sys.version,
        },
    })
```

## Network Debugging
```python
import requests
from requests.exceptions import RequestException


class NetworkDebugger:
    """Debug network requests."""
    
    def __init__(self, base_url: str) -> None:
        self.base_url = base_url
        self.session = requests.Session()
    
    def debug_request(
        self,
        method: str,
        url: str,
        **kwargs
    ) -> requests.Response:
        """Debug a network request."""
        full_url = f"{self.base_url}{url}"
        
        print(f"\n{'='*60}")
        print(f"Request: {method.upper()} {full_url}")
        
        # Log headers
        headers = kwargs.get('headers', {})
        print(f"Headers: {dict(headers)}")
        
        # Log body
        if 'json' in kwargs:
            print(f"Body (JSON): {kwargs['json']}")
        elif 'data' in kwargs:
            print(f"Body: {kwargs['data']}")
        
        try:
            response = self.session.request(method, full_url, **kwargs)
            
            print(f"\nResponse: {response.status_code}")
            print(f"Headers: {dict(response.headers)}")
            
            # Log truncated response
            content = response.text[:1000]
            print(f"Content (truncated): {content}")
            
            return response
            
        except RequestException as e:
            print(f"Error: {e}")
            raise
    
    def check_connectivity(self, timeout: int = 5) -> dict:
        """Check network connectivity."""
        import socket
        
        checks = {}
        
        # DNS check
        try:
            socket.gethostbyname(self.base_url)
            checks['dns'] = 'OK'
        except socket.gaierror:
            checks['dns'] = 'FAILED'
        
        # TCP check
        try:
            host = self.base_url.split('://')[1].split('/')[0]
            port = 443 if 'https' in self.base_url else 80
            socket.create_connection((host, port), timeout)
            checks['tcp'] = 'OK'
        except Exception:
            checks['tcp'] = 'FAILED'
        
        return checks
```

## Common Debugging Patterns
```python
# Binary search debugging
def bisect_debug():
    """Find the breaking change with binary search."""
    versions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    
    # Test middle version
    mid = len(versions) // 2
    print(f"Testing version {versions[mid]}")
    
    # If it works, test later versions
    # If it fails, test earlier versions


# Minimal reproduction
def minimal_reproduction():
    """Create minimal code to reproduce bug."""
    # Start with what you know:
    # - Error message
    # - Input that causes it
    
    # Strip away everything not needed
    # until you have the smallest test case


# Diff debugging
def diff_debug():
    """Compare working vs broken state."""
    import difflib
    
    working = "correct behavior"
    broken = "current behavior"
    
    diff = difflib.unified_diff(
        working.splitlines(),
        broken.splitlines(),
        lineterm='',
    )
    
    for line in diff:
        print(line)
```

## Debugging Tools Reference
```
Python:
- pdb - Built-in debugger
- ipdb - IPython-based debugger
- rpdb - Remote debugger
- icecream - Better print debugging
- rich - Rich output
- memory_profiler - Memory profiling
- line_profiler - Line-by-line profiling
- cProfile - CPU profiling
- py-spy - Low-overhead sampling profiler

JavaScript:
- Chrome DevTools - Browser debugging
- VS Code debugger - IDE debugging
- Node.js inspector - Node debugging
- ndb - Improved Node debugging

General:
- strace - System call tracing (Linux)
- ltrace - Library call tracing
- dtrace - Dynamic tracing
- wireshark - Network analysis
- mitmproxy - HTTP proxy for debugging
```
