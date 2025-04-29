import { EmailPayload } from "../../domain/entities/EmailPayload";

export interface EmailService {
  sendEmail(payload: EmailPayload): Promise<void>;
}
