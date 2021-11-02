import { createBot } from './bot';

const showdownUsername = process.env.SHOWDOWN_USERNAME || '';
const showdownPassword = process.env.SHOWDOWN_PASSWORD || '';
const httpServerPort = parseInt(process.env.PORT || '3000', 10);
const webhookSecret = process.env.SECRET || 'SNEED_SECRET';
const koFiDonationStorePath = process.env.DONATION_PATH || './donation.json';
const koFiDonationSecret = process.env.DONATION_SECRET || 'CHUCK_SECRET';

createBot({
  showdownUsername,
  showdownPassword,
  httpServerPort,
  webhookSecret,
  koFiDonationStorePath,
  koFiDonationSecret,
});
