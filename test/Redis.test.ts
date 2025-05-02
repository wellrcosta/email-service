import Redis from "ioredis";
import { RateLimiter } from "../src/infra/redis/RateLimiter";
import { RetryHandler } from "../src/infra/redis/RetryHandler";
import { env } from "../src/config/env";
import { ConsumeMessage } from "amqplib";

jest.mock("ioredis", () => {
  const mockRedis = {
    incr: jest.fn(),
    expire: jest.fn(),
    quit: jest.fn().mockResolvedValue(undefined),
  };
  return jest.fn(() => mockRedis);
});

describe("Redis Classes", () => {
  let rateLimiter: RateLimiter;
  let retryHandler: RetryHandler;
  let mockRedis: jest.Mocked<Redis>;

  const mockMessage: ConsumeMessage = {
    content: Buffer.from(JSON.stringify({ to: "test@example.com" })),
    properties: {
      replyTo: "test-queue",
    },
  } as ConsumeMessage;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedis = new Redis() as jest.Mocked<Redis>;
    rateLimiter = new RateLimiter();
    retryHandler = new RetryHandler();
  });

  afterEach(async () => {
    await rateLimiter.disconnect();
    await retryHandler.disconnect();
  });

  describe("RateLimiter", () => {
    it("should allow sending when under rate limit", async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);

      const canSend = await rateLimiter.canSend("test@example.com");

      expect(canSend).toBe(true);
      expect(mockRedis.incr).toHaveBeenCalledWith("rate_limit:test@example.com");
      expect(mockRedis.expire).toHaveBeenCalledWith("rate_limit:test@example.com", 60);
    });

    it("should not allow sending when over rate limit", async () => {
      mockRedis.incr.mockResolvedValue(env.maxEmailsPerMinute + 1);
      mockRedis.expire.mockResolvedValue(1);

      const canSend = await rateLimiter.canSend("test@example.com");

      expect(canSend).toBe(false);
      expect(mockRedis.incr).toHaveBeenCalledWith("rate_limit:test@example.com");
    });

    it("should not set expire when key already exists", async () => {
      mockRedis.incr.mockResolvedValue(2);
      mockRedis.expire.mockResolvedValue(1);

      const canSend = await rateLimiter.canSend("test@example.com");

      expect(canSend).toBe(true);
      expect(mockRedis.incr).toHaveBeenCalledWith("rate_limit:test@example.com");
      expect(mockRedis.expire).not.toHaveBeenCalled();
    });

    it("should properly disconnect", async () => {
      await rateLimiter.disconnect();

      expect(mockRedis.quit).toHaveBeenCalled();
    });
  });

  describe("RetryHandler", () => {
    it("should increment retry count and set expire on first retry", async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);

      const retries = await retryHandler.incrementRetry(mockMessage);

      expect(retries).toBe(1);
      expect(mockRedis.incr).toHaveBeenCalled();
      expect(mockRedis.expire).toHaveBeenCalledWith(expect.any(String), 3600);
    });

    it("should increment retry count without setting expire on subsequent retries", async () => {
      mockRedis.incr.mockResolvedValue(2);
      mockRedis.expire.mockResolvedValue(1);

      const retries = await retryHandler.incrementRetry(mockMessage);

      expect(retries).toBe(2);
      expect(mockRedis.incr).toHaveBeenCalled();
      expect(mockRedis.expire).not.toHaveBeenCalled();
    });

    it("should build correct retry key", async () => {
      const retryHandler = new RetryHandler();
      const key = retryHandler["buildKey"](mockMessage);

      expect(key).toMatch(/^retry:test-queue:[a-f0-9]{64}$/);
    });

    it("should properly disconnect", async () => {
      await retryHandler.disconnect();

      expect(mockRedis.quit).toHaveBeenCalled();
    });

    it("should have correct maxRetries value", () => {
      expect(retryHandler.maxRetries).toBe(env.maxRetries);
    });
  });
}); 