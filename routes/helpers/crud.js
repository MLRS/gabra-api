// Add CRUD methods to a route
// TODO support overrides

module.exports = function (collectionName, router) {
  var monk = require('monk')
  var passport = require('passport')
  var log = require('./logger').makeLogger(collectionName)
  var updateHelper = require('./update')

  /* Create = POST */
  /* Content-Type: application/json */
  router.post('/',
    passport.authenticate('basic', {
      session: false
    }),
    function (req, res, next) {
      var collection = req.db.get(collectionName)
      collection.insert(req.body)
        .then(data => {
          log(req, data._id, data, 'created')
          res.status(201).json(data)
        })
        .catch(err => {
          console.error(err)
          res.status(500).send(err)
        })
    })

  /* Index = GET */
  router.get('/', function (req, res, next) {
    var collection = req.db.get(collectionName)
    collection.find({})
      .then(data => {
        res.setHeader('Cache-Control', 'public, max-age=604800') // 7 days
        res.json(data)
      })
      .catch(err => {
        console.error(err)
        res.status(500).send(err)
      })
  })

  /* Read = GET with ID */
  router.get('/:id', function (req, res, next) {
    var collection = req.db.get(collectionName)
    try {
      monk.id(req.params.id)
    } catch (err) {
      res.status(400).send('Invalid ID')
      return
    }
    collection.findOne(req.params.id)
      .then(data => {
        if (!data) {
          res.status(404).end()
          return
        }
        res.json(data)
      })
      .catch(err => {
        console.error(err)
        res.status(500).send(err)
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
      var collection = req.db.get(collectionName)
      var newDoc = req.body
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

  /* Set individual fields = POST with ID */
  /* Content-Type: application/json */
  router.post('/set/:id',
    passport.authenticate('basic', {
      session: false
    }),
    function (req, res, next) {
      var collection = req.db.get(collectionName)
      collection.findOneAndUpdate(req.params.id, { '$set': req.body })
        .then(data => {
          log(req, data._id, data, 'modified')
          res.json(data)
        })
        .catch(err => {
          console.error(err)
          res.status(500).send(err)
        })
    })

  /* Unset individual fields = POST with ID */
  /* Content-Type: application/json */
  router.post('/unset/:id',
    passport.authenticate('basic', {
      session: false
    }),
    function (req, res, next) {
      var collection = req.db.get(collectionName)
      collection.findOneAndUpdate(req.params.id, { '$unset': req.body })
        .then(data => {
          log(req, data._id, data, 'modified')
          res.json(data)
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
      var collection = req.db.get(collectionName)
      collection.remove(req.params.id)
        .then(data => {
          log(req, req.params.id, null, 'deleted')
          res.end()
        })
        .catch(err => {
          console.error(err)
          res.status(500).send(err)
        })
    })
}
