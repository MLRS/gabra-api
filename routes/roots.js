var express = require('express')
var router = express.Router()
var passport = require('passport')
var monk = require('monk')

var log = require('../logger').makeLogger('roots')

// -- Search command --------------------------------------------------------

/*
 * GET search
 */
router.get('/search', function (req, res) {
  var db = req.db
  var coll_r = db.get('roots')
  var coll_l = db.get('lexemes')
  var queryObj = getQuery(req)
  if (queryObj.page < 1) {
    res.status(400).send('Invalid page number')
    return
  }
  var conds_r = searchConditions(queryObj)
  var pagesize = queryObj.page_size
  var opts = {
    'sort': { 'radicals': 1, 'variant': 1 },
    'limit': pagesize,
    'skip': pagesize * (queryObj.page - 1)
  }

  // Do final search and return
  function ret () {
    var results = []
    coll_r.find(conds_r, opts, function (err, roots) {
      if (err) {
        console.error(err)
        res.status(500).end()
        return
      }

      // Add all related derived verb forms
      var tasks = roots.map(function (root) {
        // var conds = {
        //     'root._id': root._id
        // }
        // This is safer than using root._id, which might not be set...
        var conds = {
          'root.radicals': root.radicals
        }
        if (root.variant) {
          conds['root.variant'] = root.variant
        }
        return function () {
          return coll_l.find(conds, function (err, lexs) {
            if (err) {
              console.error(err)
              return
            }
            var obj = {
              'root': root,
              'lexemes': lexs
            }
            results.push(obj)
          })
        }
      })
      tasks.push(function () {
        // Find total
        return coll_r.count(conds_r, function (err, count) {
          if (err) {
            console.error(err)
          }
          return count // undefined on error
        })
      })

      doTasks(tasks, function (count) {
        queryObj.result_count = count
        res.json({ 'results': results, 'query': queryObj })
      })
    })
  }

  if ((queryObj.search_lemma || queryObj.search_gloss) && queryObj.term) {
    var conds_l = { '$or': [] }

    if (queryObj.search_lemma) {
      addCondition(conds_l, 'lemma', queryObj.term)
    }
    if (queryObj.search_gloss) {
      addCondition(conds_l, 'gloss', queryObj.term)
    }

    coll_l.find(conds_l, { projection: {'root': true} }, function (err, docs) {
      if (err) {
        console.error(err)
        res.status(500).end()
        return
      }
      if (docs) {
        var ds = []
        docs.forEach(function (doc) {
          if (doc['root'] && doc['root']['_id']) {
            ds.push(doc['root']['_id'])
          }
        })
        addOr(conds_r, '_id', { '$in': ds })
      }
      ret()
    })
  } else {
    ret()
  }
})

/* Get lexemes for given root */
router.get('/lexemes/:radicals/:variant?', function (req, res, next) {
  var collection = req.db.get('lexemes')
  var conds = {
    'root.radicals': req.params.radicals
  }
  if (req.params.variant) {
    conds['root.variant'] = parseInt(req.params.variant, 10)
  }
  var opts = {
    'sort': {
      'pos': 1,
      'derived_form': 1
    }
  }
  collection.find(conds, opts, function (err, data) {
    if (err) {
      console.error(err)
      res.status(500).send(err)
      return
    }
    res.json(data)
  })
})

/*
 * GET count
 */
router.get('/count', function (req, res) {
  var db = req.db
  var coll = db.get('roots')
  coll.count({}, function (err, result) {
    if (err) {
      console.error(err)
    }
    res.json(result)
  })
})

// -- Private methods -------------------------------------------------------

