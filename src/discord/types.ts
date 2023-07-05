import { Interaction, SlashCommandBuilder } from 'discord.js';

export interface CommandConfiguration {
  name: string;
  configuration: SlashCommandBuilder;
  handler: (interaction: Interaction) => Promise<void>;
}
