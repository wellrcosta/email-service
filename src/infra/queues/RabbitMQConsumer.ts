import { Channel, ConsumeMessage } from "amqplib";
import { rabbitmqConfig } from "../../config/rabbitmq";
import { EmailPayload } from "../../domain/entities/EmailPayload";
import { SendEmailUseCase } from "../../application/use-cases/SendEmailUseCase";
import { RetryHandler } from "../redis/RetryHandler";
import { Logger } from "../../shared/logger/Logger";
import { DeadLetterPublisher } from "./DeadLetterPublisher";
import { ValidateEmailPayload } from "../../middlewares/ValidateEmailPayload";
import { RateLimiter } from "../redis/RateLimiter";

export class RabbitMQConsumer {
  private channel: Channel;
  private rateLimiter = new RateLimiter();

  constructor(
    private readonly sendEmailUseCase: SendEmailUseCase,
    private readonly retryHandler: RetryHandler,
    private readonly deadLetterPublisher: DeadLetterPublisher,
    channel: Channel,
    rateLimiter?: RateLimiter
  ) {
    this.channel = channel;
    this.rateLimiter = rateLimiter ?? new RateLimiter();
  }

  async connect(): Promise<void> {
    await this.channel.assertQueue(rabbitmqConfig.queue, { durable: true });
    await this.channel.assertQueue(rabbitmqConfig.dlqQueue, { durable: true });

    Logger.info("Connected to RabbitMQ");
  }

  async consume(): Promise<void> {
    this.channel.consume(rabbitmqConfig.queue, async (message) => {
      if (message) {
        try {
          const payload: EmailPayload = JSON.parse(message.content.toString());

          ValidateEmailPayload.validate(payload);

          const canSend = await this.rateLimiter.canSend(payload.to);
          if (!canSend) {
            throw new Error("Rate limit exceeded for email: " + payload.to);
          }

          await this.sendEmailUseCase.execute(payload);

          this.channel.ack(message);
          Logger.info("Email processed successfully", { email: payload.to });
        } catch (error) {
          Logger.error("Failed to process email", { error });
          await this.handleError(message);
        }
      }
    });
  }

  private async handleError(message: ConsumeMessage): Promise<void> {
    const retryCount = await this.retryHandler.incrementRetry(message);

    if (retryCount >= this.retryHandler.maxRetries) {
      await this.deadLetterPublisher.publish(message.content.toString());
      this.channel.ack(message);
      Logger.error(
        "Moved message to Dead Letter Queue after retries exhausted"
      );
    } else {
      this.channel.nack(message, false, true); // requeue
      Logger.warn(
        `Retrying message. Retry count: ${retryCount}/${this.retryHandler.maxRetries}`
      );
    }
  }

  async close(): Promise<void> {
    await this.channel.close();
    await this.rateLimiter.disconnect();
  }
}
