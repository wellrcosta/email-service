import express from "express";
import { env } from "../config/env";
import { healthRouter } from "./routes/health";
import { Logger } from "../shared/logger/Logger";

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Healthcheck route
app.use("/", healthRouter);

export const startServer = () => {
  app.listen(env.port, () => {
    Logger.info(`HTTP server listening on port ${env.port}`);
  });
};
