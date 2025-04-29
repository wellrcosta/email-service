import { env } from "./env";

export const rabbitmqConfig = {
  url: env.rabbitmqUrl,
  queue: env.rabbitmqQueue,
  dlqQueue: env.rabbitmqDlqQueue,
};
