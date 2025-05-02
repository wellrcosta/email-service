import { RabbitMQConsumer } from "../src/infra/queues/RabbitMQConsumer";
import { SendEmailUseCase } from "../src/application/use-cases/SendEmailUseCase";
import { RetryHandler } from "../src/infra/redis/RetryHandler";
import { DeadLetterPublisher } from "../src/infra/queues/DeadLetterPublisher";
import { RateLimiter } from "../src/infra/redis/RateLimiter";
import { ValidateEmailPayload } from "../src/middlewares/ValidateEmailPayload";
import { Channel, ConsumeMessage } from "amqplib";
import Redis from "ioredis";
import { rabbitmqConfig } from "../src/config/rabbitmq";

// Mock winston logger
jest.mock("winston", () => ({
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    json: jest.fn(),
  },
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }),
  transports: {
    Console: jest.fn(),
  },
}));

jest.mock("../src/middlewares/ValidateEmailPayload", () => ({
  ValidateEmailPayload: {
    validate: jest.fn(),
  },
}));

jest.mock("ioredis", () => {
  const mockRedis = {
    quit: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
  };
  return jest.fn(() => mockRedis);
});

// Mock console.log to prevent logs from showing in tests
global.console.log = jest.fn();
global.console.error = jest.fn();
global.console.warn = jest.fn();

describe("RabbitMQConsumer", () => {
  let consumer: RabbitMQConsumer;
  let sendEmailUseCase: SendEmailUseCase;
  let retryHandler: RetryHandler;
  let deadLetterPublisher: DeadLetterPublisher;
  let rateLimiter: RateLimiter;
  let mockChannel: Partial<Channel>;
  let mockRedis: jest.Mocked<Redis>;
  let consumeCallback: ((msg: ConsumeMessage | null) => void) | null = null;

  const payload = { to: "user@test.com", subject: "Hi", body: "Test" };
  const message: ConsumeMessage = {
    content: Buffer.from(JSON.stringify(payload)),
  } as ConsumeMessage;

  beforeEach(() => {
    jest.clearAllMocks();
    consumeCallback = null;

    mockRedis = new Redis() as jest.Mocked<Redis>;
    
    sendEmailUseCase = { execute: jest.fn() } as any;
    retryHandler = {
      incrementRetry: jest.fn().mockResolvedValue(0),
      maxRetries: 3,
      disconnect: jest.fn().mockResolvedValue(undefined),
    } as any;
    deadLetterPublisher = { publish: jest.fn() } as any;
    rateLimiter = {
      canSend: jest.fn().mockResolvedValue(true),
      disconnect: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockChannel = {
      ack: jest.fn(),
      nack: jest.fn(),
      assertQueue: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      consume: jest.fn().mockImplementation((queue, callback) => {
        consumeCallback = callback;
      }),
    };

    consumer = new RabbitMQConsumer(
      sendEmailUseCase,
      retryHandler,
      deadLetterPublisher,
      mockChannel as Channel,
      rateLimiter
    );
  });

  describe("connect", () => {
    it("should assert queues", async () => {
      await consumer.connect();

      expect(mockChannel.assertQueue).toHaveBeenCalledWith(rabbitmqConfig.queue, { durable: true });
      expect(mockChannel.assertQueue).toHaveBeenCalledWith(rabbitmqConfig.dlqQueue, { durable: true });
    });
  });

  describe("consume", () => {
    it("should process valid message and send email", async () => {
      await consumer.consume();
      
      // Simulate message arrival
      if (consumeCallback) {
        await consumeCallback(message);
      }

      // Wait for all promises to resolve
      await new Promise(resolve => setImmediate(resolve));

      expect(ValidateEmailPayload.validate).toHaveBeenCalledWith(payload);
      expect(rateLimiter.canSend).toHaveBeenCalledWith(payload.to);
      expect(sendEmailUseCase.execute).toHaveBeenCalledWith(payload);
      expect(mockChannel.ack).toHaveBeenCalledWith(message);
    });

    it("should handle rate limit exceeded", async () => {
      rateLimiter.canSend = jest.fn().mockResolvedValue(false);
      
      await consumer.consume();
      
      // Simulate message arrival
      if (consumeCallback) {
        await consumeCallback(message);
      }

      // Wait for all promises to resolve
      await new Promise(resolve => setImmediate(resolve));

      expect(rateLimiter.canSend).toHaveBeenCalledWith(payload.to);
      expect(mockChannel.nack).toHaveBeenCalledWith(message, false, true);
    });

    it("should handle validation error", async () => {
      ValidateEmailPayload.validate = jest.fn().mockImplementation(() => {
        throw new Error("Invalid payload");
      });
      
      await consumer.consume();
      
      // Simulate message arrival
      if (consumeCallback) {
        await consumeCallback(message);
      }

      // Wait for all promises to resolve
      await new Promise(resolve => setImmediate(resolve));

      expect(ValidateEmailPayload.validate).toHaveBeenCalledWith(payload);
      expect(mockChannel.nack).toHaveBeenCalledWith(message, false, true);
    });
  });

  describe("handleError", () => {
    it("should move to DLQ when max retries reached", async () => {
      const mockRetryHandler = {
        incrementRetry: jest.fn().mockResolvedValue(3),
        maxRetries: 3,
        disconnect: jest.fn().mockResolvedValue(undefined),
      } as any;

      consumer = new RabbitMQConsumer(
        sendEmailUseCase,
        mockRetryHandler,
        deadLetterPublisher,
        mockChannel as Channel,
        rateLimiter
      );

      await consumer["handleError"](message);

      expect(mockRetryHandler.incrementRetry).toHaveBeenCalledWith(message);
      expect(deadLetterPublisher.publish).toHaveBeenCalledWith(message.content.toString());
      expect(mockChannel.ack).toHaveBeenCalledWith(message);
    });

    it("should retry when under max retries", async () => {
      const mockRetryHandler = {
        incrementRetry: jest.fn().mockResolvedValue(1),
        maxRetries: 3,
        disconnect: jest.fn().mockResolvedValue(undefined),
      } as any;

      consumer = new RabbitMQConsumer(
        sendEmailUseCase,
        mockRetryHandler,
        deadLetterPublisher,
        mockChannel as Channel,
        rateLimiter
      );

      await consumer["handleError"](message);

      expect(mockRetryHandler.incrementRetry).toHaveBeenCalledWith(message);
      expect(mockChannel.nack).toHaveBeenCalledWith(message, false, true);
    });
  });

  describe("close", () => {
    it("should close channel and disconnect rate limiter", async () => {
      await consumer.close();

      expect(mockChannel.close).toHaveBeenCalled();
      expect(rateLimiter.disconnect).toHaveBeenCalled();
    });
  });

  afterEach(async () => {
    await retryHandler.disconnect();
    await rateLimiter.disconnect();
    await mockChannel.close!();
    await mockRedis.quit();
    await mockRedis.disconnect();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
  });
});
