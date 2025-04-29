import Redis from "ioredis";
import { redisConfig } from "../../config/redis";
import { env } from "../../config/env";

export class RateLimiter {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password || undefined,
    });
  }

  async canSend(email: string): Promise<boolean> {
    const key = `rate_limit:${email}`;
    const current = await this.client.incr(key);

    if (current === 1) {
      await this.client.expire(key, 60);
    }

    return current <= env.maxEmailsPerMinute;
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}
