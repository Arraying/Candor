import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

/**
 * Represents a user.
 */
@Entity("users")
export class User {

    /**
     * The auto incremented primary key.
     */
    @PrimaryGeneratedColumn()
    id!: number;

    /**
     * The name of the user, unique.
     */
    @Column({nullable: false, unique: true})
    name!: string;

    /**
     * The token (encrypted with bcrypt).
     */
    @Column({nullable: false})
    token!: string;
}