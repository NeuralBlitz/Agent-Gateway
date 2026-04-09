---
name: load-testing
description: Load testing and performance testing best practices
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: testing
---
## What I do
- Design load tests
- Use load testing tools
- Define performance baselines
- Analyze bottlenecks
- Simulate realistic traffic
- Monitor during tests
- Interpret results
- Create performance reports

## When to use me
When conducting load tests or analyzing performance.

## Load Testing Types
```
Unit Load Tests
├── Small, focused tests
├── Single endpoints
└── Baseline performance

Integration Load Tests
├── Multiple services
├── End-to-end flows
└── Service interactions

System Load Tests
├── Full system under load
├── Normal peak load
└── Failover behavior

Stress Tests
├── Beyond normal capacity
├── Find breaking point
└── Recovery behavior

Spike Tests
├── Sudden traffic bursts
├── Auto-scaling behavior
└── Recovery time

Soak Tests
├── Extended duration
├── Memory leak detection
└── Resource exhaustion
```

## k6 Load Test Script
```javascript
// k6 load test script
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';


// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestsPerSecond = new Trend('requests_per_second');
const activeUsers = new Counter('active_users');


// Test options
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 500 },  // Ramp up to 500
    { duration: '5m', target: 500 },  // Stay at 500 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    errors: ['rate<0.01'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
  
  // Virtual users
  vus: 500,
  max_vus: 1000,
  
  // Test duration
  duration: '16m',
};


// Test data
const BASE_URL = 'https://api.example.com';
const TEST_USERS = JSON.parse(open('./test-users.json'));


export function setup() {
  // Generate test data
  const products = [];
  for (let i = 0; i < 100; i++) {
    products.push({
      id: `product-${i}`,
      name: `Test Product ${i}`,
      price: randomIntBetween(10, 1000),
    });
  }
  
  return { products };
}


export default function (data) {
  const user = TEST_USERS[randomIntBetween(0, TEST_USERS.length - 1)];
  activeUsers.add(1);
  
  // Homepage
  let response = http.get(`${BASE_URL}/`, {
    headers: {
      'Accept-Encoding': 'gzip',
      'User-Agent': 'k6-load-test',
    },
  });
  
  check(response, {
    'homepage returns 200': (r) => r.status === 200,
    'homepage loads under 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);
  
  responseTime.add(response.timings.duration);
  
  sleep(randomIntBetween(1, 3));
  
  // Browse products
  response = http.get(`${BASE_URL}/api/v1/products?limit=20`, {
    headers: {
      'Authorization': `Bearer ${user.token}`,
      'Accept': 'application/json',
    },
  });
  
  const products = JSON.parse(response.body);
  
  check(response, {
    'products endpoint returns 200': (r) => r.status === 200,
    'products returns data': (r) => products.data && products.data.length > 0,
  }) || errorRate.add(1);
  
  sleep(randomIntBetween(2, 5));
  
  // View single product
  if (products.data && products.data.length > 0) {
    const productId = products.data[randomIntBetween(0, products.data.length - 1)].id;
    
    response = http.get(`${BASE_URL}/api/v1/products/${productId}`, {
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Accept': 'application/json',
      },
    });
    
    check(response, {
      'product detail returns 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  }
  
  sleep(randomIntBetween(1, 2));
}


export function teardown(data) {
  // Cleanup after test
  console.log('Load test completed');
}


export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}
```

## Python locust Test
```python
from locust import HttpUser, task, between, events
from locust.runners import MasterRunner


class WebsiteUser(HttpUser):
    wait_time = between(1, 5)
    
    def on_start(self):
        """Called when user starts."""
        self.login()
    
    def on_stop(self):
        """Called when user stops."""
        self.logout()
    
    def login(self):
        """Perform login."""
        response = self.client.post('/api/v1/auth/login', json={
            'email': 'test@example.com',
            'password': 'testpassword',
        })
        
        if response.status_code == 200:
            self.token = response.json()['access_token']
        else:
            self.token = None
    
    def logout(self):
        """Perform logout."""
        if self.token:
            self.client.post(
                '/api/v1/auth/logout',
                headers={'Authorization': f'Bearer {self.token}'}
            )
    
    @task(3)
    def view_homepage(self):
        """View homepage."""
        with self.client.get('/', catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f'Status {response.status_code}')
    
    @task(5)
    def browse_products(self):
        """Browse products."""
        with self.client.get(
            '/api/v1/products',
            headers={'Authorization': f'Bearer {self.token}'},
            name='/api/v1/products',
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f'Status {response.status_code}')
    
    @task(2)
    def view_product(self):
        """View single product."""
        product_id = self.get_random_product_id()
        
        with self.client.get(
            f'/api/v1/products/{product_id}',
            headers={'Authorization': f'Bearer {self.token}'},
            name='/api/v1/products/{id}',
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f'Status {response.status_code}')
    
    def get_random_product_id(self) -> str:
        """Get random product ID."""
        return f'product-{random.randint(1, 100)}'


# Custom events
@events.init.add_listener
def on_locust_init(environment, **kwargs):
    if isinstance(environment.runner, MasterRunner):
        print("Master node initialized")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    print(f"Test ended at {datetime.now()}")
```

