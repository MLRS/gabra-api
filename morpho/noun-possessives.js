var extend = require('extend')
module.exports = {

  sourceKey: 'Camilleri2020',

  inflect: function (body, callback) {
    var lemma = body.lemma // omm
    if (!lemma) {
      return callback(new Error('No lemma provided'), null)
    }

    let stem
    if (lemma.endsWith('a')) { // kelma
      stem = lemma.slice(0, -1) + 't' // kelmt-
    } else {
      stem = lemma
    }
    var forms = [
      {
        'surface_form': stem.endsWith('u') ? `${stem}wi` : `${stem}i`, // nannuwi, ommi
        'possessor': { 'person': 'p1', 'number': 'sg' }
      },
      {
        'surface_form': stem.match(/[aeiou]$/) ? `${stem}k` : stem.includes('o') ? `${stem}ok` : `${stem}ek`, // nannuk, ommok, kelmtek
        'possessor': { 'person': 'p2', 'number': 'sg' }
      },
      {
        'surface_form': stem.match(/[aeiou]$/) ? `${stem}h` : `${stem}u`, // nannuh, ommu
        'possessor': { 'person': 'p3', 'number': 'sg', 'gender': 'm' }
      },
      {
        'surface_form': `${stem}ha`, // ommha
        'possessor': { 'person': 'p3', 'number': 'sg', 'gender': 'f' }
      },
      {
        'surface_form': `${stem}na`, // ommna
        'possessor': { 'person': 'p1', 'number': 'pl' }
      },
      {
        'surface_form': `${stem}kom`, // ommkom
        'possessor': { 'person': 'p2', 'number': 'pl' }
      },
      {
        'surface_form': `${stem}hom`, // ommhom
        'possessor': { 'person': 'p3', 'number': 'pl' }
      }
    ]
    var extras = {
      'sources': [this.sourceKey]
    }
    if (body.gender) {
      extras['gender'] = body.gender
    }
    if (body.number) {
      extras['number'] = body.number
    }
    for (let f in forms) {
      extend(true, forms[f], extras)
    }

    callback(null, forms)
  }
}
