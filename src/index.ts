import { createBot } from './bot';

const USERNAME = process.env.USERNAME || '';
const PASSWORD = process.env.PASSWORD || '';
const PORT = parseInt(process.env.PORT || '3000', 10);
const SECRET = process.env.SECRET || 'SNEED_SECRET';

createBot({
  showdownUsername: USERNAME,
  showdownPassword: PASSWORD,
  httpServerPort: PORT,
  webhookSecret: SECRET,
});
