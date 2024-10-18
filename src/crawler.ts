import "reflect-metadata";
import express from "express";
import helmet from "helmet";
import cron from "node-cron";
import logger from "jet-logger";
import { config } from "./config";
import { stateRoutes } from "./routes/state.routes";
import { initializeDatabase } from "./database";
import { WorkerService } from "./services/worker.service";
import { container } from "tsyringe";
import NodeCache from "node-cache";
import { CrawlerService } from "./services/crawler.service";

export const intializeServer = async () => {
  const app = express();

  initializeDatabase();

  const cache = new NodeCache();
  container.registerInstance("Cache", cache);

  const crawlerService = container.resolve(CrawlerService);

  setInterval(async () => {
    await crawlerService.updateData();
  }, 5000); // 5000ms = 5 seconds

  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api/state", stateRoutes());

  app.listen(config.server.crawlerPort, () => {
    logger.info(`Server is running on http://localhost:${config.server.crawlerPort}`);
  });
};

intializeServer();