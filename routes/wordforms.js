var express = require('express')
var router = express.Router()
var passport = require('passport')
var async = require('async')
var monk = require('monk')

var log = require('../logger').makeLogger('wordforms')

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
    var replace = req.body.replace
    if (!search || !replace) {
      res.status(400).send('Must supply search and replace fields')
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
      var search_regex = new RegExp(search)
      data.forEach(function (wf) {
        // This is by reference
        wf.surface_form = wf.surface_form.replace(search_regex, replace)
      })

      // do it for real?
      if (req.body.commit === true) {
        async.each(
          data,
          function (item, callback) {
            collection.updateById(item._id, item, callback)
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
      res.json(data)
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
  collection.findById(req.params.id, function (err, data) {
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
//     collection.updateById(req.params.id, {'$set': req.body}, function (err) {
//       if (err) {
//         res.status(500).send(err)
//         return
//       }
//       collection.findById(req.params.id, function (err, data) {
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
    req.body.lexeme_id = monk.id(req.body.lexeme_id)
    collection.updateById(req.params.id, req.body, function (err) {
      if (err) {
        res.status(500).send(err)
        return
      }
      collection.findById(req.params.id, function (err, data) {
        if (err) {
          res.status(500).send(err)
          return
        }
        log(req, data._id, data, 'modified')
        res.json(data)
      })
    })
  })

/* Delete = DELETE with ID */
router.delete('/:id',
  passport.authenticate('basic', {
    session: false
  }),
  function (req, res, next) {
    var collection = req.db.get('wordforms')
    collection.removeById(req.params.id, function (err) {
      if (err) {
        res.status(500).send(err)
        return
      }
      log(req, req.params.id, null, 'deleted')
      res.end()
    })
  })

module.exports = router
