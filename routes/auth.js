var express = require('express')
var router = express.Router()
var passport = require('passport')

router.get('/login',
  passport.authenticate('basic', {
    session: false
  }),
  function (req, res, next) {
    res.json({
      username: req.user.username
    })
  }
)

module.exports = router
