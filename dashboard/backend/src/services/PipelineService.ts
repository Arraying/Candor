import { AppDataSource } from "../data-source";
import { BaseService } from "./BaseService";
import { Pipeline } from "../entities/Pipeline";
import { Repository } from "typeorm";

export class PipelineService extends BaseService<Pipeline> {

    getRepository(): Repository<Pipeline> {
        return AppDataSource.getRepository(Pipeline);
    }

    getRelations(): string[] {
        return ["assignees"];
    }

    makeEmpty(): Pipeline {
        return new Pipeline();
    }
    
}