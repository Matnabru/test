import { inject, injectable } from "tsyringe";
import { EntityManager, Repository } from "typeorm";
import logger from "jet-logger";
import axios from "axios";
import { config } from "../config";
import { CurrentDataResponse } from "../types/current-data";
import { MappingsResponse } from "../types/mappings";
import { Score } from "../entities/score.entity";
import { Match } from "../entities/match.entity";
import NodeCache from "node-cache";

@injectable()
export class WorkerService {
  private matchRepository: Repository<Match>;
  private cache: NodeCache;
  private CACHE_KEY = "ACTIVE_MATCHES";

  constructor(
    @inject("MatchRepository") matchRepository: Repository<Match>,
    @inject("Cache") cache: NodeCache
  ) {
    this.matchRepository = matchRepository;
    this.cache = cache;
  }

  async updateState() {
    try {
      const cachedMatches =
        this.cache.get<Match[]>(this.CACHE_KEY) ||
        (await this.getActiveMatches());

      const { mappings } = await this.fetchMappings();
      const { odds } = await this.fetchCurrentData();

      const { matches: activeMatches, scores } = await this.processData(
        mappings,
        odds
      );

      const activeIds = activeMatches.map((match) => match.id);

      const removedMatches = cachedMatches
        .filter((cachedMatch) => !activeIds.includes(cachedMatch.id))
        .map((match) => ({
          ...match,
          status: "REMOVED",
        }));

      const matchesToUpsert = [...activeMatches, ...removedMatches];

      this.upsertMatchesWithScores({ matches: matchesToUpsert, scores });

      this.cache.set(this.CACHE_KEY, activeMatches);
    } catch (error) {
      logger.err(`Error updating state: ${error.message}`);
    }
  }

  private async processData(mappingsString, currentDataString) {
    const mappingsMap = new Map<string, string>();

    mappingsString.split(";").forEach((pair) => {
      const [id, name] = pair.split(":");
      mappingsMap.set(id, name);
    });

    const rows = currentDataString.split("\n");
    const matches: Match[] = [];
    const scores: Score[] = [];

    for (const row of rows) {
      const fields = row.split(",");

      const mappedData = fields.map((field: string) => {
        const name = mappingsMap.get(field);
        return name ? name : field;
      });

      const match = new Match();
      match.id = mappedData[0];
      match.sport = mappedData[1];
      match.competition = mappedData[2];
      match.startTime = new Date(Number(mappedData[3]));
      match.homeCompetitor = mappedData[4];
      match.awayCompetitor = mappedData[5];
      match.status = mappedData[6];

      matches.push(match);

      const scoresString = mappedData[mappedData.length - 1];
      const scoresArray = scoresString.split("|");

      for (const scoreEntry of scoresArray) {
        const [type, score] = scoreEntry.split("@");
        const [home, away] = score.split(":");

        const mappedType = mappingsMap.get(type);
        if (mappedType === undefined) {
          continue;
        }

        const scoreEntity = new Score();
        scoreEntity.type = mappedType;
        scoreEntity.home = home;
        scoreEntity.away = away;
        scoreEntity.match = match;

        scores.push(scoreEntity);
      }
    }

    return { matches, scores };
  }

  private async fetchMappings(): Promise<MappingsResponse> {
    try {
      const response = await axios.get<MappingsResponse>(config.api.mappings);
      return response.data;
    } catch (error) {
      logger.err(`Error fetching mappings: ${error.message}`);
      throw error;
    }
  }

  private async fetchCurrentData(): Promise<CurrentDataResponse> {
    try {
      const response = await axios.get<CurrentDataResponse>(config.api.state);
      return response.data;
    } catch (error) {
      logger.err(`Error fetching current data: ${error.message}`);
      throw error;
    }
  }

  private async getActiveMatches(): Promise<Match[]> {
    const activeMatches = await this.matchRepository.find({
      where: { status: "LIVE" },
      relations: ["scores"],
    });

    return activeMatches;
  }

  private async upsertMatchesWithScores({
    matches,
    scores,
  }: {
    matches: Match[];
    scores: Score[];
  }): Promise<void> {
    await this.matchRepository.manager.transaction(
      async (transactionalEntityManager: EntityManager) => {
        await transactionalEntityManager.upsert(Match, matches, ["id"]);
        await transactionalEntityManager.upsert(Score, scores, [
          "type",
          "match",
        ]);
      }
    );
  }
}
