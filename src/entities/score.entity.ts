import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
} from "typeorm";
import { Match } from "./match.entity";

@Entity()
@Unique(["type", "match"])
export class Score {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  type: string;

  @Column()
  home: string;

  @Column()
  away: string;

  @ManyToOne(() => Match, (match) => match.scores)
  match: Match;
}
