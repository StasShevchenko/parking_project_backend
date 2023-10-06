'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'next_active', {
      type: Sequelize.INTEGER,
      defaultValue: null, // Установите дефолтное значение
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'newField');
  },
};