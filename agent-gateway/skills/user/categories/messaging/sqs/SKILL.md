# AWS SQS

Amazon Simple Queue Service is a fully managed message queuing service. It enables decoupling and scaling of microservices, distributed systems, and serverless applications.

## Key Concepts

- Standard and FIFO queues
- Visibility timeout
- Dead letter queues
- Message retention
- Long polling

## Common Use Cases

- Task queues
- Decoupling services
- Batch processing
- Order processing
- Background jobs

## Best Practices

- Use FIFO for ordering needs
- Configure appropriate timeouts
- Implement DLQ pattern
- Use batching for efficiency
- Monitor queue metrics

## Resources

- AWS Docs: docs.aws.amazon.com/sqs
- Related Skills: aws, messaging, serverless
