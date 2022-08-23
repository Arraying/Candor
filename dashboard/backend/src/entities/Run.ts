import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Represents a pipeline run.
 */
@Entity("runs")
export class Run {

    /**
     * The auto incremented primary key.
     */
    @PrimaryGeneratedColumn()
    id!: number;

    /**
     * The ID of the pipeline.
     * Joining is not required here.
     */
    @Column({nullable: false})
    pipeline!: number

    /**
     * The ID of the run, unique.
     */
    @Column({nullable: false})
    run_id!: string;

    /**
     * The ID of the runner that ran this.
     * This is not joined up since the entity is practically irrelevant so it is not worth the setup.
     */
    @Column({nullable: true})
    runner!: number

    /**
     * The start time of the run.
     * Mapped to a string since TypeORM is weird.
     */
    @Column({nullable: false, type: "bigint"})
    start!: string

    /**
     * The end time of the run.
     * Mapped to a string as well. 
     */
    @Column({nullable: false, type: "bigint"})
    finish!: string

    /**
     * The runner's response.
     */
    @Column({type: "json"})
    outcome!: any;
}