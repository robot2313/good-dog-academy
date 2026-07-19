import { InitializationError } from '../../services/initialization';
import type { InitializationErrorReporter } from '../../services/initialization/InitializationErrorReporter';
import type { DevelopmentResetService } from './DevelopmentResetService';

export async function performDevelopmentReset(
  service: Pick<DevelopmentResetService, 'resetAppData'>,
  reporter: Pick<InitializationErrorReporter, 'report'>,
  onSuccess: () => void,
): Promise<{ ok: true } | { ok: false; error: InitializationError }> {
  try {
    await service.resetAppData();
    onSuccess();
    return { ok: true };
  } catch (cause) {
    const error = new InitializationError('DEVELOPMENT_RESET_FAILED', { phase: 'development-reset' }, true, { cause });
    reporter.report(error);
    return { ok: false, error };
  }
}
