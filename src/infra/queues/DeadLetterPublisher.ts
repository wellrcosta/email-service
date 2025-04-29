import { Channel } from "amqplib";
import { rabbitmqConfig } from "../../config/rabbitmq";

export class DeadLetterPublisher {
  constructor(private readonly channel: Channel) {}

  async publish(message: string): Promise<void> {
    await this.channel.sendToQueue(
      rabbitmqConfig.dlqQueue,
      Buffer.from(message)
    );
  }
}
