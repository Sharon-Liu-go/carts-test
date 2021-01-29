const db = require('../models')
const { Cart, CartItem, Product, Order, OrderItem } = db
const nodemailer = require('nodemailer');
const newebpay_helpers = require('../config/newebpay-helpers')




let orderController = {
  getOrders: (req, res) => {
    Order.findAll({ include: 'items' }).then(orders => {
      orders = orders.map(items => ({
        ...items.dataValues
      }))
      res.render('orders', { orders })
    })
  },

  postOrder: (req, res) => {
    const { name, phone, address, cartId, amount, shipping_status, payment_status, shipping_method, payment_method } = req.body
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
        UserId: req.user.id
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
          console.log('-----------------')
          console.log(order)
          res.redirect(`/order/${order.id}/payment`)
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
        payment_status: '-1',
      }).then(order => {
        return res.redirect('back')
      })
    })
  },
  getPayment: (req, res) => {
    console.log('===== getPayment =====')
    console.log(req.params.id)
    console.log('==========')

    return Order.findByPk(req.params.id, { include: 'items' }).then(order => {
      let paymentMethod = newebpay_helpers.getPayParam(order.dataValues.payment_method)

      const tradeInfo = newebpay_helpers.getTradeInfo(order.amount, '產品名稱', 'innovate72095@gmail.com', paymentMethod)
      order.update({
        sn: tradeInfo.MerchantOrderNo,
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

    return Order.findAll({ where: { sn: data.Result.MerchantOrderNo } }).then(orders => {
      console.log(`==========`)
      console.log(data.Result.MerchantOrderNo)
      console.log(orders)
      orders[0].update({
        ...req.body,
        payment_status: 1,
      }).then(order => {
        return res.redirect('/orders')
      })
    })
  },

  getOrder: (req, res) => {

    Order.findByPk(req.params.id, { include: 'items' }).then(order => {
      let orderItems = order.items.map(item => ({
        ...item.dataValues,
        price: item.OrderItem.price,
        quantity: item.OrderItem.quantity,
        subtotal: item.OrderItem.price * item.OrderItem.quantity

      }))
      return res.render('orderDetails', { order, orderItems })
    })
  }

}

module.exports = orderController