var express = require('express')
var router = express.Router()

var fs = require('fs')
var marked = require('marked')

function markdownPage (req, res, next, params) {
  fs.readFile(params.mdfile, 'utf8', function (err, data) {
    if (err) {
      console.log(err)
      res.status(500).send('Cannot open ' + params.mdfile)
      return
    }
    // Replace variables in markdown file
    data = data.replace(/#{(.+?)}/g, function (m, c1) {
      return res.locals[c1]
    })
    var content = marked(data)
    content = content.replace(/<table>/g, '<table class="table">')
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
    title: 'Schema'
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
      console.log(err)
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
