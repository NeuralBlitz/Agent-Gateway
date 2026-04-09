---
name: TCP/IP
description: TCP/IP networking protocols and implementation
license: MIT
compatibility: Cross-platform (POSIX, Windows)
audience: Network engineers and backend developers
category: Networking
---

# TCP/IP Networking

## What I Do

I provide guidance for implementing and troubleshooting TCP/IP networks. I cover the TCP/IP protocol suite, socket programming, connection management, and network performance optimization.

## When to Use Me

- Implementing low-level network communication
- Debugging network connectivity issues
- Optimizing TCP connection performance
- Building network services and servers
- Understanding network troubleshooting tools

## Core Concepts

- **TCP/IP Model Layers**: Link, Internet, Transport, Application
- **Socket Programming**: Creating network endpoints
- **TCP Connection Lifecycle**: SYN, SYN-ACK, ACK handshake
- **TCP States**: LISTEN, ESTABLISHED, TIME_WAIT, CLOSE_WAIT
- **Flow Control**: Sliding window mechanism
- **Congestion Control**: Slow start, congestion avoidance
- **IP Addressing**: IPv4 and IPv6 addressing schemes
- **Subnet Masks**: Network and host portion division
- **Routing Tables**: Next-hop determination
- **MTU and Fragmentation**: Packet size limits

## Code Examples

### TCP Client-Server with Go

```go
package main

import (
	"bufio"
	"fmt"
	"net"
	"os"
	"strings"
	"sync"
	"time"
)

type TCPServer struct {
	address string
	port    int
	clients sync.Map
}

func NewTCPServer(address string, port int) *TCPServer {
	return &TCPServer{
		address: address,
		port:    port,
	}
}

func (s *TCPServer) Start() error {
	listener, err := net.Listen("tcp", fmt.Sprintf("%s:%d", s.address, s.port))
	if err != nil {
		return fmt.Errorf("failed to listen: %w", err)
	}
	defer listener.Close()
	
	fmt.Printf("Server listening on %s:%d\n", s.address, s.port)
	
	for {
		conn, err := listener.Accept()
		if err != nil {
			fmt.Printf("Failed to accept connection: %v\n", err)
			continue
		}
		
		s.clients.Store(conn.RemoteAddr().String(), conn)
		go s.handleClient(conn)
	}
}

func (s *TCPServer) handleClient(conn net.Conn) {
	defer func() {
		s.clients.Delete(conn.RemoteAddr().String())
		conn.Close()
	}()
	
	conn.SetReadDeadline(time.Now().Add(5 * time.Minute))
	
	reader := bufio.NewReader(conn)
	
	for {
		message, err := reader.ReadString('\n')
		if err != nil {
			return
		}
		
		message = strings.TrimSpace(message)
		fmt.Printf("Received from %s: %s\n", conn.RemoteAddr(), message)
		
		response := s.processMessage(message)
		_, err = conn.Write([]byte(response + "\n"))
		if err != nil {
			return
		}
	}
}

func (s *TCPServer) processMessage(message string) string {
	switch message {
	case "PING":
		return "PONG"
	case "STATUS":
		return fmt.Sprintf("Connected clients: %d", s.clients.Len())
	default:
		return fmt.Sprintf("Echo: %s", message)
	}
}

func StartClient(serverAddress string, port int) error {
	conn, err := net.DialTimeout("tcp", fmt.Sprintf("%s:%d", serverAddress, port), 5*time.Second)
	if err != nil {
		return fmt.Errorf("failed to connect: %w", err)
	}
	defer conn.Close()
	
	reader := bufio.NewReader(os.Stdin)
	
	for {
		fmt.Print("Enter message: ")
		input, _ := reader.ReadString('\n')
		input = strings.TrimSpace(input)
		
		_, err := conn.Write([]byte(input + "\n"))
		if err != nil {
			return err
		}
		
		conn.SetReadDeadline(time.Now().Add(5 * time.Second))
		
		response, err := bufio.NewReader(conn).ReadString('\n')
		if err != nil {
			return err
		}
		
		fmt.Printf("Server response: %s", response)
	}
}

func main() {
	if len(os.Args) > 1 && os.Args[1] == "server" {
		server := NewTCPServer("0.0.0.0", 8080)
		if err := server.Start(); err != nil {
			fmt.Fprintf(os.Stderr, "Server error: %v\n", err)
			os.Exit(1)
		}
	} else {
		if err := StartClient("localhost", 8080); err != nil {
			fmt.Fprintf(os.Stderr, "Client error: %v\n", err)
			os.Exit(1)
		}
	}
}
```

### TCP Connection Pool with Python

