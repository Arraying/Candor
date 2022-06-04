import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

/**
 * Represents a user assignment to a pipeline.
 */
@Entity()
export class Assignments {

    /**
     * The auto incremented primary key.
     */
    @PrimaryGeneratedColumn()
    id!: number;

    /**
     * The ID of the user.
     */
    @Column()
    user!: number;

    /**
     * The ID of the pipeline.
     */
    @Column()
    pipeline!: number;
}