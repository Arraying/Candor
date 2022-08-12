import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Pipeline } from "../entities/Pipeline";
import { BaseService } from "./BaseService";

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