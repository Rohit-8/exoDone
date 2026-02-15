// ============================================================================
// Cloud Architecture — Content
// ============================================================================

export const topic = {
  "name": "Cloud Architecture",
  "slug": "cloud-architecture",
  "description": "Design cloud-native applications with serverless, containers, IaC, and cloud design patterns.",
  "estimated_time": 220,
  "order_index": 6
};

export const lessons = [
  {
    title: "Cloud-Native Design Patterns",
    slug: "cloud-native-patterns",
    summary: "Master key cloud patterns — 12-factor app, strangler fig, sidecar, and serverless architectures.",
    difficulty_level: "advanced",
    estimated_time: 40,
    order_index: 1,
    key_points: [
  "The 12-Factor App methodology guides cloud-native design",
  "Containers (Docker) provide consistent, reproducible deployments",
  "Serverless (Lambda/Functions) scales to zero — pay only for usage",
  "Infrastructure as Code (Terraform, CDK) makes infrastructure version-controlled",
  "The Strangler Fig pattern enables gradual migration from monolith to cloud"
],
    content: `# Cloud-Native Design Patterns

## The 12-Factor App

| Factor | Principle |
|---|---|
| I. Codebase | One codebase in version control, many deploys |
| II. Dependencies | Explicitly declare and isolate dependencies |
| III. Config | Store config in environment variables |
| IV. Backing Services | Treat databases, caches as attached resources |
| V. Build, Release, Run | Strictly separate build from run |
| VI. Processes | Execute as stateless processes |
| VII. Port Binding | Export services via port binding |
| VIII. Concurrency | Scale out via the process model |
| IX. Disposability | Fast startup, graceful shutdown |
| X. Dev/Prod Parity | Keep dev, staging, production similar |
| XI. Logs | Treat logs as event streams |
| XII. Admin Processes | Run admin tasks as one-off processes |

## Containerization (Docker)

\`\`\`dockerfile
# Multi-stage build for Node.js
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Non-root user for security
RUN adduser -D appuser
USER appuser

EXPOSE 5000
HEALTHCHECK --interval=30s CMD curl -f http://localhost:5000/health || exit 1
CMD ["node", "src/server.js"]
\`\`\`

## Serverless Architecture

\`\`\`
Client → API Gateway → Lambda Function → DynamoDB
                     → Lambda Function → S3
                     → Lambda Function → SQS → Lambda → Process
\`\`\`

\`\`\`javascript
// AWS Lambda handler
export const handler = async (event) => {
  const { httpMethod, pathParameters, body } = event;

  try {
    switch (httpMethod) {
      case 'GET':
        const item = await dynamoDB.get({
          TableName: 'Products',
          Key: { id: pathParameters.id },
        }).promise();
        return { statusCode: 200, body: JSON.stringify(item.Item) };

      case 'POST':
        const data = JSON.parse(body);
        await dynamoDB.put({
          TableName: 'Products',
          Item: { id: crypto.randomUUID(), ...data, createdAt: Date.now() },
        }).promise();
        return { statusCode: 201, body: JSON.stringify({ success: true }) };

      default:
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
\`\`\`

## Strangler Fig Migration

Gradually replace monolith functionality:

\`\`\`
Phase 1:  Monolith handles 100% of traffic
Phase 2:  New /api/users routes → User Microservice (proxy from monolith)
Phase 3:  New /api/orders routes → Order Microservice
Phase 4:  Monolith handles only legacy features
Phase 5:  Monolith decommissioned
\`\`\`

## Infrastructure as Code

\`\`\`javascript
// AWS CDK (TypeScript)
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

const fn = new lambda.Function(this, 'ApiHandler', {
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset('lambda'),
  memorySize: 256,
  timeout: cdk.Duration.seconds(30),
  environment: {
    TABLE_NAME: table.tableName,
  },
});

new apigateway.LambdaRestApi(this, 'Api', { handler: fn });
\`\`\`
`,
  },
];
