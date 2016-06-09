var express = require('express')
var router = express.Router()
var fs = require('fs')
var async = require('async')
var passport = require('passport')
var regexquote = require('regexp-quote')

var log = require('../logger').makeLogger('lexemes')

// -- Searching methods -----------------------------------------------------

const min_length_l = 2
const min_length_g = 3
const min_length_wf = 3

/*
 * GET search
 */
router.get('/search', function (req, res) {
  var db = req.db
  var collection = db.get('lexemes')
  var queryObj = getQuery(req)

  if (queryObj.page < 1) {
    res.status(400).send('Invalid page number')
    return
  }

  var conds_l = searchConditions(queryObj)
  var pagesize = queryObj.page_size
  var opts = {
      'limit': pagesize,
      'skip': pagesize * (queryObj.page - 1)
  }

  //opts: sorting depends on type of query
  if(queryObj.search_lemma) {
      //for lemma search, sort by $meta textScore on lemma
      //NB: this is handled in addCondition -- lemma search is done via $text
      opts['fields'] = {'score': {'$meta': 'textScore'}}
      opts['sort']   = {'score': {'$meta': 'textScore'}}
  } else {
      opts['sort'] = {'lemma': 1}
  }

  // Do final search and return
  function ret () {
    collection.find(conds_l, opts, function (err, docs) {
      if (err) {
        console.log(err)
        res.status(500).end()
        return
      }

      // wrap in 'lexeme'
      var docs2 = docs.map(function (doc) {
        return {
          'lexeme': doc
        }
      })

      var show_count = true // always
      // var show_count = queryObj.page === 1 // first page
      // var show_count = false // never

      if (show_count) {
        collection.count(conds_l, function (err, count) {
          if (err) {
            console.log(err)
          }
          queryObj.result_count = count
          res.json({
            'results': docs2,
            'query': queryObj
          })
        })
      } else {
        // When page > 1 don't count
        queryObj.result_count = null
        res.json({
          'results': docs2,
          'query': queryObj
        })
      }
    })
  }

  // Separate query to search in wordforms first
  if (queryObj.search_wordforms && queryObj.term && queryObj.term.length >= min_length_wf) {
    var conds_wf = {}
    addCondition(conds_wf, 'surface_form', queryObj.term, {prefix: true})
    addCondition(conds_wf, 'alternatives', queryObj.term, {prefix: true})
    db.get('wordforms').distinct('lexeme_id', conds_wf, function (err, lex_ids) {
      if (err) {
        console.log(err)
      } else if (lex_ids.length > 0) {
        addOr(conds_l, '_id', {'$in': lex_ids})
      }
      ret()
    })
  } else {
    ret()
  }
})

/*
 * GET lexeme wordforms
 */
