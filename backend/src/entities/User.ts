import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

/**
 * Represents a user.
 */
@Entity()
export class User {

    /**
     * The auto incremented primary key.
     */
    @PrimaryGeneratedColumn()
    id!: number;

    /**
     * The name of the user, unique.
     */
    @Column()
    name!: string;

    /**
     * The token (encrypted with bcrypt).
     */
    @Column()
    token!: string;
}