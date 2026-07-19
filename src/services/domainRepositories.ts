import { appStorage } from './appStorage';
import { createDomainRepositories } from './createDomainRepositories';

export const domainRepositories = createDomainRepositories(appStorage);
