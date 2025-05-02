import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";
import { SMTPProvider } from "../src/infra/providers/SMTPProvider";
import { SendGridProvider } from "../src/infra/providers/SendGridProvider";
import { EmailPayload } from "../src/domain/entities/EmailPayload";
import { smtpConfig } from "../src/config/smtp";
import { sendgridConfig } from "../src/config/sendgrid";

jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: "test-message-id" }),
  }),
}));

jest.mock("@sendgrid/mail", () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([{ statusCode: 202 }]),
}));

describe("Email Providers", () => {
  let smtpProvider: SMTPProvider;
  let sendGridProvider: SendGridProvider;
  let mockPayload: EmailPayload;

  beforeEach(() => {
    jest.clearAllMocks();
    smtpProvider = new SMTPProvider();
    sendGridProvider = new SendGridProvider();

    mockPayload = {
      to: "recipient@example.com",
      subject: "Test Subject",
      bodyHtml: "<p>Test HTML Content</p>",
      bodyText: "Test Text Content",
      attachments: [
        {
          filename: "test.txt",
          path: "/path/to/test.txt",
        },
      ],
    };
  });

  describe("SMTPProvider", () => {
    it("should create transporter with correct configuration", () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: smtpConfig.host,
        port: smtpConfig.port,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.password,
        },
      });
    });

    it("should send email with correct parameters", async () => {
      await smtpProvider.sendEmail(mockPayload);

      const sendMailMock = (nodemailer.createTransport as jest.Mock)().sendMail;
      expect(sendMailMock).toHaveBeenCalledWith({
        from: smtpConfig.from,
        to: mockPayload.to,
        subject: mockPayload.subject,
        html: mockPayload.bodyHtml,
        text: mockPayload.bodyText,
        attachments: mockPayload.attachments,
      });
    });

    it("should handle email without attachments", async () => {
      const payloadWithoutAttachments = { ...mockPayload };
      delete payloadWithoutAttachments.attachments;

      await smtpProvider.sendEmail(payloadWithoutAttachments);

      const sendMailMock = (nodemailer.createTransport as jest.Mock)().sendMail;
      expect(sendMailMock).toHaveBeenCalledWith({
        from: smtpConfig.from,
        to: mockPayload.to,
        subject: mockPayload.subject,
        html: mockPayload.bodyHtml,
        text: mockPayload.bodyText,
        attachments: undefined,
      });
    });
  });

  describe("SendGridProvider", () => {
    it("should set API key on initialization", () => {
      expect(sgMail.setApiKey).toHaveBeenCalledWith(sendgridConfig.apiKey);
    });

    it("should send email with correct parameters", async () => {
      await sendGridProvider.sendEmail(mockPayload);

      expect(sgMail.send).toHaveBeenCalledWith({
        to: mockPayload.to,
        from: sendgridConfig.fromEmail,
        subject: mockPayload.subject,
        text: mockPayload.bodyText,
        html: mockPayload.bodyHtml,
        attachments: mockPayload.attachments,
      });
    });

    it("should handle email without attachments", async () => {
      const payloadWithoutAttachments = { ...mockPayload };
      delete payloadWithoutAttachments.attachments;

      await sendGridProvider.sendEmail(payloadWithoutAttachments);

      expect(sgMail.send).toHaveBeenCalledWith({
        to: mockPayload.to,
        from: sendgridConfig.fromEmail,
        subject: mockPayload.subject,
        text: mockPayload.bodyText,
        html: mockPayload.bodyHtml,
        attachments: undefined,
      });
    });

    it("should handle email without HTML content", async () => {
      const payloadWithoutHtml = { ...mockPayload };
      delete payloadWithoutHtml.bodyHtml;

      await sendGridProvider.sendEmail(payloadWithoutHtml);

      expect(sgMail.send).toHaveBeenCalledWith({
        to: mockPayload.to,
        from: sendgridConfig.fromEmail,
        subject: mockPayload.subject,
        text: mockPayload.bodyText,
        html: undefined,
        attachments: mockPayload.attachments,
      });
    });

    it("should handle email without text content", async () => {
      const payloadWithoutText = { ...mockPayload };
      delete payloadWithoutText.bodyText;

      await sendGridProvider.sendEmail(payloadWithoutText);

      expect(sgMail.send).toHaveBeenCalledWith({
        to: mockPayload.to,
        from: sendgridConfig.fromEmail,
        subject: mockPayload.subject,
        text: undefined,
        html: mockPayload.bodyHtml,
        attachments: mockPayload.attachments,
      });
    });
  });
}); 