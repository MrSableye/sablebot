import { randomUUID } from 'crypto';
import { APIEmbed, Interaction, SlashCommandBuilder } from 'discord.js';
import { CommandConfiguration } from '../types';

const BOT_USERNAME = 'Sablebot';
const DEFAULT_TOKEN_TIMEOUT = 5 * 60 * 1000; // 5 minutes

const configuration = new SlashCommandBuilder()
  .setName('verify')
  .setDescription('Verifies the ownership of a Clovermon Showdown account.');

interface TokenInfo {
  userId: string;
  token: string;
  timeout: NodeJS.Timer;
}

export const activeTokens: Record<string, TokenInfo> = {};
const userTokens: Record<string, string> = {};

const getOrCreateToken = (userId: string) => {
  if (activeTokens[userId]) {
    activeTokens[userId].timeout.refresh();
    return activeTokens[userId];
  }

  const token = randomUUID();
  userTokens[userId] = token;

  return activeTokens[token] = {
    userId,
    token,
    timeout: setTimeout(() => {
      delete activeTokens[token];
      delete userTokens[userId];
    }, DEFAULT_TOKEN_TIMEOUT),
  };
};

const verificationEmbed = (token: TokenInfo): APIEmbed => ({
  title: 'Clovermon Showdown Verification',
  description: `PM \`$verify ${token.token}\` to ${BOT_USERNAME}\nExpires at <t:${Math.floor((Date.now() + DEFAULT_TOKEN_TIMEOUT) / 1000)}:T>`,
});

const handler = async (interaction: Interaction) => {
  const token = getOrCreateToken(interaction.user.id);

  if (interaction.isRepliable()) {
    await interaction.reply({
      ephemeral: true,
      embeds: [verificationEmbed(token)],
    });
  }
};

const verifyCommand: CommandConfiguration = {
  name: 'verify',
  configuration,
  handler,
};

export default verifyCommand;
