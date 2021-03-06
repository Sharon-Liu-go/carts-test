'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Payment.belongsTo(models.Order)
    }
  };
  Payment.init({
    sn: DataTypes.BIGINT(50),
    amount: DataTypes.INTEGER,
    payment_method: DataTypes.STRING,
    paid_at: DataTypes.DATE,
    params: DataTypes.TEXT,
    orderId: DataTypes.INTEGER,
    merchantOrderNo: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Payment',
  });
  return Payment;
};