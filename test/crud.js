/* globals describe it before after */

var config = require('../server-config.js')
var monk = require('monk')
var db = monk(config.dbUrl)

var request = require('supertest')
require('should')

const username = 'test-user-crud'
const password = 'test-password-crud'

/* Tests for all CRUD editing functionality */
describe('CRUD', function () {
  const server = require('../app')

  before(function () {
    // Create test user
    var salted = config.salt + password
    var shasum = require('crypto').createHash('sha1')
    var hashed = shasum.update(salted).digest('hex')
    return db.get('users').insert({
      'username': username,
      'password': hashed
    })
  })

  after(function () {
    // Remove test user
    return db.get('users').remove({
      'username': username
    })
  })

  // -------------------------------------------------------------------------

  describe('Lexemes', function () {
    const path = '/lexemes'
    let doc = {lemma: 'ijfp9e48fp4w90j'}
    let doc2 = {lemma: '9e8fjk94fk09dk'}
    var id = null // ID of created test record, from create

    it('create lexeme', function (done) {
      request(server)
        .post(path)
        .auth(username, password)
        .send(doc)
        .expect(function (res) {
          id = res.body._id
          delete res.body._id
        })
        .expect(200, doc, done)
    })

    it('read lexeme', function (done) {
      if (!id) {
        this.skip()
      }
      request(server)
        .get(`${path}/${id}`)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            throw err
          }
          res.body.lemma.should.equal(doc.lemma)
          done()
        })
    })

    it('update lexeme', function (done) {
      if (!id) {
        this.skip()
      }
      request(server)
        .post(`${path}/${id}`)
        .auth(username, password)
        .send(doc2)
        .expect(function (res) {
          delete res.body._id
        })
        .expect(200, doc2, done)
    })

    it('delete lexeme', function (done) {
      if (!id) {
        this.skip()
      }
      request(server)
        .delete(`${path}/${id}`)
        .auth(username, password)
        .expect(200, done)
    })
  })

  // -------------------------------------------------------------------------

  describe('Wordforms', function () {
    const path = '/wordforms'
    let lexeme_id = '5cbf5064565ea44922694759'
    let doc = {surface_form: 'ijfp9e48fp4w90j', lexeme_id: lexeme_id}
    let doc2 = {surface_form: '9e8fjk94fk09dk', lexeme_id: lexeme_id}
    var id = null // ID of created test record, from create

    it('create wordform', function (done) {
      request(server)
        .post(path)
        .auth(username, password)
        .send(doc)
        .expect(function (res) {
          id = res.body._id
          delete res.body._id
        })
        .expect(200, doc, done)
    })

    it('read wordform', function (done) {
      if (!id) {
        this.skip()
      }
      request(server)
        .get(`${path}/${id}`)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            throw err
          }
          res.body.surface_form.should.equal(doc.surface_form)
          done()
        })
    })

    it('update wordform', function (done) {
      if (!id) {
        this.skip()
      }
      request(server)
        .post(`${path}/${id}`)
        .auth(username, password)
        .send(doc2)
        .expect(function (res) {
          delete res.body._id
        })
        .expect(200, doc2, done)
    })

    it('delete wordform', function (done) {
      if (!id) {
        this.skip()
      }
      request(server)
        .delete(`${path}/${id}`)
        .auth(username, password)
        .expect(200, done)
    })
  })

  // -------------------------------------------------------------------------

  describe('Roots', function () {
    const path = '/roots'
    let doc = {radicals: 'ijfp9e48fp4w90j'}
    let doc2 = {radicals: '9e8fjk94fk09dk'}
    var id = null // ID of created test record, from create

    it('create root', function (done) {
      request(server)
        .post(path)
        .auth(username, password)
        .send(doc)
        .expect(function (res) {
          id = res.body._id
          delete res.body._id
        })
        .expect(200, doc, done)
    })

    it('read root', function (done) {
      if (!id) {
        this.skip()
      }
      request(server)
        .get(`${path}/${id}`)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            throw err
          }
          res.body.radicals.should.equal(doc.radicals)
          done()
        })
    })

    it('update root', function (done) {
      if (!id) {
        this.skip()
      }
      request(server)
        .post(`${path}/${id}`)
        .auth(username, password)
        .send(doc2)
        .expect(function (res) {
          delete res.body._id
        })
        .expect(200, doc2, done)
    })

    it('delete root', function (done) {
      if (!id) {
        this.skip()
      }
      request(server)
        .delete(`${path}/${id}`)
        .auth(username, password)
        .expect(200, done)
    })
  })
})
