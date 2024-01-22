'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Queues', 'swap', {
      type: Sequelize.INTEGER,
      defaultValue: null, // Установите дефолтное значение
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'newField');
  },
};
