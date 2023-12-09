import {CreateUserDto} from "../../../user/dto";

// 6 юзеров на 3 места
export const evenQueueUsersTestArray: CreateUserDto[] = [
    {
        firstName: 'Egorka1',
        secondName: 'Goremikov',
        email: 'egorka@mail.ru',
        is_staff: false,
        in_queue: true,
    },
    {
        firstName: 'Stas2',
        secondName: 'Shevchenko',
        email: 'stas@mail.ru',
        is_staff: true,
        in_queue: true
    },
    {
        firstName: 'Denis3',
        secondName: 'Krylov',
        email: 'den@mail.ru',
        is_staff: true,
        in_queue: true
    },
    {
        firstName: 'Gery4',
        secondName: 'Mambo',
        email: 'gery@mail.ru',
        is_staff: false,
        in_queue: true
    },
    {
        firstName: 'Denis5',
        secondName: 'Egorov',
        email: 'bc@mail.ru',
        is_staff: false,
        in_queue: true
    },
    {
        firstName: 'Maxim6',
        secondName: 'Ivahnenko',
        email: 'maxim@mail.ru',
        is_staff: false,
        in_queue: true
    }
]

// 5 юзеров на 3 места
export const oddQueueUsersTestArray: CreateUserDto[] = [
    {
        firstName: 'Egorka1',
        secondName: 'Goremikov',
        email: 'egorka@mail.ru',
        is_staff: false,
        in_queue: true,
    },
    {
        firstName: 'Stas2',
        secondName: 'Shevchenko',
        email: 'stas@mail.ru',
        is_staff: true,
        in_queue: true
    },
    {
        firstName: 'Denis3',
        secondName: 'Krylov',
        email: 'den@mail.ru',
        is_staff: true,
        in_queue: true
    },
    {
        firstName: 'Gery4',
        secondName: 'Mambo',
        email: 'gery@mail.ru',
        is_staff: false,
        in_queue: true
    },
    {
        firstName: 'Denis5',
        secondName: 'Egorov',
        email: 'bc@mail.ru',
        is_staff: false,
        in_queue: true
    },
]