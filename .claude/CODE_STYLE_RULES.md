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
- **Exception**: Any code block within braces `{}` that has 3 lines or less should be condensed without extra vertical spacing (functions, if/else, try/catch, loops, switch cases, etc.)
- **Cross-cutting concerns** like logging, debugging, or validation don't need separation from the variables they operate on - they're not the next procedural step

**Cross-cutting concerns example:**

```typescript
function validateBranchName(): void {
  const branchName = getBranchName();
  debug({ branchName });

  if (!branchName) {
    output('Skipping... no branch name found');
    process.exit(0);
  }
}
```

The `debug({ branchName })` is a cross-cutting concern that operates on the variable but isn't the next step in the procedure, so no blank line is needed.

**Rationale:**

- **Improved readability** - code is easier to scan and understand
- **Visual separation** - logical blocks are clearly distinguished
- **Reduced cognitive load** - the eye can quickly identify different sections
- **Better code review** - reviewers can follow the flow more easily

**Exception for short code blocks (3 lines or less):**

```typescript
// Function body
function prependToCommitMessage(params: PrependParams): void {
  const { ticketNumber, commitMessageFile, commitMessage } = params;
  const newCommitMessage = `${ticketNumber}: ${commitMessage}`;
  fs.writeFileSync(commitMessageFile, newCommitMessage, 'utf-8');
}

// Try/catch block
} catch (error) {
  debug({ error: 'Failed to check amend via git status', errorMessage: error.message });
  return false;
}

// If block
if (condition) {
  const result = processData();
  return result;
}
```

Any code block within braces `{}` that has 3 lines or less should be condensed without extra vertical spacing. This includes function bodies, if/else blocks, try/catch blocks, loop bodies, switch cases, and any other braced code blocks.

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

## Function and Method Spacing

**Always add a blank line between declared functions and methods for improved readability:**

**Avoid (no spacing between methods):**

```typescript
private isCsrfError(error: string): boolean {
  const lowerError = error.toLowerCase();
  return (
    error.includes('403') ||
    lowerError.includes('forbidden') ||
    lowerError.includes('csrf') ||
    lowerError.includes('token')
  );
}
static create(baseUrl: string = ''): ContactFormService {
  const emailService = new EmailService(baseUrl);
  const securityService = new SecurityService(baseUrl);
  const configService = new ConfigService(baseUrl);

  return new ContactFormService(emailService, securityService, configService);
}
```

**Preferred (with spacing between methods):**

```typescript
private isCsrfError(error: string): boolean {
  const lowerError = error.toLowerCase();
  return (
    error.includes('403') ||
    lowerError.includes('forbidden') ||
    lowerError.includes('csrf') ||
    lowerError.includes('token')
  );
}

static create(baseUrl: string = ''): ContactFormService {
  const emailService = new EmailService(baseUrl);
  const securityService = new SecurityService(baseUrl);
  const configService = new ConfigService(baseUrl);

  return new ContactFormService(emailService, securityService, configService);
}
```

**Guidelines:**

- **Add blank lines between all declared functions and methods** - both instance and static methods
- **Separate function declarations from other code blocks** - properties, constructors, and methods should have clear visual separation
- **Apply consistently throughout the codebase** - maintain the same spacing pattern in all files
- **Use single blank line** - one empty line is sufficient for visual separation

**Rationale:**

- **Improved readability** - clear visual boundaries between different methods
- **Easier code navigation** - the eye can quickly locate method boundaries
- **Better code organization** - logical grouping of functionality is more apparent
- **Consistent formatting** - follows common industry standards for code presentation
- **Enhanced maintainability** - easier to review and modify individual methods

## Function Parameter Destructuring

**Avoid destructuring parameters in function signatures. Instead, destructure within the function body:**

**Avoid (destructuring in signature):**

```typescript
export function handleTicketNumberInCommitMessage({
  commitMessage,
  commitMessageFile,
  ticketNumber
}: CommitMessageParams): void {
  const hasExistingTicketNumber = checkForExistingTicketNumber(commitMessage);

  if (hasExistingTicketNumber) {
    handleExistingTicketNumber({ commitMessage, commitMessageFile, ticketNumber });
    return;
  }

  prependToCommitMessage({
    ticketNumber,
    commitMessageFile,
    commitMessage
  });
}
```

**Preferred (destructuring in body):**

```typescript
export function handleTicketNumberInCommitMessage(params: CommitMessageParams): void {
  const { commitMessage, commitMessageFile, ticketNumber } = params;
  const hasExistingTicketNumber = checkForExistingTicketNumber(commitMessage);

  if (hasExistingTicketNumber) {
    handleExistingTicketNumber({ commitMessage, commitMessageFile, ticketNumber });
    return;
  }

  prependToCommitMessage({
    ticketNumber,
    commitMessageFile,
    commitMessage
  });
}
```

**Guidelines:**

- **Keep function signatures clean** - accept a single parameter object when multiple parameters are needed
- **Destructure in the function body** - on the first line after any early validations
- **Use descriptive parameter names** - the parameter object should have a clear, meaningful name
- **Maintain type safety** - still use proper TypeScript interfaces for parameter objects

**Rationale:**

- **Cleaner function signatures** - easier to read and understand at a glance
- **Better IDE support** - simpler autocomplete and parameter hints
- **Easier refactoring** - adding or removing parameters doesn't require signature changes
- **More consistent** - follows the same pattern as constructor parameters and other complex object handling

