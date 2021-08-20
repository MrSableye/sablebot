import { createBot } from './bot';

const USERNAME = process.env.USERNAME || '';
const PASSWORD = process.env.PASSWORD || '';
const PORT = parseInt(process.env.PORT || '3000', 10);
const SECRET = process.env.SECRET || 'SNEED_SECRET';
const DONATION_PATH = process.env.DONATION_PATH || './donation.json';

createBot({
  showdownUsername: USERNAME,
  showdownPassword: PASSWORD,
  httpServerPort: PORT,
  webhookSecret: SECRET,
  koFiDonationStorePath: DONATION_PATH,
});
