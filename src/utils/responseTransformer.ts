import { Match } from "../entities/match.entity";
import { Score } from "../entities/score.entity";

export function transformMatchesToExpectedFormat(
  matches: Match[]
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const match of matches) {
    const scoresObject: Record<string, Score> = {};
    for (const score of match.scores) {
      scoresObject[score.type] = score;
    }

    result[match.id] = {
      id: match.id,
      status: match.status,
      startTime: match.startTime,
      sport: match.sport,
      competition: match.competition,
      scores: scoresObject,
      competitors: {
        HOME: {
          type: "HOME",
          name: match.homeCompetitor,
        },
        AWAY: {
          type: "AWAY",
          name: match.awayCompetitor,
        },
      },
    };
  }

  return result;
}
