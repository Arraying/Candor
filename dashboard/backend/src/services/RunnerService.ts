import { AppDataSource } from "../data-source";
import { BaseService } from "./BaseService";
import { Repository } from "typeorm";
import { Runner } from "../entities/Runner";

export class RunnerService extends BaseService<Runner> {

    getRepository(): Repository<Runner> {
        return AppDataSource.getRepository(Runner);
    }

    getRelations(): string[] {
        return [];
    }

    makeEmpty(): Runner {
        return new Runner();
    }
    
}