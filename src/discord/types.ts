import { Interaction, SlashCommandBuilder } from 'discord.js';
import { DiscordStore } from './store';

export type CommandHandler = (interaction: Interaction) => Promise<void>;

export interface CommandConfiguration {
  name: string;
  configuration: SlashCommandBuilder;
  createHandler: (store: DiscordStore) => CommandHandler;
}
