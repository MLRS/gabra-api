/* globals describe it before */

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

      // Lexeme results should contain these lemmas (in any order)
      if (opts.lemmas) {
        for (let i in opts.lemmas) {
          let lemma = opts.lemmas[i]
          res.body.results.should.matchAny(function (value) {
            value.lexeme.lemma.should.equal(lemma)
          }, `lemma "${lemma}" not found in results`)
        }
      }

      // Wordform results should contain these surface forms (in any order)
      if (opts.surface_forms) {
        for (let i in opts.surface_forms) {
          let sf = opts.surface_forms[i]
          res.body.results.should.matchAny(function (value) {
            value.wordform.surface_form.should.equal(sf)
          }, `surface form "${sf}" not found in results`)
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

  describe('Search suggest', function () {
    it('suggest lexeme', function (done) {
      request(server)
        .get('/lexemes/search_suggest?s=Hareg')
        .expect(200)
        .end(checkResponse({lemmas: ['ħareġ']}, done))
    })

    it('suggest wordform', function (done) {
      request(server)
        .get('/wordforms/search_suggest?s=harget')
        .expect(200)
        .end(checkResponse({surface_forms: ['ħarġet']}, done))
    })
  })

  // -------------------------------------------------------------------------

  describe('Load stuff', function () {
    var lexeme_id

    // Get lexeme id for 'kiteb', to be used in test cases below
    before(function (done) {
      request(server)
        .get('/lexemes/search?s=kiteb&wf=0&g=0')
        .expect(200)
        .end(function (err, res) {
          if (err) {
            throw err
          }
          lexeme_id = res.body.results[0].lexeme._id
          done()
        })
    })

    it('load lexeme by id', function (done) {
      request(server)
        .get(`/lexemes/${lexeme_id}`)
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
      let bad_id = '1' + lexeme_id.slice(1)
      request(server)
        .get(`/lexemes/${bad_id}`)
        .expect(404)
        .end(done)
    })

    it('load lexeme with malformed id', function (done) {
      let bad_id = lexeme_id.slice(1)
      request(server)
        .get(`/lexemes/${bad_id}`)
        .expect(400)
        .end(done)
    })

    it('load wordforms by lexeme id', function (done) {
      request(server)
        .get(`/lexemes/wordforms/${lexeme_id}?pending=1`)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            throw err
          }
          res.body.length.should.be.greaterThanOrEqual(6) // amount of wordforms in test data
          done()
        })
    })

    it('load wordforms by lexeme id are sorted', function (done) {
      request(server)
        .get(`/lexemes/wordforms/${lexeme_id}?pending=1`)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            throw err
          }
          // Results should contain these surface forms (in specific order, not strict)
          let surface_forms_ordered = ['ktibt', 'kitbet']
          let lastIx = -1
          for (let sf of surface_forms_ordered) {
            let thisIx = -1
            let found = false
            for (let wf of res.body) {
              thisIx++
              if (wf.surface_form === sf) {
                found = true
                break
              }
            }
            found.should.be.true(`surface form ${sf} not found in results`)
            thisIx.should.greaterThan(lastIx, `surface form ${sf} found in unexpected order`)
            lastIx = thisIx
          }
          done()
        })
    })

    it('load wordforms by lexeme id (no pending)', function (done) {
      request(server)
        .get(`/lexemes/wordforms/${lexeme_id}`)
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
        .get(`/lexemes/related/${lexeme_id}`)
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

    it('load related lexemes for root-less lexeme', function (done) {
      request(server)
        .get('/lexemes/search?s=pitazz&wf=0&g=0')
        .expect(200)
        .end(function (err, res) {
          if (err) {
            throw err
          }
          lexeme_id = res.body.results[0].lexeme._id
          request(server)
            .get(`/lexemes/related/${lexeme_id}`)
            .expect(200)
            .end(function (err, res) {
              if (err) {
                throw err
              }
              res.body.length.should.equal(0)
              done()
            })
        })
    })

    it('load random lexeme', function (done) {
      request(server)
        .get('/lexemes/random')
        .expect(200)
        .end(function (err, res) {
          if (err) {
            throw err
          }
          res.body.should.ownProperty('_id')
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

  describe('Search roots', function () {
    const path = '/roots/search'

    it('search for whole root', function (done) {
      request(server)
        .get(path + '?s=k-t-b')
        .expect(200)
        .end(checkResponse({result_count: 1}, done))
    })

    it('search by radical', function (done) {
      request(server)
        .get(path + '?c2=r')
        .expect(200)
        .end(checkResponse({result_count: 3}, done))
    })

    it('search by lemma', function (done) {
      request(server)
        .get(path + '?s=kiteb')
        .expect(200)
        .end(checkResponse({result_count: 1}, done))
    })

    it('search by gloss', function (done) {
      request(server)
        .get(path + '?s=published') // matches ħ-r-ġ
        .expect(200)
        .end(checkResponse({result_count: 1}, done))
    })

    it('search by gloss (with variant)', function (done) {
      request(server)
        .get(path + '?s=polish') // matches b-r-d 1 (not 2)
        .expect(200)
        .end(function (err, res) {
          if (err) {
            throw err
          }
          res.body.results.should.matchEvery(function (value) {
            // if (value.root.variant) {
            //   value.root.variant.should.equal(1)
            // }
            if (value.root.radicals === 'b-r-d') {
              value.root.variant.should.equal(1)
            }
          })
          done()
        })
    })
  })
})
