import { emailConfig } from "../../config/email";
import { EmailService } from "../../application/services/EmailService";
import { SMTPProvider } from "../providers/SMTPProvider";
import { SendGridProvider } from "../providers/SendGridProvider";

const provider = emailConfig.emailProvider;

export function getEmailProvider(): EmailService {
  switch (provider) {
    case "smtp":
      return new SMTPProvider();
    case "sendgrid":
      return new SendGridProvider();
    default:
      throw new Error(`Email provider ${provider} is not supported`);
  }
}
