import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "production",
  port: Number(process.env.PORT) || 3000,

  rabbitmqUrl: process.env.RABBITMQ_URL || "amqp://localhost:5672",
  rabbitmqQueue: process.env.RABBITMQ_QUEUE || "email-queue",
  rabbitmqDlqQueue: process.env.RABBITMQ_DLQ_QUEUE || "email-dlq",

  redisHost: process.env.REDIS_HOST || "localhost",
  redisPort: Number(process.env.REDIS_PORT) || 6379,
  redisPassword: process.env.REDIS_PASSWORD || "",

  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpUser: process.env.SMTP_USER || "",
  smtpPassword: process.env.SMTP_PASSWORD || "",
  smtpFrom: process.env.SMTP_FROM || "",

  maxEmailsPerMinute: Number(process.env.MAX_EMAILS_PER_MINUTE) || 100,
  maxRetries: Number(process.env.MAX_RETRIES) || 3,
};
