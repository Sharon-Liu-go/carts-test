var express = require('express');
var router = express.Router();
const passport = require('../config/passport')

const { authenticated } = require('../middleware/auth')

const productController = require('../controllers/productController')
const cartController = require('../controllers/cartController')
const orderController = require('../controllers/orderController')
const userController = require('../controllers/userController.js');
const auth = require('../middleware/auth');



/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/products', productController.getProducts)

router.get('/cart', authenticated, cartController.getCart)
router.post('/cart', authenticated, cartController.postCart)
router.post('/cartItem/:id/add', authenticated, cartController.addCartItem)
router.post('/cartItem/:id/sub', authenticated, cartController.subCartItem)
router.delete('/cartItem/:id', authenticated, cartController.deleteCartItem)

router.get('/orders', authenticated, orderController.getOrders)
router.post('/order', authenticated, orderController.postOrder)
router.post('/order/:id/cancel', authenticated, orderController.cancelOrder)

router.get('/register', userController.getRegisterPage)
router.post('/register', userController.register)
router.get('/login', userController.getLoginPage)
router.post('/login', passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), userController.login)
router.get('/logout', userController.logout)

router.get('/selfProfile/:id', authenticated, userController.getSelfProfile)
router.post('/selfProfile/:id', authenticated, userController.editSelfProfile)

router.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'public_profile'] }))
router.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }))


module.exports = router;
