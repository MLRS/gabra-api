/* globals describe it */

require('should')

/* Tests for feedback functionality */
describe('Morphological generation', function () {
  describe('Adjectives', function () {
    const gen = require('../morpho/adjective')

    function check (m, f, pl, done) {
      gen.inflect(
        {lemma: m},
        function (err, forms) {
          if (err) {
            done(err)
            return
          }
          forms.should.containEql({
            'surface_form': m,
            'number': 'sg',
            'gender': 'm',
            'sources': [gen.sourceKey]
          })
          forms.should.containEql({
            'surface_form': f,
            'number': 'sg',
            'gender': 'f',
            'sources': [gen.sourceKey]
          })
          forms.should.containEql({
            'surface_form': pl,
            'number': 'pl',
            'gender': 'mf',
            'sources': [gen.sourceKey]
          })
          done()
        }
      )
    }

    it('bravu', function (done) {
      check('bravu', 'brava', 'bravi', done)
    })
    it('mimli', function (done) {
      check('mimli', 'mimlija', 'mimlijin', done)
    })
    it('maħmuġ', function (done) {
      check('maħmuġ', 'maħmuġa', 'maħmuġin', done)
    })
  })

  describe('Nouns', function () {
    const gen = require('../morpho/noun')

    function check (sg, pl, g, done) {
      gen.inflect(
        {lemma: sg},
        function (err, forms) {
          if (err) {
            done(err)
            return
          }
          forms.should.containEql({
            'surface_form': sg,
            'number': 'sg',
            'gender': g,
            'sources': [gen.sourceKey]
          })
          forms.should.containEql({
            'surface_form': pl,
            'number': 'pl',
            'gender': 'mf',
            'sources': [gen.sourceKey]
          })
          done()
        }
      )
    }

    it('widna', function (done) {
      check('widna', 'widniet', 'f', done)
    })
    it('baħri', function (done) {
      check('baħri', 'baħrin', 'm', done)
    })
    it('rota', function (done) {
      check('rota', 'roti', 'f', done)
    })
    it('triq', function (done) {
      check('triq', 'triqat', 'm', done)
    })
    it('widna', function (done) {
      check('widna', 'widniet', 'f', done)
    })
  })
})
