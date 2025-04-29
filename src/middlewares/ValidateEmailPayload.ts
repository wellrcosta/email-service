import { EmailPayload } from "../domain/entities/EmailPayload";

export class ValidateEmailPayload {
  static validate(payload: EmailPayload): void {
    if (!payload.to) {
      throw new Error("Missing field: to");
    }

    if (!payload.subject) {
      throw new Error("Missing field: subject");
    }

    if (!payload.bodyHtml && !payload.bodyText) {
      throw new Error("Either bodyHtml or bodyText must be provided");
    }

    if (payload.attachments && !Array.isArray(payload.attachments)) {
      throw new Error("Attachments must be an array");
    }
  }
}
