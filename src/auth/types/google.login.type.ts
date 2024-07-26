import { User } from "../../user/entities/user.entity";

export type GoogleLoginType = { 
    message: string,
    access_token?: string,
    user?: User
};