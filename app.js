var express = require('express')
var path = require('path')
var logger = require('morgan')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var compression = require('compression')
var helmet = require('helmet')
var app = express()

app.use(compression()) // compress all requests

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')
app.locals.pretty = true

app.use(helmet())
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
var cache_static = '7 days'
app.use(express.static(path.join(__dirname, 'public'), { maxAge: cache_static }))

// CORS
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  next()
})

// Load server-specific config
var config = require('./server-config')
var package_json = require('./package.json')
app.use(function (req, res, next) {
  res.locals = config
  res.locals.version = package_json.version
  next()
})

// Stop if maintenance mode
app.use(function (req, res, next) {
  if (config.maintenanceMode) {
    res.status('503')
    res.header('Retry-After', 120) // two minutes
    res.send('Down for maintenance')
    res.end()
  } else {
    next()
  }
})

// Database
var monk = require('monk')
var db = monk(config.dbUrl)
// Make our db accessible to our router
app.use(function (req, res, next) {
  req.db = db
  next()
})
// Update glosses collection on a schedule
var updateGlossCollection = require('./scripts/node/update-glosses-collection.js')
require('node-schedule').scheduleJob('0 0 3 * * *', function () { // 03:00 every day
  updateGlossCollection(db)
})

// Authentication
var passport = require('passport')
var BasicStrategy = require('passport-http').BasicStrategy
passport.use(new BasicStrategy(
  function (username, password, done) {
    db.get('users').findOne({ username: username }, function (err, user) {
      var salted = config.salt + password
      var shasum = require('crypto').createHash('sha1')
      var hashed = shasum.update(salted).digest('hex')
      if (err) { return done(err) }
      if (!user) { return done(null, false, { message: 'Unknown user.' }) }
      if (user.password !== hashed) { return done(null, false, { message: 'Incorrect password.' }) }
      return done(null, user)
    })
  }
))
app.use(passport.initialize())

// Analytics
if (config.analyticsCode) {
  app.set('trust proxy', 'loopback')
  var ua = require('universal-analytics')
  var visitor = ua(config.analyticsCode)
  var pageview = function (req, res, next) {
    var params = {
      'dp': req.originalUrl,
      'uip': req.ip
    }
    visitor.pageview(params, function (err) {
      if (err) {
        console.error(err)
      }
    })
    next()
  }
  if (process.env.NODE_ENV === 'production') {
    app.use('/lexemes', pageview)
    app.use('/wordforms', pageview)
    app.use('/roots', pageview)
  }
}

// Routing
app.use('/', require('./routes/index'))
app.use('/lexemes', require('./routes/lexemes'))
app.use('/wordforms', require('./routes/wordforms'))
app.use('/roots', require('./routes/roots'))
app.use('/sources', require('./routes/sources'))
app.use('/feedback', require('./routes/feedback'))
app.use('/logs', require('./routes/logs'))
app.use('/i18n', require('./routes/i18n'))
app.use('/morpho', require('./routes/morpho'))

// http://stackoverflow.com/a/27464258/98600
// app.use('/json-editor', express.static(__dirname + '/node_modules/json-editor/dist/'))
// app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist/'))
app.use('/module', express.static(path.join(__dirname, '/node_modules/'), { maxAge: cache_static }))

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500)
    res.render('error', {
      message: err.message,
      error: err
    })
  })
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500)
  res.render('error', {
    message: err.message,
    error: {}
  })
})

module.exports = app
