import { EmailService } from "../services/EmailService";
import { EmailPayload } from "../../domain/entities/EmailPayload";

export class SendEmailUseCase {
  constructor(private readonly emailService: EmailService) {}

  async execute(payload: EmailPayload): Promise<void> {
    if (!payload.bodyHtml && !payload.bodyText) {
      throw new Error("Either bodyHtml or bodyText must be provided.");
    }

    await this.emailService.sendEmail(payload);
  }
}
