import { existsSync, readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { ManagedShowdownClient } from '@showderp/pokemon-showdown-ts';

const toID = (text: string) => ('' + text).toLowerCase().replace(/[^a-z0-9]+/g, '');

interface HotpatchStore {
  users: Record<string, 'admin' | 'hotpatch'>;
}

interface HotpatchProgressState {
  text: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE';
}

interface HotpatchProgress {
  buildClient: HotpatchProgressState;
  hotpatch: HotpatchProgressState;
}

interface HotpatchRequest { 
  requester: string;
  requestId: string;
  progress: HotpatchProgress;
}

const progressStateToHtml = (hotpatchProgressState: HotpatchProgressState) => {
  const { text, status } = hotpatchProgressState;
  const emoji = status === 'COMPLETE' ? '✅' : (status === 'IN_PROGRESS' ? '⏳' : '🔲');
  return `<p>${emoji} ${text}</p>`;
};

const createHotpatchRequestHtml = (hotpatchRequest: HotpatchRequest) => {
  let lines = [];

  lines.push('<div class="infobox">');
  lines.push(`<p><b><u>Hotpatch ${hotpatchRequest.requestId} (<small>Requester: ${hotpatchRequest.requester}</small>)</u></b></p>`);
  lines.push(progressStateToHtml(hotpatchRequest.progress.buildClient));
  lines.push(progressStateToHtml(hotpatchRequest.progress.hotpatch));
  lines.push('</div>');

  return lines.join('');
};

const createHotpatchRequestUpdate = (hotpatchRequest: HotpatchRequest) => {
  const html = createHotpatchRequestHtml(hotpatchRequest);
  return `lobby|/adduhtml hotpatch-request-${hotpatchRequest.requestId}, ${html}`;
};

const logWithPrefix = (prefix: string, message: string) => {
  console.log(`[${prefix}]: ${message}`);
};

export const createHotpatchHandler = (
  hotpatchAdmin: string,
  hotpatchStorePath: string,
  hotpatchBuildScriptPath: string,
  showdownClient: ManagedShowdownClient,
) => {
  let hotpatchEnabled = true;
  let hotpatchInProgress = false;
  const attemptRebuild = async (senderId: string) => {
    const logPrefix = `${senderId}-${Date.now()}`;
    logWithPrefix(logPrefix, 'Hotpatching...');
    if (!hotpatchEnabled) {
      await showdownClient.send(`|/pm ${senderId}, Hotpatching currently disabled`);
      logWithPrefix(logPrefix, 'Hotpaching is currently disabled. Aborting hotpatch.');
      return;
    }
    const request: HotpatchRequest = {
      requestId: logPrefix,
      requester: senderId,
      progress: {
        buildClient: { text: 'Build client', status: 'NOT_STARTED' },
        hotpatch: { text: 'Request hotpatches', status: 'NOT_STARTED' },
      },
    };

    if (hotpatchInProgress) {
      await showdownClient.send(`|/pm ${senderId}, Hotpatch already in progress -- please wait and try again`);
      logWithPrefix(logPrefix, 'Hotpatch already in progres. Aborting hotpatch.');
      return;
    }

    hotpatchInProgress = true;

    try {
      await showdownClient.send(`|/pm ${senderId}, Hotpatch request received -- on it!`);
      await showdownClient.send(createHotpatchRequestUpdate(request));

      /* Build client */
      request.progress.buildClient = {
        status: 'IN_PROGRESS',
        text: 'Building client...',
      };
      await showdownClient.send(createHotpatchRequestUpdate(request));

      logWithPrefix(logPrefix, 'Building client...');
      execSync(`sh ${hotpatchBuildScriptPath}`);
      logWithPrefix(logPrefix, 'Client built.');

      request.progress.buildClient = {
        status: 'COMPLETE',
        text: 'Client built -- Please refresh to see changes',
      };
      await showdownClient.send(createHotpatchRequestUpdate(request));

      /* Hotpatching formats */
      request.progress.hotpatch = {
        status: 'IN_PROGRESS',
        text: 'Requesting hotpatches for data and chat plugins...',
      };
      await showdownClient.send(createHotpatchRequestUpdate(request));

      logWithPrefix(logPrefix, 'Sending hotpatch requests...');
      await showdownClient.send('lobby|/hotpatch formats,notify');
      await showdownClient.send('lobby|/hotpatch chat,notify');
      logWithPrefix(logPrefix, 'Hotpatch requests sent.');

      request.progress.hotpatch = {
        status: 'COMPLETE',
        text: 'Hotpatches requested -- Please await notification that hotpatching has succeeded',
      };
      await showdownClient.send(createHotpatchRequestUpdate(request));
    } catch (e) {
      await showdownClient.send(`|/pm ${senderId}, Error while hotpatch, please contact and administrator`);
      logWithPrefix(logPrefix, 'Unknown error occured while hotpatching');
    }

    logWithPrefix(logPrefix, 'Hotpatch complete.');

    hotpatchInProgress = false;
  };

  let hotpatchStore: HotpatchStore = { users: {} };


  if (existsSync(hotpatchStorePath)) {
    hotpatchStore = JSON.parse(readFileSync(hotpatchStorePath, 'utf8'));
  }

  const updateStore = () => {
    writeFileSync(hotpatchStorePath, JSON.stringify(hotpatchStore));
  }

  showdownClient.eventEmitter.on('pm', async (pmEvent) => {
    const pm = pmEvent.event[0];
    const senderId = toID(pm.sender.username);
    const user = hotpatchStore.users[senderId];

    if (pm.message.startsWith('$hotpatch')) {
      if (['hotpatch', 'admin'].includes(user)) {
        attemptRebuild(senderId);
      } else {
        console.log(`Unauthorized user ${user} tried to hotpatch.`);
      }
    } else if (pm.message.startsWith('$addhotpatch')) {
      if (toID(hotpatchAdmin) === senderId) {
        const [, ...rest] = pm.message.split(/\s+/);
        const userId = toID(rest.join(''));
        if (userId.length < 21) {
          hotpatchStore.users[userId] = 'hotpatch';
          updateStore();
          await showdownClient.send(`|/pm ${senderId}, Successfully added ${userId}`);
          console.log(`${user} added hotpatcher ${userId}.`);
        }
      } else {
        console.log(`Unauthorized user ${user} tried to add hotpatcher.`);
      }
    } else if (pm.message.startsWith('$removehotpatch')) {
      if (toID(hotpatchAdmin) === senderId) {
        const [, ...rest] = pm.message.split('\s+');
        const userId = toID(rest.join(''));
        if (userId.length < 21) {
          delete hotpatchStore.users[userId];
          updateStore();
          await showdownClient.send(`|/pm ${senderId}, Successfully removed ${userId}`);
          console.log(`${user} removed hotpatcher ${userId}.`);
        }
      } else {
        console.log(`Unauthorized user ${user} tried to remove hotpatcher.`);
      }
    } else if (pm.message.startsWith('$toggle')) {
      if (toID(hotpatchAdmin) === senderId) {
        hotpatchEnabled = !hotpatchEnabled;
        if (hotpatchEnabled) {
          await showdownClient.send(`|/pm ${senderId}, Hotpatching is enabled`);
          console.log(`User ${user} enabled hotpatching.`);
        } else {
          await showdownClient.send(`|/pm ${senderId}, Hotpatching is disabled`);
          console.log(`User ${user} disabled hotpatching.`);
        }
      } else {
        console.log(`Unauthorized user ${user} tried to toggle hotpatching.`);
      }
    }
  });
};