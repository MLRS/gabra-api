/* globals describe it */

var request = require('supertest')
require('should')

/* General page tests */
describe('General', function () {
  const server = require('../app')

  it('responds to /', function (done) {
    request(server)
      .get('/')
      .expect(200, done)
  })

  it('responds to /schema', function (done) {
    request(server)
      .get('/schema')
      .expect(200, done)
  })

  it('responds to /download', function (done) {
    request(server)
      .get('/download')
      .expect(200, done)
  })
})
