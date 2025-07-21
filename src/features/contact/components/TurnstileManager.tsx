import { useState } from 'react';

export interface TurnstileState {
  turnstileToken: string | null;
}

export interface TurnstileActions {
  handleTurnstileVerify: (token: string) => void;
  handleTurnstileExpire: () => void;
  resetTurnstileToken: () => void;
  clearVerificationError: (currentError: string, resetError: () => void) => void;
}

export function useTurnstileManager(): TurnstileState & TurnstileActions {
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleTurnstileVerify = (token: string) => {
    setTurnstileToken(token);
  };

  const handleTurnstileExpire = () => {
    setTurnstileToken(null);
  };

  const resetTurnstileToken = () => {
    setTurnstileToken(null);
  };

  const clearVerificationError = (currentError: string, resetError: () => void) => {
    // Clear any previous verification errors when user completes Turnstile
    if (currentError === 'Please complete the security verification') {
      resetError();
    }
  };

  return {
    turnstileToken,
    handleTurnstileVerify,
    handleTurnstileExpire,
    resetTurnstileToken,
    clearVerificationError
  };
}
