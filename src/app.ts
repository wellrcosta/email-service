import { SMTPProvider } from "./infra/providers/SMTPProvider";
import { RabbitMQConsumer } from "./infra/queues/RabbitMQConsumer";
import { DeadLetterPublisher } from "./infra/queues/DeadLetterPublisher";
import { RateLimiter } from "./infra/redis/RateLimiter";
import { RetryHandler } from "./infra/redis/RetryHandler";
import { SendEmailUseCase } from "./application/use-cases/SendEmailUseCase";
import { GracefulShutdown } from "./shared/shutdown/GracefulShutdown";
import { startServer } from "./web/server";
import { Logger } from "./shared/logger/Logger";
import amqp from "amqplib";

async function main() {
  try {
    const emailProvider = new SMTPProvider();
    const sendEmailUseCase = new SendEmailUseCase(emailProvider);
    const retryHandler = new RetryHandler();
    const rateLimiter = new RateLimiter();

    const connection = await amqp.connect(
      process.env.RABBITMQ_URL || "amqp://localhost"
    );
    const channel = await connection.createChannel();
    const deadLetterPublisher = new DeadLetterPublisher(channel);

    const rabbitConsumer = new RabbitMQConsumer(
      sendEmailUseCase,
      retryHandler,
      deadLetterPublisher,
      channel
    );

    const gracefulShutdown = new GracefulShutdown(
      rabbitConsumer,
      rateLimiter,
      retryHandler
    );
    gracefulShutdown.setup();

    await rabbitConsumer.connect();
    await rabbitConsumer.consume();
    startServer();

    Logger.info("Email Service started successfully");
  } catch (error) {
    Logger.error("Fatal error during startup", { error });
    process.exit(1);
  }
}

main();