router.get('/wordforms/:id', function (req, res) {
  var db = req.db
  var collection = db.get('wordforms')
  var lexeme_id
  try {
    lexeme_id = collection.id(req.params.id)
  } catch (err) {
    res.status(400).send('Invalid ID').end()
    return
  }

  var conds = {
    lexeme_id: lexeme_id,
  }

  // if pending=0 (default), make sure no pending wordforms are included
  if (!boolItem(req.query, 'pending', false)) {
    conds['pending'] = {'$ne': true}
  }

  if (req.query.hasOwnProperty('exclude_sources')) {
    var exs = req.query.exclude_sources.split(',')
    if (exs.length > 0) {
      conds['$or'] = [
        {'sources': {'$exists': false}},
        {'sources': {'$nin': exs}}
      ]
    }
  }
  if (req.query.match) {
    conds['surface_form'] = {'$regex': regexquote(req.query.match)}
  }
  collection.find(conds, {}, function (err, docs) {
    if (err) {
      console.log(err)
      res.status(500).end()
      return
    }

    var sort = boolItem(req.query, 'sort', true)
    if (sort) {
      var agr_fields = {
        'number': ['sg', 'pl'],
        'person': ['p1', 'p2', 'p3'],
        'gender': ['m', 'f']
      }
      var fields = {
        'aspect': ['perf', 'impf', 'imp', 'prespart', 'pastpart'],
        'ind_obj': agr_fields,
        'dir_obj': agr_fields,
        'subject': agr_fields,
        'polarity': ['pos', 'neg'],
        'number': ['sg', 'sgv', 'coll', 'dl', 'pl', 'sp'],
        'gender': ['m', 'f', 'mf']
      }
      var sortF = function (a, b, fields) {
        for (var f in fields) {
          var has_a = a.hasOwnProperty(f)
          var has_b = b.hasOwnProperty(f)
          if (!has_a && !has_b) continue
          if (!has_a) return -1 // a is smaller
          if (!has_b) return 1 // b is smaller

          var blank_a = a[f] === null || a[f] === ''
          var blank_b = b[f] === null || b[f] === ''
          if (blank_a && blank_b) continue
          if (blank_a) return -1 // a is smaller
          if (blank_b) return 1 // b is smaller

          if (typeof fields[f] === 'object' && !Array.isArray(fields[f])) {
            var s = sortF(a[f], b[f], fields[f])
            if (s === 0) continue
            else return s
          }

          var afx = fields[f].indexOf(a[f])
          var bfx = fields[f].indexOf(b[f])
          if (afx === -1) return 1
          if (bfx === -1) return -1
          if (afx !== bfx) return (afx - bfx)
          // otherwise keep going to next field
        }

        // nothing to compare on
        return 0
      }
      docs.sort(function (a, b) {
        return sortF(a, b, fields)
      })
    }

    res.json(docs)
  })
})

/*
 * GET lexeme related
 */
