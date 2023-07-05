import { existsSync, readFileSync, writeFileSync } from 'fs';
import { Client } from 'discord.js';
import { commands } from './commands';
import { ManagedShowdownClient } from '@showderp/pokemon-showdown-ts';
import { activeTokens } from './commands/verify';

const toID = (text: string) => ('' + text).toLowerCase().replace(/[^a-z0-9]+/g, '');

interface DiscordStore {
  discordToShowdown: Record<string, string>;
  showdownToDiscord: Record<string, string>;
}

let discordStore: DiscordStore = {
  discordToShowdown: {},
  showdownToDiscord: {},
};

export const createDiscordHandler = async (
  discordClient: Client,
  showdownClient: ManagedShowdownClient,
  discordStorePath: string,
) => {
  if (existsSync(discordStorePath)) {
    discordStore = JSON.parse(readFileSync(discordStorePath, 'utf8'));
  }

  const updateStore = () => {
    writeFileSync(discordStorePath, JSON.stringify(discordStore));
  }

  discordClient.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands[interaction.commandName];
    if (!command) return;

    await command.handler(interaction);
  });

  showdownClient.eventEmitter.on('pm', (pmEvent) => {
    const { sender, message } = pmEvent.event[0];
    const showdownUserId = toID(sender.username);

    if (message.startsWith('!verify ')) {
      const [, receivedToken] = message.split('!verify ');
      const tokenInfo = activeTokens[receivedToken];
      if (tokenInfo) {
        discordStore.discordToShowdown[tokenInfo.userId] = showdownUserId;
        discordStore.showdownToDiscord[showdownUserId] = tokenInfo.userId;
        updateStore();
        showdownClient.send(`/pm ${showdownUserId},Verified ${tokenInfo.userId}`);
      } else {
        showdownClient.send(`/pm ${showdownUserId},Invalid token`);
      }
    }
  });
};
