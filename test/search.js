/* globals describe beforeEach it */

var request = require('supertest')
var querystring = require('querystring')
var should = require('should')

/* Tests for all searching functionality
   For Should.js syntax see http://shouldjs.github.io/
*/
describe('Search', function () {
  var server

  beforeEach(function () {
    server = require('../app')
  })

  // Function for checking search responses from /lexemes/search
  var checkResponse = function (opts, done) {
    return function (err, res) {
      if (err) {
        throw err
      }
      res.body.should.have.property('results')
      res.body.should.have.property('query')

      // At least N results
      if (opts.result_count) {
        res.body.query.result_count.should.be.greaterThanOrEqual(opts.result_count)
      }

      // Results should contain these lemmas (in any order)
      if (opts.lemmas) {
        for (let i in opts.lemmas) {
          let lemma = opts.lemmas[i]
          res.body.results.should.matchAny(function (value) {
            should(value.lexeme.lemma).equal(lemma)
          }, 'lemma "' + lemma + '" not found in results')
        }
      }

      // Results should contain these lemmas (in specific order)
      if (opts.lemmas_ordered) {
        for (let i in opts.lemmas_ordered) {
          let lemma = opts.lemmas_ordered[i]
          res.body.results[i].lexeme.lemma.should.equal(lemma, 'lemma "' + lemma + '" not found in position ' + i)
        }
      }

      done()
    }
  }

  // -------------------------------------------------------------------------

  describe('Search lexemes', function () {
    const path = '/lexemes/search'

    var mkqs = function (term, opts) {
      return path + '?s=' + term + '&' + querystring.stringify(opts)
    }

    it('search by lemma only', function (done) {
      request(server)
        .get(mkqs('kiteb', {l: 1, wf: 0, g: 0}))
        .expect(200)
        .end(checkResponse({result_count: 1}, done))
    })

    it('search by lemma, wordform', function (done) {
      request(server)
        .get(mkqs('kiteb', {l: 1, wf: 1, g: 0}))
        .expect(200)
        .end(checkResponse({result_count: 1}, done))
    })

    it('search by lemma, wordform, gloss', function (done) {
      request(server)
        .get(mkqs('kiteb', {l: 1, wf: 1, g: 1}))
        .expect(200)
        .end(checkResponse({result_count: 1}, done))
    })

    it('search by gloss only', function (done) {
      request(server)
        .get(mkqs('book', {l: 0, wf: 0, g: 1}))
        .expect(200)
        .end(checkResponse({lemmas: ['ktieb', 'ktejjeb', 'pitazz']}, done))
    })

    it('search results sorted by match', function (done) {
      request(server)
        .get(mkqs('mara')) // default options
        .expect(200)
        .end(checkResponse({lemmas_ordered: ['mara']}, done))
        // .end(checkResponse({lemmas_ordered: ['mara', 'marad', 'xmara']}, done))
    })
  })

  // -------------------------------------------------------------------------

  describe('Load stuff', function () {
    it('load lexeme by id', function (done) {
      request(server)
        .get('/lexemes/5200a366e36f237975000f26')
        .expect(200)
        .end(function (err, res) {
          if (err) {
            throw err
          }
          res.body.lemma.should.equal('kiteb')
          done()
        })
    })

    it('load wordforms by lexeme id', function (done) {
      request(server)
        .get('/lexemes/wordforms/5200a366e36f237975000f26?pending=1')
        .expect(200)
        .end(function (err, res) {
          if (err) {
            throw err
          }
          res.body.length.should.be.greaterThanOrEqual(1000)
          done()
        })
    })

    it('load wordforms by lexeme id (no pending)', function (done) {
      request(server)
        .get('/lexemes/wordforms/5200a366e36f237975000f26')
        .expect(200)
        .end(function (err, res) {
          if (err) {
            throw err
          }
          res.body.should.matchEvery(function (value) {
            if (value.hasOwnProperty('pending')) {
              should(value.pending).equal(false)
            }
          })
          done()
        })
    })

    it('load related lexemes', function (done) {
      request(server)
        .get('/lexemes/related/5200a366e36f237975000f26')
        .expect(200)
        .end(function (err, res) {
          if (err) {
            throw err
          }
          res.body.should.matchEvery(function (value) {
            should(value.root.radicals).equal('k-t-b')
          }, 'radicals should be "k-t-b"')
          done()
        })
    })

    it('load lexemes by root (no variant)', function (done) {
      request(server)
        .get('/roots/lexemes/k-t-b')
        .expect(200)
        .end(function (err, res) {
          if (err) {
            throw err
          }
          res.body.length.should.be.greaterThanOrEqual(9)
          done()
        })
    })

    it('load lexemes by root (with variant)', function (done) {
      request(server)
        .get('/roots/lexemes/b-r-d/2')
        .expect(200)
        .end(function (err, res) {
          if (err) {
            throw err
          }
          res.body.length.should.be.greaterThanOrEqual(13)
          done()
        })
    })
  })

  // -------------------------------------------------------------------------

  describe('Search for root', function () {
    const path = '/roots/search'

    it('search for whole root', function (done) {
      request(server)
        .get(path + '?s=k-t-b')
        .expect(200)
        .end(checkResponse({result_count: 1}, done))
    })

    it('search by radicals', function (done) {
      request(server)
        .get(path + '?c1=k&c3=b')
        .expect(200)
        .end(checkResponse({result_count: 7}, done))
    })
  })
})