## Simple One-Line If Statements

**Use one-line if statements for simple early returns or single operations:**

**Avoid (multi-line for simple cases):**

```typescript
export function validateInput(input: string): boolean {
  if (!input) {
    return false;
  }

  if (input.length < 3) {
    return false;
  }

  if (input.includes('spam')) {
    return false;
  }

  return true;
}
```

**Preferred (one-line for simple cases):**

```typescript
export function validateInput(input: string): boolean {
  if (!input) return false;
  if (input.length < 3) return false;
  if (input.includes('spam')) return false;
  return true;
}
```

**Guidelines:**

- **Use one-line if statements** for simple early returns with single expressions
- **Use one-line if statements** for simple single operations or assignments
- **Use multi-line format** when the condition or body is complex
- **Use multi-line format** when multiple statements are needed in the body
- **Maintain consistency** within the same function or file

**Rationale:**

- **Reduced vertical space** - more code visible on screen at once
- **Cleaner flow** - early returns are more obvious and scannable
- **Less visual noise** - fewer braces for simple operations
- **Better readability** - logical flow is more apparent

## Logical OR Chain for Sequential Fallbacks

**Use logical OR chains when returning the first truthy value from a sequence of fallback options:**

**Avoid (multiple early returns for simple fallbacks):**

```typescript
export function getTicketNumber(branchName: string): string | null {
  const jiraTicketNumber = extractJiraTicketNumber(branchName);
  if (jiraTicketNumber) return jiraTicketNumber;

  const githubTicketNumber = extractGitHubTicketNumber(branchName);
  if (githubTicketNumber) return githubTicketNumber;

  return null;
}
```

**Preferred (logical OR chain):**

```typescript
export function getTicketNumber(branchName: string): string | null {
  const jiraTicketNumber = extractJiraTicketNumber(branchName);
  const githubTicketNumber = extractGitHubTicketNumber(branchName);
  return jiraTicketNumber || githubTicketNumber || null;
}
```

**Guidelines:**

- **Use logical OR chains** when you need the first truthy value from a sequence
- **Extract all values first** then use OR chain for the return
- **Use early returns** when additional logic is needed between checks
- **Use early returns** when error handling or side effects are involved
- **Ensure null/undefined handling** is explicit in the final fallback

**Rationale:**

- **Concise and clear** - the fallback sequence is immediately obvious
- **Reduced code complexity** - fewer conditional branches to follow
- **Easier to modify** - adding/removing fallbacks is simpler
- **Functional style** - declarative rather than imperative flow

## Avoid Nested Function Calls - Use Intermediate Variables

**Use intermediate variables instead of nesting function calls when it makes the code clearer:**

**Avoid (nested function calls):**

```typescript
function checkForExistingTicketNumber(commitMessage: string): boolean {
  return TICKET_PATTERN_REGEX.test(commitMessage.trim());
}

function processData(input: string): string {
  return JSON.stringify(parseUserData(input.toLowerCase()));
}
```

**Preferred (intermediate variables):**

```typescript
function checkForExistingTicketNumber(commitMessage: string): boolean {
  const trimmedMessage = commitMessage.trim();
  return TICKET_PATTERN_REGEX.test(trimmedMessage);
}

function processData(input: string): string {
  const lowerCaseInput = input.toLowerCase();
  const userData = parseUserData(lowerCaseInput);
  return JSON.stringify(userData);
}
```

**Guidelines:**

- **Use intermediate variables** when function calls are nested and intermediate values would be meaningful
- **Give descriptive names** to intermediate variables that clarify what each step does
- **Prioritize readability** - if breaking up the chain makes the code clearer, do it
- **Consider debugging benefits** - intermediate variables make it easier to inspect values

**Rationale:**

- **Improved debugging** - can inspect intermediate values during development
- **Better readability** - each step is clear and self-documenting
- **Easier testing** - individual transformations can be verified
- **Reduced cognitive load** - no need to mentally parse nested operations
- **Better error messages** - stack traces point to specific transformation steps

## Use clsx for Complex CSS Classes

**Use clsx for complex className combinations instead of template literals:**

**Avoid (template literal className):**

```tsx
<div
  className={`${geistSans.className} ${geistMono.className} font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20`}
>
```

**Preferred (clsx with styles object):**

```tsx
// Component styles using clsx
const styles = {
  container: clsx(
    geistSans.className,
    geistMono.className,
    'font-sans',
    'grid grid-rows-[20px_1fr_20px]',
    'items-center justify-items-center',
    'min-h-screen',
    'p-8 pb-20',
    'gap-16',
    'sm:p-20'
  ),
};

<div className={styles.container}>
```

**Guidelines:**

- **Use clsx** for complex className combinations with multiple classes
- **Group related classes** on the same line for better organization
- **Extract to styles object** when className becomes long or complex
- **Keep simple single classes** inline without clsx
- **Use descriptive style object keys** that describe the element's purpose

**Rationale:**

- **Better readability** - classes are organized and easy to scan
- **Easier maintenance** - adding/removing classes is cleaner
- **Conditional logic support** - clsx handles conditional classes elegantly
- **Reduced template literal complexity** - no need for complex string interpolation
- **Better IDE support** - easier to format and refactor
