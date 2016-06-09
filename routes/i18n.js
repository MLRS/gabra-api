var express = require('express')
var router = express.Router()

// -- Internationalisation (i18n) methods ------------------------------------

/* Suggest */
/* Content-Type: application/json */
router.get('/all', function (req, res, next) {
  var collection = req.db.get('messages')
  var conds = {
    type: 'i18n'
  }
  var opts = {
    'sort': {
      'key': 1
    }
  }
  var lang = req.query.lang
  if (!lang) lang = 'eng'
  collection.find(conds, opts, function (err, data) {
    if (err) {
      res.status(500).send(err)
      return
    }
    var obj = {}
    data.forEach(function (item) {
      if (item.key) {
        obj[item.key] = item[lang]
      }
    })
    res.setHeader('Cache-Control', 'public, max-age=604800') // 7 days
    res.json(obj)
  })
})

module.exports = router
