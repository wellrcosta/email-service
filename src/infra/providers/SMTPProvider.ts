import nodemailer from "nodemailer";
import { EmailService } from "../../application/services/EmailService";
import { EmailPayload } from "../../domain/entities/EmailPayload";
import { smtpConfig } from "../../config/smtp";

export class SMTPProvider implements EmailService {
  private transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.password,
    },
  });

  async sendEmail(payload: EmailPayload): Promise<void> {
    await this.transporter.sendMail({
      from: smtpConfig.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.bodyHtml,
      text: payload.bodyText,
      attachments: payload.attachments,
    });
  }
}
