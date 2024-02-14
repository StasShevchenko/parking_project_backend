'use strict';
const {resetDate} = require("../src/utils/resetDate");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    //sequelize db:seed --seed my_seeder_file.js
    async up(queryInterface, Sequelize) {
        //8 юзеров на очередь в 3 места
        //займут 3 периода, значит нужно 3 даты
        const firstPeriodStartDate = resetDate(new Date())
        const firstPeriodEndDate = new Date(firstPeriodStartDate.getDate() - 1)

        const secondPeriodStartDate = new Date(firstPeriodStartDate)
        secondPeriodStartDate.setMonth(secondPeriodStartDate.getMonth() + 1)
        const secondPeriodEndDate = new Date(secondPeriodStartDate.getDate() - 1)

        const thirdPeriodStartDate = new Date(firstPeriodStartDate)
        thirdPeriodStartDate.setMonth(thirdPeriodStartDate.getMonth() + 2)
        const thirdPeriodEndDate = new Date(secondPeriodStartDate.getDate() - 1)

        await queryInterface.bulkInsert('Users', [
            //1 юзер
            {
                firstName: 'Иван',
                secondName: 'Иванов',
                email: 'admin@mail.ru',
                password: '12341234',
                isAdmin: true,
                active: true,
                isSuperAdmin: true,
                queueUser: true,
                startActiveTime: firstPeriodStartDate,
                endActiveTime: firstPeriodEndDate,
                lastActivePeriod: firstPeriodEndDate,
                avatar: null,
                changedPassword: false
            },
            //2 юзер
            {
                firstName: 'Алексей',
                secondName: 'Алексеев',
                email: 'alex@mail.ru',
                password: '12341234',
                isAdmin: false,
                active: true,
                isSuperAdmin: false,
                queueUser: true,
                startActiveTime: firstPeriodStartDate,
                endActiveTime: firstPeriodEndDate,
                lastActivePeriod: firstPeriodEndDate,
                avatar: 'ava1.png',
                changedPassword: false
            },

            //3 юзер
            {
                firstName: 'Наталья',
                secondName: 'Горохова',
                email: 'natali@mail.ru',
                password: '12341234',
                isAdmin: true,
                active: true,
                isSuperAdmin: false,
                queueUser: true,
                startActiveTime: firstPeriodStartDate,
                endActiveTime: firstPeriodEndDate,
                lastActivePeriod: firstPeriodEndDate,
                avatar: 'ava3.png',
                changedPassword: false
            },

            //4 юзер
            {
                firstName: 'Михаил',
                secondName: 'Глушко',
                email: 'mihail@mail.ru',
                password: '12341234',
                isAdmin: true,
                active: false,
                isSuperAdmin: true,
                queueUser: false,
                startActiveTime: secondPeriodStartDate,
                endActiveTime: secondPeriodEndDate,
                lastActivePeriod: secondPeriodEndDate,
                avatar: 'ava2.png',
                changedPassword: false
            },

            //5 юзер
            {
                firstName: 'Петр',
                secondName: 'Петренко',
                email: 'petr@mail.ru',
                password: '12341234',
                isAdmin: false,
                active: false,
                isSuperAdmin: false,
                queueUser: true,
                startActiveTime: secondPeriodStartDate,
                endActiveTime: secondPeriodEndDate,
                lastActivePeriod: secondPeriodEndDate,
                avatar: 'ava7.png',
                changedPassword: false
            },

            //6 юзер
            {
                firstName: 'Елена',
                secondName: 'Летучая',
                email: 'lena@mail.ru',
                password: '12341234',
                isAdmin: true,
                active: false,
                isSuperAdmin: false,
                queueUser: true,
                startActiveTime: secondPeriodStartDate,
                endActiveTime: secondPeriodEndDate,
                lastActivePeriod: secondPeriodEndDate,
                avatar: 'ava4.png',
                changedPassword: false
            },

            //7 юзер
            {
                firstName: 'Евгений',
                secondName: 'Парасюк',
                email: 'evgeny@mail.ru',
                password: '12341234',
                isAdmin: false,
                active: false,
                isSuperAdmin: false,
                queueUser: true,
                startActiveTime: thirdPeriodStartDate,
                endActiveTime: thirdPeriodEndDate,
                lastActivePeriod: thirdPeriodEndDate,
                avatar: 'ava1.png',
                changedPassword: false
            },
            //8 юзер
            {
                firstName: 'Владимир',
                secondName: 'Макаренко',
                email: 'vova@mail.ru',
                password: '12341234',
                isAdmin: false,
                active: false,
                isSuperAdmin: false,
                queueUser: true,
                startActiveTime: thirdPeriodStartDate,
                endActiveTime: thirdPeriodEndDate,
                lastActivePeriod: thirdPeriodEndDate,
                avatar: 'ava8.png',
                changedPassword: false
            }
        ])
        await queryInterface.bulkInsert('InputData', [{
            seats: 3,
            period: 30,
            numberOfOutputPeriods: 4
        }])
        await queryInterface.bulkInsert('Queues', [
            {
                userId: 1,
                number: 1
            },
            {
                userId: 1,
                number: 1
            },
            {
                userId: 1,
                number: 1
            },
            {
                userId: 1,
                number: 1
            },
            {
                userId: 1,
                number: 1
            },
            {
                userId: 1,
                number: 1
            },
            {
                userId: 1,
                number: 1
            },
            {
                userId: 1,
                number: 1
            }
        ])
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('Users', null, {})
        await queryInterface.bulkDelete('InputData', null, {})
    }
};
