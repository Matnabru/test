import { Request, Response } from "express";
import { injectable, container } from "tsyringe";
import { StateService } from "../services/state.service";

@injectable()
export class StateController {
  private stateService: StateService;

  constructor() {
    this.stateService = container.resolve(StateService);
  }

  getState = async (_req: Request, res: Response) => {
    const state = await this.stateService.getState();
    res.send(state);
  };
}
