import http from 'http';
import { EmitterWebhookEvent, Webhooks, createNodeMiddleware } from '@octokit/webhooks';
import { ManagedShowdownClient } from '@showderp/pokemon-showdown-ts';
import { Commit, Repository, User } from '@octokit/webhooks-types';

interface BotSettings {
  showdownUsername: string;
  showdownPassword: string;
  httpServerPort: number;
  webhookSecret: string;
}

const shortenText = (textToShorten: string, maxLength: number) => {
  if (textToShorten.length > maxLength) {
    return textToShorten.slice(0, maxLength) + '…';
  }

  return textToShorten;
};

const createUserHtml = (user: User) => {
  return `<div><a href="${user.url}"><img src="${user.avatar_url}" width=16 height=16 /> <strong>${user.login}</strong></a></div>`;
};

const getBranchFromRef = (ref: string) => ref.split('/').slice(-1)[0];

const createRepositoryUpdateHtml = (repository: Repository, compareUrl: string, commits: Commit[], ref: string) => {
  const branch = getBranchFromRef(ref);

  return `<div><a href="${compareUrl}"><strong>[${repository.full_name}:${branch}] ${commits.length} new commits</strong></a></div>`;
};

const createCommitHtml = (commit: Commit) => {
  return `<div><a href="${commit.url}"><code>${commit.id.slice(0, 7)}</code></a> ${shortenText(commit.message, 20)} - ${commit.author.name}</div>`;
};

const createPushHtml = ({ payload }: EmitterWebhookEvent<'push'>) => {
  let htmlContent = `<div>`;

  htmlContent += createUserHtml(payload.sender);
  htmlContent += createRepositoryUpdateHtml(payload.repository, payload.compare, payload.commits, payload.ref);

  let commitElements = payload.commits.map(createCommitHtml);
  if (commitElements.length > 6) {
    commitElements = [
      ...commitElements.slice(0, 3),
      `<div>${commitElements.length - 6} commits omitted</div>`,
      ...commitElements.slice(-3),
    ];
  }
  htmlContent += commitElements.join('');

  return htmlContent + '</div>';
};

const createShowdownClient = async (username: string, password: string) => {
  const showdownClient = new ManagedShowdownClient({
    actionUrl: 'https://clover.weedl.es/~~showdown/action.php',
    throttle: 200,
    server: 'clover.weedl.es',
    port: 8443,
    debug: true,
  });

  // TODO: Figure out why TLS isn't working properly
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
  await showdownClient.connect();
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';

  await showdownClient.login(username, password);
  await showdownClient.send('|/join lobby');

  return showdownClient;
};

const createWebhookServer = (secret: string) => {
  const webhooks = new Webhooks({
    secret,
  });

  const httpServer = http.createServer(createNodeMiddleware(webhooks, { path: '/github' }));

  return {
    httpServer,
    webhooks,
  };
};

export const createBot = async ({
  showdownUsername,
  showdownPassword,
  httpServerPort,
  webhookSecret,
}: BotSettings) => {
  const { httpServer, webhooks } = createWebhookServer(webhookSecret);
  const showdownClient = await createShowdownClient(showdownUsername, showdownPassword);
  
  webhooks.on('push', async (pushEvent) => {
    const pushHtml = createPushHtml(pushEvent);

    await showdownClient.send(`lobby|/addhtmlbox ${pushHtml}`);
  });

  httpServer.listen(httpServerPort);
};
