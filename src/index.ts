import { createBot } from './bot';

const showdownUsername = process.env.SHOWDOWN_USERNAME || '';
const showdownPassword = process.env.SHOWDOWN_PASSWORD || '';
const httpServerPort = parseInt(process.env.PORT || '3000', 10);
const webhookSecret = process.env.SECRET || 'SNEED_SECRET';
const koFiDonationStorePath = process.env.DONATION_PATH || './donation.json';
const koFiDonationSecret = process.env.DONATION_SECRET || 'CHUCK_SECRET';
const adminSecret = process.env.ADMIN_SECRET || 'ADMIN_SECRET';
const adminPort = parseInt(process.env.ADMIN_PORT || '81722', 10);

createBot({
  showdownUsername,
  showdownPassword,
  httpServerPort,
  webhookSecret,
  koFiDonationStorePath,
  koFiDonationSecret,
  adminSecret,
  adminPort,
});
