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
