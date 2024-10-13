import { inject, injectable } from "tsyringe";
import { Repository } from "typeorm";
import { Match } from "../entities/match.entity";

@injectable()
export class StateService {
  private matchRepository: Repository<Match>;

  constructor(@inject("MatchRepository") matchRepository: Repository<Match>) {
    this.matchRepository = matchRepository;
  }

  async getState() {
    return "siema";
  }
}
