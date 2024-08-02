import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';
import { LoginDto } from './dto/login.dto';
import { UserDto } from '../user/dto/user.dto';
import { User } from '../user/entities/user.entity';
import { LoginResponseType } from './types/google.login.type';
import { CreateUserDto } from '../user/dto/create-user.dto';

@Injectable()
export class AuthService {
    constructor(
      private usersService: UserService,
      private jwtService: JwtService
    ) {}
  
    async validateUser(email: string, pass: string): Promise<any> {
      //console.log('[auth.service] validateUser');
      const user = await this.usersService.findOneByEmail(email);
      
      if (user && user.password === pass) {
        const { password, ...result } = user;
        return result;
      }
      return null;
    }
  
    /**
     * Generates JWT Token
     * 
     * @param payload 
     * @returns 
     */
    generateJwt(payload: {email: string}) {
      return this.jwtService.sign(payload);
    }

    async login(loginDto: LoginDto) {
        //console.log('[auth.service] login');
        const { email, password } = loginDto;

        const validated = await this.validateUser(email, password);

        if (!validated) {
          throw new UnauthorizedException();
        }

      //const payload = { username: user.username, sub: user.userId };
      return {
        access_token: this.generateJwt({email }),
      };
    }

    async register(createUserDto: CreateUserDto): Promise<object> {
      
      const { name } = createUserDto;

      const names = name.split(" ");

      const userDTO: UserDto = {
        email: createUserDto.email,
        password: createUserDto.password,
        firstName: names[0],
        lastName: names[1]? names[1] : '',
      }

      // FIND OR CREATE USER
      const fetch = await this.usersService.findOrCreate(userDTO);

      // IF FOUND, UPDATE

      return {
        message: 'User information from google',
        access_token: this.generateJwt({email: fetch[0].email }),
      };
    }

    async googleLogin(req): Promise<LoginResponseType> {
      if (!req.user) {
        return { message: 'No user from google' };
      }

      const userDTO: UserDto = {
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        picture: req.user.picture
      }

      // FIND OR CREATE USER
      const fetch = await this.usersService.findOrCreate(userDTO);

      // IF FOUND, UPDATE

      return {
        message: 'User information from google',
        access_token: this.generateJwt({email: fetch[0].email }),
        user: req.user,
      };
    }
    // {"message":"User information from google","user":
    // {"email":"hackteech@gmail.com","firstName":"Hack","lastName":"Teech",
    //  "picture":"https://lh3.googleusercontent.com/a/ACg8ocLNIZOG0BPYLVU9hnkHbWidWX0yjt4A6WjT-EsyLczXLFiTUQ=s96-c",
    // "accessToken":"ya29.a0AXooCgvIKGjbwXTf8TFkVoi2N_f3V7EMxD43BF-kgIdBW8g2ebWCwItXODvSQIPUv9eC6Jgg4NPvvgxMdZb9LV6VAUlRmeFhI2tTzW76OqupHAyLiLSNQ6Grk1UPlivRGKqe3DPdHxVZhKTSZhsHLLcl4nE0vQjLOhwfaCgYKAfUSARMSFQHGX2MiIVj9CwCtd_g3up8XzEEUnw0171",
    //  "refreshToken":"1//0hELME9ABRofLCgYIARAAGBESNwF-L9IrYOYzqMgVqxf8wDITnV3X52KxXf8HzxwP13tRdfAzn3HpbJszZOUX1D2wAc0eWOTLxqg"}}
  }