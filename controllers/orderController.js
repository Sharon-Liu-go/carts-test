const db = require('../models')
const { Cart, CartItem, Product, Order, OrderItem, User } = db
const nodemailer = require('nodemailer');
const newebpay_helpers = require('../config/newebpay-helpers');
const user = require('../models/user');




let orderController = {
  getOrders: (req, res) => {
    Order.findAll({ where: { UserId: req.user.id }, include: 'items', order: [['createdAt', 'DESC']] }).then(orders => {
      orders = orders.map(items => ({
        ...items.dataValues
      }))
      res.render('orders', { orders })
    })
  },

  postOrder: (req, res) => {
    const { name, phone, address, cartId, amount, shipping_status, payment_status, shipping_method, payment_method, sender } = req.body
    return Cart.findByPk(cartId, { include: 'items' }).then(cart => {
      return Order.create({
        name: name,
        address: address,
        phone: phone,
        shipping_status: shipping_status,
        payment_status: payment_status,
        amount: amount,
        shipping_method: shipping_method,
        payment_method: payment_method,
        UserId: req.user.id,
        sender: sender
      }).then(order => {

        let results = [];
        for (let i = 0; i < cart.items.length; i++) {
          results.push(
            OrderItem.create({
              OrderId: order.id,
              ProductId: cart.items[i].id,
              price: cart.items[i].price,
              quantity: cart.items[i].CartItem.quantity,
            })
          );
        }
        return Promise.all(results).then(() => {
          //清空購物車
          CartItem.findAll({
            where: {
              cartId: cartId
            }
          }).then(items => {
            items.map(item => item.destroy())
            req.session.cartItemCount = 0  //購物車的品項也歸0
            res.redirect(`/order/${order.id}/payment`)
          })
        }
        );
      })
    })
  },

  cancelOrder: (req, res) => {
    return Order.findByPk(req.params.id, {}).then(order => {
      order.update({
        ...req.body,
        shipping_status: '-1',
        payment_status: order.payment_status === '0' ? '-1' : '2',
      }).then(order => {
        req.flash('success_message', 'Order is successfully canceled')
        return res.redirect('/orders')
      })
    })
  },
  getPayment: (req, res) => {
    console.log('===== getPayment =====')

    return Order.findByPk(req.params.id, { include: 'items' }).then(order => {
      let paymentMethod = newebpay_helpers.getPayParam(order.dataValues.payment_method)

      let orderSn = order.sn
      const tradeInfo = newebpay_helpers.getTradeInfo(order.amount, '產品名稱', req.user.email, paymentMethod, orderSn)

      order.update({
        sn: order.sn || tradeInfo.MerchantOrderNo.slice(0, 13),
      }).then(order => {
        let orderItems = order.items.map(item => ({
          ...item.dataValues,
          price: item.OrderItem.price,
          quantity: item.OrderItem.quantity,
          subtotal: item.OrderItem.price * item.OrderItem.quantity
        }))
        return res.render('payment', { order, orderItems, tradeInfo })
      })
    })
  },
  newebpayCallback: (req, res) => {
    console.log('===== newebpayCallback =====')
    console.log(req.method)
    console.log(req.query)
    console.log(req.body)
    console.log('==========')

    console.log('===== spgatewayCallback: TradeInfo =====')
    console.log(req.body.TradeInfo)

    const data = JSON.parse(newebpay_helpers.create_mpg_aes_decrypt(req.body.TradeInfo))

    console.log('===== spgatewayCallback: create_mpg_aes_decrypt、data =====')
    console.log(data)

    return Order.findAll({ where: { sn: data.Result.MerchantOrderNo.slice(0, 13) } }).then(orders => {
      orders[0].update({
        ...req.body,
        payment_status: "1",
      }).then(order => {
        res.render('clientBack', { order })
      })
    })
  },

  getOrder: (req, res) => {
    return Order.findByPk(req.params.id, { include: 'items' }).then(order => {

      let paymentMethod = newebpay_helpers.getPayParam(order.dataValues.payment_method)

      let orderSn = order.sn

      const tradeInfo = newebpay_helpers.getTradeInfo(order.amount, '產品名稱', req.user.email, paymentMethod, orderSn)

      let orderItems = order.items.map(item => ({
        ...item.dataValues,
        price: item.OrderItem.price,
        quantity: item.OrderItem.quantity,
        subtotal: item.OrderItem.price * item.OrderItem.quantity

      }))
      return res.render('orderDetails', { order, orderItems, tradeInfo })


    })
  },

  clientBack: (req, res) => {
    Order.findOne({ where: { sn: req.params.sn }, attributes: ['payment_status', 'updatedAt', 'id'] })
      .then(order => {
        return res.render('clientBack', { order })
      })
      .catch(err => console.log(err))

  }
}

module.exports = orderController