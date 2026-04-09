---
name: tcp-ip
description: TCP/IP networking protocols and implementation
category: networking
difficulty: intermediate
tags: [network, protocol, tcp, ip, sockets]
author: OpenCode Community
version: 1.0
last_updated: 2024-01-15
---

# TCP/IP Networking

## What I Do

I am TCP/IP, the fundamental communication protocol suite that enables internet and local network connectivity. I encompass the OSI model layers implemented as TCP/IP layers: Link Layer, Internet Layer, Transport Layer, and Application Layer. I provide reliable, ordered, error-checked delivery of data streams through TCP and faster, connectionless delivery through UDP. I handle addressing through IP addresses (IPv4 and IPv6), routing packets across networks, and managing network interfaces. I enable applications to communicate across heterogeneous networks through standardized protocols. I form the backbone of all modern network communication, from web browsing to video streaming to IoT device communication.

## When to Use Me

- Building network applications and services
- Implementing custom protocols
- Network debugging and troubleshooting
- Performance optimization of network services
- Socket programming for distributed systems
- Low-latency communication requirements
- Broadcast and multicast scenarios
- Network security implementation

## Core Concepts

**TCP (Transmission Control Protocol)**: Reliable, connection-oriented protocol with flow control, congestion control, and ordered delivery.

**UDP (User Datagram Protocol)**: Connectionless protocol with low latency, suitable for real-time applications.

**IP Addressing**: IPv4 (32-bit) and IPv6 (128-bit) addresses identifying network interfaces.

**Sockets**: Endpoints for network communication exposing APIs for TCP/UDP communication.

**Ports**: 16-bit identifiers distinguishing between multiple services on a single host.

**NAT (Network Address Translation)**: Mapping private addresses to public addresses for internet connectivity.

**MTU (Maximum Transmission Unit)**: Maximum packet size for network transmission.

**TCP Three-Way Handshake**: SYN, SYN-ACK, ACK sequence establishing connections.

## Code Examples

### Example 1: TCP Server with Connection Handling (Go)
```go
package main

import (
    "bufio"
    "fmt"
    "log"
    "net"
    "sync"
    "time"
)

type TCPClient struct {
    conn    net.Conn
    id      string
    joined  time.Time
}

type TCPServer struct {
    addr        string
    clients     map[string]*TCPClient
    mutex       sync.RWMutex
    broadcast   chan string
    register    chan *TCPClient
    unregister  chan *TCPClient
}

func NewTCPServer(addr string) *TCPServer {
    return &TCPServer{
        addr:        addr,
        clients:     make(map[string]*TCPClient),
        broadcast:   make(chan string, 256),
        register:    make(chan *TCPClient),
        unregister:  make(chan *TCPClient),
    }
}

func (s *TCPServer) Start() error {
    listener, err := net.Listen("tcp", s.addr)
    if err != nil {
        return fmt.Errorf("failed to listen: %w", err)
    }
    defer listener.Close()
    
    log.Printf("TCP server listening on %s", s.addr)
    
    go s.handleMessages()
    
    for {
        conn, err := listener.Accept()
        if err != nil {
            log.Printf("Failed to accept connection: %v", err)
            continue
        }
        
        go s.handleConnection(conn)
    }
}

func (s *TCPServer) handleConnection(conn net.Conn) {
    defer conn.Close()
    
    reader := bufio.NewReader(conn)
    
    client := &TCPClient{
        conn:   conn,
        id:     conn.RemoteAddr().String(),
        joined: time.Now(),
    }
    
    s.register <- client
    log.Printf("Client connected: %s", client.id)
    
    s.broadcast <- fmt.Sprintf("[%s] Client connected\n", client.id)
    
    for {
        message, err := reader.ReadString('\n')
        if err != nil {
            s.unregister <- client
            s.broadcast <- fmt.Sprintf("[%s] Client disconnected\n", client.id)
            log.Printf("Client disconnected: %s", client.id)
            return
        }
        
        message = strings.TrimSpace(message)
        formatted := fmt.Sprintf("[%s] %s", client.id, message)
        log.Printf("Received: %s", formatted)
        s.broadcast <- formatted
    }
}

func (s *TCPServer) handleMessages() {
    for {
        select {
        case client := <-s.register:
            s.mutex.Lock()
            s.clients[client.id] = client
            s.mutex.Unlock()
            
        case client := <-s.unregister:
            s.mutex.Lock()
            if _, ok := s.clients[client.id]; ok {
                delete(s.clients, client.id)
                client.conn.Close()
            }
            s.mutex.Unlock()
            
        case message := <-s.broadcast:
            s.mutex.RLock()
            for _, client := range s.clients {
                go func(c *TCPClient) {
                    c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
                    _, err := fmt.Fprintln(c.conn, message)
                    if err != nil {
                        s.unregister <- c
                    }
                }(client)
            }
            s.mutex.RUnlock()
        }
    }
}

func (s *TCPServer) GetClientCount() int {
    s.mutex.RLock()
    defer s.mutex.RUnlock()
    return len(s.clients)
}
```

