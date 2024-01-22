'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'previous_active', {
      type: Sequelize.INTEGER,
      defaultValue: null, // Установите дефолтное значение
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'newField');
  },
};