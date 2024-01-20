import { existsSync, readFileSync, writeFileSync } from 'fs';
import { escape } from 'html-escaper';
import { ManagedShowdownClient } from '@showderp/pokemon-showdown-ts';

interface DonationStore {
  donations: Record<string, number>;
  history?: { amount: number, currency: string }[];
}

type KoFiEvent = Partial<{
  message_id: string;
  kofi_transaction_id: string;
  timestamp: string;
  type: 'Donation' | 'Subscription' | 'Commission' | 'Shop Order';
  from_name: string;
  message: string;
  amount: string;
  currency: string;
  url: string;
  is_subscription_payment: boolean;
  is_first_subscription_payment: boolean;
  is_public: boolean;
}>;

const createDonationHtml = (username: string, message: string, currency: string, amount: number, url?: string) => {
  let amountText = `${amount} ${currency}`;

  if (url) {
    amountText = `<a href="${url}">${amountText}</a>`;
  }

  return `<div><strong>${username}</strong> donated ${amountText}: "${escape(message)}"</div>`;
};

const toID = (text: string) => ('' + text).toLowerCase().replace(/[^a-z0-9]+/g, '');
const showdownRegex = /\[\s*showdown\:(?<username>.+)\s*\]/;
const getShowdownUsername = (message: string): { username?: string, message: string } => {
  const regexResult = showdownRegex.exec(message);

  if (regexResult?.groups?.username) {
    return { username: toID(regexResult.groups.username), message: message.replace(showdownRegex, '') };
  }

  return { message };
};

export const createKoFiDonationHandler = (
  donationStorePath: string,
  showdownClient: ManagedShowdownClient,
) => {
  let donationStore: DonationStore = { donations: {} };

  if (existsSync(donationStorePath)) {
    donationStore = JSON.parse(readFileSync(donationStorePath, 'utf8'));
  }

  const updateStore = () => {
    writeFileSync(donationStorePath, JSON.stringify(donationStore));
  }

  return async (event: KoFiEvent) => {
    const { message, amount, currency, is_public, url } = event;

    if (message && amount && currency) {
      const { username, message: strippedMessage } = getShowdownUsername(message);
      const amountNumeric = parseFloat(amount);

      if (!Number.isNaN(amountNumeric)) {
        const amountNumber = parseFloat(amount);
        if (username) {
          if (!donationStore.donations[username]) donationStore.donations[username] = 0;
          if (!donationStore.history) donationStore.history = [];
          donationStore.history.push({ amount: amountNumber, currency });
          if (currency === 'USD') {
            donationStore.donations[username] += amountNumber;
          }
  
          updateStore();
  
          const totalDonations = donationStore.donations[username];
          if (totalDonations >= 5) {
            await showdownClient.send(`lobby|/badge grant ${username},smalldonor`);
  
            if (totalDonations >= 10) {
              await showdownClient.send(`lobby|/badge grant ${username},mediumdonor`);
  
              if (totalDonations >= 20) {
                await showdownClient.send(`lobby|/badge grant ${username},largedonor`);
              }
            }
          }
        }

        if ((is_public !== undefined) && is_public) {
          const donationHtml = createDonationHtml(username || 'Anonymous', strippedMessage, currency, amountNumber, url);
          await showdownClient.send(`lobby|/addhtmlbox ${donationHtml}`);
        }
      }
    }
  };
};