var getQuery = function (req) {
  var q = req.query

  function boolItem (key, def) {
    if (q.hasOwnProperty(key)) {
      switch (q[key]) {
        case '0': case 'f': case 'false': case '': return false
        default: return true
      }
    } else {
      return def
    }
  }

  var term

  if (q['c1'] || q['c2'] || q['c3'] || q['c4']) {
    term = '^'
    term += q['c1'] || '.'
    term += '-'
    term += q['c2'] || '.'
    term += '-'
    term += q['c3'] || '.'
    if (q['c4'] === 'none') {
      term += '$'
    } else if (q['c4']) {
      term += '-' + q['c4']
    }
  } else if (q.hasOwnProperty('s') && q['s'].trim()) {
    term = q['s'].trim()
  }

  // If someone has CAPS LOCK on...
  if (term) {
    term = term.toLowerCase()
  }

  /* eslint-disable key-spacing */
  var try_page = parseInt(q.page, 10)
  var obj = {
    term            : term, // could be undefined!
    raw_term        : q.s,
    search_radicals : boolItem('r', true),
    search_lemma    : boolItem('l', true),
    search_gloss    : boolItem('g', true),
    root_type       : q.t,
    page            : try_page || 1,
    page_size       : 20,
    result_count    : null // don't know yet
  }
  /* eslint-enable key-spacing */
  return obj
}

// Safe add search condition to $or field
var addOr = function (conds, field, val) {
  if (!conds.hasOwnProperty('$or')) {
    conds['$or'] = []
  }
  var obj = {}
  obj[field] = val
  conds['$or'].push(obj)
}

// Add regex search condition
var addCondition = function (conds, field, q) {
  addOr(conds, field, { '$regex': q })
}

var searchConditions = function (queryObj) {
  var conds = {}

  // always regex
  if (queryObj.search_radicals && queryObj.term) {
    addCondition(conds, 'radicals', queryObj.term)
  }

  // Specify root type
  if (queryObj.root_type) {
    conds['type'] = queryObj.root_type
  }

  return conds
}

var doTasks = function (tasks, callback) {
  var p = tasks[0]() // start the first one
  for (var i = 1; i < tasks.length; i++) p = p.then(tasks[i])
  p.then(callback)
}

// -- CRUD Methods ----------------------------------------------------------

/* Index = GET */
router.get('/', function (req, res, next) {
  var collection = req.db.get('roots')
  collection.find({}, function (err, data) {
    if (err) {
      res.status(500).send(err)
      return
    }
    res.setHeader('Cache-Control', 'public, max-age=604800') // 7 days
    res.json(data)
  })
})

/* Create = POST */
/* Content-Type: application/json */
router.post('/',
  passport.authenticate('basic', {
    session: false
  }),
  function (req, res, next) {
    var collection = req.db.get('roots')
    collection.insert(req.body, function (err, data) {
      if (err) {
        res.status(500).send(err)
        return
      }
      log(req, data._id, data, 'created')
      res.json(data)
    })
  })

/* Read = GET with ID or radicals+variant */
router.get('/:id_or_radicals/:variant?', function (req, res, next) {
  var collection = req.db.get('roots')
  try {
    // Try by ID
    var root_id = monk.id(req.params.id_or_radicals)
    collection.findOne(root_id, function (err, data) {
      if (err) {
        res.status(500).send(err)
        return
      }
      res.json(data)
    })
  } catch (err) {
    // Try by radicals
    var conds = {
      'radicals': req.params.id_or_radicals
    }
    if (req.params.variant) {
      conds['variant'] = parseInt(req.params.variant, 10)
    }
    var opts = {
    }
    collection.findOne(conds, opts, function (err, data) {
      if (err) {
        res.status(500).send(err)
        return
      }
      if (!data) {
        res.status(404).end()
        return
      }
      res.json(data)
    })
  }
})

/* Update = POST with ID */
/* Content-Type: application/json */
/* _id in body should match :id or be omitted (otherwise will fail) */
router.post('/:id',
  passport.authenticate('basic', {
    session: false
  }),
  function (req, res, next) {
    var collection = req.db.get('roots')
    collection.update(req.params.id, { '$set': req.body }, function (err) {
      if (err) {
        res.status(500).send(err)
        return
      }
      collection.findOne(req.params.id, function (err, data) {
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
    var coll_r = req.db.get('roots')
    var root_id = monk.id(req.params.id)
    coll_r.remove(root_id, function (err) {
      if (err) {
        res.status(500).send(err)
        return
      }
      log(req, root_id, null, 'created')
      res.end()
    })
  })

module.exports = router
