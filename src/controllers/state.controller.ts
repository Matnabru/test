import { Request, Response } from "express";
import { injectable, container } from "tsyringe";
import { StateService } from "../services/state.service";
import { transformMatchesToExpectedFormat } from "../utils/responseTransformer";
import logger from "jet-logger";

@injectable()
export class StateController {
  private stateService: StateService;

  constructor() {
    this.stateService = container.resolve(StateService);
  }

  getState = async (_req: Request, res: Response) => {
    try {
      const state = await this.stateService.getState();
      if (!state || state.length === 0) {
        res.status(404).send({ message: "No data found." });
      }

      const formattedState = transformMatchesToExpectedFormat(state);
      res.status(200).send(JSON.stringify(formattedState));
    } catch (error) {
      logger.err(`Error fetching state: ${error}`);
      res.status(500).send({ message: "Internal server error." });
    }
  };
}
