import { Client } from 'discord.js';
import { commands } from './commands';
import { ManagedShowdownClient } from '@showderp/pokemon-showdown-ts';
import { createStore } from './store';
import { CommandHandler } from './types';

const toID = (text: string) => ('' + text).toLowerCase().replace(/[^a-z0-9]+/g, '');

export const createDiscordHandler = async (
  discordClient: Client,
  showdownClient: ManagedShowdownClient,
  discordStorePath: string,
) => {
  const store = createStore(discordStorePath);
  const handlers = Object.entries(commands).reduce((allHandlers, [commandName, command]) => {
    return {
      [commandName]: command.createHandler(store),
    }
  }, {} as Record<string, CommandHandler>);

  discordClient.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const handler = handlers[interaction.commandName];
    if (!handler) return;

    await handler(interaction);
  });

  showdownClient.eventEmitter.on('pm', (pmEvent) => {
    const { sender, message } = pmEvent.event[0];
    const showdownUserId = toID(sender.username);

    if (message.startsWith('$verify ')) {
      const [, receivedToken] = message.split('$verify ');
      const tokenInfo = store.getToken(receivedToken);
      if (tokenInfo) {
        store.addDiscordAssociation(tokenInfo.userId, showdownUserId);
        showdownClient.send(`|/pm ${showdownUserId},Verified ${tokenInfo.userId}`);
        showdownClient.send(`|/databadge discord set ${showdownUserId},${tokenInfo.userId}`);
      } else {
        showdownClient.send(`|/pm ${showdownUserId},Invalid token`);
      }
    }
  });
};
