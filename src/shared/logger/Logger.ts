import { createLogger, format, transports } from "winston";
import LokiTransport from "winston-loki";

export const Logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new LokiTransport({
      host: process.env.LOKI_HOST || "http://localhost:3100",
      labels: { job: process.env.LOKI_JOB_NAME || "email-service" },
      json: true,
      interval: 5,
      timeout: 10000,
      batching: true,
    }),
    new transports.Console(),
  ],
});
