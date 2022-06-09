import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, AfterLoad } from "typeorm";
import { Pipeline } from "./Pipeline";

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
    @Column({name: "token_hash", nullable: false})
    token!: string;

    /**
     * The pipelines assigned to this user.
     */
    @ManyToMany(() => Pipeline)
    @JoinTable({
      name: "assignments", 
      joinColumn: {name: "user", referencedColumnName: "id"}, 
      inverseJoinColumn: {name: "pipeline", referencedColumnName: "id"}
    })
    pipelines!: Pipeline[];

    /**
     * Set the list of pipelines to empty if not found.
     */
    @AfterLoad()
    async nullChecks() {
      if (!this.pipelines) {
        this.pipelines = []
      }
    }
}