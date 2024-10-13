import { Router } from "express";
import { container } from "tsyringe";
import { StateController } from "../controllers/state.controller";

export const stateRoutes = () => {
  const stateRouter = Router();
  const stateController = container.resolve(StateController);

  stateRouter.get("/", stateController.getState);

  return stateRouter;
};
