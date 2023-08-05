import { createBot } from './bot';

const showdownUsername = process.env.SHOWDOWN_USERNAME || '';
const showdownPassword = process.env.SHOWDOWN_PASSWORD || '';
const httpServerPort = parseInt(process.env.PORT || '3000', 10);
const webhookSecret = process.env.SECRET || 'SNEED_SECRET';
const koFiDonationStorePath = process.env.DONATION_PATH || './donation.json';
const koFiDonationSecret = process.env.DONATION_SECRET || 'CHUCK_SECRET';
const adminSecret = process.env.ADMIN_SECRET || 'ADMIN_SECRET';
const adminPort = parseInt(process.env.ADMIN_PORT || '81722', 10);
const discordToken = process.env.DISCORD_TOKEN || '';
const discordStorePath = process.env.DISCORD_STORE_PATH || '';
const hotpatchAdmin = process.env.HOTPATCH_ADMIN || '';
const hotpatchStorePath = process.env.HOTPATCH_STORE_PATH || '';
const hotpatchBuildScriptPath = process.env.HOTPATCH_BUILD_SCRIPT_PATH || '';

createBot({
  showdownUsername,
  showdownPassword,
  httpServerPort,
  webhookSecret,
  koFiDonationStorePath,
  koFiDonationSecret,
  adminSecret,
  adminPort,
  discordToken,
  discordStorePath,
  hotpatchAdmin,
  hotpatchBuildScriptPath,
  hotpatchStorePath,
});
