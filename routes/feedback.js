var express = require('express')
var router = express.Router()

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
    delete data['_id'] // just to be safe
    data['created'] = new Date()
    data['pending'] = true
    data['sources'] = ['UserFeedback']
    collection.insert(data, function (err, data) {
      if (err) {
        res.status(500).send(err)
      }
      res.json(data)
    })
  })
})

module.exports = router
