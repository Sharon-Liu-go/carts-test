const db = require('../models')
const { Op } = require("sequelize");
const { Product } = db
let PAGE_OFFSET = 0
const PAGE_LIMIT = 20


let productController = {

  getProducts: (req, res) => {
    let pageNow = req.query.page
    if (pageNow) {
      PAGE_OFFSET = (pageNow - 1) * PAGE_LIMIT || 0
    }
    Product.findAndCountAll({ offset: PAGE_OFFSET, limit: PAGE_LIMIT, order: [['createdAt', 'DESC']], raw: true, nest: true }).then(products => {
      let totalPages = Math.ceil(products.count / PAGE_LIMIT)
      let pagesArray = Array.from({ length: totalPages }).map((item, index) => index + 1)
      let prev = pageNow - 1 > 0 ? pageNow - 1 : 1
      let next = pageNow + 1 < totalPages ? pageNow + 1 : totalPages
      return res.render('index',
        { products, pagesArray, prev, next, pageNow })
    }
    )
  },

  searchProduct: (req, res) => {
    const keyword = req.query.keyword

    let pageNow = req.query.page
    if (pageNow) {
      PAGE_OFFSET = (pageNow - 1) * PAGE_LIMIT || 0
    }
    Product.findAndCountAll({
      where: {
        name: { [Op.like]: `%${keyword}%` }
      }, offset: PAGE_OFFSET, limit: PAGE_LIMIT, order: [['createdAt', 'DESC']], raw: true, nest: true
    }).then(products => {
      let totalPages = Math.ceil(products.count / PAGE_LIMIT)
      let pagesArray = Array.from({ length: totalPages }).map((item, index) => index + 1)
      let prev = pageNow - 1 > 0 ? pageNow - 1 : 1
      let next = pageNow + 1 < totalPages ? pageNow + 1 : totalPages
      return res.render('index',
        { products, pagesArray, prev, next, pageNow, keyword })
    }
    )
  },

}

module.exports = productController