const express = require('express')
const router = express.Router()

var config = require('../server-config')

/* GET home page */
router.get('/', function (req, res, next) {
  res.redirect(`${res.locals.pageURL}/home`)
})

/* GET sitemap for Gabra site */
router.get('/sitemap.gabra.txt', function (req, res, next) {
  var db = req.db
  var base = config.gabraURL
  let t = []
  t.push(`${base}/lexemes`)
  t.push(`${base}/roots`)
  t.push(`${base}/sources`)
  let p1 = db.get('lexemes').find()
  let p2 = db.get('roots').find()
  Promise.all([p1, p2]).then((values) => {
    for (let l of values[0]) {
      t.push(`${base}/lexemes/view/${l._id}`)
    }
    for (let r of values[1]) {
      let rads = encodeURIComponent(r.radicals)
      if (r.variant) {
        t.push(`${base}/roots/view/${rads}/${r.variant}`)
      } else {
        t.push(`${base}/roots/view/${rads}`)
      }
    }
    res.header('Content-Type', 'text/plain')
    res.send(t.join('\n'))
  })
})

module.exports = router
