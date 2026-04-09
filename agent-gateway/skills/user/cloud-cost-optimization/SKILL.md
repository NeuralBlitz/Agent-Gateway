---
name: cloud-cost-optimization
description: Cloud spending reduction strategies
license: MIT
compatibility: opencode
metadata:
  audience: devops-engineer, platform-engineer, finance
  category: devops
---

## What I do

- Analyze cloud spending patterns and identify waste
- Implement cost optimization strategies across services
- Design right-sizing policies for compute resources
- Leverage reserved instances and savings plans
- Implement auto-scaling and resource scheduling
- Build cost allocation and showback models

## When to use me

- When cloud costs are higher than expected
- When you need to optimize existing cloud usage
- When planning new cloud deployments on a budget
- When implementing FinOps practices
- When needing visibility into cloud spending
- When allocating costs to teams or projects

## Key Concepts

### Cost Analysis Queries

```sql
-- AWS Cost Explorer - Daily costs by service
SELECT 
  line_item_usage_start_date,
  line_item_product_code,
  SUM(line_item_unblended_cost) as cost
FROM aws_cost_and_usage
WHERE line_item_usage_start_date 
  BETWEEN DATE_TRUNC('month', CURRENT_DATE) 
  AND CURRENT_DATE
GROUP BY 1, 2
ORDER BY 3 DESC;
```

### Right-Sizing Recommendations

```python
# GCP Recommender API example
from google.cloud import recommender_v1

client = recommender_v1.RecommenderClient()
project_id = "my-project"

# Get idle resource recommendations
recommendations = client.list_recommendations(
    parent=f"projects/{project_id}/locations/-/recommenders/"
           f"google.compute.instance.IdleResourceRecommender"
)

for rec in recommendations:
    print(f"Recommendation: {rec.description}")
    print(f"Potential savings: {rec.primary_impact.cost_forecast.amount}")
```

### Cost Optimization Strategies

| Category | Strategy | Potential Savings |
|----------|----------|-------------------|
| Compute | Right-sizing instances | 20-40% |
| Compute | Reserved/Savings Plans | 30-60% |
| Storage | Lifecycle policies | 50-70% |
| Data Transfer | CDN usage | 40-60% |
| Database | Reserved instances | 30-50% |
| Serverless | Pay-per-use optimization | 20-30% |

### Resource Scheduling

```yaml
# Kubernetes pod scheduling for cost savings
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: low-priority
value: -10
globalDefault: false
description: "Non-production workloads"
---
apiVersion: v1
kind: Pod
metadata:
  name: batch-job
spec:
  priorityClassName: low-priority
  tolerations:
    - key: "spot"
      operator: "Equal"
      value: "true"
      effect: "NoSchedule"
```

### Budget Alerts

```hcl
# Terraform AWS Budgets
resource "aws_budgets_budget" "monthly" {
  name         = "monthly-cost-budget"
  budget_type  = "COST"
  limit_amount = "5000"
  limit_unit   = "USD"
  time_period_start = "2024-01-01"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator = "GREATER_THAN"
    threshold          = 80
    threshold_type     = "PERCENTAGE"
    notification_type  = "FORECASTED"
  }
}
```

### FinOps Framework

1. **Inform**: Provide cost visibility to teams
2. **Optimize**: Act on optimization opportunities
3. **Operate**: Maintain cost efficiency over time
4. **Govern**: Establish policies and guardrails

### Key Metrics

- Cost per user or transaction
- Cost per environment (dev, staging, prod)
- Idle resource percentage
- Savings plan coverage
- Resource utilization rates
- Cloud waste percentage
