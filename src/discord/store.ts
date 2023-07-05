import { randomUUID } from 'crypto';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const DEFAULT_TOKEN_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export interface TokenInfo {
  userId: string;
  token: string;
  timeout: NodeJS.Timer;
}

interface InternalDiscordStore {
  activeTokens: Record<string, TokenInfo>;
  userTokens: Record<string, string>;
  persistent: {
    discordToShowdown: Record<string, string>;
    showdownToDiscord: Record<string, string>;
  };
}

export const createStore = (discordStorePath: string) => {
  let store: InternalDiscordStore = {
    activeTokens: {},
    userTokens: {},
    persistent: {
      discordToShowdown: {},
      showdownToDiscord: {},
    },
  };

  if (existsSync(discordStorePath)) {
    store.persistent = JSON.parse(readFileSync(discordStorePath, 'utf8'));
  }

  const updateStore = () => {
    writeFileSync(discordStorePath, JSON.stringify(store.persistent));
  }

  return {
    addDiscordAssociation: (discordId: string, showdownId: string) => {
      store.persistent.discordToShowdown[discordId] = showdownId;
      store.persistent.showdownToDiscord[showdownId] = discordId;
      updateStore();
    },
    getToken: (token: string) => {
      return store.activeTokens[token];
    },
    getOrCreateToken: (discordId: string) => {
      if (store.activeTokens[discordId]) {
        store.activeTokens[discordId].timeout.refresh();
        return store.activeTokens[discordId];
      }
    
      const token = randomUUID();
      store.userTokens[discordId] = token;
    
      return store.activeTokens[token] = {
        userId: discordId,
        token,
        timeout: setTimeout(() => {
          delete store.activeTokens[token];
          delete store.userTokens[discordId];
        }, DEFAULT_TOKEN_TIMEOUT),
      };
    },
    getShowdownIdByDiscordId: (discordId: string) => {
      return store.persistent.discordToShowdown[discordId];
    },
    getDiscordIdByShowdownId: (showdownId: string) => {
      return store.persistent.showdownToDiscord[showdownId];
    },
  };
};

export type DiscordStore = ReturnType<typeof createStore>;
