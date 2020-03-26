var extend = require('extend')
module.exports = {

  sourceKey: 'Camilleri2015',

  inflect: function (body, callback) {
    var lemma = body.lemma // 'bravu'
    if (!lemma) {
      return callback(new Error('No lemma provided'), null)
    }

    var infs = inflections(lemma)
    var forms = [
      {
        'surface_form': infs.m,
        'number': 'sg',
        'gender': 'm'
      },
      {
        'surface_form': infs.f,
        'number': 'sg',
        'gender': 'f'
      },
      {
        'surface_form': infs.pl,
        'number': 'pl',
        'gender': 'mf'
      }
    ]
    var extras = {
      'sources': [this.sourceKey]
    }
    for (var f in forms) {
      extend(true, forms[f], extras)
    }

    callback(null, forms)
  }
}

function inflections (lemma) {
  var m = lemma
  var f
  var pl
  if (lemma.match(/u$/)) { // bravu
    var stem = lemma.slice(0, -1)
    f = stem + 'a' // brava
    pl = stem + 'i' // bravi
  } else if (lemma.match(/i$/)) { // mimli
    f = lemma + 'ja' // mimlija
    pl = lemma + 'jin' // mimlijin
  } else {
    f = lemma + 'a' // maħmuġa
    pl = lemma + 'in' // maħmuġin
  }
  return {
    m: m,
    f: f,
    pl: pl
  }
}
