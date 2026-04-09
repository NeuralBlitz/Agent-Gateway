# AWS Skill

Amazon Web Services management.

## Commands

### List EC2
```
/aws ec2 list
```
List EC2 instances.

### EC2 Status
```
/aws ec2 status <instance_id>
```
Get EC2 instance status.

### Start Instance
```
/aws ec2 start <instance_id>
```
Start EC2 instance.

### Stop Instance
```
/aws ec2 stop <instance_id>
```
Stop EC2 instance.

### List S3 Buckets
```
/aws s3 list
```
List S3 buckets.

### S3 Upload
```
/aws s3 upload <file> <bucket>
```
Upload file to S3.

### S3 Download
```
/aws s3 download <bucket> <key>
```
Download file from S3.

### List Lambda
```
/aws lambda list
```
List Lambda functions.

### Invoke Lambda
```
/aws lambda invoke <function>
```
Invoke Lambda function.

### CloudWatch Logs
```
/aws logs <group> [stream]
```
View CloudWatch logs.

### ECS Tasks
```
/aws ecs tasks <cluster>
```
List ECS tasks.

## Examples

```
/aws ec2 list
/aws ec2 status i-12345678
/aws ec2 start i-12345678
/aws s3 list
/aws s3 upload data.csv my-bucket
/aws lambda list
/aws logs /aws/lambda/my-function
/aws ecs tasks production
```
