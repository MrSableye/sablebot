import { APIEmbed, SlashCommandBuilder } from 'discord.js';
import { CommandConfiguration } from '../types';
import { TokenInfo } from '../store';

const COMMAND_NAME = 'clodownverify';
const BOT_USERNAME = 'Mr. Sablebot';
const DEFAULT_TOKEN_TIMEOUT = 5 * 60 * 1000; // 5 minutes

const configuration = new SlashCommandBuilder()
  .setName(COMMAND_NAME)
  .setDescription('Starts the verification process for associating a Discord user with a Clovermon Showdown user');

const verificationEmbed = (token: TokenInfo): APIEmbed => ({
  title: 'Clovermon Showdown Verification',
  description: `PM \`$verify ${token.token}\` to ${BOT_USERNAME}\nExpires at <t:${Math.floor((Date.now() + DEFAULT_TOKEN_TIMEOUT) / 1000)}:T>`,
});

const verifyCommand: CommandConfiguration = {
  name: COMMAND_NAME,
  configuration,
  createHandler: (store) => {
    return async (interaction) => {
      if (!interaction.isCommand()) return;

      const token = store.getOrCreateToken(interaction.user.id);

      await interaction.reply({
        ephemeral: true,
        embeds: [verificationEmbed(token)],
      });
    };
  },
};

export default verifyCommand;
