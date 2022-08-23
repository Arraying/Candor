import { BaseService, NamedEntity } from "../services/BaseService";
import { promptList, promptName, unanswered } from "./actions-utils";
import prompts from "prompts";

/**
 * Represents an updater that can be used to update entities.
 */
type Updater<T> = {
    /**
     * The promps that will give the properties needed to update.
     */
    prompts: prompts.PromptObject[],
    /**
     * The actual updater.
     * Takes in an entity and the response.
     * The name does not need to be set.
     */
    update: (entity: T, response: Response) => void,
}

/**
 * A generic response that isn't very strict but better than "any".
 */
export type Response = {
    [key: string]: string | boolean | number;
}

/**
 * Defines generic CRUD actions using the CLI.
 */
export abstract class BaseAction<T extends NamedEntity> {

    protected _service: BaseService<T>;
    private _name: string;
    private _nameLimit: number;

    /**
     * Creates a new action handler.
     * @param service The service serving the underlying entity.
     * @param name The name of the entity - singular.
     * @param nameLimit The number of characters an entity of this type can have in its name.
     */
    constructor(service: BaseService<T>, name: string, nameLimit: number) {
        this._service = service;
        this._name = name;
        this._nameLimit = nameLimit;
    }

    /**
     * Pretty prints an entity to console.
     * @param entity The entity.
     */
    protected abstract prettyPrint(entity: T): void;

    /**
     * Gets the prompts needed to create the entity.
     */
    protected abstract createPrompts(): prompts.PromptObject[];

    /**
     * Validates the response from the creation.
     * Returns an error string, or null if everything is fine.
     * @param response The response.
     */
    protected abstract createValidateInput(response: Response): Promise<string | null>;

    /**
     * Constructs an entity from a response.
     * The name does not need to be set here.
     * @param response The newly constructed entity.
     */
    protected abstract createBuildEntity(response: Response): Promise<T>;

    /**
     * The info message when an entity is created, can be blank.
     */
    protected abstract createInfoMessage(): string;

    /**
     * Lists all entities.
     */
    async actionList(): Promise<void> {
        const entities = await this._service.getAll();
        if (entities === "error") {
            console.log(`An error occurred listing all ${this._name}s.`);
            return;
        }
        if (entities.length === 0) {
            console.log(`There are no ${this._name}s.`);
            return;
        }
        for (const entity of entities) {
            this.prettyPrint(entity);
        }
    }

    /**
     * Creates a new entity.
     */
    async actionCreate(): Promise<void> {
        const questions = [
            promptName(this._nameLimit, (name: string): Promise<boolean> => this._service.doesNameExist(name)), 
            ...this.createPrompts(),
        ];
        const response = await prompts(questions);
        // Check if we need to return early.
        if (unanswered(response)) {
            return;
        }
        // Perform validation.
        const validationResult = await this.createValidateInput(response);
        if (validationResult != null) {
            console.log(validationResult);
            return;
        }
        // Create the entity.
        const entity = await this.createBuildEntity(response);
        entity.name = response.name;
        const status = await this._service.create(entity);
        console.log(status === "success" 
            ? `The ${this._name} has been created. ${this.createInfoMessage()}`
            : `An error occurred creating the ${this._name}.`
        );
    }
    
    /**
     * Deletes an existing entity.
     */
    async actionDelete(): Promise<void> {
        const entities = await this._service.getAll();
        if (entities === "error") {
            console.log(`An error occurred getting all ${this._name}s.`);
            return;
        }
        if (entities.length === 0) {
            console.log(`There are no ${this._name}s.`);
            return;
        }
        const names = entities.map((entity: T): string => entity.name);
        const response = await prompts(promptList(`Which ${this._name} should be deleted?`, names));
        // Check for early return.
        if (unanswered(response)) {
            return;
        }
        // Delete by name.
        const status = await this._service.delete(response.name);
        console.log(status === "success" 
            ? `The ${this._name} has been deleted.`
            : `An error occurred deleting the ${this._name}.`
        );
    }

    /**
     * Updates an entity with the help of custom prompts and handlers.
     * @param updater The updater.
     */
    protected async actionUpdate(updater: Updater<T>): Promise<void> {
        const entities = await this._service.getAll();
        if (entities === "error") {
            console.log(`An error occurred getting all ${this._name}s.`);
            return;
        }
        if (entities.length === 0) {
            console.log(`There are no ${this._name}s.`);
            return;
        }
        const names = entities.map((entity: T): string => entity.name);
        let response = await prompts(promptList(`Which ${this._name} should be updated?`, names));
        // Check for early return.
        if (unanswered(response)) {
            return;
        }
        // Get the entity by name.
        const entity = await this._service.getOne(response.name);
        // Prompt the update questions, if they exist.
        if (updater.prompts.length !== 0) {
            response = await prompts(updater.prompts);
            // Again, check for validity.
            if (unanswered(response)) {
                return;
            }
        }
        // Actually perform the update.
        updater.update(entity, response);
        // Save.
        const status = await this._service.update(entity);
        console.log(status === "success" 
            ? `The ${this._name} has been updated.`
            : `An error occurred updating the ${this._name}.`
        );
    }

}