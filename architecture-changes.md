# Contact Form Architecture Refactoring

## Current Architecture Problems

The current contact form architecture violates several separation of concerns principles:

### 1. Single Responsibility Principle Violations

- **ContactFormService** is a monolith handling:
  - UI state management (`isSubmitting`, `submitStatus`, `errorMessage`)
  - Coordination logic (form submission orchestration)
  - Infrastructure concerns (API calls, CSRF tokens, Turnstile integration)
  - State store responsibilities with callback management

### 2. Tight Coupling Issues

- Service knows about UI concepts like submit states
- Components are tightly coupled to service's state management implementation
- No clear separation between coordination logic and external integrations

### 3. Testing and Maintenance Problems

- Hard to test individual concerns in isolation
- Changes to external services affect UI logic
- Difficult to mock specific parts for testing

## Proposed 3-Layer Architecture Solution

### Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │   ContactForm   │ │ ContactFormInner│ │  useContactForm │ │
│  │   (Container)   │ │   (Component)   │ │     (Hook)      │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                         │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │ ContactFormService│ │ (Orchestrates  │ │   Coordinated   │ │
│  │  (Orchestrator) │ │  submission     │ │    Services)    │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                 Infrastructure Layer                        │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │   EmailService  │ │ SecurityService │ │  ConfigService  │ │
│  │   (API calls)   │ │(CSRF+Turnstile)│ │ (Server config) │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 1. Presentation Layer (React UI State Management)

**Responsibilities:**

- Manage UI state (loading, errors, success states)
- Handle user interactions and form events
- Coordinate with application layer services
- Pure React concerns only

#### React Hook for Contact Form State

```typescript
// src/features/contact/presentation/hooks/useContactForm.ts
export interface ContactFormState {
  isSubmitting: boolean;
  submitStatus: 'idle' | 'success' | 'error';
  errorMessage: string;
  isConfigLoading: boolean;
  serviceConfig: ServiceConfig | null;
}

export function useContactForm() {
  // Manages local React state for UI concerns (loading, errors, success)
  // Creates ContactFormService instance with dependency injection
  // submitForm: Sets loading state, calls service, updates UI state based on result
  // initializeConfig: Fetches service configuration, updates loading and config state
  // Returns: { formState, submitForm, initializeConfig }
}
```

#### Updated ContactFormInner

```typescript
// src/features/contact/components/ContactFormInner.tsx
export function ContactFormInner({ className }: ContactFormInnerProps) {
  // Uses useContactForm hook for all state management
  // useEffect to initialize config on mount
  // onSubmit handler calls submitForm and resets form on success
  // Renders form fields, error messages, success states
  // No direct service instantiation or state management
}
```

### 2. Application Layer (Coordination/Orchestration)

**Responsibilities:**

- Orchestrate form submission workflow
- Coordinate between security and email services
- Handle retry logic and error recovery
- No UI state management or external API knowledge

#### ContactFormService (Orchestrator)

```typescript
// src/features/contact/ContactFormService.ts
export class ContactFormService {
  constructor(
    private emailService: EmailService,
    private securityService: SecurityService,
    private configService: ConfigService
  ) {}

  async getConfig(): Promise<Result<ServiceConfig, string>> {
    // Simply delegate to configService.getServiceConfig()
    // No additional logic needed here
  }

  async submit(formData: ContactFormData): Promise<Result<void, string>> {
    // 1. Call securityService.getTokens() to get CSRF and Turnstile tokens
    // 2. If tokens fail, return early with error
    // 3. Call emailService.send(formData, tokens) to submit
    // 4. If submission fails with CSRF error (check with isCsrfError helper):
    //    a. Call securityService.refreshCsrfToken()
    //    b. Get fresh tokens and retry emailService.send()
    // 5. If successful, call securityService.resetTokens() to clear Turnstile
    // 6. Return Result.success() or Result.failure() based on outcome
  }

  private isCsrfError(error: string): boolean {
    // Check if error message contains '403', 'forbidden', 'csrf', or 'token'
    // Return true if CSRF-related error detected
  }
}
```

