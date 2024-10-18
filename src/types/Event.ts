import { Competitor } from "./Competitor";
import { Score } from "./Score";

export type Event = {
    id: string;
    status: string;
    startTime: Date;
    sport: string;
    competition: string;
    competitors: Competitor;
    scores: Score[];
  };
  