## Test Scenarios
```yaml
# k6 cloud test configuration
scenarios:
  # Constant load
  constant_load:
    executor: constant-arrival-rate
    rate: 100
    timeUnit: 1s
    duration: 10m
    preAllocatedVUs: 50
    maxVUs: 100

  # Ramp load
  ramp_load:
    executor: ramping-arrival-rate
    startRate: 10
    stages:
      - duration: 2m, target: 100
      - duration: 5m, target: 100
      - duration: 2m, target: 500
      - duration: 5m, target: 500
      - duration: 2m, target: 0
    preAllocatedVUs: 50
    maxVUs: 500

  # Spike test
  spike_test:
    executor: step-load
    stages:
      - duration: 1m, target: 100
      - duration: 30s, target: 1000
      - duration: 1m, target: 1000
      - duration: 30s, target: 100
      - duration: 1m, target: 100

  # Soak test
  soak_test:
    executor: constant-vus
    vus: 100
    duration: 24h
```

## Analyzing Results
```python
import pandas as pd
import matplotlib.pyplot as plt


class LoadTestAnalyzer:
    """Analyze load test results."""
    
    def __init__(self, results_file: str) -> None:
        self.data = pd.read_json(results_file, lines=True)
    
    def calculate_percentiles(self) -> dict:
        """Calculate response time percentiles."""
        response_times = self.data['http_req_duration']
        
        return {
            'p50': response_times.quantile(0.50),
            'p90': response_times.quantile(0.90),
            'p95': response_times.quantile(0.95),
            'p99': response_times.quantile(0.99),
            'max': response_times.max(),
            'mean': response_times.mean(),
        }
    
    def calculate_error_rate(self) -> float:
        """Calculate overall error rate."""
        errors = self.data[self.data['http_req_failed'] == True]
        return len(errors) / len(self.data)
    
    def find_bottlenecks(self) -> list:
        """Find endpoints with high latency."""
        avg_response = self.data.groupby('name')['http_req_duration'].mean()
        
        return avg_response.sort_values(ascending=False).head(10)
    
    def plot_response_times(self, output_file: str) -> None:
        """Create response time distribution plot."""
        plt.figure(figsize=(12, 6))
        
        # Response time over time
        self.data['timestamp'] = pd.to_datetime(self.data['timestamp'])
        plt.plot(
            self.data['timestamp'],
            self.data['http_req_duration'].rolling(60).mean()
        )
        
        plt.xlabel('Time')
        plt.ylabel('Response Time (ms)')
        plt.title('Response Time Over Load Test')
        plt.savefig(output_file)
    
    def generate_report(self) -> str:
        """Generate summary report."""
        percentiles = self.calculate_percentiles()
        error_rate = self.calculate_error_rate()
        
        return f"""
Load Test Report
================

Percentile Response Times:
  p50: {percentiles['p50']:.2f}ms
  p90: {percentiles['p90']:.2f}ms
  p95: {percentiles['p95']:.2f}ms
  p99: {percentiles['p99']:.2f}ms
  Max: {percentiles['max']:.2f}ms

Error Rate: {error_rate * 100:.2f}%

Top 5 Slowest Endpoints:
{self.find_bottlenecks().head(5)}
"""
```

## Best Practices
```
1. Test in production-like environment
   - Same resources, same configuration
   - Realistic data volumes

2. Define clear success criteria
   - Response time thresholds
   - Error rate limits
   - Throughput requirements

3. Warm up before testing
   - JIT compilation
   - Database connection pools
   - Cache population

4. Monitor during tests
   - CPU, memory, I/O
   - Database queries
   - Network latency

5. Test realistic scenarios
   - User journeys, not just URLs
   - Think time between requests
   - Variable data

6. Start small, increase gradually
   - Find baseline first
   - Identify breaking point
   - Don't break the system

7. Test failure scenarios
   - What happens when X fails?
   - Recovery time objectives
   - Graceful degradation

8. Document and share results
   - Baseline for future tests
   - Share with stakeholders
   - Track over time
```
