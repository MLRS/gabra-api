const express = require('express')
const router = express.Router()

var monk = require('monk')
const fs = require('fs')
const marked = require('marked')
const passport = require('passport')

/* GET home page */
router.get('/home', function (req, res, next) {
  var mdfile = (req.query.admin) ? 'public/markdown/api-admin.md' : 'public/markdown/api.md'
  markdownPage(req, res, next, {
    mdfile: mdfile,
    title: null
  })
})

/* GET schema page */
router.get('/schema', function (req, res, next) {
  markdownPage(req, res, next, {
    mdfile: 'public/markdown/schema.md',
    title: 'Schema',
    replacer: content =>
      content.replace(/{{(.+\.json)}}/g, (full, g1) =>
        loadSchemaAsHTML(g1, res.locals.baseURL)
      )
  })
})

/* GET tutorial page */
router.get('/tutorial', function (req, res, next) {
  markdownPage(req, res, next, {
    mdfile: 'public/markdown/tutorial.md',
    title: 'Tutorial'
  })
})

/* GET download page */
router.get('/download', function (req, res, next) {
  var path = 'public/data/'
  fs.readdir(path, function (err, data) {
    if (err) {
      console.error(err)
      res.status(500).send('Cannot open ' + path)
      return
    }
    var files = []
    data.forEach(function (file) {
      if (file.slice(-7) === '.tar.gz') {
        var stats = fs.statSync(path + file)
        stats['name'] = file
        files.push(stats)
      }
    })
    files.sort(function (a, b) {
      return b.mtime.getTime() - a.mtime.getTime()
    })
    res.render('download', { title: 'Download', files: files })
  })
})

/* GET search page */
router.get('/search', function (req, res, next) {
  var q = req.query
  q['pending'] = true
  res.render('search', {
    title: 'Search',
    query: q
  })
})

// -- Edit pages -------------------------------------------------------------

function getSchema (collection) {
  let schema
  switch (collection) {
    case 'lexemes':
      schema = JSON.parse(fs.readFileSync('public/schemas/lexeme.json'))
      break
    case 'wordforms':
      schema = JSON.parse(fs.readFileSync('public/schemas/wordform.json'))
      schema.properties.lexeme_id.type = 'string' // patch type to allow string input
      break
    default:
      throw Error('Invalid collection')
  }
  return schema
}

/* GET edit */
router.get('/edit/:collection/:id',
  passport.authenticate('basic', {
    session: false
  }),
  function (req, res, next) {
    try {
      let schema = getSchema(req.params.collection)
      res.render('edit', {
        title: `Edit ${req.params.id}`,
        collection: req.params.collection,
        schema: schema,
        id: req.params.id
      })
    } catch (err) {
      console.error(err)
      res.status(500).end()
    }
  }
)

/* GET add */
router.get('/add/:collection/:lexeme_id?',
  passport.authenticate('basic', {
    session: false
  }),
  function (req, res, next) {
    try {
      let schema = getSchema(req.params.collection)
      res.render('edit', {
        title: `Add ${req.params.collection}`,
        collection: req.params.collection,
        schema: schema,
        lexeme_id: req.params.lexeme_id,
        id: null
      })
    } catch (err) {
      console.error(err)
      res.status(500).end()
    }
  }
)

/* GET history */
router.get('/history/:collection/:id',
  passport.authenticate('basic', {
    session: false
  }),
  function (req, res, next) {
    var collection = req.db.get('logs')
    var conds = {
      'collection': req.params.collection,
      'object_id': monk.id(req.params.id)
    }
    var opts = {
      'sort': {
        'date': -1
      }
    }
    collection.find(conds, opts, function (err, data) {
      if (err) {
        res.status(500).send(err)
        return
      }
      res.render('history', {
        title: 'History',
        collection: req.params.collections,
        id: req.params.id,
        logs: data
      })
    })
  }
)

// -- Edit pages -------------------------------------------------------------

/* GET generate */
router.get('/generate/:lexeme_id',
  passport.authenticate('basic', {
    session: false
  }),
  function (req, res, next) {
    try {
      res.render('generate', {
        lexeme_id: req.params.lexeme_id
      })
    } catch (err) {
      console.error(err)
      res.status(500).end()
    }
  }
)

/* GET replace */
router.get('/replace/:lexeme_id',
  passport.authenticate('basic', {
    session: false
  }),
  function (req, res, next) {
    try {
      res.render('replace', {
        lexeme_id: req.params.lexeme_id
      })
    } catch (err) {
      console.error(err)
      res.status(500).end()
    }
  }
)

// -- Private helpers --------------------------------------------------------

/**
 * Render a markdown feil as HTML and serve it
 * keys for `params`:
 * - mdfile: path to file
 * - title: page title
 */
function markdownPage (req, res, next, params) {
  fs.readFile(params.mdfile, 'utf8', function (err, data) {
    if (err) {
      console.error(err)
      res.status(500).send('Cannot open ' + params.mdfile)
      return
    }
    // Replace variables in markdown file
    data = data.replace(/#{(.+?)}/g, function (m, c1) {
      return res.locals[c1]
    })
    var content = marked(data)
    content = content.replace(/<table>/g, '<table class="table">')
    if (typeof params.replacer === 'function') {
      content = params.replacer(content)
    }
    res.render('index', { title: params.title, body: content })
  })
}

/**
 * Read JSON schema from file and format as HTML table
 */
function loadSchemaAsHTML (file, baseURL) {
  let data = fs.readFileSync(`public/schemas/${file}`, 'utf8')
  let stats = fs.statSync(`public/schemas/${file}`)
  let html = `
    <table class="table">
    <thead>
      <tr>
        <th>Field</th>
        <th>Type</th>
        <th>Description</th>
        <th style="width:40%">Example / allowed values</th>
      </tr>
    </thead>
    <tbody>
  `
  data = JSON.parse(data)
  for (let p in data.properties) {
    let po = data.properties[p]
    let eg = ''
    if (po.examples) {
      eg = po.examples.map(e => `<code>${JSON.stringify(e)}</code>`).join(',<br>')
    } else if (po.enum) {
      eg = po.enum.map(e => `<code>${JSON.stringify(e)}</code>`).join(' / ')
    }
    let refType
    if (po['$ref'] && po['$ref'].startsWith('#/')) { // e.g. '#/definitions/agr'
      let keys = po['$ref'].split('/').slice(1) // e.g. ['definitions','agr']
      refType = keys.reduce((acc, val) => acc[val], data)['type']
    }
    html += `
      <tr>
        <td><code>${p}</code></td>
        <td>${po.type || refType}</td>
        <td>${po.description || ''}${data.required.includes(p) ? '<div class="small text-muted">Required</div>' : ''}</td>
        <td>${eg}</td>
      </tr>
    `
  }
  html += `
    </tbody>
    </table>
    <p>
      Source: <a href="${baseURL}/schemas/${file}">${file}</a><br>
      <small class="text-muted">Last updated ${stats.mtime.toISOString()}</small>
    </p>
  `
  return html
}

module.exports = router
