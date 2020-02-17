/* eslint-disable camelcase, no-multi-spaces, key-spacing */

var express = require('express')
var router = express.Router()
var fs = require('fs')
var async = require('async')
var passport = require('passport')
var regexquote = require('regexp-quote')
var monk = require('monk')

var log = require('../logger').makeLogger('lexemes')
var log_wf = require('../logger').makeLogger('wordforms')

// -- Searching methods -----------------------------------------------------

const min_length_l = 2
const min_length_g = 3
const min_length_wf = 3

/*
 * GET search for glosses
 */
router.get('/search_gloss', function (req, res) {
  var db = req.db
  var glosses_coll = db.get('glosses')
  var lexemes_coll = db.get('lexemes')
  var queryObj = getQuery(req, {
    term: {param: 's'},
    pending: {default: false},
    pos: {},
    source: {}
  })

  if (queryObj.page < 1) {
    res.status(400).send('Invalid page number')
    return
  }

  // Check length of query
  if (queryObj.term.length < min_length_g) {
    res.status(422).send('Search term too short')
    return
  }

  var conds_g = {
    '$text': {'$search': queryObj.term} // search by text match
  }

  var opts_g = {
    'projection': {'score': {'$meta': 'textScore'}},
    'sort': {'score': {'$meta': 'textScore'}}
  }

  // Search in glosses collection first
  // Return ALL matches, then page manually on lexeme IDs
  glosses_coll.find(conds_g, opts_g, function (err, docs) {
    if (err) {
      console.error(err)
      res.status(500).end()
      return
    }

    // collect all lexeme IDs in the order returned
    var lex_ids = docs.map(d => d.lexeme_id)

    // Slice lex_ids to current page
    var pagestart = queryObj.page_size * (queryObj.page - 1)
    var lex_ids_paged = lex_ids.slice(pagestart, pagestart + queryObj.page_size)

    // find the lexemes by ID
    var conds_l = {
      '_id': {'$in': lex_ids_paged}
    }
    var opts_l = { }
    lexemes_coll.find(conds_l, opts_l, function (err, results) {
      if (err) {
        console.error(err)
        res.status(500).end()
        return
      }

      // sort results based on order of lex_ids
      results.sort(function (a, b) {
        return lex_ids.indexOf(a['_id'].toString()) - lex_ids.indexOf(b['_id'].toString())
      })

      // wrap in 'lexeme'
      var docs2 = results.map(function (doc) {
        return {
          'lexeme': doc
        }
      })

      var show_count = true // always
      // var show_count = queryObj.page === 1 // first page
      // var show_count = false // never

      if (show_count) {
        queryObj.result_count = lex_ids.length
        res.json({
          'results': docs2,
          'query': queryObj
        })
      } else {
        // When page > 1 don't count
        queryObj.result_count = null
        res.json({
          'results': docs2,
          'query': queryObj
        })
      }
    }) // end lexemes.find
  })
})

/*
 * GET search
 */
