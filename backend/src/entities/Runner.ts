import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

/**
 * Represents a pipeline runner.
 */
@Entity("runners")
export class Runner {

    /**
     * The auto incremented primary key.
     */
    @PrimaryGeneratedColumn()
    id!: number;

    /**
     * The name of the runner, unique.
     */
    @Column({nullable: false})
    name!: string;

    /**
     * The hostname (excl. port).
     */
    @Column({nullable: false})
    hostname!: string; 
}