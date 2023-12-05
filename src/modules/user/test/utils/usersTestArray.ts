import {CreateUserDto} from "../../dto";

//Простой набор пользователей для UserModule тестов
export const usersTestArray: CreateUserDto[] = [
    {
        firstName: "Stas",
        secondName: "Shevchenko",
        email: "stas@mail.ru",
        is_staff: true
    },
    {
        firstName: "Denis",
        secondName: "Krylov",
        email: "den@mail.ru",
        is_staff: true
    },
    {
        firstName: "Gery",
        secondName: "Mambo",
        email: "gery@mail.ru",
        is_staff: false
    },
]