import Koa from 'koa';
import KoaBody from 'koa-body'
import Router from 'koa-router';
import { ManagedShowdownClient } from '@showderp/pokemon-showdown-ts';
import { createGithubHandler } from './github';
import { createKoFiDonationHandler } from './ko-fi';

interface BotSettings {
  showdownUsername: string;
  showdownPassword: string;
  httpServerPort: number;
  webhookSecret: string;
  koFiDonationStorePath: string;
  koFiDonationSecret: string;
  adminSecret: string;
  adminPort: number;
}

const createShowdownClient = async (username: string, password: string) => {
  const showdownClient = new ManagedShowdownClient({
    actionUrl: 'https://clover.weedl.es/~~showdown/action.php',
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

export const createBot = async ({
  showdownUsername,
  showdownPassword,
  httpServerPort,
  webhookSecret,
  koFiDonationStorePath,
  koFiDonationSecret,
  adminSecret,
  adminPort,
}: BotSettings) => {
  const showdownClient = await createShowdownClient(showdownUsername, showdownPassword);
  const githubHandler = createGithubHandler(webhookSecret, showdownClient);
  const koFiHandler = createKoFiDonationHandler(koFiDonationStorePath, showdownClient);

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

  const adminApp = new Koa();
  const adminRouter = new Router();
  adminApp.use(KoaBody());
  adminRouter
    .get(`/admin/${adminSecret}/hotpatch`, async () => {
      await showdownClient.send('lobby|/hotpatch formats,notify');
      await showdownClient.send('lobby|/hotpatch chat,notify');
    });
  
  adminApp.use(adminRouter.routes());
  app.listen(adminPort, 'localhost');
};
