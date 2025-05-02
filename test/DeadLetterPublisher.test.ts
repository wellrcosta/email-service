import { Channel } from "amqplib";
import { DeadLetterPublisher } from "../src/infra/queues/DeadLetterPublisher";
import { rabbitmqConfig } from "../src/config/rabbitmq";

const mockSendToQueue = jest.fn().mockResolvedValue(undefined);
const mockClose = jest.fn().mockResolvedValue(undefined);
const mockChannel = {
  sendToQueue: mockSendToQueue,
  close: mockClose,
} as unknown as Channel;

jest.mock("amqplib", () => ({
  Channel: jest.fn().mockImplementation(() => mockChannel),
}));

describe("DeadLetterPublisher", () => {
  let deadLetterPublisher: DeadLetterPublisher;

  beforeEach(() => {
    jest.clearAllMocks();
    deadLetterPublisher = new DeadLetterPublisher(mockChannel);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await mockClose();
  });

  it("should publish message to dead letter queue", async () => {
    const testMessage = "test message";

    await deadLetterPublisher.publish(testMessage);

    expect(mockSendToQueue).toHaveBeenCalledWith(
      rabbitmqConfig.dlqQueue,
      Buffer.from(testMessage)
    );
  });

  it("should handle empty message", async () => {
    const emptyMessage = "";

    await deadLetterPublisher.publish(emptyMessage);

    expect(mockSendToQueue).toHaveBeenCalledWith(
      rabbitmqConfig.dlqQueue,
      Buffer.from(emptyMessage)
    );
  });

  it("should handle special characters in message", async () => {
    const specialMessage = "test message with special chars: !@#$%^&*()";

    await deadLetterPublisher.publish(specialMessage);

    expect(mockSendToQueue).toHaveBeenCalledWith(
      rabbitmqConfig.dlqQueue,
      Buffer.from(specialMessage)
    );
  });
}); 