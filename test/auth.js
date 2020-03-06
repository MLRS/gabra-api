/* globals describe it before after */

var config = require('../server-config.js')
var monk = require('monk')
var db = monk(config.dbUrl)

var request = require('supertest')
require('should')

const username = 'test-user'
const password = 'test-password'

/* Tests for all CRUD editing functionality */
describe('CRUD', function () {
  const server = require('../app')

  before(function () {
    // Create test user
    var salted = config.salt + password
    var shasum = require('crypto').createHash('sha1')
    var hashed = shasum.update(salted).digest('hex')
    db.get('users').insert({
      'username': username,
      'password': hashed
    })
  })

  after(function () {
    // Remove test user
    db.get('users').remove({
      'username': username
    })
  })

  describe('Authentication', function () {
    const path = '/auth/login'

    it('no credentials', function (done) {
      request(server)
        .get(path)
        .send({})
        .expect(401, done)
    })

    it('wrong credentials', function (done) {
      request(server)
        .get(path)
        .auth('wrong', 'password')
        .send({})
        .expect(401, done)
    })

    it('correct credentials', function (done) {
      request(server)
        .get(path)
        .auth(username, password)
        .send({})
        .expect(200, done)
    })
  })
})
