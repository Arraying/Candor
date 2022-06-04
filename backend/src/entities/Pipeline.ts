import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

/**
 * Represents a pipeline.
 */
@Entity()
export class Pipeline {

    /**
     * The auto incremented primary key.
     */
    @PrimaryGeneratedColumn()
    id!: number;

    /**
     * The name of the pipeline, unique.
     */
    @Column({nullable: false, unique: true})
    name!: string;

    /**
     * The plan (JSON).
     */
    @Column({type: "json"})
    plan!: Object;

    /**
     * If the pipeline is public.
     */
    @Column({nullable: false, default: false})
    public!: boolean;   
}