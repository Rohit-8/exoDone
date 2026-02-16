const examples = {
  "cloud-native-patterns": [
    {
      title: "Kubernetes Deployment with Service and Ingress",
      description:
        "A complete Kubernetes deployment manifest that defines a containerized Node.js application with replicas, resource limits, health probes, a ClusterIP service, and an Ingress for external HTTP routing. This demonstrates production-ready K8s configuration.",
      language: "yaml",
      code: `# deployment.yaml — Production-grade Kubernetes manifests
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
  namespace: production
  labels:
    app: api-server
    version: v1.4.2
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1          # At most 1 extra pod during update
      maxUnavailable: 0    # Zero downtime
  selector:
    matchLabels:
      app: api-server
  template:
    metadata:
      labels:
        app: api-server
        version: v1.4.2
    spec:
      serviceAccountName: api-server-sa
      containers:
        - name: api-server
          image: 123456789.dkr.ecr.us-east-1.amazonaws.com/api-server:v1.4.2
          ports:
            - containerPort: 3000
              protocol: TCP
          env:
            - name: NODE_ENV
              value: "production"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: connection-string
            - name: LOG_LEVEL
              valueFrom:
                configMapKeyRef:
                  name: api-config
                  key: log-level
          resources:
            requests:
              cpu: "250m"
              memory: "256Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          livenessProbe:
            httpGet:
              path: /health/live
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 15
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
            failureThreshold: 2
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 10"]  # Drain connections
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app: api-server
---
apiVersion: v1
kind: Service
metadata:
  name: api-server-svc
  namespace: production
spec:
  type: ClusterIP
  selector:
    app: api-server
  ports:
    - port: 80
      targetPort: 3000
      protocol: TCP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-server-ingress
  namespace: production
  annotations:
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - api.example.com
      secretName: api-tls-cert
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-server-svc
                port:
                  number: 80
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-server-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80`,
      explanation:
        "This manifest demonstrates several Kubernetes best practices: (1) A Deployment with 3 replicas and a RollingUpdate strategy that ensures zero downtime (maxUnavailable: 0). (2) Secrets are injected from a Kubernetes Secret via secretKeyRef, keeping credentials out of code. (3) ConfigMaps supply non-sensitive config. (4) Resource requests and limits ensure the scheduler places pods correctly and prevents resource starvation. (5) Liveness and readiness probes let Kubernetes automatically restart unhealthy containers and stop routing traffic to unready pods. (6) TopologySpreadConstraints distribute pods across availability zones. (7) The Service provides a stable internal endpoint, while the Ingress exposes the app externally with TLS via cert-manager. (8) An HPA auto-scales between 3–20 replicas based on CPU and memory utilization.",
      order_index: 1,
    },
    {
      title: "Terraform Multi-Resource AWS Infrastructure",
      description:
        "A Terraform configuration that provisions a production VPC with public and private subnets across availability zones, a NAT gateway, an Application Load Balancer, an ECS Fargate cluster, and an RDS PostgreSQL database — all with proper networking and security groups.",
      language: "hcl",
      code: `# main.tf — Production AWS Infrastructure with Terraform
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "myapp-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "MyApp"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# --- Variables ---
variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "db_password" {
  type      = string
  sensitive = true
}

# --- Networking ---
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "myapp-\${var.environment}-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["\${var.aws_region}a", "\${var.aws_region}b", "\${var.aws_region}c"]
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnets = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]

  enable_nat_gateway     = true
  single_nat_gateway     = false   # One NAT per AZ for HA
  enable_dns_hostnames   = true
  enable_dns_support     = true

  public_subnet_tags = { Tier = "Public" }
  private_subnet_tags = { Tier = "Private" }
}

# --- Security Groups ---
resource "aws_security_group" "alb_sg" {
  name_prefix = "alb-sg-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from internet"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "app_sg" {
  name_prefix = "app-sg-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
    description     = "Traffic from ALB only"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "db_sg" {
  name_prefix = "db-sg-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
    description     = "PostgreSQL from app only"
  }
}

# --- RDS PostgreSQL ---
resource "aws_db_instance" "main" {
  identifier     = "myapp-\${var.environment}-db"
  engine         = "postgres"
  engine_version = "16.1"
  instance_class = "db.r6g.large"

  allocated_storage     = 100
  max_allocated_storage = 500
  storage_encrypted     = true

  db_name  = "myapp"
  username = "app_user"
  password = var.db_password

  multi_az               = true
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]

  backup_retention_period = 14
  deletion_protection     = true
  skip_final_snapshot     = false
  final_snapshot_identifier = "myapp-\${var.environment}-final"

  performance_insights_enabled = true
}

resource "aws_db_subnet_group" "main" {
  name       = "myapp-\${var.environment}-db-subnet"
  subnet_ids = module.vpc.private_subnets
}

# --- ECS Fargate ---
resource "aws_ecs_cluster" "main" {
  name = "myapp-\${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_task_definition" "api" {
  family                   = "myapp-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "api"
    image     = "\${aws_ecr_repository.api.repository_url}:latest"
    essential = true
    portMappings = [{ containerPort = 3000, protocol = "tcp" }]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/myapp-api"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "api"
      }
    }
    secrets = [
      { name = "DATABASE_URL", valueFrom = aws_ssm_parameter.db_url.arn }
    ]
  }])
}

resource "aws_ecs_service" "api" {
  name            = "api-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = module.vpc.private_subnets
    security_groups = [aws_security_group.app_sg.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 3000
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
}

# --- Outputs ---
output "alb_dns_name" {
  value       = aws_lb.main.dns_name
  description = "Application Load Balancer DNS name"
}

output "rds_endpoint" {
  value       = aws_db_instance.main.endpoint
  description = "RDS PostgreSQL endpoint"
  sensitive   = true
}`,
      explanation:
        "This Terraform configuration demonstrates a production-ready AWS architecture: (1) Remote state in S3 with DynamoDB locking prevents concurrent modifications. (2) The VPC module creates public and private subnets across 3 AZs with NAT gateways for high availability. (3) Security groups follow least-privilege: the ALB accepts HTTPS from the internet, the app only accepts traffic from the ALB, and the database only accepts connections from the app. (4) RDS PostgreSQL is multi-AZ with encryption, backup retention, deletion protection, and Performance Insights. (5) ECS Fargate runs containers without managing servers, with secrets injected from SSM Parameter Store. (6) A deployment circuit breaker automatically rolls back failed deployments. (7) Default tags ensure every resource is traceable for cost allocation.",
      order_index: 2,
    },
    {
      title: "AWS Lambda Serverless Function with API Gateway",
      description:
        "A serverless API handler using AWS Lambda that processes orders. Includes connection reuse, structured logging, input validation, error handling, and integration with DynamoDB and SQS — demonstrating real-world serverless patterns.",
      language: "javascript",
      code: `// handler.js — Serverless order processing function
// Module-level initialization: runs once per cold start, reused across warm invocations
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand,
} = require('@aws-sdk/lib-dynamodb');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const crypto = require('crypto');

// Reuse clients across invocations (warm start optimization)
const dynamoClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION })
);
const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

const ORDERS_TABLE = process.env.ORDERS_TABLE;
const NOTIFICATIONS_QUEUE = process.env.NOTIFICATIONS_QUEUE_URL;

// --- Utilities ---
const response = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'X-Request-Id': body.requestId || 'unknown',
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  },
  body: JSON.stringify(body),
});

const log = (level, message, meta = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  // Structured JSON logging — parsed by CloudWatch Insights
  console.log(JSON.stringify(entry));
};

// --- Validation ---
const validateOrder = (order) => {
  const errors = [];
  if (!order.customerId || typeof order.customerId !== 'string') {
    errors.push('customerId is required and must be a string');
  }
  if (!Array.isArray(order.items) || order.items.length === 0) {
    errors.push('items must be a non-empty array');
  }
  if (order.items) {
    order.items.forEach((item, i) => {
      if (!item.productId) errors.push(\`items[\${i}].productId is required\`);
      if (!item.quantity || item.quantity < 1) {
        errors.push(\`items[\${i}].quantity must be >= 1\`);
      }
      if (!item.price || item.price <= 0) {
        errors.push(\`items[\${i}].price must be > 0\`);
      }
    });
  }
  return errors;
};

// --- Handlers ---
const createOrder = async (event) => {
  const requestId = event.requestContext?.requestId || crypto.randomUUID();

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return response(400, { error: 'Invalid JSON body', requestId });
  }

  const errors = validateOrder(body);
  if (errors.length > 0) {
    log('warn', 'Validation failed', { requestId, errors });
    return response(400, { error: 'Validation failed', details: errors, requestId });
  }

  const order = {
    orderId: \`ORD-\${Date.now()}-\${crypto.randomBytes(4).toString('hex')}\`,
    customerId: body.customerId,
    items: body.items,
    totalAmount: body.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ttl: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60, // 90-day TTL
  };

  try {
    // Write to DynamoDB
    await dynamoClient.send(new PutCommand({
      TableName: ORDERS_TABLE,
      Item: order,
      ConditionExpression: 'attribute_not_exists(orderId)', // Prevent duplicates
    }));

    // Send notification to SQS for async processing
    await sqsClient.send(new SendMessageCommand({
      QueueUrl: NOTIFICATIONS_QUEUE,
      MessageBody: JSON.stringify({
        type: 'ORDER_CREATED',
        orderId: order.orderId,
        customerId: order.customerId,
        totalAmount: order.totalAmount,
      }),
      MessageGroupId: order.customerId, // FIFO queue ordering per customer
      MessageDeduplicationId: order.orderId,
    }));

    log('info', 'Order created successfully', {
      requestId,
      orderId: order.orderId,
      totalAmount: order.totalAmount,
    });

    return response(201, { order, requestId });
  } catch (err) {
    log('error', 'Failed to create order', {
      requestId,
      error: err.message,
      stack: err.stack,
    });
    return response(500, { error: 'Internal server error', requestId });
  }
};

const getOrder = async (event) => {
  const requestId = event.requestContext?.requestId || crypto.randomUUID();
  const { orderId } = event.pathParameters || {};

  if (!orderId) {
    return response(400, { error: 'orderId is required', requestId });
  }

  try {
    const result = await dynamoClient.send(new GetCommand({
      TableName: ORDERS_TABLE,
      Key: { orderId },
    }));

    if (!result.Item) {
      return response(404, { error: 'Order not found', requestId });
    }

    return response(200, { order: result.Item, requestId });
  } catch (err) {
    log('error', 'Failed to get order', { requestId, orderId, error: err.message });
    return response(500, { error: 'Internal server error', requestId });
  }
};

// --- Router ---
exports.handler = async (event) => {
  log('info', 'Incoming request', {
    method: event.httpMethod,
    path: event.path,
    requestId: event.requestContext?.requestId,
  });

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return response(200, { message: 'OK' });
  }

  switch (true) {
    case event.httpMethod === 'POST' && event.path === '/orders':
      return createOrder(event);
    case event.httpMethod === 'GET' && event.path.startsWith('/orders/'):
      return getOrder(event);
    default:
      return response(404, {
        error: 'Not found',
        requestId: event.requestContext?.requestId,
      });
  }
};`,
      explanation:
        "This serverless function demonstrates production patterns: (1) Module-level client initialization reuses DynamoDB and SQS connections across warm invocations, avoiding cold-start overhead on every call. (2) Structured JSON logging enables CloudWatch Insights queries for debugging. (3) Input validation returns detailed error messages. (4) DynamoDB's ConditionExpression prevents duplicate orders (idempotency). (5) SQS decouples order notification from the synchronous request cycle (event-driven architecture). (6) A TTL attribute enables automatic data cleanup. (7) CORS headers and preflight handling support browser clients. (8) The router pattern keeps all related endpoints in a single Lambda, reducing cold starts compared to one-function-per-endpoint.",
      order_index: 3,
    },
    {
      title: "GitHub Actions CI/CD Pipeline for Cloud Deployment",
      description:
        "A comprehensive GitHub Actions workflow that builds, tests, scans, and deploys a containerized application to AWS ECS Fargate — with Terraform infrastructure preview on pull requests and automated production deployment on merge to main.",
      language: "yaml",
      code: `# .github/workflows/deploy.yml — Full CI/CD Pipeline
name: Build, Test & Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  id-token: write    # OIDC for AWS authentication
  contents: read
  pull-requests: write  # Comment Terraform plan on PRs

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: myapp-api
  ECS_CLUSTER: myapp-production
  ECS_SERVICE: api-service

jobs:
  # ── Job 1: Test & Lint ──────────────────────────────
  test:
    name: Test & Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Lint
        run: npm run lint

      - name: Unit Tests
        run: npm test -- --coverage
        env:
          NODE_ENV: test

      - name: Upload coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

  # ── Job 2: Security Scan ────────────────────────────
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: fs
          scan-ref: .
          severity: CRITICAL,HIGH
          exit-code: 1    # Fail pipeline on critical/high vulns

      - name: Run npm audit
        run: npm audit --audit-level=high

  # ── Job 3: Build & Push Docker Image ────────────────
  build:
    name: Build & Push Image
    runs-on: ubuntu-latest
    needs: [test, security]
    if: github.ref == 'refs/heads/main'
    outputs:
      image_tag: \${{ steps.meta.outputs.tags }}
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole
          aws-region: \${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: ecr-login
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag, and push image
        id: meta
        env:
          REGISTRY: \${{ steps.ecr-login.outputs.registry }}
          IMAGE_TAG: \${{ github.sha }}
        run: |
          docker build \\
            --build-arg BUILD_DATE=\$(date -u +'%Y-%m-%dT%H:%M:%SZ') \\
            --build-arg GIT_SHA=\${{ github.sha }} \\
            -t \$REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG \\
            -t \$REGISTRY/\$ECR_REPOSITORY:latest \\
            .

          # Scan the built image for vulnerabilities
          docker run --rm \\
            -v /var/run/docker.sock:/var/run/docker.sock \\
            aquasec/trivy image \\
            --severity CRITICAL \\
            --exit-code 1 \\
            \$REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG

          docker push \$REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG
          docker push \$REGISTRY/\$ECR_REPOSITORY:latest
          echo "tags=\$REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG" >> \$GITHUB_OUTPUT

  # ── Job 4: Terraform Plan (PRs only) ───────────────
  terraform-plan:
    name: Terraform Plan
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole
          aws-region: \${{ env.AWS_REGION }}

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.6.0

      - name: Terraform Init
        working-directory: infrastructure/
        run: terraform init

      - name: Terraform Plan
        working-directory: infrastructure/
        id: plan
        run: terraform plan -no-color -out=tfplan
        continue-on-error: true

      - name: Comment plan on PR
        uses: actions/github-script@v7
        with:
          script: |
            const plan = \`\${{ steps.plan.outputs.stdout }}\`;
            const truncated = plan.length > 60000
              ? plan.substring(0, 60000) + '\\n... (truncated)'
              : plan;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: \`### Terraform Plan\\n\\\`\\\`\\\`hcl\\n\${truncated}\\n\\\`\\\`\\\`\`
            });

  # ── Job 5: Deploy to Production ─────────────────────
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/main'
    environment: production   # Requires manual approval if configured
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole
          aws-region: \${{ env.AWS_REGION }}

      - name: Update ECS service with new image
        run: |
          aws ecs update-service \\
            --cluster \${{ env.ECS_CLUSTER }} \\
            --service \${{ env.ECS_SERVICE }} \\
            --force-new-deployment \\
            --region \${{ env.AWS_REGION }}

      - name: Wait for deployment stability
        run: |
          echo "Waiting for ECS service to stabilize..."
          aws ecs wait services-stable \\
            --cluster \${{ env.ECS_CLUSTER }} \\
            --services \${{ env.ECS_SERVICE }} \\
            --region \${{ env.AWS_REGION }}
          echo "Deployment stable!"

      - name: Smoke test
        run: |
          ENDPOINT="https://api.example.com/health"
          STATUS=\$(curl -s -o /dev/null -w "%{http_code}" \$ENDPOINT)
          if [ "\$STATUS" != "200" ]; then
            echo "Smoke test failed! Status: \$STATUS"
            exit 1
          fi
          echo "Smoke test passed!"

      - name: Notify Slack on success
        if: success()
        uses: slackapi/slack-github-action@v1.25.0
        with:
          payload: |
            {
              "text": "Deployed \${{ github.sha }} to production successfully"
            }
        env:
          SLACK_WEBHOOK_URL: \${{ secrets.SLACK_WEBHOOK }}`,
      explanation:
        "This CI/CD pipeline embodies cloud deployment best practices: (1) Parallel test and security scan jobs fail fast before building images. (2) OIDC-based AWS authentication eliminates long-lived access keys. (3) Docker images are tagged with the Git SHA for traceability and scanned for vulnerabilities before push. (4) Terraform plan outputs are posted as PR comments, enabling infrastructure review alongside code review. (5) The deploy job uses a GitHub Environment with optional manual approval gates. (6) After deployment, the pipeline waits for ECS service stability and runs a smoke test to validate the release. (7) Slack notifications close the feedback loop. The entire workflow enforces the principle of immutable artifacts — the same image built in CI is what runs in production.",
      order_index: 4,
    },
  ],
};

export default examples;
