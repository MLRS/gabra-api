var express = require('express')
var router = express.Router()

// -- Methods for sources ----------------------------------------------------

/* Index = GET */
router.get('/', function (req, res, next) {
  // var collection = req.db.get('lexemes')
  // collection.distinct('sources', {}, function (err, data) {
  //   if (err) {
  //     res.status(500).send(err)
  //   }
  //   var arr = []
  //   for (var s in data) {
  //     if (data[s]) arr.push(data[s])
  //   }
  //   res.json(arr)
  // })
  var collection = req.db.get('sources')
  collection.find({}, function (err, data) {
    if (err) {
      res.status(500).send(err)
    }
    res.setHeader('Cache-Control', 'public, max-age=604800') // 7 days
    res.json(data)
  })
})

/* Read = GET with key */
router.get('/:key', function (req, res, next) {
  var collection = req.db.get('sources')
  var conds = {
    'key': req.params.key
  }
  collection.findOne(conds, function (err, data) {
    if (err) {
      res.status(500).send(err)
    }
    res.json(data)
  })
})

module.exports = router
