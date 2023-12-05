import {User} from "../model/user.model";
import {UserService} from "../user.service";
import {Test, TestingModule} from "@nestjs/testing";
import {UserController} from "../user.controller";
import {Notification} from "../../notifications/model/notifications.model";
import {SequelizeModule} from "@nestjs/sequelize";
import {TokenModule} from "../../token/token.module";
import {MailModule} from "../../mail/mail.module";
import {MailKeyModule} from "../../mail_key/mail_key.module";
import {QueueModule} from "../../queue/queue.module";
import {ConfigModule} from "@nestjs/config";
import {AvatarService} from "../../avatar/avatar.service";
import {Sequelize} from "sequelize-typescript";
import {usersTestArray} from "./utils/usersTestArray";
import {mapUserToCreateUserDto} from "./utils/mapUserToCreateUserDto";

describe('UserModule', () => {
    let userModule: TestingModule;

    //Настройка модуля для тестирования
    beforeAll(async () => {
        userModule = await Test.createTestingModule({
                imports: [
                    ConfigModule.forRoot({
                        isGlobal: true,
                    }),
                    SequelizeModule.forRoot(
                        {
                            dialect: 'sqlite',
                            logging: false,
                            autoLoadModels: true,
                            omitNull: true,
                            synchronize: true,
                            models: [
                                User,
                                Notification,
                            ]
                        }
                    ),
                    SequelizeModule.forFeature([User]),
                    TokenModule,
                    MailModule,
                    MailKeyModule,
                    QueueModule,
                ],
                providers: [UserService, AvatarService,],
                controllers: [UserController]
            }
        )
            .compile();
    })

    //Очищаем бд после каждого теста
    afterEach(async () => {
        const db = userModule.get(Sequelize);
        await db.truncate();
    })

    //Возвращаем юзера по части его имени
    it('Should return entry based on fullName request parameter (part of actual fullName)', async() => {
        const userService = userModule.get(UserService);
        //Добавляем юзеров в бд
        for (const user of usersTestArray) {
            await userService.createUser(user);
        }
        const userController = userModule.get(UserController);

        //Должно вернуть одного единственного юзера
        const requestResult = (await userController.getUsers("", "yl"))[0];

        //Проверяем только по обязательным полям из CreateUserDto
        const finalResult = mapUserToCreateUserDto(requestResult);
        expect(finalResult).toEqual(usersTestArray[1]);
    })

    it('Should return empty array for empty users table', async () => {
        const userController = userModule.get<UserController>(UserController);
        const finalResult = await userController.getUsers("", "");
        expect(finalResult).toEqual([]);
    });

    //Возвращаем юзера по его полному имени
    it('Should return entry based on fullName request parameter', async() => {
        const userService = userModule.get(UserService);
        //Добавляем юзеров в бд
        for (const user of usersTestArray) {
            await userService.createUser(user);
        }
        const userController = userModule.get(UserController);

        //Должно вернуть одного единственного юзера
        const requestResult = (await userController.getUsers("", "Denis Krylov"))[0];

        //Проверяем только по обязательным полям из CreateUserDto
        const finalResult = mapUserToCreateUserDto(requestResult);
        expect(finalResult).toEqual(usersTestArray[1]);
    })

    //Для пустой таблицы должен вернуться пустой массив
    it('Should return empty array for empty users table', async () => {
        const userController = userModule.get<UserController>(UserController);
        const finalResult = await userController.getUsers("", "");
        expect(finalResult).toEqual([]);
    });

    //Для не пустой таблицы при пустых параметрах запроса должны вернуться все юзеры
    it('Should return all users for not empty table with empty request parameters', async () => {
        const userService = userModule.get(UserService);
        //Добавляем юзеров в бд
        for (const user of usersTestArray) {
            await userService.createUser(user);
        }
        const userController = userModule.get(UserController);
        const requestResult = await userController.getUsers("", "")
        const finalResult = requestResult.map((user) => mapUserToCreateUserDto(user));
        expect(finalResult).toEqual(usersTestArray);
    })

    //Получаем всех админов
    it('Should return all users with admin role', async () => {
        const userService = userModule.get(UserService);
        //Добавляем юзеров в бд
        for (const user of usersTestArray) {
            await userService.createUser(user);
        }
        const onlyAdminArray = usersTestArray.slice(0, 2)
        const userController = userModule.get(UserController);
        const requestResult = await userController.getUsers("[admin]", "")
        const finalResult = requestResult.map((user) => mapUserToCreateUserDto(user));
        expect(finalResult).toEqual(onlyAdminArray);
    })

    //Возвращаем пустой массив для случайного набора букв в качестве имени
    it('Should return empty array for random fullName ', async () => {
        const userService = userModule.get(UserService);
        //Добавляем юзеров в бд
        for (const user of usersTestArray) {
            await userService.createUser(user);
        }
        const userController = userModule.get(UserController);
        const requestResult = await userController.getUsers("", "adfhjkahfjlaj13hjlzhb")
        const finalResult = requestResult.map((user) => mapUserToCreateUserDto(user));
        expect(finalResult).toEqual([]);
    })

    //Возвращаем пустой массив если по данной роли ничего не найдено
    it('Should return empty array for role that no one has', async () => {
        const userService = userModule.get(UserService);
        //Добавляем юзеров в бд
        for (const user of usersTestArray) {
            await userService.createUser(user);
        }
        const userController = userModule.get(UserController);
        const requestResult = await userController.getUsers("[super_admin]", "")
        const finalResult = requestResult.map((user) => mapUserToCreateUserDto(user));
        expect(finalResult).toEqual([]);
    })
})