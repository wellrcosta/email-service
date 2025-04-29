export interface Attachment {
  filename: string;
  path: string;
}

export interface EmailPayload {
  to: string;
  subject: string;
  bodyHtml?: string;
  bodyText?: string;
  attachments?: Attachment[];
}
