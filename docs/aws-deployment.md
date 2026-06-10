# AWS Deployment

The AWS path deploys the API container to ECS Fargate behind an Application Load Balancer and provisions PostgreSQL on Amazon RDS. GitHub Actions builds the Docker image, pushes it to ECR, deploys CloudFormation, stores the API URL in the repository variable `VITE_API_URL`, and triggers the GitHub Pages workflow so the public demo talks to the hosted API.

## Required GitHub Settings

Add these before running the `Deploy AWS API` workflow:

| Type | Name | Value |
| --- | --- | --- |
| Secret | `AWS_ROLE_TO_ASSUME` | IAM role ARN trusted by GitHub OIDC for this repository |
| Variable | `AWS_REGION` | AWS region, for example `us-east-1` |
| Variable | `CORS_ORIGIN` | `https://saithej2k.github.io` |

The workflow uses OpenID Connect rather than storing long-lived AWS access keys.

## Provisioned Resources

- VPC with two public subnets and two private database subnets
- ECS Fargate service for the Node API
- Application Load Balancer with `/api/health` checks
- ECR repository for the Docker image
- RDS PostgreSQL instance with generated Secrets Manager credentials
- CloudWatch log group for API containers

## After Deployment

The workflow prints the API URL and updates `VITE_API_URL` to `<api-url>/api`. The Pages workflow then rebuilds the React app so the live demo uses the hosted API and RDS database instead of browser-local demo state.

To validate manually:

```bash
curl <api-url>/api/health
curl <api-url>/api/workspaces/workspace-demo
```

