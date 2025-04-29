import { env } from "./env";

export const redisConfig = {
  host: env.redisHost,
  port: env.redisPort,
  password: env.redisPassword,
};
