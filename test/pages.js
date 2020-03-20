/* globals describe it */

var request = require('supertest')
require('should')

/* Page tests */
describe('Pages', function () {
  const server = require('../app')

  it('responds to /', function (done) {
    request(server)
      .get('/')
      .expect(302, done)
  })

  it('responds to /p/schema', function (done) {
    request(server)
      .get('/p/schema')
      .expect(200, done)
  })
})