### Example 2: UDP Client-Server (Python)
```python
import socket
import threading
import time
from typing import Optional

class UDPServer:
    def __init__(self, host: str = '0.0.0.0', port: int = 5000):
        self.host = host
        self.port = port
        self.socket: Optional[socket.socket] = None
        self.running = False
        self.clients: dict[tuple, float] = {}
        self.lock = threading.Lock()
        
    def start(self):
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.socket.bind((self.host, self.port))
        self.socket.settimeout(1.0)
        
        self.running = True
        print(f"UDP server started on {self.host}:{self.port}")
        
        while self.running:
            try:
                data, addr = self.socket.recvfrom(1024)
                threading.Thread(
                    target=self.handle_client,
                    args=(data, addr),
                    daemon=True
                ).start()
            except socket.timeout:
                continue
            except Exception as e:
                if self.running:
                    print(f"Error: {e}")
                    
    def handle_client(self, data: bytes, addr: tuple):
        message = data.decode('utf-8')
        print(f"Received from {addr}: {message}")
        
        with self.lock:
            self.clients[addr] = time.time()
        
        if message.startswith("PING"):
            response = f"PONG {time.time()}"
        elif message == "STATUS":
            response = f"Server running with {len(self.clients)} clients"
        else:
            response = f"ECHO: {message}"
            
        self.socket.sendto(response.encode('utf-8'), addr)
        
    def broadcast(self, message: str):
        with self.lock:
            clients = list(self.clients.keys())
            
        for addr in clients:
            try:
                self.socket.sendto(message.encode('utf-8'), addr)
            except Exception as e:
                print(f"Failed to send to {addr}: {e}")
                
    def stop(self):
        self.running = False
        if self.socket:
            self.socket.close()
        print("Server stopped")


class UDPClient:
    def __init__(self, server_host: str, server_port: int):
        self.server_host = server_host
        self.server_port = server_port
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.socket.settimeout(5.0)
        
    def send(self, message: str) -> str:
        self.socket.sendto(message.encode('utf-8'), (self.server_host, self.server_port))
        data, _ = self.socket.recvfrom(4096)
        return data.decode('utf-8')
    
    def ping(self) -> float:
        start = time.time()
        response = self.send("PING")
        latency = (time.time() - start) * 1000
        
        if response.startswith("PONG"):
            server_time = float(response.split()[1])
            return latency
        return -1
    
    def close(self):
        self.socket.close()


if __name__ == "__main__":
    server = UDPServer()
    server.start()
```

