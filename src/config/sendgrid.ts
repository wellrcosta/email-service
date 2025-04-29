import { env } from "./env";

export const sendgridConfig = {
  apiKey: env.sendgridApiKey,
  fromEmail: env.sendgridFromEmail,
};
