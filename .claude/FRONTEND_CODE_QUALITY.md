# Frontend Code Quality Rules

This file contains specific code quality rules and patterns for frontend development in this project.

## React useEffect with Async Functions

When using async functions inside `useEffect`, prefer the "early return" pattern for cleaner control flow:

**Preferred:**

```typescript
useEffect(() => {
  const asyncFunction = async () => {
    const result = await someAsyncOperation();

    if (result.success) {
      handleSuccess(result.data);
      return;
    }

    handleError(result.error);
  };

  asyncFunction();
}, [dependencies]);
```

**Avoid:**

```typescript
// Don't use if/else blocks when early return is cleaner
useEffect(() => {
  const asyncFunction = async () => {
    const result = await someAsyncOperation();

    if (result.success) {
      handleSuccess(result.data);
    } else {
      handleError(result.error);
    }
  };

  asyncFunction();
}, [dependencies]);

// Don't extract async functions outside useEffect (causes re-renders)
const asyncFunction = async () => {
  /* ... */
};
useEffect(() => {
  asyncFunction();
}, [asyncFunction]); // Bad: function recreated every render

// Don't use useCallback unless the function is used elsewhere
const asyncFunction = useCallback(async () => {
  /* ... */
}, [deps]);
useEffect(() => {
  asyncFunction();
}, [asyncFunction]); // Unnecessary complexity
```
