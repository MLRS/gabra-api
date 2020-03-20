var express = require('express')
var router = express.Router()
var monk = require('monk')

/* Read = GET with ID */
router.get('/:collection/:object_id', function (req, res, next) {
  var collection = req.db.get('logs')
  var conds = {
    'collection': req.params.collection,
    'object_id': monk.id(req.params.object_id)
  }
  var opts = {
    'sort': {
      'date': -1
    }
  }
  collection.find(conds, opts, function (err, data) {
    if (err) {
      res.status(500).send(err)
      return
    }
    res.json(data)
  })
})

module.exports = router
