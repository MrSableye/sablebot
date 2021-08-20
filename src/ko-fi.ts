import { existsSync, readFileSync, writeFileSync } from 'fs';
import { exchangeRates } from 'exchange-rates-api';
import { ManagedShowdownClient } from '@showderp/pokemon-showdown-ts';

 const convert = (amount: number, fromCurrency: string, toCurrency: string) => {
  if (typeof amount !== 'number') {
    throw new TypeError('The \'amount\' parameter has to be a number');
  }

  if (Array.isArray(toCurrency)) {
    throw new TypeError('Cannot convert to multiple currencies at the same time');
  }

  const instance = exchangeRates();
  (instance as any).setApiBaseUrl('https://api.exchangerate.host');
  instance.latest();

  return instance
    .base(fromCurrency)
    .symbols(toCurrency)
    .fetch()
    .then((rate) => (rate as number) * amount);
};

interface DonationStore {
  donations: Record<string, number>;
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

const toID = (text: string) => ('' + text).toLowerCase().replace(/[^a-z0-9]+/g, '');;
const showdownRegex = /\[\s*showdown\:(?<username>.+)\s*\]/;
const getShowdownUsername = (message: string) => {
  const regexResult = showdownRegex.exec(message);

  if (regexResult?.groups?.username) {
    return toID(regexResult.groups.username);
  }

  return null;
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
    const { message, amount, currency, is_public } = event;

    if (message && amount && currency) {
      const showdownUsername = getShowdownUsername(message);

      if (showdownUsername) {
        const amountNumeric = parseFloat(amount);

        if (!Number.isNaN(amountNumeric)) {
          const amountUSD = await convert(amountNumeric, currency, 'USD');
          if (!donationStore.donations[showdownUsername]) donationStore.donations[showdownUsername] = 0;
          donationStore.donations[showdownUsername] += amountUSD;
          updateStore();

          const totalDonations = donationStore.donations[showdownUsername];

          if (amountUSD >= 5 && (is_public !== undefined) && is_public) {
            await showdownClient.send(`lobby|${showdownUsername} donated $${amountUSD} USD!`);
          }

          if (totalDonations >= 5) {
            await showdownClient.send(`lobby|/badge grant ${showdownUsername},smalldonor`);

            if (totalDonations >= 10) {
              await showdownClient.send(`lobby|/badge grant ${showdownUsername},mediumdonor`);

              if (totalDonations >= 20) {
                await showdownClient.send(`lobby|/badge grant ${showdownUsername},largedonor`);
              }
            }
          }
        }
      }
    }
  };
};