router.get('/search', function (req, res) {
  var db = req.db
  var collection = db.get('lexemes')
  var queryObj = getQuery(req, {
    term             : {param: 's'},
    search_lemma     : {param: 'l', default: true},
    search_wordforms : {param: 'wf', default: true},
    search_gloss     : {param: 'g', default: true},
    pending          : {default: false},
    pos              : {},
    source           : {}
  })

  if (queryObj.page < 1) {
    res.status(400).send('Invalid page number')
    return
  }

  var conds_l = searchConditions(queryObj)
  var opts = {
    'limit': queryObj.page_size,
    'skip': queryObj.page_size * (queryObj.page - 1)
  }

  // opts: sorting depends on type of query
  if (queryObj.search_lemma) {
    // for lemma search, sort by $meta textScore on lemma
    // NB: this is handled in addCondition -- lemma search is done via $text
    opts['projection'] = {'score': {'$meta': 'textScore'}}
    opts['sort']   = {'score': {'$meta': 'textScore'}}
  } else {
    opts['sort'] = {'lemma': 1}
  }

  // Do final search and return
  function ret () {
    collection.find(conds_l, opts, function (err, docs) {
      if (err) {
        console.error(err)
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
            console.error(err)
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
        console.error(err)
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
 * GET lexeme wordforms:
 */
router.get('/wordforms/:id', function (req, res) {
  var db = req.db
  var collection = db.get('wordforms')
  var lexeme_id
  try {
    lexeme_id = monk.id(req.params.id)
  } catch (err) {
    res.status(400).send('Invalid ID')
    return
  }

  var conds = {
    lexeme_id: lexeme_id
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
      console.error(err)
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
          // if (!has_a && !has_b) continue
          // if (!has_a) return -1 // a is smaller
          // if (!has_b) return 1 // b is smaller

          var blank_a = !has_a || a[f] === null || a[f] === ''
          var blank_b = !has_b || b[f] === null || b[f] === ''
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
    lexeme_id = monk.id(req.params.id)
  } catch (err) {
    res.status(400).send('Invalid ID')
    return
  }
  collection.findOne(lexeme_id, function (err, doc) {
    if (err) {
      console.error(err)
      res.status(500).end()
      return
    }
    if (doc && doc.root && doc.root.radicals) {
      var conds = {
        'pending': {'$ne': true},
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
          console.error(err)
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
  var opts = {
    'projection': {'lemma': true}
  }
  collection.find(query, opts, function (err, docs) {
    if (err) {
      console.error(err)
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
      console.error(err)
      res.status(500).end()
      return
    }
    var lids = docs_wf.map(function (doc) {
      return doc.lexeme_id
    })
    coll_l.find({'_id': {'$in': lids}}, function (err, docs_l) {
      if (err) {
        console.error(err)
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

/*
 * GET count
 */
router.get('/count', function (req, res) {
  var db = req.db
  var coll = db.get('lexemes')
  coll.count({}, function (err, result) {
    if (err) {
      console.error(err)
      res.status(500).end()
      return
    }
    res.json(result)
  })
})

/*
 * GET random
 */
router.get('/random', function (req, res) {
  var db = req.db
  var coll = db.get('lexemes')
  coll.aggregate([
    {'$match': {'pending': {'$ne': true}}},
    {'$sample': {'size': 1}}
  ], function (err, result) {
    if (err) {
      console.error(err)
      res.status(500).end()
      return
    }
    res.json(result[0])
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

/**
 * Process query from request and extract relevant parts
 *
 * params is an object of key => opts
 * where opts can contain:
 *   - param: the query-string param (or same as key if ommitted)
 *   - default: default value, used to determine type too
 * default type is string, default default is ''
 * Note: all string values are trimmed
 */
var getQuery = function (req, params) {
  var q = req.query
  var obj = {
    page         : parseInt(q.page, 10) || 1,
    page_size    : 20,
    result_count : null // don't know yet
  }
  for (var key in params) {
    var name = params[key].hasOwnProperty('param') ? params[key].param : key
    var def = params[key].hasOwnProperty('default') ? params[key].default : ''
    if (def === true || def === false) {
      // boolean
      obj[key] = boolItem(q, name, def)
    } else {
      // string
      obj[key] = (q.hasOwnProperty(name) && q[name]) ? q[name].trim() : null
    }
  }
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

  // if we search in lemma,
  // we want a $text search with $meta textScore (for sorting)
  // NB: $text search is case insensitive by default, so no need to specify
  if (field === 'lemma') {
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

    // Search in lexemes.glosses.gloss
    if (queryObj.search_gloss && queryObj.term.length >= min_length_g) {
      addCondition(conds, 'glosses.gloss', q)
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
  async.parallel(
    {
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
      }
    },
    function (err, results) {
      if (err) {
        // Not loading schema is not fatal!
        console.error(err)
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
    collection.insert(req.body, function (err, data) {
      if (err) {
        res.status(500).send(err)
        return
      }
      log(req, data._id, data, 'created')
      res.json(data)
    })
  })

/* Index = GET */
router.get('/', function (req, res, next) {
  var collection = req.db.get('lexemes')
  collection.find({}, function (err, data) {
    if (err) {
      res.status(500).send(err)
      return
    }
    res.setHeader('Cache-Control', 'public, max-age=604800') // 7 days
    res.json(data)
  })
})

/* Read = GET with ID */
router.get('/:id', function (req, res, next) {
  var collection = req.db.get('lexemes')
  try {
    monk.id(req.params.id)
  } catch (err) {
    res.status(400).send('Invalid ID')
    return
  }
  collection.findOne(req.params.id, function (err, data) {
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
    var coll_l = req.db.get('lexemes')
    var coll_wf = req.db.get('wordforms')
    var lexeme_id = monk.id(req.params.id)
    coll_l.remove(lexeme_id, function (err) {
      if (err) {
        res.status(500).send(err)
        return
      }
      log(req, req.params.id, null, 'deleted')

      // First find wordforms so we can log them
      coll_wf.find({'lexeme_id': lexeme_id}, function (err, data) {
        if (err) {
          console.error(err)
          return
        }
        data.forEach(function (item) {
          log_wf(req, item._id, null, 'deleted')
        })

        // Then delete wordforms
        coll_wf.remove({'lexeme_id': lexeme_id}, function (err) {
          if (err) {
            res.status(500).send(err)
            return
          }
          res.end()
        })
      })
      res.end()
    })
  })

module.exports = router
