import { Repository } from "typeorm";
import { logger } from "../logger";

/**
 * Represents a partial entity that has a name and ID.
 * Pipelines, users and runners all inhibit these properties.
 */
export interface NamedEntity {
    id: number
    name: string
}

/**
 * The status after reading multiple entities.
 */
export type ReadsStatus<T> = T[] | "error";

/**
 * A generic success/failure status.
 */
export type GenericStatus = "success" | "error";

/**
 * A generic service that can serve CRUD operations.
 * It is a little higher level than a repository, hence service.
 */
export abstract class BaseService<T extends NamedEntity> {

    /**
     * Gets the repository.
     */
    abstract getRepository(): Repository<T>
    
    /**
     * Gets any required relations when querying.
     */
    abstract getRelations(): string[]
    
    /**
     * Makes a blank entity.
     */
    abstract makeEmpty(): T

    /**
     * Gets all entities.
     * @returns A promise of all entities, or an error.
     */
    async getAll(): Promise<ReadsStatus<T>> {
        try {
            const entities = await this.getRepository().find({ 
                relations: this.getRelations(),
                // @ts-ignore Currently typechecking with NamedEntity does not work.
                order: {
                    name: "ASC"
                },
            });
            return entities == null ? [] : entities;
        } catch (error) {
            logger.error(error);
            return "error";
        }
    }

    /**
     * Gets an entity by name, and if it does not exist, it will make an empty one.
     * @param name The name.
     * @returns The entity.
     */
    async getOne(name: string): Promise<T> {
        try {
            const find = await this.getRepository().findOne({
                relations: this.getRelations(),
                // @ts-ignore Currently typechecking with NamedEntity does not work.
                where: {
                    name: name
                },
            });
            // If find is empty, then we can just create it instead.
            return find == null ? this.makeEmpty() : find;
        } catch (error) {
            logger.error(error);
            return this.makeEmpty();
        }
    }

    /**
     * Whether or not a name exists.
     * @param name The name to query for.
     * @returns True if it exists, false otherwise.
     */
    async doesNameExist(name: string): Promise<boolean> {
        try {
            // @ts-ignore Currently typechecking with NamedEntity does not work.
            const find = await this.getRepository().findOneBy({ name: name });
            return find != null;
        } catch (error) {
            return false;
        }
    }

    /**
     * Creates a new entity.
     * @param entity The entity.
     * @returns A promise of the creation outcome.
     */
    async create(entity: T): Promise<GenericStatus> {
        try {
            await this.getRepository().save(entity);
            return "success";
        } catch (error) {
            logger.error(error);
            return "error";
        }
    }

    /**
     * Updates an existing entity.
     * @param entity The entity (can be partial).
     * @returns A promise of the update outcome.
     */
    async update(entity: T): Promise<GenericStatus> {
        try {
            await this.getRepository().save(entity);
            return "success";
        } catch (error) {
            logger.error(error);
            return "error";
        }
    }

    /**
     * Deletes an existing entity.
     * @param name The name of the entry.
     * @returns A promise of the deletion outcome.
     */
    async delete(name: string): Promise<GenericStatus> {
        try {
            // @ts-ignore Currently typechecking with NamedEntity does not work.
            await this.getRepository().delete({ name: name });
            return "success";
        } catch (error) {
            logger.error(error);
            return "error";
        }
    }

}