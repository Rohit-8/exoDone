const quiz = {
  "cloud-native-patterns": [
    {
      question_text:
        "In Kubernetes, what is the primary difference between a liveness probe and a readiness probe?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "A liveness probe checks if the container is running and restarts it on failure; a readiness probe checks if the container can accept traffic and removes it from the service endpoint if it fails",
        "A liveness probe runs only at startup; a readiness probe runs continuously throughout the container's lifecycle",
        "A liveness probe checks network connectivity; a readiness probe checks disk space",
        "There is no difference — they are interchangeable and serve the same purpose",
      ]),
      correct_answer:
        "A liveness probe checks if the container is running and restarts it on failure; a readiness probe checks if the container can accept traffic and removes it from the service endpoint if it fails",
      explanation:
        "Liveness probes detect deadlocked or unhealthy containers and trigger a restart. Readiness probes determine whether a container is ready to serve traffic — failing a readiness probe removes the pod from the Service's endpoints so no requests are routed to it, but does not restart the container. This distinction is critical: a container might be alive (passing liveness) but temporarily unable to serve requests during initialization or overload (failing readiness).",
      difficulty: 'hard',
      order_index: 1,
    },
    {
      question_text:
        "According to the 12-Factor App methodology, where should application configuration (database URLs, API keys) be stored?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "In a config file committed to the repository (e.g., config.json)",
        "In environment variables, separate from the codebase",
        "Hard-coded as constants in the application source code",
        "In a shared network drive accessible to all environments",
      ]),
      correct_answer:
        "In environment variables, separate from the codebase",
      explanation:
        "Factor 3 (Config) states that configuration that varies between deploys must be stored in environment variables. This strict separation ensures the same codebase can run in any environment (development, staging, production) without code changes. Environment variables are language- and OS-agnostic, and unlike config files, they are unlikely to be accidentally committed to source control. In container environments, Kubernetes ConfigMaps and Secrets inject these values as environment variables.",
      difficulty: 'medium',
      order_index: 2,
    },
    {
      question_text:
        "What is the Strangler Fig pattern in cloud architecture?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "A pattern where you deploy a monolithic application across multiple cloud providers simultaneously",
        "A migration pattern that incrementally replaces a legacy system by routing traffic through a façade that delegates to either old or new services",
        "A security pattern that isolates untrusted components in a sandbox environment",
        "A caching pattern that gradually fills cache entries based on request patterns",
      ]),
      correct_answer:
        "A migration pattern that incrementally replaces a legacy system by routing traffic through a façade that delegates to either old or new services",
      explanation:
        "Named after the strangler fig vine that gradually envelops a host tree, this pattern allows teams to modernize legacy applications without a risky big-bang rewrite. An API gateway or façade intercepts requests and routes them to either the legacy monolith or new microservices based on the endpoint. Over time, more functionality migrates to new services until the legacy system can be decommissioned. This reduces risk, provides continuous delivery of new features, and allows the team to validate the new architecture incrementally.",
      difficulty: 'hard',
      order_index: 3,
    },
    {
      question_text:
        "Which of the following accurately describes Terraform's plan-apply workflow?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "terraform plan provisions resources immediately; terraform apply generates a preview of changes",
        "terraform plan compares desired state to current state and shows a diff; terraform apply executes the changes to reach the desired state",
        "terraform plan only works with AWS; terraform apply works with all cloud providers",
        "terraform plan creates a backup of existing infrastructure; terraform apply restores from that backup",
      ]),
      correct_answer:
        "terraform plan compares desired state to current state and shows a diff; terraform apply executes the changes to reach the desired state",
      explanation:
        "Terraform maintains a state file that records the current state of provisioned infrastructure. When you run 'terraform plan', it reads your HCL configuration (desired state), queries the cloud provider for actual state, compares them, and produces an execution plan showing what will be created, modified, or destroyed. 'terraform apply' then executes that plan. This two-step workflow provides a critical safety net — teams can review infrastructure changes before they happen, and in CI/CD pipelines, plan output is often posted on pull requests for peer review.",
      difficulty: 'medium',
      order_index: 4,
    },
    {
      question_text:
        "What is a 'cold start' in serverless computing, and which strategy most effectively mitigates it?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "A cold start is when the function's code has syntax errors; using TypeScript mitigates this",
        "A cold start is the latency when the platform provisions a new execution environment; provisioned concurrency keeps instances warm to eliminate it",
        "A cold start occurs when the function runs out of memory; increasing the memory allocation mitigates it",
        "A cold start happens when the function's timeout is too short; extending the timeout mitigates it",
      ]),
      correct_answer:
        "A cold start is the latency when the platform provisions a new execution environment; provisioned concurrency keeps instances warm to eliminate it",
      explanation:
        "Cold starts occur when there is no warm execution environment available for a function invocation. The platform must provision a new micro-VM or container, load the runtime, load the function code and dependencies, and run initialization code. This can add 100ms to several seconds of latency depending on the runtime and package size. Provisioned concurrency (AWS Lambda) or pre-warmed instances (Azure Functions Premium) keep a specified number of environments initialized and ready, eliminating cold-start latency for those instances. Other mitigations include minimizing package size, choosing lightweight runtimes, and performing lazy initialization.",
      difficulty: 'hard',
      order_index: 5,
    },
    {
      question_text:
        "In a cloud VPC architecture, what is the purpose of placing application servers in a private subnet with a NAT gateway?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "It improves application performance by caching DNS queries at the NAT gateway",
        "It allows application servers to initiate outbound internet connections (e.g., for API calls or updates) while preventing unsolicited inbound connections from the internet",
        "It eliminates the need for security groups and network ACLs",
        "It ensures that application servers have public IP addresses for direct client access",
      ]),
      correct_answer:
        "It allows application servers to initiate outbound internet connections (e.g., for API calls or updates) while preventing unsolicited inbound connections from the internet",
      explanation:
        "Private subnets have no internet gateway route, so instances within them cannot be reached directly from the internet — this is a fundamental security layer. However, those instances often need outbound connectivity to download packages, call external APIs, or send metrics. A NAT (Network Address Translation) gateway sits in the public subnet and allows private-subnet instances to initiate outbound connections, while blocking inbound connections from the internet. This architecture follows the principle of least exposure: only load balancers and bastion hosts sit in public subnets.",
      difficulty: 'hard',
      order_index: 6,
    },
    {
      question_text:
        "Which cloud cost optimization strategy offers the highest potential savings but requires workloads to be fault-tolerant?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Reserved Instances with a 3-year commitment (30–60% savings)",
        "Spot instances / preemptible VMs that use spare capacity at 60–90% discount but can be terminated with short notice",
        "Right-sizing instances based on monitoring data (20–40% savings)",
        "Using serverless functions instead of always-on containers (40–70% savings)",
      ]),
      correct_answer:
        "Spot instances / preemptible VMs that use spare capacity at 60–90% discount but can be terminated with short notice",
      explanation:
        "Spot instances (AWS), preemptible VMs (GCP), and spot VMs (Azure) offer the deepest discounts — typically 60–90% off on-demand pricing — because they use the provider's surplus capacity. The tradeoff is that the provider can reclaim these instances with as little as 2 minutes notice. This makes them ideal for fault-tolerant, stateless workloads like batch processing, CI/CD builds, data pipelines, and Kubernetes worker nodes (with pod disruption budgets). They should not be used for databases, stateful services, or workloads that cannot tolerate interruption.",
      difficulty: 'medium',
      order_index: 7,
    },
    {
      question_text:
        "What does the Sidecar pattern in cloud architecture achieve, and how is it typically implemented in Kubernetes?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "It runs the database alongside the application in the same container to reduce network latency",
        "It deploys a helper container in the same Pod as the main application container, sharing network and storage, to handle cross-cutting concerns like logging, proxying, or TLS termination",
        "It creates a secondary replica of the application in a different region for disaster recovery",
        "It attaches an external monitoring service to the cluster that runs on a dedicated node pool",
      ]),
      correct_answer:
        "It deploys a helper container in the same Pod as the main application container, sharing network and storage, to handle cross-cutting concerns like logging, proxying, or TLS termination",
      explanation:
        "The Sidecar pattern places an auxiliary container alongside the primary application container within the same Kubernetes Pod. Because containers in a Pod share the same network namespace (they communicate via localhost) and can share volume mounts, the sidecar can transparently intercept traffic, collect logs, manage certificates, or run a service mesh proxy (e.g., Envoy in Istio). This approach keeps the main application container focused on business logic while the sidecar handles infrastructure concerns — promoting separation of concerns without modifying the application code.",
      difficulty: 'hard',
      order_index: 8,
    },
  ],
};

export default quiz;
