import { EmailService } from "../services/EmailService";
import { EmailPayload } from "../../domain/entities/EmailPayload";
import { Logger } from "../../shared/logger/Logger";

export class SendEmailUseCase {
  constructor(private readonly emailService: EmailService) {}

  async execute(payload: EmailPayload): Promise<void> {
    if (!payload.bodyHtml && !payload.bodyText) {
      Logger.error(
        "Either bodyHtml or bodyText must be provided. Payload: ",
        payload
      );
      throw new Error("Either bodyHtml or bodyText must be provided.");
    }

    await this.emailService.sendEmail(payload);
  }
}
