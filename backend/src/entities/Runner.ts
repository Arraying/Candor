import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

/**
 * Represents a pipeline runner.
 */
@Entity()
export class Runner {

    /**
     * The auto incremented primary key.
     */
    @PrimaryGeneratedColumn()
    id!: number;

    /**
     * The name of the runner, unique.
     */
    @Column()
    name!: string;

    /**
     * The hostname (excl. port).
     */
    @Column()
    hostname!: string;

    /**
     * The port.
     */
    @Column()
    port!: number;   
}