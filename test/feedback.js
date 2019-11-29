/* globals describe it */

var request = require('supertest')
// var querystring = require('querystring')
// var should = require('should')

const server = require('../app')

/* Tests for feedback functionality
   For Should.js syntax see http://shouldjs.github.io/
*/
describe('Feedback', function () {
  describe('Suggest', function () {
    const path = '/feedback/suggest'

    it('XSS', function (done) {
      request(server)
        .post(path)
        .send({xss: '<script>alert("xss")</script>'})
        .expect(400, done)
    })

    it('existing entry', function (done) {
      request(server)
        .post(path)
        .send({ lemma: 'kiteb', pos: 'VERB' })
        .expect(200, done)
    })

    it('new entry', function (done) {
      request(server)
        .post(path)
        .send({ lemma: `test-${Date.now()}`, pos: 'VERB' })
        .expect(201, done)
    })
  })
})
