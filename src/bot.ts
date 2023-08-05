import Koa from 'koa';
import KoaBody from 'koa-body'
import Router from 'koa-router';
import { Client } from 'discord.js';
import { ManagedShowdownClient } from '@showderp/pokemon-showdown-ts';
import { createGithubHandler } from './github';
import { createKoFiDonationHandler } from './ko-fi';
import { createDiscordHandler } from './discord';
import { createHotpatchHandler } from './hotpatch';

interface BotSettings {
  showdownUsername: string;
  showdownPassword: string;
  httpServerPort: number;
  webhookSecret: string;
  koFiDonationStorePath: string;
  koFiDonationSecret: string;
  discordToken: string;
  discordStorePath: string;
  hotpatchAdmin: string;
  hotpatchBuildScriptPath: string;
  hotpatchStorePath: string;
}

const createShowdownClient = async (username: string, password: string) => {
  const showdownClient = new ManagedShowdownClient({
    actionUrl: 'https://clover.weedl.es/~~clodown/action.php',
    throttle: 200,
    server: 'clover.weedl.es',
    port: 8443,
  });

  // TODO: Figure out why TLS isn't working properly
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
  await showdownClient.connect();
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';

  await showdownClient.login(username, password);
  await showdownClient.send('|/join lobby');

  return showdownClient;
};

const createDiscordClient = async (token: string) => {
  const client = new Client({ intents: [] });
  await client.login(token);
  return client;
};

export const createBot = async ({
  showdownUsername,
  showdownPassword,
  httpServerPort,
  webhookSecret,
  koFiDonationStorePath,
  koFiDonationSecret,
  discordToken,
  discordStorePath,
  hotpatchAdmin,
  hotpatchStorePath,
  hotpatchBuildScriptPath,
}: BotSettings) => {
  const showdownClient = await createShowdownClient(showdownUsername, showdownPassword);
  const githubHandler = createGithubHandler(webhookSecret, showdownClient);
  const koFiHandler = createKoFiDonationHandler(koFiDonationStorePath, showdownClient);
  const discordClient = await createDiscordClient(discordToken);
  createDiscordHandler(discordClient, showdownClient, discordStorePath);
  createHotpatchHandler(hotpatchAdmin, hotpatchStorePath, hotpatchBuildScriptPath, showdownClient);

  const app = new Koa();
  app.use(KoaBody());

  const router = new Router();
  router
    .post('/github', async (ctx) => {
      const id = ctx.headers['x-github-delivery'];
      const name = ctx.headers['x-github-event'];
      const payload = ctx.request.body;
      const signature = ctx.headers['x-hub-signature-256'];

      githubHandler(id as string, name as any, payload as string, signature as string);
      ctx.status = 201;
      ctx.body = '';
    })
    .post(`/kofi/${koFiDonationSecret}`, async (ctx) => {
      koFiHandler(JSON.parse(ctx.request.body.data));
      ctx.status = 201;
      ctx.body = '';
    });

  app.use(router.routes());
  app.listen(httpServerPort);
};
