import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { BaseService } from "./BaseService";

export class UserService extends BaseService<User> {

    getRepository(): Repository<User> {
        return AppDataSource.getRepository(User);
    }

    getRelations(): string[] {
        return ["pipelines"];
    }

    makeEmpty(): User {
        return new User();
    }
    
}