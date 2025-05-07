import { EmailPayload } from "../domain/entities/EmailPayload";
import { Logger } from "../shared/logger/Logger";

export class ValidateEmailPayload {
  static validate(payload: EmailPayload): void {
    if (!payload.to) {
      Logger.error("Missing field: to");
      throw new Error("Missing field: to");
    }

    if (!payload.subject) {
      Logger.error("Missing field: subject");
      throw new Error("Missing field: subject");
    }

    if (!payload.bodyHtml && !payload.bodyText) {
      Logger.error("Either bodyHtml or bodyText must be provided");
      throw new Error("Either bodyHtml or bodyText must be provided");
    }

    if (payload.attachments && !Array.isArray(payload.attachments)) {
      Logger.error("Attachments must be an array");
      throw new Error("Attachments must be an array");
    }
  }
}
