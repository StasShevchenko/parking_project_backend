'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('Users', [
            {
                firstName: 'Алексей1',
                secondName: 'Алексеев1',
                email: 'alex@mail.ru',
                password: '12341234',
                isAdmin: false,
                active: true,
                isSuperAdmin: false,
                queueUser: true,
                startActiveTime: null,
                endActiveTime: null,
                lastActivePeriod: null,
                avatar: 'ava1.png',
                changedPassword: false
            },
            {
                firstName: 'Сергей2',
                secondName: 'Сергеев2',
                email: 'serg@mail.ru',
                password: '12341234',
                isAdmin: true,
                active: true,
                isSuperAdmin: false,
                queueUser: true,
                startActiveTime: null,
                endActiveTime: null,
                lastActivePeriod: null,
                avatar: 'ava2.png',
                changedPassword: false
            },
            {
                firstName: 'Михаил3',
                secondName: 'Михаилов3',
                email: 'mihail@mail.ru',
                password: '12341234',
                isAdmin: true,
                active: true,
                isSuperAdmin: true,
                queueUser: false,
                startActiveTime: null,
                endActiveTime: null,
                lastActivePeriod: null,
                avatar: 'ava3.png',
                changedPassword: false
            },
            {
                firstName: 'Петр4',
                secondName: 'Петров4',
                email: 'petr@mail.ru',
                password: '12341234',
                isAdmin: false,
                active: true,
                isSuperAdmin: false,
                queueUser: true,
                startActiveTime: null,
                endActiveTime: null,
                lastActivePeriod: null,
                avatar: 'ava4.png',
                changedPassword: false
            },
            {
                firstName: 'Николай5',
                secondName: 'Николаев5',
                email: 'kolya@mail.ru',
                password: '12341234',
                isAdmin: true,
                active: true,
                isSuperAdmin: false,
                queueUser: true,
                startActiveTime: null,
                endActiveTime: null,
                lastActivePeriod: null,
                avatar: 'ava5.png',
                changedPassword: false
            }
        ])

    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('Users', null, {})
    }
};
