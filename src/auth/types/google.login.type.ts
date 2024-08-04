import { User } from "../../user/entities/user.entity";

export type LoginResponseType = { 
    message: string,
    access_token?: string,
    user?: User
};