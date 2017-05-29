var express = require('express')
var router = express.Router()
var passport = require('passport')
var monk = require('monk')

// -- Pages -----------------------------------------------------------------

/* Recent activity page */
router.get('/',
  passport.authenticate('basic', {
    session: false
  }),
  function (req, res, next) {
    var collection = req.db.get('logs')
    var pagesize = 50
    var try_page = parseInt(req.query.page, 10)
    var page = try_page ? try_page : 1

    var conds = {}
    var opts = {
      'sort': {
        'date': -1
      },
      'limit': pagesize,
      'skip': pagesize * (page - 1)
    }
    collection.find(conds, opts, function (err, results) {
      if (err) {
        res.status(500).send(err)
      }
      res.render('logs', {
        title: 'Recent activity',
        data: results,
        page: page
      })
    })
  }
)

// -- Chart data ------------------------------------------------------------

router.get('/chart', function (req, res, next) {
  var collection = req.db.get('logs')
  var from = new Date()
  var to = new Date()
  from.setMonth(to.getMonth() - 1)
  var conds = {
    'date': {'$gte': from}
  }
  var opts = {
    'sort': {
      'date': -1
    }
  }
  collection.find(conds, opts, function (err, data) {
    if (err) {
      res.status(500).send(err)
    }
    var day_counts = {}

    // Init
    var init = { total: 0 }
    data.forEach(function (item) {
      if (!init.hasOwnProperty(item.username)) init[item.username] = 0
    })
    for (var d = from; d <= to; d.setDate(d.getDate() + 1)) {
      day_counts[d.toISOString().substring(0, 10)] = JSON.parse(JSON.stringify(init)) // naughty
    }
    // Populate
    data.forEach(function (item) {
      var day = item.date.toISOString().substring(0, 10)
      day_counts[day][item.username]++
      day_counts[day]['total']++
    })

    res.json(day_counts)
  })
})

// -- CRUD Methods ----------------------------------------------------------

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
    }
    res.json(data)
  })
})

module.exports = router
