/* globals describe beforeEach afterEach it */

var request = require('supertest')

describe('General', function () {
  var server

  beforeEach(function () {
    server = require('../app')
  })

  afterEach(function () {
    // server.close()
  })

  it('responds to /', function (done) {
    request(server)
      .get('/')
      .expect(200, done)
  })

  it('version number matches', function (done) {
    request(server)
      .get('/')
      .expect(200)
      .end(function (err, res) {
        if (err) {
          throw err
        }
        var version = require('../package.json').version
        res.text.should.containEql('<h1>Ġabra API v' + version, 'version number on homepage should match package.json')
        done()
      })
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
