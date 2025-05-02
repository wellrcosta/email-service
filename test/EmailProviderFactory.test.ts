import { getEmailProvider } from "../src/infra/email/EmailProviderFactory";
import { SMTPProvider } from "../src/infra/providers/SMTPProvider";
import { SendGridProvider } from "../src/infra/providers/SendGridProvider";

// Mock the providers
jest.mock("../src/infra/providers/SMTPProvider", () => ({
  SMTPProvider: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
}));

jest.mock("../src/infra/providers/SendGridProvider", () => ({
  SendGridProvider: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
}));

// Mock the email config
jest.mock("../src/config/email", () => ({
  emailConfig: {
    emailProvider: "smtp",
  },
}));

// Mock console.log to prevent logs from showing in tests
global.console.log = jest.fn();
global.console.error = jest.fn();
global.console.warn = jest.fn();

describe("EmailProviderFactory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return SMTPProvider when email provider is set to smtp", () => {
    // Override the mock to return 'smtp'
    require("../src/config/email").emailConfig.emailProvider = "smtp";

    const provider = getEmailProvider();

    expect(provider).toBeInstanceOf(SMTPProvider);
    expect(SMTPProvider).toHaveBeenCalledTimes(1);
  });

  it("should return SendGridProvider when email provider is set to sendgrid", () => {
    // Override the mock to return 'sendgrid'
    require("../src/config/email").emailConfig.emailProvider = "sendgrid";

    const provider = getEmailProvider();

    expect(provider).toBeInstanceOf(SendGridProvider);
    expect(SendGridProvider).toHaveBeenCalledTimes(1);
  });

  it("should throw error when email provider is not supported", () => {
    // Override the mock to return an unsupported provider
    require("../src/config/email").emailConfig.emailProvider = "unsupported";

    expect(() => getEmailProvider()).toThrow("Email provider unsupported is not supported");
  });

  afterEach(() => {
    // Reset the mock to default value
    require("../src/config/email").emailConfig.emailProvider = "smtp";
  });
}); 