### Example 3: Connection Pool and Health Checks (Node.js)
```javascript
const net = require('net');

class TCPConnectionPool {
  constructor(options = {}) {
    this.host = options.host || 'localhost';
    this.port = options.port || 8080;
    this.minSize = options.minSize || 5;
    this.maxSize = options.maxSize || 20;
    this.connectionTimeout = options.connectionTimeout || 5000;
    this.idleTimeout = options.idleTimeout || 30000;
    
    this.pool = [];
    this.waiting = [];
    this.activeCount = 0;
    this.creating = false;
  }

  async acquire() {
    const connection = this.findAvailableConnection();
    if (connection) {
      return connection;
    }
    
    if (this.activeCount >= this.maxSize) {
      return this.waitForConnection();
    }
    
    return this.createConnection();
  }

  findAvailableConnection() {
    while (this.pool.length > 0) {
      const connection = this.pool.pop();
      if (this.isConnectionHealthy(connection)) {
        return connection;
      }
      this.destroyConnection(connection);
    }
    return null;
  }

  async createConnection() {
    this.creating = true;
    this.activeCount++;
    
    return new Promise((resolve, reject) => {
      const connection = net.createConnection({
        host: this.host,
        port: this.port,
        timeout: this.connectionTimeout
      });
      
      connection.on('connect', () => {
        this.creating = false;
        connection.isAcquired = true;
        connection.lastUsed = Date.now();
        resolve(connection);
      });
      
      connection.on('error', (err) => {
        this.creating = false;
        this.activeCount--;
        this.processWaitingQueue();
        reject(err);
      });
      
      connection.on('timeout', () => {
        connection.destroy();
        this.activeCount--;
      });
    });
  }

  async waitForConnection() {
    return new Promise((resolve, reject) => {
      this.waiting.push({ resolve, reject });
    });
  }

  processWaitingQueue() {
    while (this.waiting.length > 0 && this.activeCount < this.maxSize) {
      const { resolve } = this.waiting.shift();
      this.createConnection().then(resolve).catch(() => {
        // Error handled in createConnection
      });
    }
  }

  release(connection) {
    if (!connection || connection.destroyed) {
      return;
    }
    
    connection.isAcquired = false;
    connection.lastUsed = Date.now();
    
    if (this.pool.length < this.minSize) {
      this.pool.push(connection);
      this.processWaitingQueue();
    } else {
      this.destroyConnection(connection);
    }
  }

  destroyConnection(connection) {
    this.activeCount--;
    connection.removeAllListeners();
    connection.destroy();
  }

  isConnectionHealthy(connection) {
    if (connection.destroyed || connection.connecting) {
      return false;
    }
    
    const idleTime = Date.now() - connection.lastUsed;
    return idleTime < this.idleTimeout && connection.writable;
  }

  healthCheck() {
    this.pool = this.pool.filter(connection => {
      if (!this.isConnectionHealthy(connection)) {
        this.destroyConnection(connection);
        return false;
      }
      return true;
    });
  }

  close() {
    this.pool.forEach(connection => this.destroyConnection(connection));
    this.pool = [];
    this.waiting.forEach(({ reject }) => reject(new Error('Pool closed')));
    this.waiting = [];
  }
}
```

