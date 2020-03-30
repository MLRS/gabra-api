/* globals describe it */

require('should')

// All forms should contain an object which is a super-object of form
function contains (forms, form) {
  forms.should.matchAny(function (v) {
    v.should.containEql(form)
  }, `${JSON.stringify(form)} not found in forms`)
}

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
          contains(forms, {
            'surface_form': m,
            'number': 'sg',
            'gender': 'm'
          })
          contains(forms, {
            'surface_form': f,
            'number': 'sg',
            'gender': 'f'
          })
          contains(forms, {
            'surface_form': pl,
            'number': 'pl',
            'gender': 'mf'
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
          contains(forms, {
            'surface_form': sg,
            'number': 'sg',
            'gender': g
          })
          contains(forms, {
            'surface_form': pl,
            'number': 'pl',
            'gender': 'mf'
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

  describe('Loan verbs', function () {
    const gen = require('../morpho/loan-verb')

    function toAgr (ix) {
      return [
        {'person': 'p1', 'number': 'sg'},
        {'person': 'p2', 'number': 'sg'},
        {'person': 'p3', 'number': 'sg', 'gender': 'm'},
        {'person': 'p3', 'number': 'sg', 'gender': 'f'},
        {'person': 'p1', 'number': 'pl'},
        {'person': 'p2', 'number': 'pl'},
        {'person': 'p3', 'number': 'pl'}
      ][ix]
    }

    function check (lemma, tbl, done) {
      gen.inflect(
        {lemma: lemma},
        function (err, forms) {
          if (err) {
            done(err)
            return
          }
          for (let aspect in tbl) {
            for (let ix in tbl[aspect]) {
              let sf = tbl[aspect][ix]
              contains(forms, {
                'aspect': aspect,
                'surface_form': sf,
                'subject': toAgr(Math.floor(ix / 2)),
                'polarity': ix % 2 === 0 ? 'pos' : 'neg'
              })
            }
          }
          done()
        }
      )
    }

    it('sparixxa', function (done) {
      check('sparixxa', {
        'perf': [
          'sparixxejt', 'sparixxejtx',
          'sparixxejt', 'sparixxejtx',
          'sparixxa', 'sparixxiex',
          'sparixxiet', 'sparixxietx',
          'sparixxejna', 'sparixxejniex',
          'sparixxejtu', 'sparixxejtux',
          'sparixxew', 'sparixxewx'
        ],
        'impf': [
          'nisparixxi', 'nisparixxix',
          'tisparixxi', 'tisparixxix',
          'jisparixxi', 'jisparixxix',
          'tisparixxi', 'tisparixxix',
          'nisparixxu', 'nisparixxux',
          'tisparixxu', 'tisparixxux',
          'jisparixxu', 'jisparixxux'
        ]
      }, done)
    })
    it('pparkja', function (done) {
      check('pparkja', {
        'perf': [
          'pparkjajt', 'pparkjajtx',
          'pparkjajt', 'pparkjajtx',
          'pparkja', 'pparkjax',
          'pparkjat', 'pparkjatx',
          'pparkjajna', 'pparkjajniex',
          'pparkjajtu', 'pparkjajtux',
          'pparkjaw', 'pparkjawx'
        ],
        'impf': [
          'nipparkja', 'nipparkjax',
          'tipparkja', 'tipparkjax',
          'jipparkja', 'jipparkjax',
          'tipparkja', 'tipparkjax',
          'nipparkjaw', 'nipparkjawx',
          'tipparkjaw', 'tipparkjawx',
          'jipparkjaw', 'jipparkjawx'
        ]
      }, done)
    })
    it('irreżista', function (done) {
      check('irreżista', {
        'perf': [
          'irreżistejt', 'irreżistejtx',
          'irreżistejt', 'irreżistejtx',
          'irreżista', 'irreżistiex',
          'irreżistiet', 'irreżistietx',
          'irreżistejna', 'irreżistejniex',
          'irreżistejtu', 'irreżistejtux',
          'irreżistew', 'irreżistewx'
        ],
        'impf': [
          'nirreżisti', 'nirreżistix',
          'tirreżisti', 'tirreżistix',
          'jirreżisti', 'jirreżistix',
          'tirreżisti', 'tirreżistix',
          'nirreżistu', 'nirreżistux',
          'tirreżistu', 'tirreżistux',
          'jirreżistu', 'jirreżistux'
        ]
      }, done)
    })
  })
})
