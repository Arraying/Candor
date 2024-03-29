import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Represents a user assignment to a pipeline.
 */
@Entity("assignments")
export class Assignment {

    /**
     * The auto incremented primary key.
     */
    @PrimaryGeneratedColumn()
    id!: number;

    /**
     * The ID of the user.
     */
    @Column({nullable: false})
    user!: number;

    /**
     * The ID of the pipeline.
     */
    @Column({nullable: false})
    pipeline!: number;
}