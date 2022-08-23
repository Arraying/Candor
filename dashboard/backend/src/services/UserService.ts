import { AppDataSource } from "../data-source";
import { BaseService } from "./BaseService";
import { Repository } from "typeorm";
import { User } from "../entities/User";

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