### Example 4: Packet Analysis and Raw Sockets (C)
```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <netinet/ip.h>
#include <netinet/tcp.h>
#include <netinet/udp.h>
#include <netinet/if_ether.h>
#include <sys/socket.h>
#include <netinet/in.h>

#define BUFFER_SIZE 65536

typedef struct {
    uint32_t src_ip;
    uint32_t dst_ip;
    uint16_t src_port;
    uint16_t dst_port;
    uint8_t protocol;
    uint32_t packet_count;
    uint64_t byte_count;
} FlowStats;

typedef struct {
    FlowStats flows[1000];
    int flow_count;
} NetworkAnalyzer;

void print_ip_header(struct ip *ip_header) {
    char src_ip[INET_ADDRSTRLEN];
    char dst_ip[INET_ADDRSTRLEN];
    
    inet_ntop(AF_INET, &ip_header->ip_src, src_ip, INET_ADDRSTRLEN);
    inet_ntop(AF_INET, &ip_header->ip_dst, dst_ip, INET_ADDRSTRLEN);
    
    printf("IP Header:\n");
    printf("  Version: %d\n", ip_header->ip_v);
    printf("  Header Length: %d bytes\n", ip_header->ip_hl * 4);
    printf("  Type of Service: %d\n", ip_header->ip_tos);
    printf("  Total Length: %d bytes\n", ntohs(ip_header->ip_len));
    printf("  TTL: %d\n", ip_header->ip_ttl);
    printf("  Protocol: %d\n", ip_header->ip_p);
    printf("  Source IP: %s\n", src_ip);
    printf("  Destination IP: %s\n", dst_ip);
}

void print_tcp_header(struct tcphdr *tcp_header) {
    printf("TCP Header:\n");
    printf("  Source Port: %d\n", ntohs(tcp_header->th_sport));
    printf("  Destination Port: %d\n", ntohs(tcp_header->th_dport));
    printf("  Sequence Number: %u\n", ntohl(tcp_header->th_seq));
    printf("  Ack Number: %u\n", ntohl(tcp_header->th_ack));
    printf("  Flags: 0x%02x", tcp_header->th_flags);
    
    if (tcp_header->th_flags & TH_SYN) printf(" SYN");
    if (tcp_header->th_flags & TH_ACK) printf(" ACK");
    if (tcp_header->th_flags & TH_FIN) printf(" FIN");
    if (tcp_header->th_flags & TH_RST) printf(" RST");
    if (tcp_header->th_flags & TH_PUSH) printf(" PSH");
    if (tcp_header->th_flags & TH_URG) printf(" URG");
    printf("\n");
}

void print_udp_header(struct udphdr *udp_header) {
    printf("UDP Header:\n");
    printf("  Source Port: %d\n", ntohs(udp_header->uh_sport));
    printf("  Destination Port: %d\n", ntohs(udp_header->uh_dport));
    printf("  Length: %d bytes\n", ntohs(udp_header->uh_len));
}

void analyze_packet(unsigned char *buffer, int size, NetworkAnalyzer *analyzer) {
    struct ether_header *eth_header = (struct ether_header *)buffer;
    struct ip *ip_header = (struct ip *)(buffer + sizeof(struct ether_header));
    
    if (ntohs(eth_header->ether_type) != ETHERTYPE_IP) {
        return;
    }
    
    print_ip_header(ip_header);
    
    if (ip_header->ip_p == IPPROTO_TCP) {
        struct tcphdr *tcp_header = (struct tcphdr *)(buffer + 
            sizeof(struct ether_header) + sizeof(struct ip));
        print_tcp_header(tcp_header);
    } else if (ip_header->ip_p == IPPROTO_UDP) {
        struct udphdr *udp_header = (struct udphdr *)(buffer + 
            sizeof(struct ether_header) + sizeof(struct ip));
        print_udp_header(udp_header);
    }
    
    printf("Payload Size: %d bytes\n\n", size - sizeof(struct ether_header) - ip_header->ip_hl * 4);
}

int create_raw_socket(const char *interface) {
    int raw_socket = socket(AF_PACKET, SOCK_RAW, htons(ETH_P_ALL));
    
    if (raw_socket < 0) {
        perror("Failed to create raw socket");
        return -1;
    }
    
    struct ifreq ifr;
    memset(&ifr, 0, sizeof(ifr));
    strncpy(ifr.ifr_name, interface, IFNAMSIZ - 1);
    
    if (setsockopt(raw_socket, SOL_SOCKET, SO_BINDTODEVICE, &ifr, sizeof(ifr)) < 0) {
        perror("Failed to bind to interface");
        close(raw_socket);
        return -1;
    }
    
    return raw_socket;
}

void packet_sniffer(const char *interface, int packet_count) {
    int raw_socket = create_raw_socket(interface);
    
    if (raw_socket < 0) {
        fprintf(stderr, "Failed to create packet sniffer\n");
        return;
    }
    
    unsigned char *buffer = (unsigned char *)malloc(BUFFER_SIZE);
    NetworkAnalyzer analyzer = {0};
    
    printf("Starting packet capture on interface: %s\n", interface);
    printf("Press Ctrl+C to stop...\n\n");
    
    int count = 0;
    while (count < packet_count || packet_count == 0) {
        int size = recvfrom(raw_socket, buffer, BUFFER_SIZE, 0, NULL, NULL);
        
        if (size < 0) {
            perror("Failed to receive packet");
            continue;
        }
        
        analyze_packet(buffer, size, &analyzer);
        count++;
    }
    
    free(buffer);
    close(raw_socket);
}
```

