'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'changePassword', {
      type: Sequelize.BOOLEAN,
      defaultValue: false, // Установите дефолтное значение
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'newField');
  },
};