```python
import asyncio
import socket
from dataclasses import dataclass
from typing import Optional
from contextlib import asynccontextmanager
import logging

logger = logging.getLogger(__name__)

@dataclass
class TCPConnection:
    reader: asyncio.StreamReader
    writer: asyncio.StreamWriter
    
    async def send(self, data: bytes) -> None:
        self.writer.write(data)
        await self.writer.drain()
    
    async def receive(self, max_size: int = 4096) -> bytes:
        return await self.reader.read(max_size)
    
    async def send_message(self, message: str) -> str:
        await self.send(message.encode())
        response = await self.receive()
        return response.decode().strip()
    
    def close(self):
        self.writer.close()
    
    async def wait_closed(self):
        await self.writer.wait_closed()


class TCPConnectionPool:
    def __init__(
        self,
        host: str,
        port: int,
        min_size: int = 2,
        max_size: int = 10,
        timeout: float = 10.0
    ):
        self.host = host
        self.port = port
        self.min_size = min_size
        self.max_size = max_size
        self.timeout = timeout
        self._pool: asyncio.Queue[TCPConnection] = asyncio.Queue(maxsize=max_size)
        self._in_use: set[TCPConnection] = set()
    
    async def initialize(self):
        for _ in range(self.min_size):
            conn = await self._create_connection()
            await self._pool.put(conn)
        logger.info(f"Connection pool initialized with {self.min_size} connections")
    
    async def _create_connection(self) -> TCPConnection:
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(self.host, self.port),
            timeout=self.timeout
        )
        return TCPConnection(reader=reader, writer=writer)
    
    @asynccontextmanager
    async def get_connection(self):
        conn = await self._pool.get()
        self._in_use.add(conn)
        try:
            yield conn
        finally:
            self._in_use.discard()
            if self._pool.qsize() < self.max_size:
                await self._pool.put(conn)
            else:
                conn.close()
                await conn.wait_closed()
    
    async def close(self):
        while not self._pool.empty():
            conn = await self._pool.get()
            conn.close()
            await conn.wait_closed()
        
        for conn in list(self._in_use):
            conn.close()
        
        logger.info("Connection pool closed")


async def main():
    pool = TCPConnectionPool("localhost", 8080)
    await pool.initialize()
    
    async with pool.get_connection() as conn:
        response = await conn.send_message("PING")
        print(f"Response: {response}")
    
    await pool.close()


if __name__ == "__main__":
    asyncio.run(main())
```

### TCP Performance Tuning

```go
package main

import (
	"fmt"
	"net"
	"syscall"
	"time"
)

func SetTCPSocketOptions(conn *net.TCPConn) error {
	// Enable TCP keep-alive
	file, err := conn.File()
	if err != nil {
		return err
	}
	defer file.Close()
	
	fd := int(file.Fd())
	
	// Set keep-alive interval
	if err := syscall.SetsockoptInt(fd, syscall.IPPROTO_TCP, 
		syscall.TCP_KEEPINTVL, 30); err != nil {
		return fmt.Errorf("failed to set keepalive interval: %w", err)
	}
	
	// Set keep-alive retry count
	if err := syscall.SetsockoptInt(fd, syscall.IPPROTO_TCP, 
		syscall.TCP_KEEPCNT, 5); err != nil {
		return fmt.Errorf("failed to set keepalive count: %w", err)
	}
	
	// Enable TCP_NODELAY to disable Nagle's algorithm
	if err := conn.SetNoDelay(true); err != nil {
		return fmt.Errorf("failed to set no delay: %w", err)
	}
	
	// Set read buffer size
	if err := conn.SetReadBuffer(256 * 1024); err != nil {
		return fmt.Errorf("failed to set read buffer: %w", err)
	}
	
	// Set write buffer size
	if err := conn.SetWriteBuffer(256 * 1024); err != nil {
		return fmt.Errorf("failed to set write buffer: %w", err)
	}
	
	// Set keep-alive period
	if err := syscall.SetsockoptInt(fd, syscall.IPPROTO_TCP, 
		syscall.TCP_KEEPIDLE, 60); err != nil {
		return fmt.Errorf("failed to set keepalive idle: %w", err)
	}
	
	return nil
}

func OptimizeListener(address string, port int) (*net.TCPListener, error) {
	tcpAddr, err := net.ResolveTCPAddr("tcp", fmt.Sprintf("%s:%d", address, port))
	if err != nil {
		return nil, err
	}
	
	listener, err := net.ListenTCP("tcp", tcpAddr)
	if err != nil {
		return nil, err
	}
	
	file, err := listener.File()
	if err != nil {
		return nil, err
	}
	defer file.Close()
	
	fd := int(file.Fd())
	
	// Set socket to non-blocking for better concurrency
	if err := syscall.SetNonblock(fd, true); err != nil {
		return nil, fmt.Errorf("failed to set non-blocking: %w", err)
	}
	
	// Enable address reuse
	if err := syscall.SetsockoptInt(fd, syscall.SOL_SOCKET, 
		syscall.SO_REUSEADDR, 1); err != nil {
		return nil, fmt.Errorf("failed to set reuseaddr: %w", err)
	}
	
	// Enable port reuse for multiple listeners
	if err := syscall.SetsockoptInt(fd, syscall.SOL_SOCKET, 
		syscall.SO_REUSEPORT, 1); err != nil {
		return nil, fmt.Errorf("failed to set reuseport: %w", err)
	}
	
	// Set backlog size
	if err := syscall.SetsockoptInt(fd, syscall.SOL_TCP, 
		syscall.TCP_SYNCNT, 128); err != nil {
		return nil, fmt.Errorf("failed to set syncnt: %w", err)
	}
	
	return listener, nil
}
```

## Best Practices

1. **Set Appropriate Timeouts**: Prevent hanging connections
2. **Implement Keep-Alive**: Detect dead connections
3. **Use Connection Pooling**: Reuse connections efficiently
4. **Handle Backpressure**: Don't overwhelm network or system resources
5. **Implement Retry Logic**: With exponential backoff for transient failures
6. **Monitor Connection States**: Track TIME_WAIT and CLOSE_WAIT
7. **Tune Buffer Sizes**: Match to workload characteristics
8. **Use TCP_NODELAY**: For latency-sensitive applications
9. **Implement Graceful Shutdown**: Allow in-flight data to complete
10. **Log Network Metrics**: Track latency, throughput, and errors
