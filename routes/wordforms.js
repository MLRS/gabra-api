var express = require('express')
var router = express.Router()
var passport = require('passport')
var async = require('async')
var monk = require('monk')

var log = require('./helpers/logger').makeLogger('wordforms')
var sortWordforms = require('./helpers/sort-wordforms')
var updateHelper = require('./helpers/update')

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
      case 'noun':
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
      if (lexeme_id && req.body.commit === true) {
        // Insert into DB
        var lemma = req.body.lemma // 'ipparkja'
        req.db.get('lexemes').findOne(lexeme_id, function (err, data) {
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
              res.json(forms)
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

/* Create = POST */
/* Content-Type: application/json */
router.post('/',
  passport.authenticate('basic', {
    session: false
  }),
  function (req, res, next) {
    var collection = req.db.get('wordforms')
    req.body.lexeme_id = monk.id(req.body.lexeme_id)
    collection.insert(req.body, function (err, data) {
      if (err) {
        res.status(500).send(err)
        return
      }
      log(req, data._id, data, 'created')
      res.status(201).json(data)
    })
  })

// /* Index = GET */
// router.get('/', function (req, res, next) {
//   var collection = req.db.get('wordforms')
//   collection.find({}, function (err, data) {
//     if (err) {
//       res.status(500).send(err)
//       return
//     }
//     res.json(data)
//     res.setHeader('Cache-Control', 'public, max-age=604800') // 7 days
//   })
// })

/* Read = GET with ID */
router.get('/:id', function (req, res, next) {
  var collection = req.db.get('wordforms')
  try {
    monk.id(req.params.id)
  } catch (err) {
    res.status(400).send('Invalid ID').end()
    return
  }
  collection.findOne(req.params.id, function (err, data) {
    if (err) {
      res.status(500).send(err)
      return
    }
    res.json(data)
  })
})

/* Set individual fields = POST with ID */
/* Content-Type: application/json */
/* _id in body should match :id or be omitted (otherwise will fail) */
// router.post('/set/:id',
//   passport.authenticate('basic', {
//     session: false
//   }),
//   function (req, res, next) {
//     var collection = req.db.get('wordforms')
//     collection.update(req.params.id, { '$set': req.body }, function (err) {
//       if (err) {
//         res.status(500).send(err)
//         return
//       }
//       collection.find(req.params.id, function (err, data) {
//         if (err) {
//           res.status(500).send(err)
//           return
//         }
//         log(req, data._id, data, 'modified')
//         res.json(data)
//       })
//     })
//   })

/* Update entire document = POST with ID */
/* Content-Type: application/json */
/* _id in body should match :id or be omitted (otherwise will fail) */
router.post('/:id',
  passport.authenticate('basic', {
    session: false
  }),
  function (req, res, next) {
    var collection = req.db.get('wordforms')
    var newDoc = req.body
    newDoc.lexeme_id = monk.id(newDoc.lexeme_id)
    collection.findOne(req.params.id)
      .then(doc => {
        var ops = updateHelper.prepareUpdateOperations(doc, newDoc)
        return collection.findOneAndUpdate(req.params.id, ops)
      })
      .then(updatedDoc => {
        log(req, updatedDoc._id, updatedDoc, 'modified')
        res.json(updatedDoc)
      })
      .catch(err => {
        console.error(err)
        res.status(500).send(err)
      })
  })

/* Delete = DELETE with ID */
router.delete('/:id',
  passport.authenticate('basic', {
    session: false
  }),
  function (req, res, next) {
    var collection = req.db.get('wordforms')
    collection.remove(req.params.id, function (err) {
      if (err) {
        res.status(500).send(err)
        return
      }
      log(req, req.params.id, null, 'deleted')
      res.end()
    })
  })

module.exports = router
