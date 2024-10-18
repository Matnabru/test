import { inject, injectable } from "tsyringe";
import { In, Repository } from "typeorm";
import { Match } from "../entities/match.entity";

@injectable()
export class StateService {
  private matchRepository: Repository<Match>;

  constructor(@inject("MatchRepository") matchRepository: Repository<Match>) {
    this.matchRepository = matchRepository;
  }

  async getState(): Promise<Match[]> {
    return await this.matchRepository.find({
      where: {
        status: In(['LIVE', 'PRE']),
      },
      relations: ["scores"],
    });
  }
}
