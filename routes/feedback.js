var express = require('express')
var router = express.Router()
var log = require('../logger').makeLogger('lexemes')

// -- Feedback/'crowdsourcing' methods ---------------------------------------

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
    // gloss: data.gloss
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
      gloss: data.gloss,
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
