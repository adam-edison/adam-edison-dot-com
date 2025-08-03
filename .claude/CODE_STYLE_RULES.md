# Code Style Rules

This file contains specific code style rules and formatting guidelines for this project.

## Vertical Spacing for Readability

**Use blank lines to separate logical blocks of code for better readability:**

**Preferred (with spacing):**

```typescript
const initializeService = async () => {
  const result = await contactService.initialize();

  if (!result.success) {
    logger.error('Failed to initialize contact service:', result.error);
    setConfigStatus('error');
    return;
  }

  setConfigStatus('ready');
};
```

**Avoid (without spacing):**

```typescript
const initializeService = async () => {
  const result = await contactService.initialize();
  if (!result.success) {
    logger.error('Failed to initialize contact service:', result.error);
    setConfigStatus('error');
    return;
  }
  setConfigStatus('ready');
};
```

**Guidelines:**

- Add blank lines after variable declarations before the main logic
- Add blank lines before return statements in guard clauses
- Add blank lines after error handling blocks before the happy path
- Separate logical groups of operations with blank lines
- Use vertical spacing to create visual "paragraphs" in your code

**Rationale:**

- **Improved readability** - code is easier to scan and understand
- **Visual separation** - logical blocks are clearly distinguished
- **Reduced cognitive load** - the eye can quickly identify different sections
- **Better code review** - reviewers can follow the flow more easily

## Never Nester Pattern (Early Returns)

**Use early returns and guard clauses to avoid deep nesting and improve readability:**

**Avoid (deeply nested):**

```typescript
async submit(formData: ContactFormData): Promise<Result<void, string>> {
  // 1. Get security tokens
  const tokensResult = await this.securityService.getTokens();
  if (!tokensResult.success) {
    return Result.failure(tokensResult.error);
  }

  // 2. Attempt to send email
  const sendResult = await this.emailService.send(formData, tokensResult.data);
  if (sendResult.success) {
    // 5. Reset tokens after successful submission
    await this.securityService.resetTokens();
    return Result.success();
  }

  // 3. Check if it's a CSRF error and retry if so
  if (this.isCsrfError(sendResult.error)) {
    const refreshResult = await this.securityService.refreshCsrfToken();
    if (!refreshResult.success) {
      return Result.failure(sendResult.error);
    }

    // 4. Get fresh tokens and retry
    const freshTokensResult = await this.securityService.getTokens();
    if (!freshTokensResult.success) {
      return Result.failure(freshTokensResult.error);
    }

    const retryResult = await this.emailService.send(formData, freshTokensResult.data);
    if (retryResult.success) {
      await this.securityService.resetTokens();
    }
    return retryResult;
  }

  return sendResult;
}
```

**Preferred (with early returns and extracted methods):**

```typescript
async submit(formData: ContactFormData): Promise<Result<void, string>> {
  const tokensResult = await this.securityService.getTokens();
  if (!tokensResult.success) {
    return Result.failure(tokensResult.error);
  }

  const sendResult = await this.emailService.send(formData, tokensResult.data);
  if (sendResult.success) {
    await this.securityService.resetTokens();
    return Result.success();
  }

  if (!this.isCsrfError(sendResult.error)) {
    return sendResult;
  }

  return this.retryWithFreshCsrfToken(formData);
}

private async retryWithFreshCsrfToken(formData: ContactFormData): Promise<Result<void, string>> {
  const refreshResult = await this.securityService.refreshCsrfToken();
  if (!refreshResult.success) {
    return Result.failure('Failed to refresh CSRF token');
  }

  const freshTokensResult = await this.securityService.getTokens();
  if (!freshTokensResult.success) {
    return Result.failure(freshTokensResult.error);
  }

  const retryResult = await this.emailService.send(formData, freshTokensResult.data);
  if (retryResult.success) {
    await this.securityService.resetTokens();
  }

  return retryResult;
}
```

**Guidelines:**

- **Use guard clauses** - return early for error conditions
- **Extract complex nested logic** into separate methods
- **Invert conditionals** when it reduces nesting (prefer `if (!condition) return` over deep else blocks)
- **Keep the happy path** at the lowest indentation level
- **One level of nesting maximum** in most cases
- **Separate concerns** - complex retry logic deserves its own method

**Rationale:**

- **Reduced cognitive complexity** - easier to follow the main flow
- **Improved maintainability** - smaller, focused methods are easier to test and modify
- **Better error handling** - guard clauses make error conditions explicit
- **Enhanced readability** - the happy path is immediately obvious
- **Easier testing** - extracted methods can be tested independently

## Static Factory Methods

**Use static factory methods on classes instead of standalone factory functions:**

**Avoid (standalone factory function):**

```typescript
// Factory function to create service with dependencies
export function createContactFormService(baseUrl: string = ''): ContactFormService {
  const emailService = new EmailService(baseUrl);
  const securityService = new SecurityService(baseUrl);
  const configService = new ConfigService(baseUrl);

  return new ContactFormService(emailService, securityService, configService);
}

// Usage
const service = createContactFormService();
```

**Preferred (static factory method):**

```typescript
export class ContactFormService {
  constructor(
    private emailService: EmailService,
    private securityService: SecurityService,
    private configService: ConfigService
  ) {}

  static create(baseUrl: string = ''): ContactFormService {
    const emailService = new EmailService(baseUrl);
    const securityService = new SecurityService(baseUrl);
    const configService = new ConfigService(baseUrl);

    return new ContactFormService(emailService, securityService, configService);
  }

  // ... other methods
}

// Usage
const service = ContactFormService.create();
```

**Guidelines:**

- **Use static factory methods** for complex object creation with dependencies
- **Name factory methods clearly** - `create()`, `from()`, `build()`, etc.
- **Keep factory logic close to the class** - better encapsulation and discoverability
- **Use descriptive names** for different creation patterns (e.g., `fromConfig()`, `withDefaults()`)
- **Return the class type** to maintain type safety

**Example patterns:**

```typescript
class RequestContext {
  static from(req: NextApiRequest): RequestContext {
    // Create from request
  }
}

class DatabaseService {
  static create(): DatabaseService {
    // Default creation
  }

  static withConfig(config: DatabaseConfig): DatabaseService {
    // Creation with specific config
  }
}
```

**Rationale:**

- **Better encapsulation** - factory logic belongs with the class it creates
- **Improved discoverability** - IDE autocomplete shows factory methods with the class
- **Type safety** - factory methods maintain proper typing
- **Consistency** - follows common patterns in frameworks and libraries
- **Namespace organization** - keeps related functionality together

## Error Handling: Fail Fast with Guard Clauses

**Always handle error cases first with early returns:**

```typescript
// Preferred: Guard clauses first
if (!result.success) {
  logger.error('Failed to initialize:', result.error);
  setConfigStatus('error');
  return;
}

// Happy path is clean and unindented
setConfigStatus('ready');
processSuccessfulResult(result.data);
```

**Avoid:**

```typescript
// Don't nest happy path inside success checks
if (result.success) {
  setConfigStatus('ready');
  processSuccessfulResult(result.data);
} else {
  logger.error('Failed to initialize:', result.error);
  setConfigStatus('error');
}
```

**Rationale:**

- **Fail fast principle** - handle problems immediately where they occur
- **Reduced cognitive load** - once past the guards, you know you're in a valid state
- **Cleaner happy path** - success logic isn't nested or mixed with error handling
- **Better debugging** - error conditions are explicit and handled upfront
- **Prevents deep nesting** - scales well when multiple error conditions exist
