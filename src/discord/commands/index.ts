import { CommandConfiguration } from '../types';
import getClodownCommand from './get-clodown';
import verifyClodownCommand from './verify-clodown';

export const commands: Record<string, CommandConfiguration> = {
  [getClodownCommand.name]: getClodownCommand,
  [verifyClodownCommand.name]: verifyClodownCommand,
};