### 3. Infrastructure Layer (External Service Integrations)

**Responsibilities:**

- Handle external API communications
- Manage security tokens and integrations
- Deal with network errors and HTTP responses
- No business logic or UI concerns

#### EmailService (API Integration)

```typescript
// src/features/contact/infrastructure/EmailService.ts
export interface SecurityTokens {
  csrfToken: string;
  turnstileToken?: string;
}

export class EmailService {
  constructor(private baseUrl: string = '') {}

  async send(formData: ContactFormData, tokens: SecurityTokens): Promise<Result<void, string>> {
    // 1. Create payload object with formData spread + csrfToken + turnstileToken
    // 2. Use fetch() to POST to `${baseUrl}/api/contact` with JSON payload
    // 3. Set Content-Type: application/json header
    // 4. If response.ok, return Result.success()
    // 5. If not ok, parse error JSON (with fallback), extract message, return Result.failure()
    // 6. Catch network errors, return Result.failure() with error message
  }
}
```

#### SecurityService (CSRF + Turnstile)

```typescript
// src/features/contact/infrastructure/SecurityService.ts
export class SecurityService {
  private csrfToken: string | null = null;
  private turnstileToken: string | null = null;
  private turnstileWidgetId: string | null = null;

  constructor(private baseUrl: string = '') {}

  async getTokens(): Promise<Result<SecurityTokens, string>> {
    // Check if csrfToken is null, if so call getCsrfToken() and cache result
    // Return Result.success() with { csrfToken, turnstileToken } object
    // If CSRF fetch fails, return Result.failure()
  }

  async refreshCsrfToken(): Promise<Result<string, string>> {
    // Call getCsrfToken() to fetch fresh token from API
    // Update this.csrfToken with new value if successful
    // Return the result (success with token or failure with error)
  }

  private async getCsrfToken(): Promise<Result<string, string>> {
    // Fetch from `${baseUrl}/api/csrf-token`, handle response/errors
    // Parse JSON response to get csrfToken field
    // Return Result.success(token) or Result.failure(error)
  }

  async initializeTurnstile(container: HTMLElement, siteKey: string): Promise<Result<void, string>> {
    // Load Turnstile script using existing loadTurnstileScript utility
    // Call window.turnstile.render() with container, siteKey, and callbacks
    // Set callback to update this.turnstileToken when verification completes
    // Set error/expired/timeout callbacks to clear token and update state
    // Store widget ID in this.turnstileWidgetId for cleanup
    // Return Result.success() or Result.failure() based on load/render success
  }

  async resetTokens(): Promise<void> {
    // Set this.turnstileToken = null
    // If turnstile widget exists, call window.turnstile.reset(widgetId)
  }

  cleanup(): void {
    // If turnstile widget exists, call window.turnstile.remove(widgetId)
    // Clear all stored tokens and widget ID references
  }
}
```

#### ConfigService (Server Configuration)

```typescript
// src/features/contact/infrastructure/ConfigService.ts
export class ConfigService {
  constructor(private baseUrl: string = '') {}

  async getServiceConfig(): Promise<Result<ServiceConfig, string>> {
    // Fetch from `${baseUrl}/api/email-service-check`
    // Parse JSON response containing service status and configuration
    // Return Result.success(config) with email/turnstile service availability
    // Handle fetch errors and return Result.failure() with error message
  }
}
```

## Benefits of This 3-Layer Architecture

### 1. Clear Separation of Concerns

- **Presentation Layer**: Pure React concerns - state, events, rendering
- **Application Layer**: Orchestrates business processes, coordinates services
- **Infrastructure Layer**: Handles external integrations - APIs, third-party services

### 2. Improved Testability

Each layer can be tested at the appropriate level:

