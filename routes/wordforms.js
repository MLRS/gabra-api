var express = require('express')
var router = express.Router()
var passport = require('passport')
var async = require('async')
var regexquote = require('regexp-quote')
var monk = require('monk')

var log = require('./helpers/logger').makeLogger('wordforms')
var sortWordforms = require('./helpers/sort-wordforms')
// var updateHelper = require('./helpers/update')

// -- Morphological generation -----------------------------------------------

// Keys must match filenames in ../morpho/
const paradigms = {
  'loan-verb': {
    name: 'Loan verb',
    fields: ['lemma']
  },
  'adjective': {
    name: 'Adjective',
    fields: ['lemma']
  },
  'noun': {
    name: 'Noun',
    fields: ['lemma']
  },
  'noun-possessives': {
    name: 'Noun possessives',
    fields: ['lemma', 'number', 'gender']
  }
}

/* List generation paradigms */
router.get('/generate', function (req, res, next) {
  res.json(paradigms)
})

/* Run generation */
/* Content-Type: application/json */
router.post('/generate/:paradigm/:lexeme_id?',
  passport.authenticate('basic', {
    session: false
  }),
  function (req, res, next) {
    // Load inflector dynamically
    var par = req.params.paradigm
    if (!paradigms.hasOwnProperty(par)) {
      res.status(400).send('Unknown paradigm ' + par)
      return
    }
    var mg = require('../morpho/' + par)
    mg.inflect(req.body, function (err, forms) {
      if (err) {
        res.status(400).send(err)
        return
      }

      var lexeme_id = req.params.lexeme_id
      if (lexeme_id && req.body.commit === true) {
        // Insert into DB
        req.db.get('lexemes').findOne(lexeme_id, function (err, data) {
          if (err) {
            res.status(400).send(err)
            return
          }
          if (!data) {
            res.status(400).send('Lexeme ' + lexeme_id + ' not found')
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
              res.json(forms)
            }
          )
        })
      } else {
        // Just return forms
        forms = forms.map(wf => {
          wf['generated'] = true
          return wf
        })
        res.json(forms)
      }
    })
  }
)

// -- Advanced manipulation -------------------------------------------------

/* Replace */
/* Content-Type: application/json */
router.post('/replace/:lexeme_id',
  passport.authenticate('basic', {
    session: false
  }),
  function (req, res, next) {
    var collection = req.db.get('wordforms')
    var search = req.body.search
    var replace = req.body.replace || ''
    if (!search) {
      res.status(400).send('Must supply search field')
      return
    }
    var conds = {
      'lexeme_id': monk.id(req.params.lexeme_id),
      'surface_form': {'$regex': search}
    }
    collection.find(conds, function (err, data) {
      if (err) {
        res.status(500).send(err)
        return
      }
      data.sort(sortWordforms)

      var search_regex = new RegExp(search)
      data.forEach(function (wf) {
        wf.surface_form = wf.surface_form.replace(search_regex, replace)
      })

      // do it for real?
      if (req.body.commit === true) {
        async.each(
          data,
          function (item, callback) {
            collection.update(item._id, { '$set': item }, callback)
            log(req, item._id, item, 'modified')
          },
          // All done
          function (err) {
            if (err) {
              res.status(500).send(err)
            } else {
              res.json(data)
            }
          }
        )
      } else {
        res.json(data)
      }
    })
  })

/*
 * GET search suggest
 */
router.get('/search_suggest', function (req, res) {
  var db = req.db

  var orig = req.query.s
  var s = regexquote(orig)

  // Handle capitalisation
  s = s.toLowerCase()
  // s = s.replace(/^\[(.+?)\]/, function (m,c,o,s) { return '[' + c.toLowerCase() + c.toUpperCase() + ']'})
  // s = s.replace(/^([^\[])/, function (m,c,o,s) { return '[' + c.toUpperCase() + ']'})

  // Handle diacritics
  s = s.replace(/c/g, 'ċ')
  s = s.replace(/g/g, '[gġ]')
  s = s.replace(/h/g, '[hħ]')
  s = s.replace(/z/g, '[zż]')

  // No substrings
  s = s.replace(/^\^/, '')
  s = s.replace(/\$$/, '')
  s = '^' + s + '$'

  var query = {
    'surface_form': {'$regex': s, '$ne': orig},
    'pending': {'$ne': true}
  }
  var opts = {
    'projection': {
      'surface_form': true,
      'lexeme_id': true
    }
  }
  db.get('wordforms').find(query, opts)
    .catch(function (err) {
      console.error(err)
      res.status(500).end()
    })
    .then(function (data) {
      res.json({
        'results': data.map((l) => { return {'wordform': l} }),
        'query': {
          'term': orig,
          'result_count': data.length
        }
      })
    })
})

/*
 * GET count
 */
router.get('/count', function (req, res) {
  var db = req.db
  var coll = db.get('wordforms')
  coll.count({}, function (err, result) {
    if (err) {
      console.error(err)
      res.status(500).end()
      return
    }
    res.json(result)
  })
})

// -- CRUD Methods ----------------------------------------------------------

require('./helpers/crud')('wordforms', router, {
  withData: function (data) {
    data.lexeme_id = monk.id(data.lexeme_id)
  }
})

module.exports = router
