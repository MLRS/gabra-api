/* global db */
/* eslint-disable camelcase */

/*
* Create a new collection in gabra DB:
* Collection reverses lexemes, i.e. keys English gloss to lexeme ID
*/

var COLL = 'glosses'

// create the collection if not existing
if (db.getCollectionNames().indexOf(COLL) < 0) {
  db.createCollection(COLL)

  // set up indices
  // do this already now since we are querying the glosses collection in the loop below
  // db.getCollection(COLL).createIndex({gloss: 'text'}, {score: {$meta: 'textScore'}})
  db.getCollection(COLL).createIndex({gloss: 'text'})
  db.getCollection(COLL).createIndex({length: -1})
}

// iterate over all lexemes with a gloss
var conds = {
  'gloss': {
    '$exists': true,
    '$ne': ''
  }
}
db.getCollection('lexemes').find(conds).forEach(function (lex) {
  // split the glosses by newline
  var glosses = lex.gloss.split(/\r?\n/)

  for (var i = 0; i < glosses.length; i++) {
    var g = glosses[i].toLowerCase()

    // check if gloss is in the collection already
    var entry = db.getCollection(COLL).findOne({'gloss': g})

    if (entry == null) {
      db.getCollection(COLL).insert({
        'gloss': g,
        'length': g.length,
        'lexemes': [lex._id]
      })
    } else {
      db.getCollection(COLL).update(
        {'gloss': g},
        {$push: {'lexemes': lex._id}}
      )
    }
  }
})
