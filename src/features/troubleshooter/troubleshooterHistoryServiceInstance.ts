import { domainRepositories } from '../../services/domainRepositories';
import { TroubleshooterHistoryService } from './TroubleshooterHistoryService';

export const troubleshooterHistoryService = new TroubleshooterHistoryService(
  domainRepositories.troubleshooterAttempts,
);
