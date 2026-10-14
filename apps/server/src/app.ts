import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { API_PREFIX } from "./config/constants";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/error-handler.middleware";
import { notFoundHandler } from "./middlewares/notfound.middleware";
import { requestLogger } from "./middlewares/request-logger.middleware";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "100kb" })); 
  app.use(cookieParser());
  app.use(requestLogger);

  app.get(`${API_PREFIX}/health`, (_req, res) => {
    res.status(200).json({ success: true, message: "OK", data: { uptime: process.uptime() } });
  });

  // app.use(`${API_PREFIX}/auth`, authRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
