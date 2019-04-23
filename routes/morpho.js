var express = require('express')
var router = express.Router()

var passport = require('passport')
var async = require('async')

var log = require('../logger').makeLogger('wordforms')

// -- Morphological generation -----------------------------------------------

/* Generate */
/* Content-Type: application/json */
router.post('/generate/:paradigm/:lexeme_id?',
  passport.authenticate('basic', {
    session: false
  }),
  function (req, res, next) {
    // Load inflector dynamically
    var par = req.params.paradigm
    var mg
    switch (par) {
      case 'loan-verb':
      case 'adjective':
        mg = require('../morpho/' + par)
        break
      default:
        res.status(400).send('Unknown paradigm ' + par)
        return
    }

    mg.inflect(req.body, function (err, forms) {
      if (err) {
        res.status(400).send(err)
        return
      }

      var lexeme_id = req.params.lexeme_id
      if (lexeme_id) {
        // Insert into DB
        var lemma = req.body.lemma // 'ipparkja'
        req.db.get('lexemes').find(lexeme_id, function (err, data) {
          if (err) {
            res.status(400).send('find error')
            return
          }
          if (!data) {
            res.status(400).send('lexeme ' + lexeme_id + ' not found')
            return
          }
          if (data.lemma !== lemma) {
            res.status(400).send('Lemma mis-match: ' + lemma + ' / ' + data.lemma)
            return
          }

          var coll = req.db.get('wordforms')
          async.each(forms,
            function (wf, cb) {
              wf['lexeme_id'] = data._id
              wf['generated'] = true
              coll.insert(wf, function (err, data) {
                log(req, data._id, wf, 'modified')
                cb(err)
              })
            },
            function (err) {
              if (err) {
                res.status(400).send(err)
                return
              }
              res.json('ok')
            }
          )
        })
      } else {
        // Just return forms
        res.json(forms)
      }
    })
  }
)

module.exports = router
