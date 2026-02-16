const quiz = {
  "owasp-top-10-secure-coding": [
    {
      question_text:
        "Which OWASP Top 10 (2021) category addresses vulnerabilities where users can act outside their intended permissions, such as accessing another user's data by modifying a URL parameter?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "A03: Injection",
        "A01: Broken Access Control",
        "A07: Identification and Authentication Failures",
        "A05: Security Misconfiguration",
      ]),
      correct_answer: "A01: Broken Access Control",
      explanation:
        "A01: Broken Access Control is the #1 risk in the OWASP Top 10 (2021). It occurs when users can act outside their intended permissions — for example, accessing other users' data via IDOR (Insecure Direct Object References), escalating privileges, or bypassing access control checks. Mitigations include server-side ownership verification, deny-by-default policies, and rate limiting. This was promoted from #5 in the 2017 list to #1 in 2021 due to its prevalence.",
      difficulty: 'medium',
      order_index: 1,
    },
    {
      question_text:
        "What is the PRIMARY defense against SQL injection attacks?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Input validation with regular expressions",
        "Using a Web Application Firewall (WAF)",
        "Parameterized queries (prepared statements)",
        "Escaping special characters in user input",
      ]),
      correct_answer: "Parameterized queries (prepared statements)",
      explanation:
        "Parameterized queries (prepared statements) are the primary defense against SQL injection. They separate the SQL command structure from the data, so user input is always treated as data — never as executable SQL code. While input validation, WAFs, and escaping provide defense-in-depth layers, they can be bypassed and should NOT be relied upon as the primary control. ORMs and query builders also provide parameterization automatically.",
      difficulty: 'medium',
      order_index: 2,
    },
    {
      question_text:
        "Which password hashing algorithm is recommended as the strongest choice for new applications, having won the Password Hashing Competition?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "bcrypt",
        "SHA-256 with salt",
        "Argon2id",
        "PBKDF2",
      ]),
      correct_answer: "Argon2id",
      explanation:
        "Argon2id is the winner of the Password Hashing Competition (2015) and is the recommended algorithm for new applications. It is a memory-hard function that resists both GPU-based attacks (due to memory requirements) and side-channel attacks (the 'id' variant combines Argon2i and Argon2d). While bcrypt remains a solid choice, Argon2id offers superior resistance to modern attack techniques. SHA-256, even with a salt, is too fast for password hashing and vulnerable to brute force.",
      difficulty: 'medium',
      order_index: 3,
    },
    {
      question_text:
        "In the context of secure authentication, why should a login endpoint return the SAME error message whether the email doesn't exist or the password is wrong?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "To simplify error handling code on the frontend",
        "To prevent user enumeration attacks that reveal which emails are registered",
        "To comply with GDPR data minimization requirements",
        "To reduce server-side logging overhead",
      ]),
      correct_answer:
        "To prevent user enumeration attacks that reveal which emails are registered",
      explanation:
        "Returning the same generic error message (e.g., 'Invalid credentials') for both non-existent emails and wrong passwords prevents user enumeration attacks. If different messages are returned (e.g., 'Email not found' vs 'Wrong password'), an attacker can determine which email addresses are registered in the system. This information can be used for targeted phishing, credential stuffing, or social engineering. The response should be identical in both content and timing (to prevent timing-based enumeration).",
      difficulty: 'hard',
      order_index: 4,
    },
    {
      question_text:
        "What does the Content-Security-Policy (CSP) header primarily protect against?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "SQL injection and command injection attacks",
        "Cross-Site Scripting (XSS) and other code injection attacks",
        "Cross-Site Request Forgery (CSRF) attacks",
        "Man-in-the-middle attacks and SSL stripping",
      ]),
      correct_answer:
        "Cross-Site Scripting (XSS) and other code injection attacks",
      explanation:
        "Content-Security-Policy (CSP) is primarily designed to prevent XSS and other code injection attacks. It works by specifying approved sources of content (scripts, styles, images, etc.) via directives like script-src, style-src, and img-src. If an attacker manages to inject a script tag, the browser will block its execution because the script's source doesn't match the CSP policy. CSP can use nonces or hashes for inline scripts, further restricting what code can execute. HSTS protects against MITM/SSL stripping, and CSRF requires separate token-based protections.",
      difficulty: 'medium',
      order_index: 5,
    },
    {
      question_text:
        "Which security principle states that every user, process, or service should operate with the minimum set of permissions required to perform its function?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Defense in Depth",
        "Zero Trust",
        "Principle of Least Privilege",
        "Separation of Duties",
      ]),
      correct_answer: "Principle of Least Privilege",
      explanation:
        "The Principle of Least Privilege (PoLP) dictates that every entity (user, process, service) should have only the minimum permissions necessary to perform its intended function — nothing more. For example, a database account used by a web application should only have SELECT, INSERT, UPDATE permissions on specific tables, not DROP or GRANT privileges. This limits the blast radius if an account is compromised. Defense in Depth uses multiple layers, Zero Trust verifies every request, and Separation of Duties ensures no single entity controls all aspects of a critical function.",
      difficulty: 'easy',
      order_index: 6,
    },
    {
      question_text:
        "A developer stores API keys directly in their source code repository. Which security practice does this violate, and what is the recommended alternative?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "Input validation — use parameterized configuration files instead",
        "Secrets management — use environment variables or a vault system like HashiCorp Vault",
        "Defense in depth — add a WAF to protect the exposed keys",
        "Least privilege — restrict the API key permissions to read-only",
      ]),
      correct_answer:
        "Secrets management — use environment variables or a vault system like HashiCorp Vault",
      explanation:
        "Storing API keys, passwords, or other secrets directly in source code violates secrets management best practices. Anyone with repository access (including future contributors, leaked repos, or compromised CI systems) can access these secrets. The recommended approach is to use environment variables (loaded from .env files excluded from version control), or dedicated vault systems like HashiCorp Vault, AWS Secrets Manager, or Azure Key Vault. These provide encryption, access controls, audit logging, and automatic rotation. The .env file should be added to .gitignore and required environment variables should be validated at application startup.",
      difficulty: 'medium',
      order_index: 7,
    },
    {
      question_text:
        "What is the key difference between SAST (Static Application Security Testing) and DAST (Dynamic Application Security Testing)?",
      question_type: "multiple_choice",
      options: JSON.stringify([
        "SAST runs faster than DAST and is therefore preferred in CI/CD pipelines",
        "SAST analyzes source code without executing it, while DAST tests the running application by simulating attacks",
        "SAST only detects injection vulnerabilities, while DAST detects all OWASP Top 10 categories",
        "SAST is performed by developers and DAST is performed only by dedicated security teams",
      ]),
      correct_answer:
        "SAST analyzes source code without executing it, while DAST tests the running application by simulating attacks",
      explanation:
        "SAST (Static Application Security Testing) analyzes source code, bytecode, or binaries WITHOUT executing the application. It can find vulnerabilities like SQL injection patterns, hard-coded secrets, and insecure configurations early in development. DAST (Dynamic Application Security Testing) tests the RUNNING application by sending crafted requests and analyzing responses — simulating real attacks. It catches issues like XSS, authentication flaws, and misconfigurations that only manifest at runtime. Both should be used in a comprehensive security program: SAST shifts security left (early in SDLC), while DAST validates the deployed application. SCA (Software Composition Analysis) is a third type that checks third-party dependencies for known CVEs.",
      difficulty: 'hard',
      order_index: 8,
    },
  ],
};

export default quiz;
