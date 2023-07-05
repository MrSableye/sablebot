import { REST, Routes } from 'discord.js';
import { commands } from './commands';
import { config } from 'dotenv';

config();

const deployCommands = async (clientId: string, token: string) => {
  try {
    const rest = new REST().setToken(token);
    const commandsJson = Object.values(commands)
			.map((command) => command.configuration.toJSON());

		await rest.put(
      Routes.applicationCommands(clientId),
			{ body: commandsJson },
		);

		console.log(`Successfully reloaded application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
};

deployCommands(process.env.DISCORD_CLIENT_ID || '', process.env.DISCORD_TOKEN || '');
