import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Runner } from "../entities/Runner";
import { BaseService } from "./BaseService";

export class RunnerService extends BaseService<Runner> {

    getRepository(): Repository<Runner> {
        return AppDataSource.getRepository(Runner);
    }

    makeEmpty(): Runner {
        return new Runner();
    }
    
}