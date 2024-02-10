'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Users', [{
      firstName: 'Иван',
      secondName: 'Иванов',
      email: 'admin@mail.ru',
      password: '12341234',
      isAdmin: true,
      active: false,
      isSuperAdmin: true,
      queueUser: false,
      startActiveTime: null,
      endActiveTime: null,
      lastActivePeriod: null,
      avatar: null,
      changedPassword: false
    }])
    await queryInterface.bulkInsert('InputData', [{
      seats: 3,
      period: 30,
      numberOfOutputPeriods: 4
    }])
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {})
  }
};
