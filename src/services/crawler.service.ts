import axios from 'axios';
import { Pool } from 'pg';
import { injectable } from 'tsyringe';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';
import { Event } from '../types/Event';
@injectable()
export class CrawlerService {
    private db: Pool;

    constructor() {
        this.db = new Pool({
            user: config.database.username,
            host: config.database.host,
            database: config.database.name,
            password: config.database.password,
            port: config.database.port,
        });
    }

    public async updateData(): Promise<void> {
        try {
            const mappings = await this.fetchMappings();
            //console.log(mappings);
            const events = await this.fetchState(mappings);
            //console.log(events);

            const processedEventIds: string[] = [];

            for (const event of events) {
                await this.upsertMatch(event);
                await this.upsertScores(event, mappings);
                processedEventIds.push(event.id);
            }

            await this.removeUnprocessedMatches(processedEventIds);

            console.log('Data successfully updated');
        } catch (error) {
            console.error('Error updating data:', error);
        }
    }

    private async fetchMappings(): Promise<Record<string, string>> {
        const response = await axios.get(config.api.mappings); 
        return response.data.mappings.split(';').reduce((acc: Record<string, string>, item: string) => {
            const [id, value] = item.split(':');
            acc[id] = value;
            return acc;
        }, {});
    }

    private async fetchState(mappings: Record<string, string>): Promise<Event[]> {
        const response = await axios.get(config.api.state);

        if (!response.data || !response.data.odds) {
            throw new Error('Invalid response from state API');
        }

        const events = response.data.odds.split('\n').map((event: string) => {
            const eventFields = event.split(',');

            if (eventFields.length < 7) {
                console.error('Invalid event data:', event);
                return null;
            }

            const [eventId, sportId, competitionId, startTime, homeCompetitorId, awayCompetitorId, statusId, scores] = eventFields;

            return {
                id: eventId,
                status: mappings[statusId],
                startTime: new Date(parseInt(startTime)),
                sport: mappings[sportId],
                competition: mappings[competitionId],
                competitors: {
                    home: mappings[homeCompetitorId],
                    away: mappings[awayCompetitorId],
                },
                scores: scores ? scores.split('|').map((score: string) => {
                    const [period, result] = score.split('@');
                    const [homeScore, awayScore] = result.split(':');

                    return { period, homeScore, awayScore };
                }) : [],
            };
        }).filter((event: Event) => event !== null);

        return events;
    }
    private async upsertMatch(event: Event): Promise<void> {
        const query = `
  INSERT INTO match (id, status, "startTime", sport, competition, "homeCompetitor", "awayCompetitor")
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    "startTime" = EXCLUDED."startTime",
    sport = EXCLUDED.sport,
    competition = EXCLUDED.competition,
    "homeCompetitor" = EXCLUDED."homeCompetitor",
    "awayCompetitor" = EXCLUDED."awayCompetitor";
`;
        const values = [
            event.id,
            event.status,
            event.startTime,
            event.sport,
            event.competition,
            event.competitors.home,
            event.competitors.away,
        ];

        await this.db.query(query, values);
    }

    private async upsertScores(event: Event, mappings: Record<string, string>): Promise<void> {
        for (const score of event.scores) {

            const periodString = mappings[score.period];

            if (!periodString) {
                console.error(`No mapping found for period UUID: ${score.period}`);
                continue;
            }

            const query = `
                INSERT INTO score (id, type, home, away, "matchId")
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (type, "matchId") DO UPDATE SET
                  home = EXCLUDED.home,
                  away = EXCLUDED.away;
            `;
            const values = [
                uuidv4(),
                periodString,
                score.homeScore,
                score.awayScore,
                event.id,
            ];

            await this.db.query(query, values);
        }
    }

    private async removeUnprocessedMatches(processedEventIds: string[]): Promise<void> {
        const query = `
            UPDATE match
            SET status = 'REMOVED'
            WHERE id NOT IN (${processedEventIds.map((_, i) => `$${i + 1}`).join(', ')})
        `;
        if (processedEventIds.length > 0) {
            await this.db.query(query, processedEventIds);
        }
    }



}
