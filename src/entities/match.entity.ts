import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Score } from "./score.entity";

@Entity()
export class Match {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  status: string;

  @Column()
  startTime: Date;

  @Column()
  sport: string;

  @Column()
  competition: string;

  @Column()
  homeCompetitor: string;

  @Column()
  awayCompetitor: string;

  @OneToMany(() => Score, (score) => score.match, { cascade: true })
  scores: Score[];
}
