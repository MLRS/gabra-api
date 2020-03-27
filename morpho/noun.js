var extend = require('extend')
module.exports = {

  sourceKey: 'Camilleri2020',

  inflect: function (body, callback) {
    var lemma = body.lemma // 'sufan'
    if (!lemma) {
      return callback(new Error('No lemma provided'), null)
    }

    var forms = [
      {
        'surface_form': lemma,
        'number': 'sg',
        'gender': inferGender(lemma)
      },
      {
        'surface_form': inferPlural(lemma),
        'number': 'pl',
        'gender': 'mf'
      }
    ]
    var extras = {
      'sources': [this.sourceKey]
    }
    for (let f in forms) {
      extend(true, forms[f], extras)
    }

    callback(null, forms)
  }
}

// These functions taken from GF RGL:
// https://github.com/GrammaticalFramework/gf-rgl/blob/master/src/maltese/MorphoMlt.gf

function inferPlural (sing) {
  if (sing.endsWith('na')) { // widna
    return sing.slice(0, -1) + 'iet' // widniet
  } else if (sing.endsWith('i')) { // baħri
    return sing + 'n' // baħrin
  } else if (sing.endsWith('a') || sing.endsWith('u')) { // rota, inkwatru
    return sing.slice(0, -1) + 'i' // roti, inkwatri
  } else if (sing.endsWith('q')) { // triq
    return sing + 'at' // triqat
  } else {
    return sing + 'i'
  }
}

function inferGender (sing) {
  if (
    sing.endsWith('aġni') ||
    sing.endsWith('anti') ||
    sing.endsWith('zzjoni') ||
    sing.endsWith('ġenesi') ||
    sing.endsWith('ite') ||
    sing.endsWith('itù') ||
    sing.endsWith('joni') ||
    sing.endsWith('ojde') ||
    sing.endsWith('udni') ||
    sing.endsWith('a') ||
    sing.endsWith('à')
  ) {
    return 'f'
  } else {
    return 'm'
  }
}
