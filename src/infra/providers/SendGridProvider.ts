import { EmailService } from "../../application/services/EmailService";
import sgMail from "@sendgrid/mail";
import { sendgridConfig } from "../../config/sendgrid";
import { EmailPayload } from "../../domain/entities/EmailPayload";

export class SendGridProvider implements EmailService {
  private sgMail: any;

  constructor() {
    this.sgMail = sgMail;
    this.sgMail.setApiKey(sendgridConfig.apiKey);
  }

  async sendEmail(payload: EmailPayload): Promise<void> {
    const msg = {
      to: payload.to,
      from: sendgridConfig.fromEmail,
      subject: payload.subject,
      text: payload.bodyText,
      html: payload.bodyHtml,
      attachments: payload.attachments,
    };

    await this.sgMail.send(msg);
  }
}
