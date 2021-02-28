const createError = require('http-errors');
const express = require('express');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session')
const logger = require('morgan');
const exphbs = require('express-handlebars')

const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const flash = require('connect-flash')
const passport = require('./config/passport')




const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.engine('hbs', exphbs({ defaultLayout: 'main', extname: 'hbs', helpers: require('./config/handlebars-helpers') }))

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(methodOverride('_method'))

app.use(session({
  secret: 'cart',
  name: 'cart',
  cookie: { maxAge: 12 * 60 * 60 * 1000 },
  resave: false,
  saveUninitialized: true,
}));

app.use(flash())
app.use(passport.initialize())
app.use(passport.session())

app.use((req, res, next) => {
  res.locals.success_message = req.flash('success_message')
  res.locals.error_message = req.flash('error_message')
  res.locals.error_message_c = req.flash('error_message_c')
  res.locals.user = req.user
  res.locals.cartItemCount = req.session.cartItemCount
  next()
})

app.use('/', indexRouter);
app.use('/users', usersRouter);


app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`)
})

module.exports = app;
