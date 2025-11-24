import { Gender } from '../../../user/entities/user.entity';
import { CreateUserDto } from '../../../user/dto/create-user.dto';

export const mockVictorSoutoData: CreateUserDto = {
  email: 'souto.victor@gmail.com',
  password: 'Password123!',
  firstName: 'Victor',
  lastName: 'Souto',
  gender: Gender.Male,
  age: 28,
  active: true,
};

export const mockMariaSlvaData: CreateUserDto = {
  email: 'maria.silva@example.com',
  password: 'Password123!',
  firstName: 'Maria',
  lastName: 'Silva',
  gender: Gender.Female,
  age: 32,
  active: true,
};

export const mockJoaoSantosData: CreateUserDto = {
  email: 'joao.santos@example.com',
  password: 'Password123!',
  firstName: 'João',
  lastName: 'Santos',
  gender: Gender.Male,
  age: 25,
  active: true,
};

export const mockInactiveUserData: CreateUserDto = {
  email: 'inactive.user@example.com',
  password: 'Password123!',
  firstName: 'Inactive',
  lastName: 'User',
  gender: Gender.Female,
  age: 30,
  active: false,
};

export const mockUsersData = [
  mockVictorSoutoData,
  mockMariaSlvaData,
  mockJoaoSantosData,
  mockInactiveUserData,
];
