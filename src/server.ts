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

export const intializeServer = async () => {
  const app = express();

  initializeDatabase();

  const cache = new NodeCache();
  container.registerInstance("Cache", cache);

  const workerService = container.resolve(WorkerService);

  // task will be run every minute
  cron.schedule("30 * * * *", async () => {
    try {
      await workerService.updateState();
    } catch (error) {
      logger.err(`Error while updating state: ${error}`);
    }
  });

  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api/state", stateRoutes());

  app.listen(config.server.port, () => {
    logger.info(`Server is running on http://localhost:${config.server.port}`);
  });
};
