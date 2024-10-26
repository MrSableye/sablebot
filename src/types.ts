export interface BotSettings {
  showdownUsername: string;
  showdownPassword: string;
  httpServerPort: number;
  webhookSecret: string;
  koFiDonationStorePath: string;
  koFiDonationSecret: string;
  discordToken: string;
  discordStorePath: string;
  hotpatchAdmin: string;
  hotpatchBuildScriptPath: string;
  hotpatchStorePath: string;
}