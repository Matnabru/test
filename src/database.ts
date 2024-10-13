import { DataSource } from "typeorm";
import { config } from "./config";
import { container } from "tsyringe";
import { Match } from "./entities/match.entity";
import { Score } from "./entities/score.entity";

export const initializeDatabase = async () => {
  const dataSource = new DataSource({
    type: "postgres",
    host: config.database.host,
    port: config.database.port,
    username: config.database.username,
    password: config.database.password,
    database: config.database.name,
    entities: [Match, Score],
    synchronize: true,
  });

  const matchRepository = dataSource.getRepository(Match);
  const scoreRepository = dataSource.getRepository(Score);
  container.registerInstance("MatchRepository", matchRepository);
  container.registerInstance("ScoreRepository", scoreRepository);

  return await dataSource.initialize();
};
