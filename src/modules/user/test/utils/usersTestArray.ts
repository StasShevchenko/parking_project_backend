import { CreateUserDto } from '../../dto/createUser.dto';

//Простой набор пользователей для UserModule тестов
export const usersTestArray: CreateUserDto[] = [
  {
    firstName: 'Stas',
    secondName: 'Shevchenko',
    email: 'stas@mail.ru',
    isAdmin: true,
  },
  {
    firstName: 'Denis',
    secondName: 'Krylov',
    email: 'den@mail.ru',
    isAdmin: true,
  },
  {
    firstName: 'Gery',
    secondName: 'Mambo',
    email: 'gery@mail.ru',
    isAdmin: false,
  },
  {
    firstName: 'Denis',
    secondName: 'Egorov',
    email: 'bc@mail.ru',
    isAdmin: false,
  },
];
