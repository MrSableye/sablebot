import { CommandConfiguration } from '../types';
import verifyCommand from './verify';

export const commands: Record<string, CommandConfiguration> = {
  [verifyCommand.name]: verifyCommand,
};
