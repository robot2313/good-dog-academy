import type { InitializationError } from './InitializationError';

export type InitializationErrorSnapshot = {
  code: InitializationError['code'];
  message: string;
  context: Record<string, unknown>;
  recoverable: boolean;
};

export class InitializationErrorReporter {
  private lastError: InitializationErrorSnapshot | null = null;

  report(error: InitializationError): void {
    this.lastError = {
      code: error.code,
      message: error.userMessage,
      context: error.context,
      recoverable: error.recoverable,
    };

    console.error('[Application initialization]', this.lastError, { cause: error.cause });
  }

  getLastError(): InitializationErrorSnapshot | null {
    return this.lastError;
  }

  clear(): void {
    this.lastError = null;
  }
}

export const initializationErrorReporter = new InitializationErrorReporter();
