/* globals describe it */

var request = require('supertest')
var querystring = require('querystring')
require('should')

/* Tests for all searching functionality */
describe('Search', function () {
  const server = require('../app')

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
            value.lexeme.lemma.should.equal(lemma)
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
  })

  // -------------------------------------------------------------------------

  describe('Search lexemes by gloss', function () {
    const path = '/lexemes/search_gloss'

    var mkqs = function (term) {
      return path + '?s=' + term
    }

    it('search results sorted by match', function (done) {
      request(server)
        .get(mkqs('book'))
        .expect(200)
        .end(checkResponse({lemmas: ['ktieb', 'ktejjeb', 'pitazz']}, done))
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

    it('load lexeme with incorrect id', function (done) {
      request(server)
        .get('/lexemes/2500a366e36f237975000f26')
        .expect(404)
        .end(done)
    })

    it('load lexeme with malformed id', function (done) {
      request(server)
        .get('/lexemes/2500a3')
        .expect(400)
        .end(done)
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
              value.pending.should.equal(false)
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
            value.root.radicals.should.equal('k-t-b')
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
          res.body.length.should.be.greaterThanOrEqual(3)
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
          res.body.length.should.be.greaterThanOrEqual(1)
          res.body.should.matchEvery(function (value) {
            value.root.variant.should.equal(2)
          })
          done()
        })
    })

    it('load root by radicals', function (done) {
      request(server)
        .get('/roots/%C4%A7-r-%C4%A1')
        .expect(200)
        .end(function (err, res) {
          if (err) {
            throw err
          }
          res.body.radicals.should.equal('ħ-r-ġ')
          done()
        })
    })

    it('load root by radicals (with variant)', function (done) {
      request(server)
        .get('/roots/b-r-d/2')
        .expect(200)
        .end(function (err, res) {
          if (err) {
            throw err
          }
          res.body.radicals.should.equal('b-r-d')
          res.body.variant.should.equal(2)
          done()
        })
    })

    it('load root with missing radicals', function (done) {
      request(server)
        .get('/roots/k-k-k')
        .expect(404)
        .end(done)
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
        .get(path + '?c2=r')
        .expect(200)
        .end(checkResponse({result_count: 3}, done))
    })
  })
})
