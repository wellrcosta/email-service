import { env } from "./env";

export const smtpConfig = {
  host: env.smtpHost,
  port: env.smtpPort,
  user: env.smtpUser,
  password: env.smtpPassword,
  from: env.smtpFrom,
};