### Example 5: IPv6 and Dual-Stack Server (Rust)
```rust
use std::io::{self, Read, Write};
use std::net::{SocketAddr, TcpListener, TcpStream, ToSocketAddrs, UdpSocket};
use std::sync::Arc;
use std::thread;

struct DualStackServer {
    ipv4_addr: String,
    ipv6_addr: String,
    port: u16,
}

impl DualStackServer {
    fn new(ipv4_addr: String, ipv6_addr: String, port: u16) -> Self {
        Self { ipv4_addr, ipv6_addr, port }
    }

    fn start(&self) -> io::Result<()> {
        let ipv4_addr = format!("{}:{}", self.ipv4_addr, self.port);
        let ipv6_addr = format!("[{}]:{}", self.ipv6_addr, self.port);
        
        let ipv4_listener = TcpListener::bind(&ipv4_addr)?;
        let ipv6_listener = TcpListener::bind(&ipv6_addr)?;
        
        println!("Server listening on IPv4: {}", ipv4_addr);
        println!("Server listening on IPv6: {}", ipv6_addr);
        
        let running = Arc::new(std::sync::atomic::AtomicBool::new(true));
        let running_clone = running.clone();
        
        thread::spawn(move || {
            for stream in ipv4_listener.incoming() {
                if !running_clone.load(std::sync::atomic::Ordering::Relaxed) {
                    break;
                }
                if let Ok(stream) = stream {
                    self.handle_client(stream);
                }
            }
        });
        
        for stream in ipv6_listener.incoming() {
            if !running.load(std::sync::atomic::Ordering::Relaxed) {
                break;
            }
            if let Ok(stream) = stream {
                self.handle_client(stream);
            }
        }
        
        Ok(())
    }

    fn handle_client(&self, mut stream: TcpStream) {
        let addr = stream.peer_addr().unwrap();
        let mut buffer = [0; 1024];
        
        println!("Client connected: {:?}", addr);
        
        loop {
            let bytes_read = match stream.read(&mut buffer) {
                Ok(0) => break,
                Ok(n) => n,
                Err(e) => {
                    eprintln!("Error reading from {}: {}", addr, e);
                    break;
                }
            };
            
            println!("Received {} bytes from {}", bytes_read, addr);
            
            let response = format!("Echo: {}", String::from_utf8_lossy(&buffer[..bytes_read]));
            
            if let Err(e) = stream.write_all(response.as_bytes()) {
                eprintln!("Error writing to {}: {}", addr, e);
                break;
            }
        }
        
        println!("Client disconnected: {}", addr);
    }
}

struct UDP6Server {
    socket: UdpSocket,
}

impl UDP6Server {
    fn new(addr: &str) -> io::Result<Self> {
        let socket = UdpSocket::bind(addr)?;
        socket.set_broadcast(true)?;
        Ok(Self { socket })
    }

    fn broadcast(&self, message: &str, broadcast_addr: &str) -> io::Result<usize> {
        self.socket.send_to(message.as_bytes(), broadcast_addr)
    }

    fn receive(&self, buffer: &mut [u8]) -> io::Result<(usize, SocketAddr)> {
        self.socket.recv_from(buffer)
    }
}

fn main() -> io::Result<()> {
    let server = DualStackServer::new(
        "0.0.0.0".to_string(),
        "::".to_string(),
        8080
    );
    
    server.start()
}
```

## Best Practices

- Use TCP for reliable, ordered delivery; UDP for real-time, low-latency needs
- Implement proper error handling and connection recovery
- Set appropriate timeouts for socket operations
- Use connection pooling for high-throughput services
- Monitor connection states and handle graceful degradation
- Implement proper backlog handling for connection queues
- Consider using epoll/kqueue/IOCP for high-concurrency servers
- Use non-blocking I/O with event loops for scalability
- Implement proper resource cleanup and connection termination
- Monitor for connection exhaustion and resource leaks

## Core Competencies

- TCP and UDP socket programming
- Connection lifecycle management
- Socket options and timeouts
- Non-blocking I/O and event loops
- Packet structure and headers
- IPv4 and IPv6 addressing
- Network byte order and endianness
- Socket security considerations
- Connection pooling
- Protocol design and implementation
- Performance optimization
- Debugging network issues
- Firewall and NAT traversal
- Load balancing strategies
- High availability patterns
