import { AfterLoad, Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";

/**
 * Represents a pipeline.
 */
@Entity("pipelines")
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
    @Column({nullable: false})
    public!: boolean;

    /**
     * The users assigned to this pipeline.
     */
    @ManyToMany(() => User)
    @JoinTable({
        name: "assignments", 
        joinColumn: {name: "pipeline", referencedColumnName: "id"}, 
        inverseJoinColumn: {name: "user", referencedColumnName: "id"},
    })
    assignees!: User[];

    /**
     * The random token of the pipeline.
     */
    @Column({nullable: false})
    token!: string

    /**
     * Set the list of pipelines to empty if not found.
     */
    @AfterLoad()
    async nullChecks() {
      if (!this.assignees) {
        this.assignees = []
      }
    }
}