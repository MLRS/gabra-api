const express = require('express')
const router = express.Router()

const fs = require('fs')
const marked = require('marked')

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

/* GET home page */
router.get('/', function (req, res, next) {
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
        loadSchemaAsHTML(g1)
      )
  })
})

/**
 * Read JSON schema from file and format as HTML table
 */
function loadSchemaAsHTML (file) {
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
      Source: <a href="schemas/${file}">${file}</a><br>
      <small class="text-muted">Last updated ${stats.mtime.toISOString()}</small>
    </p>
  `
  return html
}

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

module.exports = router