**Infrastructure Tests (Integration)**

```typescript
test('EmailService sends contact form via API', async () => {
  // Create EmailService with real localhost URL
  // Call send() with actual form data and tokens
  // Verify successful HTTP POST to /api/contact endpoint
  // Test response parsing and Result object creation
  // Test network failure scenarios with invalid URLs
});

test('SecurityService fetches and refreshes CSRF tokens', async () => {
  // Test getTokens() fetches from /api/csrf-token on first call
  // Test token caching on subsequent calls
  // Test refreshCsrfToken() updates cached token
  // Test Turnstile initialization with real DOM container
});
```

**Application Tests (Unit with Mocks)**

```typescript
test('ContactFormService retries on CSRF error', async () => {
  // Mock EmailService.send() to fail with '403 Forbidden' then succeed
  // Mock SecurityService.refreshCsrfToken() to return success
  // Mock SecurityService.getTokens() to return fresh tokens on retry
  // Verify service calls refreshCsrfToken() and retries submission
  // Verify resetTokens() called after successful submission
});

test('ContactFormService handles non-CSRF errors without retry', async () => {
  // Mock EmailService.send() to fail with 'Network error'
  // Verify service does not call refreshCsrfToken()
  // Verify service returns failure result immediately
});
```

**Presentation Tests (React Testing Library)**

```typescript
test('form shows error when submission fails', async () => {
  // Mock ContactFormService.submit() to return Result.failure('Server error')
  // Render ContactFormInner component
  // Fill form fields and click submit button
  // Verify error message 'Server error' appears in document
  // Verify form remains in error state with submit button enabled
});

test('form resets and shows success when submission succeeds', async () => {
  // Mock ContactFormService.submit() to return Result.success()
  // Fill form fields and submit
  // Verify form fields are cleared (reset() called)
  // Verify success message is displayed
});
```

### 3. Maintainability & Debugging

- **Isolated changes**: Switch email providers? Only touch `EmailService`
- **Clear debugging path**: Error in form submission? Check layers in order
- **Focused responsibilities**: Each class has one clear job

### 4. Real-World Flexibility

- **A/B testing**: Easy to swap `EmailService` implementations
- **Environment differences**: Different services for dev/staging/prod
- **Future features**: Add SMS notifications by creating `SmsService`

## Why This Is Better Than Current Monolith

### Current Problem

```typescript
// Everything mixed together - hard to test specific concerns
class ContactFormService {
  async submitForm() {
    // UI state management mixed with business logic
    // Security logic mixed with API calls
    // Hard to test individual concerns
    // Changes affect multiple responsibilities
  }
}
```

### Proposed Solution

```typescript
// Each service has one clear responsibility
class ContactFormService {
  async submit(data) {
    // Only coordination logic - delegates to specialized services
  }
}

// UI state is separate
function useContactForm() {
  // Pure React state management only
}

// Infrastructure services handle external concerns
class EmailService {
  // Only API communication logic
}
```

## Migration Strategy

### Phase 1: Extract Infrastructure Services

1. Create `EmailService`, `SecurityService`, `ConfigService`
2. Move external integration logic from current service
3. Keep current service as orchestrator temporarily

### Phase 2: Simplify Application Layer

1. Refactor current `ContactFormService` to orchestrate new services
2. Remove UI state management from service
3. Focus on coordination logic only

### Phase 3: Create Presentation Layer

1. Create `useContactForm` hook for React state
2. Move UI state management from service to hook
3. Update components to use hook instead of service callbacks

### Phase 4: Update Tests

1. Add focused integration tests for infrastructure services
2. Add unit tests for application orchestration
3. Simplify component tests with mocked dependencies

### Phase 5: Cleanup

1. Remove old state management code
2. Verify all functionality works
3. Update documentation

This approach maintains the familiar Repository/Service/Controller pattern you know from backend development, but applies it properly to frontend concerns with clear boundaries for React state management.
