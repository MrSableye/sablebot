import {
  EmitterWebhookEvent,
  EmitterWebhookEventName,
  Webhooks,
} from '@octokit/webhooks';
import { Commit, PullRequest, Repository, User } from '@octokit/webhooks-types';
import { ManagedShowdownClient } from '@showderp/pokemon-showdown-ts';
import { BotSettings } from './types';

const shortenText = (textToShorten: string, maxLength: number) => {
  if (textToShorten.length > maxLength) {
    return textToShorten.slice(0, maxLength) + '…';
  }

  return textToShorten;
};

const createUserHtml = (user: User) => {
  return `<div><img src="${user.avatar_url}&size=24" width=24 height=24 style="border-radius: 50%;" /> <a href="${user.html_url}"><strong style="font-size: 14px; vertical-align:super;">${user.login}</strong></a></div>`;
};

const getBranchFromRef = (ref: string) => ref.split('/').slice(-1)[0];

const createRepositoryUpdateHtml = (repository: Repository, compareUrl: string, commits: Commit[], ref: string) => {
  const branch = getBranchFromRef(ref);

  return `<div style="margin-bottom: 6px;"><a href="${compareUrl}"><strong>[${repository.full_name}:${branch}] ${commits.length} new commits</strong></a></div>`;
};

const createCommitHtml = (commit: Commit) => {
  return `<div><a href="${commit.url}"><code>${commit.id.slice(0, 7)}</code></a> ${shortenText(commit.message, 80)} - ${commit.author.name}</div>`;
};

const createHotpatchHtml = (showdownUsername: string) => {
  return `<div><button class="button" name="send" value="/pm ${showdownUsername},$hotpatch">Hotpatch</button></div>`;
};

const createPushHtml = ({ payload }: EmitterWebhookEvent<'push'>, showdownUsername: string) => {
  let htmlContent = `<div>`;

  htmlContent += createUserHtml(payload.sender);
  htmlContent += createRepositoryUpdateHtml(payload.repository, payload.compare, payload.commits, payload.ref);

  let commitElements = payload.commits.filter((commit) => !commit.message.includes('[No Bot]')).map(createCommitHtml);
  if (!commitElements.length) return;
  if (commitElements.length > 6) {
    commitElements = [
      ...commitElements.slice(0, 3),
      `<div>${commitElements.length - 6} commits omitted</div>`,
      ...commitElements.slice(-3),
    ];
  }
  htmlContent += commitElements.join('');
  htmlContent += createHotpatchHtml(showdownUsername);

  return htmlContent + '</div>';
};

const createPullRequestOpenedHtml = (repository: Repository, pullRequest: PullRequest) => {
  return `<div style="margin-bottom: 6px;"><a href="${pullRequest.url}"><strong>[${repository.full_name}] New pull request (#${pullRequest.number}): ${pullRequest.title}</strong></a></div>`;
};

const createPullRequestHtml = ({ payload }: EmitterWebhookEvent<'pull_request.opened'>) => {
  let htmlContent = `<div>`;

  htmlContent += createUserHtml(payload.sender);
  htmlContent += createPullRequestOpenedHtml(payload.repository, payload.pull_request);

  return htmlContent + '</div>';
};

export const createGithubHandler = (secret: string, showdownClient: ManagedShowdownClient, { showdownUsername }: BotSettings) => {
  const webhooks = new Webhooks({
    secret,
  });

  webhooks.on('push', async (pushEvent) => {
    const pushHtml = createPushHtml(pushEvent, showdownUsername);

    if (pushHtml) {
      await showdownClient.send(`lobby|/addhtmlbox ${pushHtml}`);
    }
  });

  webhooks.on('pull_request.opened', async (pullRequestEvent) => {
    const pullRequestHtml = createPullRequestHtml(pullRequestEvent);

    if (pullRequestHtml) {
      await showdownClient.send(`lobby|/addhtmlbox ${pullRequestHtml}`);
    }
  });

  return (id: string, name: EmitterWebhookEventName, payload: any, signature: string) => {
    webhooks.verifyAndReceive({
      id,
      name,
      payload,
      signature,
    });
  };
};
