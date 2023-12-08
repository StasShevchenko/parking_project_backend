import {CreateUserDto} from "../../../user/dto";

export const queueUsersTestArray: CreateUserDto[] = [
    {
        firstName: 'Egorka',
        secondName: 'Goremikov',
        email: 'egorka@mail.ru',
        is_staff: false,
        in_queue: true,
    },
    {
        firstName: 'Stas',
        secondName: 'Shevchenko',
        email: 'stas@mail.ru',
        is_staff: true,
        in_queue: true
    },
    {
        firstName: 'Denis',
        secondName: 'Krylov',
        email: 'den@mail.ru',
        is_staff: true,
        in_queue: true
    },
    {
        firstName: 'Gery',
        secondName: 'Mambo',
        email: 'gery@mail.ru',
        is_staff: false,
        in_queue: true
    },
    {
        firstName: 'Denis',
        secondName: 'Egorov',
        email: 'bc@mail.ru',
        is_staff: false,
        in_queue: true
    },
    {
        firstName: 'Maxim',
        secondName: 'Ivahnenko',
        email: 'maxim@mail.ru',
        is_staff: false,
        in_queue: true
    }
]