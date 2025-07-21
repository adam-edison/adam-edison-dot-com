# Code Review

## Code Quality Review

### ❌ I do not approve

While the codebase demonstrates strong security practices and architecture, there are several significant code quality issues that need attention:

**1. Code Duplication (DRY Violation):**

- **TurnstileWidget configuration duplication**: The `TurnstileWidget.tsx` component contains duplicated Turnstile render configuration in two places:
  - Lines 72-98 (initial render in useEffect)
  - Lines 34-60 (refresh widget callback)
  - The entire configuration object is repeated with identical properties
  - **Impact**: This violates DRY principle and creates maintenance burden - any configuration changes must be made in two places
  - **Solution**: Extract the configuration into a shared object or method

**2. Complex Component with Multiple Responsibilities:**

- **ContactFormInner.tsx**: This 240-line component handles too many concerns:
  - Form validation and submission
  - Service status management
  - CSRF token handling
  - Turnstile widget integration
  - Error state management
  - **Impact**: Makes the component hard to test, understand, and maintain
  - **Solution**: Break into smaller, focused components (ServiceStatusManager, FormSubmissionHandler, etc.)

**3. Inconsistent Hash Implementation:**

- **TurnstileTokenTracker.hashToken()**: Uses a simple string-based hash algorithm (lines 87-97) with comment acknowledging it's not cryptographically secure
  - While the comment explains this is "just for key generation", it's still a security-sensitive component
  - **Impact**: Potential security risk and code quality concern in a security-focused feature
  - **Solution**: Use Node.js crypto.createHash() for consistent, secure hashing

**4. Magic Numbers and Configuration:**

- **Hard-coded timeouts**: Multiple services use magic numbers:
  - `TurnstileService.TIMEOUT_MS = 10000` (line 17)
  - `TurnstileTokenTracker.DEFAULT_EXPIRY_SECONDS = 300` (line 15)
  - `CsrfService.tokenTtlSeconds = 900` (line 10)
  - **Impact**: Makes configuration less flexible and harder to tune
  - **Solution**: Move to environment-based configuration

**5. Error Handling Inconsistencies:**

- **Mixed error patterns**: Some components use Result pattern consistently, others have mixed approaches
  - `TurnstileWidget` uses try/catch with void error callbacks
  - Services use Result pattern properly
  - **Impact**: Inconsistent error handling makes debugging harder
  - **Solution**: Standardize on Result pattern throughout

**6. Testing Gaps:**

- **Missing component integration tests**: While unit tests are comprehensive, integration testing between React components and services is limited
  - `TurnstileWidget` component testing could be more thorough
  - **Impact**: Integration bugs may not be caught
  - **Solution**: Add more component integration tests

**7. TypeScript Usage Issues:**

- **Type assertions without validation**: Some places use type assertions without proper runtime validation
  - Line 44 in `ContactFormProcessor`: `const data = formData as Record<string, unknown>`
  - **Impact**: Potential runtime type errors
  - **Solution**: Add proper type guards

**8. Function Length and Complexity:**

- **Long methods**: Several methods exceed reasonable length:
  - `TurnstileService.verifyToken()`: 109 lines with complex nested error handling
  - `ContactFormInner.useEffect()`: Complex effect with multiple responsibilities
  - **Impact**: Reduces readability and testability
  - **Solution**: Break into smaller, focused functions
