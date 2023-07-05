import { APIEmbed, SlashCommandBuilder, User } from 'discord.js';
import { CommandConfiguration } from '../types';

const COMMAND_NAME = 'clodownuser';

const userEmbed = (user: User, showdownId: string): APIEmbed => ({
  color: 0x00ff00,
  author: {
    name: user.username,
    icon_url: user.displayAvatarURL(),
  },
  description: `Clovermon Showdown user: \`${showdownId}\``,
});

const noUserEmbed = (user: User): APIEmbed => ({
  color: 0xff0000,
  author: {
    name: user.username,
    icon_url: user.displayAvatarURL(),
  },
  description: `No associated Clovermon Showdown user`,
});

const getClodownCommand: CommandConfiguration = {
  name: COMMAND_NAME,
  configuration: new SlashCommandBuilder()
    .addUserOption((option) => option.setName('user').setDescription('Discord user').setRequired(true))
    .setName(COMMAND_NAME)
    .setDescription("Retrieves a Discord user's Clovermon Showdown user"),
  createHandler: (store) => {
    return async (interaction) => {
      if (!interaction.isCommand()) return;

      const user = interaction.options.getUser('user', true);
      const showdownId = store.getShowdownIdByDiscordId(user.id);

      if (showdownId) {
        await interaction.reply({
          embeds: [userEmbed(user, showdownId)],
        });
      } else {
        await interaction.reply({
          embeds: [noUserEmbed(user)],
        });
      }
    }
  }
};

export default getClodownCommand;
