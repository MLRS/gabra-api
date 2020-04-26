var express = require('express')
var router = express.Router()
var log = require('./helpers/logger').makeLogger('lexemes')
const get = require('./helpers/safe-access')

// -- Feedback/'crowdsourcing' methods ---------------------------------------

/* GET suggestions */
router.get('/suggest', function (req, res, next) {
  var collection = req.db.get('lexemes')
  var conds = {
    pending: true,
    sources: 'UserFeedback'
  }
  var page_size = 20
  var page = req.query.page || 1
  var opts = {
    'limit': page_size,
    'skip': page_size * (page - 1),
    'sort': {
      '_id': get(req.query, 'sort') === 'oldest' ? 1 : -1
    }
  }
  collection.find(conds, opts, function (err, data) {
    if (err) {
      res.status(500).send(err)
      return
    }
    collection.count(conds, function (err, count) {
      if (err) {
        console.error(err)
      }
      res.json({
        query: {
          page: page,
          page_size: page_size,
          result_count: count
        },
        results: data.map(lex => {
          return { lexeme: lex }
        })
      })
    })
  })
})

/* Suggest */
/* Content-Type: application/json */
router.post('/suggest', function (req, res, next) {
  var collection = req.db.get('lexemes')
  var data = req.body
  if (!data.lemma && !data.gloss) {
    res.status(400).send('Empty suggestion')
    return
  }
  // Forbid any < > chars - code injection!
  if (JSON.stringify(data).match(/[<>]/)) {
    res.status(400).send('Invalid input')
    return
  }
  var conds = {
    lemma: data.lemma,
    pos: data.pos
  }
  collection.findOne(conds, function (err, found) {
    if (err) {
      res.status(500).send(err)
      return
    }
    if (found) {
      res.status(200).send('Entry already exists')
      return
    }
    // Only copy the fields we want
    var newdata = {
      lemma: data.lemma,
      glosses: data.gloss ? [{ gloss: data.gloss }] : [],
      pos: data.pos,
      pending: true,
      sources: ['UserFeedback']
    }
    collection.insert(newdata, function (err, data) {
      if (err) {
        res.status(500).send(err)
        return
      }
      log(req, data._id, data, 'created')
      res.status(201)
      res.json(data)
    })
  })
})

module.exports = router
