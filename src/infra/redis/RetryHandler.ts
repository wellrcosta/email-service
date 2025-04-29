import Redis from "ioredis";
import { redisConfig } from "../../config/redis";
import { env } from "../../config/env";
import { ConsumeMessage } from "amqplib";
import { hash } from "node:crypto";

export class RetryHandler {
  private client: Redis;
  readonly maxRetries = env.maxRetries;

  constructor() {
    this.client = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password || undefined,
    });
  }

  async incrementRetry(message: ConsumeMessage): Promise<number> {
    const key = this.buildKey(message);
    const retries = await this.client.incr(key);

    if (retries === 1) {
      await this.client.expire(key, 3600); // key will expire in 1 hour
    }

    return retries;
  }

  private buildKey(message: ConsumeMessage): string {
    const replyTo = message.properties.replyTo;
    const bodyHash = hash("sha256", message.content.toString(), "hex");
    return `retry:${replyTo}:${bodyHash}`;
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}
