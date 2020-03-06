var express = require('express')
var router = express.Router()
var passport = require('passport')

router.get('/login',
  passport.authenticate('basic', {
    session: false
  }),
  function (req, res, next) {
    res.sendStatus(200)
  }
)

module.exports = router
