'use strict'

const faker = require('faker')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Orders',
      Array.from({ length: 2 }).map((item, index) => ({
        sn: faker.random.number(),
        amount: faker.random.number(),
        name: faker.commerce.productName(),
        phone: faker.phone.phoneNumber(),
        address: faker.address.streetAddress(),
        shipping_status: Math.floor(Math.random() * 1),
        payment_status: Math.floor(Math.random() * 1),
        createdAt: new Date(),
        updatedAt: new Date()

      })
      ), {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Orders', null, {})
  }
};