router.get('/related/:id', function (req, res) {
  var db = req.db
  var collection = db.get('lexemes')
  var lexeme_id
  try {
    lexeme_id = collection.id(req.params.id)
  } catch (err) {
    res.status(400).send('Invalid ID').end()
    return
  }
  collection.findById(lexeme_id, function (err, doc) {
    if (err) {
      console.log(err)
      res.status(500).end()
      return
    }
    if (doc && doc.root) {
      var conds = {
        'root.radicals': doc.root.radicals,
        '_id': {'$ne': doc._id}
      }
      if (doc.root.variant) {
        conds['root.variant'] = doc.root.variant
      }
      var opts = {
        'sort': {
          'pos': 1,
          'derived_form': 1
        }
      }
      collection.find(conds, opts, function (err, docs) {
        if (err) {
          console.log(err)
          res.status(500).end()
          return
        }
        res.json(docs)
      })
    } else {
      res.json([])
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
  s = s.replace(/^\^/, '')
  s = s.replace(/\$$/, '')
  s = s.replace(/c/g, 'ċ')
  s = s.replace(/g/g, '[gġ]')
  s = s.replace(/h/g, '[hħ]')
  s = s.replace(/z/g, '[zż]')

  // No substrings
  s = '^' + s + '$'

  var collection = db.get('lexemes')
  var query = {
    '$or': [
      {
        'lemma': {'$regex': s, '$ne': orig}
      },
      {
        'alternatives': {'$regex': s, '$ne': orig}
      }
    ],
    'pending': {'$ne': true}
  }
  var fields = ['lemma']
  collection.find(query, fields, function (err, docs) {
    if (err) {
      console.log(err)
      res.status(500).end()
      return
    }
    res.json({
      'results': docs,
      'query': {
        'term': orig,
        'result_count': docs.length
      }
    })
  })
})

/*
 * GET lemmatise
 */
router.get('/lemmatise', function (req, res) {
  var db = req.db
  var coll_wf = db.get('wordforms')
  var coll_l = db.get('lexemes')
  var term = '^' + regexquote(req.query.s)
  var conds = {
    '$or': [
      {'surface_form': {'$regex': term}},
      {'alternatives': {'$regex': term}}
    ]
  }
  coll_wf.find(conds, function (err, docs_wf) {
    if (err) {
      console.log(err)
      res.status(500).end()
      return
    }
    var lids = docs_wf.map(function (doc) {
      return doc.lexeme_id
    })
    coll_l.find({'_id': {'$in': lids}}, function (err, docs_l) {
      if (err) {
        console.log(err)
        res.status(500).end()
        return
      }
      // transform for indexing
      var docs_ix = {}
      docs_l.forEach(function (doc) {
        docs_ix[doc._id] = doc
      })
      // add lexeme info to each wf result
      var results = docs_wf.map(function (doc) {
        return {
          'wordform': doc,
          'lexeme': docs_ix[doc.lexeme_id]
        }
      })
      var query = {
        'term': term,
        'raw_term': req.query.s,
        'result_count': docs_l.length,
        'matches': docs_wf.length
      }
      res.json({
        'results': results,
        'query': query
      })
    })
  })
})

// -- Private helper methods ------------------------------------------------

function boolItem (obj, key, def) {
  if (obj.hasOwnProperty(key)) {
    switch (obj[key]) {
      case '0':
      case 'f':
      case 'false':
      case '':
        return false
      default:
        return true
    }
  } else {
    return def
  }
}

// Process query from request and extract relevant parts
var getQuery = function (req) {
  var q = req.query

  var term
  if (q.hasOwnProperty('s') && q['s'].trim()) {
    term = q['s'].trim()
  }

  // If someone has CAPS LOCK on...
  // if (term && term == term.toUpperCase()) {
  //     term = term.toLowerCase()
  // }

  /* eslint-disable key-spacing */
  var try_page = parseInt(q.page, 10)
  var obj = {
    term            : term, // could be undefined!
    raw_term        : q.s,
    search_lemma    : boolItem(q, 'l', true),
    search_wordforms: boolItem(q, 'wf', true),
    search_gloss    : boolItem(q, 'g', true),
    pending         : boolItem(q, 'pending', false),
    pos             : q.pos,
    source          : q.source,
    page            : try_page ? try_page : 1,
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
var addCondition = function (conds, field, q, opts) {

  if (opts && opts.hasOwnProperty('prefix') && opts.prefix) {
    q = '^' + regexquote(q)
  } else {
    q = regexquote(q)
  }

  //if we search in lemma,
  //we want a $text search with $meta textScore (for sorting)
  //NB: $text search is case insensitive by default, so no need to specify
  if (field == 'lemma') {
      // TODO: why does it complain when I specify caseSensitive and diacriticSensitive?
      // addOr(conds, '$text', {'$search': q, '$caseSensitive': false, '$diacriticSensitive': false})
      addOr(conds, '$text', {'$search': q})
      addOr(conds, 'lemma', {'$regex': q}) // also search by regex (substring)
  } else {
      addOr(conds, field, {'$regex': q})
      var q_lower = q.toLowerCase()
      if (q !== q_lower) {
        addOr(conds, field, {'$regex': q_lower})
      }
  }
}

// Process query object into search conditions
var searchConditions = function (queryObj) {
  var conds = {}

  if (queryObj.term) {
    var q = queryObj.term

    // Search in lexemes.gloss
    if (queryObj.search_gloss && queryObj.term.length >= min_length_g) {
      addCondition(conds, 'gloss', q)
    }

    // Search in lexemes.lemma
    if (queryObj.search_lemma && queryObj.term.length >= min_length_l) {
      addCondition(conds, 'lemma', q)
      addCondition(conds, 'alternatives', q)
    }

    // Searching in word forms is handled in caller, because of async
  }

  // Specify POS
  if (queryObj.pos) {
    conds['pos'] = queryObj.pos
  }

  // Specify source
  if (queryObj.source) {
    conds['sources'] = queryObj.source // match any in sources
  }

  // Ignore pending
  if (queryObj.pending === false) {
    conds['pending'] = {'$ne': true}
  }

  return conds
}

// -- Edit pages -------------------------------------------------------------

const schema_lexeme = 'public/schemas/lexeme.json'
const schema_wordform = 'public/schemas/wordform.json'

/* GET view */
router.get('/view/:id',
  passport.authenticate('basic', {
    session: false
  }),
  function (req, res, next) {
    loadSchemas(req, res, next, {
      'title': req.params.id, // replaced with lemma on load
      'id': req.params.id
    })
  }
)

/* GET add */
router.get('/add',
  passport.authenticate('basic', {
    session: false
  }),
  function (req, res, next) {
    loadSchemas(req, res, next, {
      'title': 'New entry',
      'id': null
    })
  }
)

function loadSchemas (req, res, next, params) {
  async.parallel({
    l: function (callback) {
      fs.readFile(schema_lexeme, 'utf8', function (err, data) {
        callback(err, JSON.parse(data))
      })
    },
    wf: function (callback) {
      fs.readFile(schema_wordform, 'utf8', function (err, data) {
        // replace variables (baseURL)
        data = data.replace(/#{(.+?)}/g, function (m, c1) {
          return res.locals[c1]
        })
        callback(err, JSON.parse(data))
      })
    }},
    function (err, results) {
      if (err) {
        // Not loading schema is not fatal!
        console.log(err)
        results = {
          l: {},
          wf: {}
        }
      }
      res.render('view', {
        title: params.title,
        schemas: JSON.stringify({
          lexeme: results.l,
          wordform: results.wf
        }),
        id: params.id
      })
    }
  )
}

// -- CRUD Methods ----------------------------------------------------------

/* Create = POST */
/* Content-Type: application/json */
router.post('/',
  passport.authenticate('basic', {
    session: false
  }),
  function (req, res, next) {
    var collection = req.db.get('lexemes')
    req.body['created'] = new Date()
    collection.insert(req.body, function (err, data) {
      if (err) {
        res.status(500).send(err)
      }
      log(req, data._id, data)
      res.json(data)
    })
  })

// /* Index = GET */
// router.get('/', function (req, res, next) {
//   var collection = req.db.get('lexemes')
//   collection.find({}, function (err, data) {
//     if (err) {
//       res.status(500).send(err)
//     }
//     res.json(data)
//   })
// })

/* Read = GET with ID */
router.get('/:id', function (req, res, next) {
  var collection = req.db.get('lexemes')
  try {
    collection.id(req.params.id)
  } catch (err) {
    res.status(400).send('Invalid ID').end()
    return
  }

  collection.findById(req.params.id, function (err, data) {
    if (err) {
      res.status(500).send(err)
    }
    res.json(data)
  })
})

/* Update = POST with ID */
/* Content-Type: application/json */
/* _id in body should match :id or be omitted (otherwise will fail) */
router.post('/:id',
  passport.authenticate('basic', {
    session: false
  }),
  function (req, res, next) {
    var collection = req.db.get('lexemes')
    if (req.body.hasOwnProperty('created')) {
      req.body['created'] = new Date(req.body.created)
    }
    req.body['modified'] = new Date()
    collection.updateById(req.params.id, req.body, function (err) {
      if (err) {
        res.status(500).send(err)
      }
      collection.findById(req.params.id, function (err, data) {
        if (err) {
          res.status(500).send(err)
        }
        log(req, data._id, data)
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
    var coll_l = req.db.get('lexemes')
    var coll_wf = req.db.get('wordforms')
    var lexeme_id = coll_l.id(req.params.id)
    coll_l.removeById(lexeme_id, function (err) {
      if (err) {
        res.status(500).send(err)
      }
      log(req, req.params.id, null)
      coll_wf.find({'lexeme_id': lexeme_id}, function (err, data) {
        if (err) {
          console.log(err)
          return
        }
        data.forEach(function (item) {
          log(req, item._id, null)
        })
      })
      coll_wf.remove({'lexeme_id': lexeme_id}, function (err) {
        if (err) {
          res.status(500).send(err)
        }
        res.end()
      })
      res.end()
    })
  })

module.exports = router
