const db = require('../models')
const { User } = db
const bcrypt = require('bcryptjs')

let userController = {
  getRegisterPage: (req, res) => {
    res.render('register')
  },

  register: (req, res) => {
    const { name, email, phone, password, passwordConfirm } = req.body

    let msgArray = []
    //對email的輸入限制
    if (email.indexOf(' ') + 1 || email.match(/.+(@).+(.co).*/) === null) {
      msgArray.push({ message: 'The email is invalid' })
    }

    User.findOne({ where: { email: email } }).then(user => {
      if (user) {
        msgArray.push({ message: 'The email has already existed！' })
      }
    })

    //對phone的輸入限制
    if (phone.length > 0 && phone.match(/^09[0-9]{8}$/) === null) {
      msgArray.push({ message: 'The phone number is invalid' })
    }
    //對password的入限制
    if (password.length < 6) {
      msgArray.push({ message: 'Passwords must be at least 6 characters in length' })
    }

    if (password.indexOf(' ') + 1) {
      msgArray.push({ message: "Passwords can't include space" })
    }
    if (password !== passwordConfirm) {
      req.flash('error_message', '')
      msgArray.push({ message: "Different passwords！" })
    }

    if (msgArray.length > 0) {
      return res.render('register', { msgArray, name, email, phone })
    }

    return User.create({
      name: name,
      email: email,
      phone: phone,
      password: bcrypt.hashSync(password, bcrypt.genSaltSync(10), null)
    }).then(user => {
      req.flash('success_message', 'Successfully registered')
      res.redirect('/login')
    })

  },

  getLoginPage: (req, res) => {
    res.render('login')
  },

  login: (req, res) => {
    req.flash('success_message', 'Successfully logged in!')
    return res.redirect('/')
  },

  logout: (req, res) => {
    req.logout()
    req.flash('success_message', 'Successfully logged out')
    return res.redirect('/')
  },

  getSelfProfile: (req, res) => {
    User.findByPk(req.params.id, { nest: true, raw: true }).then(user => {
      res.render('selfProfile', { user })
    })
  },

  editSelfProfile: (req, res) => {
    const id = req.params.id
    console.log(req.body)
    const { email, phone } = req.body

    let msgArray = []
    //對email的輸入限制
    if (email.indexOf(' ') + 1 || email.match(/.+(@).+(.co).*/) === null) {
      msgArray.push({ message: 'The email is invalid' })
    }

    User.findOne({ where: { email: email } }).then(user => {
      if (user) {
        msgArray.push({ message: 'The email has already existed！' })
      }
    })

    //對phone的輸入限制
    if (phone.length > 0 && phone.match(/^09[0-9]{8}$/) === null) {
      msgArray.push({ message: 'The phone number is invalid' })
    }

    if (msgArray.length > 0) {
      return res.render('selfProfile', { msgArray })
    }

    return User.findByPk(id).then(user => {
      user.update(req.body).then(user => {
        req.flash('success_message', 'Successfully save changes')
        res.redirect(`/selfProfile/${id}`)
      })
    })
  },

  resetPasswordPage: (req, res) => {
    res.render('passwordSetting')
  },

  resetPassword: (req, res) => {
    const id = req.params.id
    const { oldPassword, newPassword, newPasswordConfirm } = req.body
    User.findByPk(id, { attributes: ['id', 'password'] }).then(user => {

      let msgArray = []
      if (!bcrypt.compareSync(oldPassword, user.dataValues.password)) {
        msgArray.push({ message: 'Origin password is incorrect' })
      }

      if (newPassword !== newPasswordConfirm) {
        msgArray.push({ message: 'New password and new password confirmation are different' })
      }

      if (oldPassword === newPassword) {
        msgArray.push({ message: 'New password and origin password are the same, please input another new password' })
      }

      if (newPassword.length < 6) {
        msgArray.push({ message: 'Passwords must be at least 6 characters in length' })
      }

      if (newPassword.indexOf(' ') + 1) {
        msgArray.push({ message: "Passwords can't include space" })
      }

      if (msgArray.length > 0) {
        return res.render('passwordSetting', { msgArray })
      }

      return user.update({
        password: bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10), null)
      }).then(user => {
        req.flash('success_message', 'Successfully reset your password')
        res.redirect(`/selfProfile/${id}`)
      })
    })
  }
}

module.exports = userController