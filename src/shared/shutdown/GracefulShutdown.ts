import { RabbitMQConsumer } from "../../infra/queues/RabbitMQConsumer";
import { RateLimiter } from "../../infra/redis/RateLimiter";
import { RetryHandler } from "../../infra/redis/RetryHandler";
import { Logger } from "../logger/Logger";

export class GracefulShutdown {
  constructor(
    private readonly consumer: RabbitMQConsumer,
    private readonly rateLimiter: RateLimiter,
    private readonly retryHandler: RetryHandler
  ) {}

  setup(): void {
    const shutdown = async () => {
      Logger.info("Graceful shutdown started...");
      try {
        await this.consumer.close();
        await this.rateLimiter.disconnect();
        await this.retryHandler.disconnect();
        Logger.info("All connections closed. Exiting.");
        process.exit(0);
      } catch (error) {
        Logger.error("Error during graceful shutdown", { error });
        process.exit(1);
      }
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }
}
