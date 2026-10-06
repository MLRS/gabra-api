/* globals describe it before after */

var monk = require('monk')
var db = monk(process.env.DB_URL)

var request = require('supertest')
require('should')

const username = 'test-user-auth'
const password = 'test-password-auth'

/* Tests for all CRUD editing functionality */
describe('CRUD', function () {
  const server = require('../app')

  before(function () {
    // Create test user
    var salted = process.env.SALT + password
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
